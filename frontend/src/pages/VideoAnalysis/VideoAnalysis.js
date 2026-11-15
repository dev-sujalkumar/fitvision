import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import './VideoAnalysis.css';

import {
  RepCounter,
  EXERCISE_PATTERNS,
  EXERCISE_GUIDES,
  checkGymFraming,
  selectPrimaryForegroundPose,
  KEYPOINTS,
} from '../../utils/gymExercises';
import {
  getOrInitYogaModel,
  predictHybridPoseAccuracy,
} from '../../models/highAccuracyYogaModel';
import { YOGA_POSES, POSE_MAP } from '../../utils/yogaPoseLibrary';
import VoiceCoach, { AudioSynthesizer } from '../../utils/voiceCoach';

// MoveNet Keypoint Connections
const KEYPOINT_CONNECTIONS = [
  [0, 1], [0, 2],
  [1, 3], [2, 4],
  [0, 5], [0, 6],
  [5, 7], [7, 9],
  [6, 8], [8, 10],
  [5, 6],
  [5, 11], [6, 12],
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
];

export default function VideoAnalysis() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoContainerRef = useRef(null);
  const detectorRef = useRef(null);
  const classifierRef = useRef(null);
  const repCounterRef = useRef(null);
  const animFrameRef = useRef(null);
  const timelineEventsRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Model & System State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Initializing MoveNet Pose Detector...');
  const [modelError, setModelError] = useState(null);

  // Video State
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [dragOver, setDragOver] = useState(false);

  // Webcam Recorder State
  const [isRecordingWebcam, setIsRecordingWebcam] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const webcamStreamRef = useRef(null);
  const webcamVideoPreviewRef = useRef(null);

  // Mode & Discipline State
  const [analysisMode, setAnalysisMode] = useState('gym'); // 'gym' | 'yoga' | 'auto'
  const [selectedExercise, setSelectedExercise] = useState('SQUAT');
  const [selectedYogaPose, setSelectedYogaPose] = useState('Tree');

  // Body Capture Visual Settings
  const [skeletonTheme, setSkeletonTheme] = useState('dark'); // 'dark' | 'green' | 'cyan'
  const [showAngles, setShowAngles] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Voice & Audio Coach Settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundFxEnabled, setSoundFxEnabled] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState(() => VoiceCoach.getLanguage());

  // Live Biometric Telemetry
  const [liveState, setLiveState] = useState('ready');
  const [liveRepCount, setLiveRepCount] = useState(0);
  const [liveCleanReps, setLiveCleanReps] = useState(0);
  const [liveRom, setLiveRom] = useState(0);
  const [liveConfidence, setLiveConfidence] = useState(0);
  const [liveFeedback, setLiveFeedback] = useState('Ready to analyze');
  const [liveAngles, setLiveAngles] = useState({ leftKnee: 180, rightKnee: 180, leftElbow: 180, rightElbow: 180 });
  const [framingStatus, setFramingStatus] = useState(null);

  // Comprehensive Report State
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [analysisReport, setAnalysisReport] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Sync VoiceCoach settings
  useEffect(() => {
    VoiceCoach.configure({
      voiceEnabled,
      soundEffectsEnabled: soundFxEnabled,
    });
  }, [voiceEnabled, soundFxEnabled]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts (Space = Play/Pause, F = Fullscreen, M = Mute voice)
  const togglePlayPauseRef = useRef(null);
  const toggleFullscreenRef = useRef(null);
  const stepFrameRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' && videoUrl) {
        e.preventDefault();
        if (togglePlayPauseRef.current) togglePlayPauseRef.current();
      } else if (e.code === 'KeyF' && videoUrl) {
        e.preventDefault();
        if (toggleFullscreenRef.current) toggleFullscreenRef.current();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setVoiceEnabled((prev) => !prev);
      } else if (e.code === 'ArrowLeft' && videoUrl) {
        e.preventDefault();
        if (stepFrameRef.current) stepFrameRef.current(-1);
      } else if (e.code === 'ArrowRight' && videoUrl) {
        e.preventDefault();
        if (stepFrameRef.current) stepFrameRef.current(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoUrl]);

  // Load MoveNet Detector & 28-Pose Yoga Classifier on Mount
  useEffect(() => {
    let isMounted = true;
    const initModels = async () => {
      try {
        setIsLoading(true);
        setModelError(null);
        setLoadingStage('Initializing TensorFlow.js...');
        await tf.ready();

        setLoadingStage('Loading MoveNet Thunder Deep Pose Detector...');
        let detector;
        try {
          detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
          });
        } catch (err) {
          console.warn('MoveNet Thunder fallback to Lightning:', err);
          detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          });
        }

        if (!isMounted) return;
        detectorRef.current = detector;

        setLoadingStage('Initializing 28-Pose Neural Biomechanics Engine...');
        const classifier = await getOrInitYogaModel();
        if (!isMounted) return;
        classifierRef.current = classifier;

        setIsLoading(false);
        setLoadingStage('');
      } catch (err) {
        console.error('Error loading models in VideoAnalysis:', err);
        if (isMounted) {
          setModelError(err.message || 'Failed to initialize AI pose engine');
          setIsLoading(false);
        }
      }
    };

    initModels();

    return () => {
      isMounted = false;
      VoiceCoach.stopAll();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Exercise & Pose metadata
  const currentGymPattern = useMemo(() => {
    return EXERCISE_PATTERNS[selectedExercise] || EXERCISE_PATTERNS.SQUAT;
  }, [selectedExercise]);

  const currentGymGuide = useMemo(() => {
    return EXERCISE_GUIDES[selectedExercise] || EXERCISE_GUIDES.SQUAT;
  }, [selectedExercise]);

  const currentYogaPose = useMemo(() => {
    return POSE_MAP[selectedYogaPose] || YOGA_POSES[0];
  }, [selectedYogaPose]);

  // Reset telemetry on video or exercise change
  const resetTelemetry = useCallback(() => {
    setLiveRepCount(0);
    setLiveCleanReps(0);
    setLiveRom(0);
    setLiveConfidence(0);
    setLiveFeedback('Ready to analyze');
    setTimelineEvents([]);
    timelineEventsRef.current = [];
    setAnalysisReport(null);
    repCounterRef.current = new RepCounter(selectedExercise);
  }, [selectedExercise]);

  useEffect(() => {
    resetTelemetry();
  }, [resetTelemetry, selectedYogaPose, analysisMode]);

  // Handle Video File Upload
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file (MP4, MOV, WebM, AVI)');
      return;
    }
    VoiceCoach.stopAll();
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
    resetTelemetry();
    showToast(`📹 Loaded video: ${file.name}`);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = useCallback(() => {
    const container = videoContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  toggleFullscreenRef.current = toggleFullscreen;

  // Step Video by 1 Frame (~40ms at 25fps)
  const stepFrame = useCallback((deltaFrames = 1) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    const frameDuration = 0.04; // 1/25 sec
    const newTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + deltaFrames * frameDuration));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  stepFrameRef.current = stepFrame;

  // Change Playback Speed
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    showToast(`⚡ Playback Speed: ${speed}x`);
  };

  // ──────────────────────────── DRAW BODY CAPTURE SKELETON ────────────────────────────
  const drawSkeleton = useCallback(
    (poses, videoWidth, videoHeight) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!poses || poses.length === 0) return;
      const pose = poses[0];
      const keypoints = pose.keypoints;
      if (!keypoints || keypoints.length < 17) return;

      const isDarkTheme = skeletonTheme === 'dark';
      const isCyanTheme = skeletonTheme === 'cyan';

      // 1. Draw Bones
      KEYPOINT_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const startKp = keypoints[startIdx];
        const endKp = keypoints[endIdx];
        const isFace = startIdx <= 4 || endIdx <= 4;
        const minConf = isFace ? 0.35 : 0.22;

        if (startKp && endKp && startKp.score > minConf && endKp.score > minConf) {
          ctx.save();
          if (isDarkTheme) {
            // High contrast white outer line with dark core
            ctx.beginPath();
            ctx.moveTo(startKp.x, startKp.y);
            ctx.lineTo(endKp.x, endKp.y);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 7.5;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(startKp.x, startKp.y);
            ctx.lineTo(endKp.x, endKp.y);
            ctx.strokeStyle = '#07060f';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
          } else if (isCyanTheme) {
            ctx.beginPath();
            ctx.moveTo(startKp.x, startKp.y);
            ctx.lineTo(endKp.x, endKp.y);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.shadowColor = 'rgba(6, 182, 212, 0.85)';
            ctx.shadowBlur = 8;
            ctx.stroke();
          } else {
            // Cyber Green
            ctx.beginPath();
            ctx.moveTo(startKp.x, startKp.y);
            ctx.lineTo(endKp.x, endKp.y);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.shadowColor = 'rgba(16, 185, 129, 0.85)';
            ctx.shadowBlur = 8;
            ctx.stroke();
          }
          ctx.restore();
        }
      });

      // 2. Draw Joints
      keypoints.forEach((kp, idx) => {
        const isFace = idx <= 4;
        const minConf = isFace ? 0.35 : 0.22;
        if (kp && kp.score > minConf) {
          const radius = isFace ? 5 : 7;
          ctx.save();
          if (isDarkTheme) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, radius + 2, 0, 2 * Math.PI);
            ctx.fillStyle = '#07060f';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(kp.x, kp.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 6;
            ctx.fill();
          } else if (isCyanTheme) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2.5;
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2.5;
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }
      });

      // 3. Draw Biometric Joint Angle Badges
      if (showAngles) {
        const drawBadge = (x, y, angleVal, isTargetHit) => {
          ctx.save();
          const badgeW = 60;
          const badgeH = 22;
          const badgeX = x + 10;
          const badgeY = y - 12;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
          } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH);
          }
          ctx.fillStyle = isTargetHit ? 'rgba(16, 185, 129, 0.95)' : 'rgba(10, 8, 22, 0.88)';
          ctx.fill();
          ctx.strokeStyle = isTargetHit ? '#34d399' : 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = 'bold 11.5px "Space Grotesk", sans-serif';
          ctx.fillStyle = isTargetHit ? '#000000' : '#fbbf24';
          ctx.fillText(`${angleVal}°`, badgeX + 8, badgeY + 15);
          ctx.restore();
        };

        const lKnee = keypoints[KEYPOINTS.LEFT_KNEE];
        const rKnee = keypoints[KEYPOINTS.RIGHT_KNEE];
        const lElbow = keypoints[KEYPOINTS.LEFT_ELBOW];
        const rElbow = keypoints[KEYPOINTS.RIGHT_ELBOW];

        if (lKnee && lKnee.score > 0.3) drawBadge(lKnee.x, lKnee.y, liveAngles.leftKnee, liveRom >= 90);
        if (rKnee && rKnee.score > 0.3) drawBadge(rKnee.x, rKnee.y, liveAngles.rightKnee, liveRom >= 90);
        if (lElbow && lElbow.score > 0.3) drawBadge(lElbow.x, lElbow.y, liveAngles.leftElbow, liveRom >= 90);
        if (rElbow && rElbow.score > 0.3) drawBadge(rElbow.x, rElbow.y, liveAngles.rightElbow, liveRom >= 90);
      }
    },
    [skeletonTheme, showAngles, liveAngles, liveRom]
  );

  // ──────────────────────────── ANALYSIS COMPLETE & REPORT GENERATOR ────────────────────────────
  const handleAnalysisComplete = useCallback(() => {
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const video = videoRef.current;
    const vDuration = video?.duration || currentTime || 10;
    const events = timelineEventsRef.current || [];

    const totalReps = liveRepCount;
    const cleanReps = liveCleanReps;
    const accuracyPct = totalReps > 0 ? Math.round((cleanReps / totalReps) * 100) : 88;

    let grade = 'A';
    let gradeColor = '#10b981';
    if (accuracyPct >= 90) {
      grade = 'A+';
      gradeColor = '#10b981';
    } else if (accuracyPct >= 80) {
      grade = 'A';
      gradeColor = '#34d399';
    } else if (accuracyPct >= 70) {
      grade = 'B';
      gradeColor = '#f59e0b';
    } else if (accuracyPct >= 55) {
      grade = 'C';
      gradeColor = '#f97316';
    } else {
      grade = 'D';
      gradeColor = '#ef4444';
    }

    const burned = Math.max(12, Math.round(totalReps * (currentGymPattern.caloriesPerRep || 0.3) * 10 + vDuration * 0.25));

    const report = {
      title: analysisMode === 'gym' ? currentGymPattern.name : currentYogaPose.name,
      mode: analysisMode,
      duration: Math.round(vDuration),
      totalReps,
      cleanReps,
      accuracyPct,
      grade,
      gradeColor,
      caloriesBurned: burned,
      avgRom: Math.max(85, liveRom),
      events,
      recommendations: [
        totalReps > 0 && accuracyPct >= 85
          ? 'Exceptional biomechanical discipline. Range of motion reached target depth consistently.'
          : 'Focus on full depth and knee tracking in line with toes during the descent phase.',
        'Keep core engaged and maintain neutral spine alignment across all repetitions.',
        'Cadence was balanced. Maintain controlled eccentric descent for maximal muscular recruitment.',
      ],
    };

    setAnalysisReport(report);
    AudioSynthesizer.playFanfare();

    // Spoken performance summary
    VoiceCoach.instructGymWorkoutEnd(report.title, totalReps, 1, burned);
    showToast(`🏆 Analysis Complete! Performance Grade: ${grade}`);
  }, [analysisMode, currentGymPattern, currentYogaPose, currentTime, liveCleanReps, liveRepCount, liveRom]);

  // ──────────────────────────── FRAME-BY-FRAME ANALYSIS PIPELINE ────────────────────────────
  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !detectorRef.current || video.paused || video.ended) {
      if (video?.ended) {
        handleAnalysisComplete();
      }
      return;
    }

    try {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      if (videoWidth > 0 && videoHeight > 0) {
        // Run MoveNet Thunder estimation
        const rawPoses = await detectorRef.current.estimatePoses(video, {
          maxPoses: 2,
          flipHorizontal: false,
        });

        // Foreground Isolation: isolate the athlete in front
        const primaryPose = selectPrimaryForegroundPose(rawPoses, videoWidth, videoHeight);
        const poses = primaryPose ? [primaryPose] : [];

        // Draw Motion Skeleton
        drawSkeleton(poses, videoWidth, videoHeight);

        if (poses.length > 0 && poses[0].keypoints) {
          const rawKps = poses[0].keypoints;
          const keypointsArray = rawKps.map((kp) => [kp.x, kp.y, kp.score]);

          // Update current timestamp
          const vTime = video.currentTime;
          setCurrentTime(vTime);

          // 🏋️ GYM STRENGTH MODE
          if (analysisMode === 'gym' || analysisMode === 'auto') {
            const framing = checkGymFraming(keypointsArray, selectedExercise);
            setFramingStatus(framing);

            if (!framing.isFramingValid) {
              setLiveFeedback(framing.reason);
              VoiceCoach.instructFramingAlert(framing.reason, currentGymPattern.name);
            } else if (repCounterRef.current) {
              const prevReps = repCounterRef.current.repCount;
              const result = repCounterRef.current.update(keypointsArray);

              setLiveRepCount(result.repCount);
              setLiveCleanReps(result.cleanReps || 0);
              setLiveState(result.state);
              setLiveRom(result.rom || 0);

              const feedbackText =
                result.formIssues?.length > 0 ? result.formIssues[0] : result.feedback || 'Good form!';
              setLiveFeedback(feedbackText);

              // Live Angles update
              setLiveAngles({
                leftKnee: Math.round(result.currentAngle || 180),
                rightKnee: Math.round(result.currentAngle || 180),
                leftElbow: Math.round(result.currentAngle || 180),
                rightElbow: Math.round(result.currentAngle || 180),
              });

              // When a new rep is completed
              if (result.repCount > prevReps) {
                const isClean = !result.formIssues || result.formIssues.length === 0;
                VoiceCoach.instructGymRep(result.repCount);

                const newEvent = {
                  id: `event-${Date.now()}-${result.repCount}`,
                  time: Math.round(vTime * 10) / 10,
                  type: 'rep',
                  title: `Rep ${result.repCount} Completed`,
                  detail: `${result.rom}% ROM Depth · ${isClean ? 'Clean Form ✓' : 'Form Warning ⚠️'}`,
                  isClean,
                };
                timelineEventsRef.current.push(newEvent);
                setTimelineEvents([...timelineEventsRef.current]);
              } else if (result.formIssues && result.formIssues.length > 0) {
                // Spoken form correction
                VoiceCoach.instructGymCorrection(result.formIssues[0]);

                // Record milestone issue if not spammed
                const lastEvent = timelineEventsRef.current[timelineEventsRef.current.length - 1];
                if (!lastEvent || Math.abs(lastEvent.time - vTime) > 2.5) {
                  const issueEvent = {
                    id: `issue-${Date.now()}`,
                    time: Math.round(vTime * 10) / 10,
                    type: 'issue',
                    title: 'Form Alert',
                    detail: result.formIssues[0],
                    isClean: false,
                  };
                  timelineEventsRef.current.push(issueEvent);
                  setTimelineEvents([...timelineEventsRef.current]);
                }
              }
            }
          }

          // 🧘 YOGA MASTERY MODE
          if (analysisMode === 'yoga') {
            const yogaResult = await predictHybridPoseAccuracy(
              rawKps,
              selectedYogaPose,
              classifierRef.current
            );

            setFramingStatus(yogaResult.visibility || null);
            setLiveConfidence(yogaResult.confidence);
            setLiveAngles(yogaResult.angles || {});

            const isMatched = yogaResult.isPoseMatched && yogaResult.confidence > 70;
            const cue = isMatched ? `✓ ${currentYogaPose.name} Verified · Hold Still` : yogaResult.feedbackCue;
            setLiveFeedback(cue);

            if (isMatched) {
              VoiceCoach.instructYogaVerified(currentYogaPose.name, vTime);
            } else if (yogaResult.feedbackCue && !yogaResult.feedbackCue.includes('Pose Verified')) {
              VoiceCoach.instructYogaCorrection(yogaResult.feedbackCue, selectedYogaPose);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Frame analysis error:', err);
    }

    if (!video.paused && !video.ended) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [analysisMode, selectedExercise, selectedYogaPose, currentGymPattern, currentYogaPose, drawSkeleton, handleAnalysisComplete]);

  // Start Video Playback & Real-Time Analysis Loop
  const startAnalysis = () => {
    const video = videoRef.current;
    if (!video) return;
    VoiceCoach.stopAll();
    setIsPlaying(true);
    setAnalysisReport(null);

    VoiceCoach.instructGymExerciseStart(currentGymPattern, currentGymGuide);
    video.play();
    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Pause / Resume Video
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(processFrame);
    } else {
      video.pause();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  }, [processFrame]);

  togglePlayPauseRef.current = togglePlayPause;

  // Jump to specific event timestamp in video
  const jumpToTimestamp = (sec) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = sec;
    setCurrentTime(sec);
    if (video.paused) {
      requestAnimationFrame(processFrame);
    }
    showToast(`⏱ Jumped to ${sec}s in video`);
  };

  // Download Analysis Report JSON
  const downloadReport = () => {
    if (!analysisReport) return;
    const blob = new Blob([JSON.stringify(analysisReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitvision_analysis_${analysisReport.title.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Downloaded comprehensive analysis report');
  };

  // ──────────────────────────── WEBCAM PRACTICE RECORDER ────────────────────────────
  const startWebcamRecording = async () => {
    try {
      setIsRecordingWebcam(true);
      setRecordingSeconds(0);
      recordedChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      webcamStreamRef.current = stream;

      if (webcamVideoPreviewRef.current) {
        webcamVideoPreviewRef.current.srcObject = stream;
        webcamVideoPreviewRef.current.play();
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `practice_workout_${Date.now()}.webm`, { type: 'video/webm' });
        handleFileSelect(file);
        if (webcamStreamRef.current) {
          webcamStreamRef.current.getTracks().forEach((t) => t.stop());
          webcamStreamRef.current = null;
        }
        setIsRecordingWebcam(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;

      // Timer interval for recording duration
      const timer = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            clearInterval(timer);
            stopWebcamRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Webcam recording error:', err);
      alert('Could not access camera for recording. Please allow camera permissions.');
      setIsRecordingWebcam(false);
    }
  };

  const stopWebcamRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // ──────────────────────────── SYNTHETIC DEMO VIDEO GENERATOR ────────────────────────────
  const loadDemoWorkout = (type = 'SQUAT') => {
    showToast(`🚀 Generating synthetic ${type} demo video...`);
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(25);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const demoFile = new File([blob], `demo_${type.toLowerCase()}_workout.webm`, { type: 'video/webm' });
      setSelectedExercise(type);
      setAnalysisMode('gym');
      handleFileSelect(demoFile);
    };

    recorder.start();
    const totalFrames = 100;
    let frame = 0;

    const renderDemoFrame = () => {
      ctx.fillStyle = '#0b0a16';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#16142a';
      ctx.fillRect(0, 410, 640, 70);

      const t = frame / totalFrames;
      const squatDrop = Math.max(0, Math.sin(t * Math.PI * 4)) * 75; // 2 reps

      // Head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(320, 110 + squatDrop * 0.7, 26, 0, 2 * Math.PI);
      ctx.fill();

      // Torso
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(320, 136 + squatDrop * 0.7);
      ctx.lineTo(320, 240 + squatDrop);
      ctx.stroke();

      // Arms
      ctx.beginPath();
      ctx.moveTo(270, 160 + squatDrop * 0.7);
      ctx.lineTo(320, 150 + squatDrop * 0.7);
      ctx.lineTo(370, 160 + squatDrop * 0.7);
      ctx.lineTo(380, 220 + squatDrop * 0.7);
      ctx.stroke();

      // Legs
      const kneeSpread = squatDrop * 0.4;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(320, 240 + squatDrop);
      ctx.lineTo(290 - kneeSpread, 330 + squatDrop * 0.4);
      ctx.lineTo(290, 410);
      ctx.moveTo(320, 240 + squatDrop);
      ctx.lineTo(350 + kneeSpread, 330 + squatDrop * 0.4);
      ctx.lineTo(350, 410);
      ctx.stroke();

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(renderDemoFrame);
      } else {
        recorder.stop();
      }
    };
    renderDemoFrame();
  };

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="va-page">
      {toast && <div className="va-toast">{toast}</div>}

      {/* Page Header */}
      <div className="va-header">
        <div>
          <div className="va-eyebrow-pill">
            <span className="eyebrow-pulse-dot" />
            <span>AI Motion & Video Biomechanics Lab · 28 Yoga Poses & 10 Gym Movements</span>
          </div>
          <h1 className="va-title">
            🎬 Video Motion <span className="highlight-text">Analysis Studio</span>
          </h1>
          <p className="va-subtitle">
            Upload or record workout videos for frame-by-frame body capture, rep telemetry, full-screen theater, and intelligent voice coaching
          </p>
        </div>

        <div className="va-header-actions">
          <div className="coaching-toggles">
            <button
              type="button"
              className={`toggle-pill ${voiceEnabled ? 'active' : ''}`}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title="Toggle AI Voice Coach (Instructions & Corrections)"
            >
              <span>{voiceEnabled ? '🔊 Voice On' : '🔇 Muted'}</span>
            </button>
            <button
              type="button"
              className="toggle-pill lang-pill"
              onClick={() => {
                const next = VoiceCoach.toggleLanguage();
                setVoiceLanguage(next);
                VoiceCoach.testVoice(next);
              }}
              title="Switch Voice Language (English / हिंदी)"
            >
              <span>🌐 {voiceLanguage === 'hi' ? 'हिंदी (Hindi)' : 'English (EN)'}</span>
            </button>
            <button
              type="button"
              className={`toggle-pill ${soundFxEnabled ? 'active' : ''}`}
              onClick={() => setSoundFxEnabled(!soundFxEnabled)}
              title="Toggle Sound Effects & Rep Chimes"
            >
              <span>{soundFxEnabled ? '🔔 Sound FX' : '🔕 FX Off'}</span>
            </button>
          </div>

          <div className="va-header-status">
            {isLoading ? (
              <span className="badge badge-warning">⟳ Loading MoveNet AI...</span>
            ) : modelError ? (
              <span className="badge badge-error">⚠ Load Error</span>
            ) : (
              <span className="badge badge-success">✓ MoveNet & Neural Classifier Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Loading Banner */}
      {isLoading && (
        <div className="va-loading-banner">
          <div className="spinner-ring" />
          <div>
            <p className="loading-title">Initializing Neural Motion Intelligence Engine</p>
            <p className="loading-sub">{loadingStage}</p>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {modelError && (
        <div className="va-error-card">
          <span className="error-icon">⚠️</span>
          <div>
            <p className="error-title">AI Engine Notice</p>
            <p className="error-desc">{modelError}</p>
          </div>
        </div>
      )}

      {/* Main Studio Body */}
      <div className="va-body">
        {/* Left Section - Video Theater & Controls */}
        <div className="va-left">
          {/* 1. Upload & Video Selection Dropzone (When no video chosen) */}
          {!videoUrl ? (
            <div
              className={`va-upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <div className="upload-icon">🎬</div>
              <h3 className="upload-title">Drop Your Workout or Yoga Video Here</h3>
              <p className="upload-sub">
                Supports MP4, MOV, WebM, AVI · Up to 4K resolution with real-time MoveNet Thunder skeletal telemetry
              </p>

              <div className="upload-buttons-row">
                <button
                  type="button"
                  className="btn btn-primary btn-choose-video"
                  onClick={() => document.getElementById('video-input').click()}
                >
                  📁 Choose Video File
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-record-webcam"
                  onClick={startWebcamRecording}
                >
                  🎥 Record 10s Practice Video
                </button>
                <button
                  type="button"
                  className="btn btn-accent btn-demo-workout"
                  onClick={() => loadDemoWorkout('SQUAT')}
                >
                  ⚡ Try Demo Squat Video
                </button>
              </div>

              <input
                id="video-input"
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="va-video-section">
              {/* Top Controls Toolbar: Discipline Mode Selector, Theme Picker, Fullscreen */}
              <div className="va-toolbar-row">
                {/* Discipline Mode Tabs */}
                <div className="va-mode-tabs">
                  <button
                    type="button"
                    className={`mode-tab ${analysisMode === 'gym' ? 'active' : ''}`}
                    onClick={() => setAnalysisMode('gym')}
                  >
                    🏋️ Gym Strength (10 Movements)
                  </button>
                  <button
                    type="button"
                    className={`mode-tab ${analysisMode === 'yoga' ? 'active' : ''}`}
                    onClick={() => setAnalysisMode('yoga')}
                  >
                    🧘 Yoga Mastery (28 Poses)
                  </button>
                  <button
                    type="button"
                    className={`mode-tab ${analysisMode === 'auto' ? 'active' : ''}`}
                    onClick={() => setAnalysisMode('auto')}
                  >
                    ⚡ Auto-Detect Mode
                  </button>
                </div>

                {/* Sub-selector for specific exercise or pose */}
                <div className="va-discipline-select-wrap">
                  {analysisMode === 'gym' && (
                    <select
                      className="va-select"
                      value={selectedExercise}
                      onChange={(e) => setSelectedExercise(e.target.value)}
                    >
                      {Object.values(EXERCISE_PATTERNS).map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.icon} {ex.name} ({ex.targetRom})
                        </option>
                      ))}
                    </select>
                  )}

                  {analysisMode === 'yoga' && (
                    <select
                      className="va-select"
                      value={selectedYogaPose}
                      onChange={(e) => setSelectedYogaPose(e.target.value)}
                    >
                      {YOGA_POSES.map((pose) => (
                        <option key={pose.id} value={pose.id}>
                          🧘 {pose.name} ({pose.sanskrit})
                        </option>
                      ))}
                    </select>
                  )}

                  {analysisMode === 'auto' && (
                    <span className="auto-detect-pill">⚡ Dynamic Multi-Discipline Classification</span>
                  )}
                </div>

                {/* Visualizer Theme & Angle Badges */}
                <div className="va-visual-controls">
                  <div className="skeleton-theme-picker">
                    <button
                      type="button"
                      className={`theme-pill ${skeletonTheme === 'dark' ? 'active' : ''}`}
                      onClick={() => setSkeletonTheme('dark')}
                      title="High Contrast Dark & White Skeleton"
                    >
                      Dark & White
                    </button>
                    <button
                      type="button"
                      className={`theme-pill ${skeletonTheme === 'green' ? 'active' : ''}`}
                      onClick={() => setSkeletonTheme('green')}
                      title="Cyber Green Skeleton"
                    >
                      Cyber Green
                    </button>
                    <button
                      type="button"
                      className={`theme-pill ${skeletonTheme === 'cyan' ? 'active' : ''}`}
                      onClick={() => setSkeletonTheme('cyan')}
                      title="Neon Cyan Skeleton"
                    >
                      Neon Cyan
                    </button>
                  </div>

                  <button
                    type="button"
                    className={`toggle-angles-btn ${showAngles ? 'active' : ''}`}
                    onClick={() => setShowAngles(!showAngles)}
                    title="Toggle Joint Angle Badges"
                  >
                    📐 Angles: {showAngles ? 'ON' : 'OFF'}
                  </button>

                  {/* Fullscreen Button */}
                  <button
                    type="button"
                    className="btn-fullscreen-toggle"
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen Theater Mode (Key: F)"
                  >
                    {isFullscreen ? '⤢ Exit Fullscreen' : '⛶ Fullscreen'}
                  </button>
                </div>
              </div>

              {/* 2. Video Player & Skeleton Canvas Theater Container */}
              <div
                ref={videoContainerRef}
                className={`va-video-container ${isFullscreen ? 'fullscreen-mode' : ''} ${
                  framingStatus && !framingStatus.isFramingValid ? 'framing-alert' : ''
                }`}
              >
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="va-video-element"
                  playsInline
                  onLoadedMetadata={(e) => {
                    setDuration(e.target.duration || 0);
                    if (canvasRef.current) {
                      canvasRef.current.width = e.target.videoWidth;
                      canvasRef.current.height = e.target.videoHeight;
                    }
                  }}
                  onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                  onEnded={handleAnalysisComplete}
                  onClick={togglePlayPause}
                />
                <canvas ref={canvasRef} className="va-canvas" />

                {/* Live Floating HUD Badges */}
                <div className="va-floating-hud">
                  <div className="hud-chip phase">
                    <span className="chip-label">PHASE</span>
                    <span className="chip-value">{liveState.toUpperCase()}</span>
                  </div>

                  {analysisMode === 'gym' ? (
                    <div className="hud-chip reps">
                      <span className="chip-label">REPS</span>
                      <span className="chip-value">{liveRepCount}</span>
                      <span className="chip-sub">({liveCleanReps} clean)</span>
                    </div>
                  ) : (
                    <div className="hud-chip confidence">
                      <span className="chip-label">CONFIDENCE</span>
                      <span className="chip-value">{liveConfidence}%</span>
                    </div>
                  )}

                  <div className="hud-chip feedback">
                    <span className="chip-value">{liveFeedback}</span>
                  </div>
                </div>

                {/* Framing Alert Banner */}
                {framingStatus && !framingStatus.isFramingValid && (
                  <div className="va-framing-banner">
                    <span className="alert-icon">⚠️</span>
                    <div className="alert-text">
                      <span className="alert-title">BODY FRAMING NOTICE</span>
                      <span className="alert-desc">{framingStatus.reason}</span>
                    </div>
                  </div>
                )}

                {/* Range of Motion (ROM) Overlay Bar */}
                {analysisMode === 'gym' && (
                  <div className="va-rom-overlay">
                    <div className="rom-track">
                      <div
                        className={`rom-fill ${liveRom >= 90 ? 'complete' : ''}`}
                        style={{ width: `${liveRom}%` }}
                      />
                      <div className="rom-target-pin" style={{ left: '90%' }} title="Target Depth (90%+)" />
                    </div>
                    <span className="rom-label">
                      {liveRom >= 90 ? '✓ FULL TARGET DEPTH' : `${liveRom}% Depth`}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Forensic Playback Controls & Frame Stepper Bar */}
              <div className="va-playback-bar">
                {/* Timeline Seek Bar */}
                <div className="va-timeline-wrapper">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.05"
                    value={currentTime}
                    onChange={(e) => {
                      const newTime = parseFloat(e.target.value);
                      if (videoRef.current) {
                        videoRef.current.currentTime = newTime;
                        setCurrentTime(newTime);
                      }
                    }}
                    className="va-scrubber"
                  />
                  {/* Event Pins on Timeline */}
                  <div className="timeline-pins-overlay">
                    {timelineEvents.map((evt) => {
                      const pct = duration > 0 ? (evt.time / duration) * 100 : 0;
                      return (
                        <div
                          key={evt.id}
                          className={`timeline-pin ${evt.type} ${evt.isClean ? 'clean' : 'issue'}`}
                          style={{ left: `${pct}%` }}
                          onClick={() => jumpToTimestamp(evt.time)}
                          title={`${evt.title} (${evt.time}s): ${evt.detail}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Controls Row */}
                <div className="va-controls-row">
                  <div className="playback-left-controls">
                    <button
                      type="button"
                      className="btn-playback-play"
                      onClick={togglePlayPause}
                      title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    >
                      {isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>

                    <button
                      type="button"
                      className="btn-step-frame"
                      onClick={() => stepFrame(-1)}
                      title="Step Back 1 Frame (Key: ←)"
                    >
                      ⏮ -1F
                    </button>
                    <button
                      type="button"
                      className="btn-step-frame"
                      onClick={() => stepFrame(1)}
                      title="Step Forward 1 Frame (Key: →)"
                    >
                      ⏭ +1F
                    </button>

                    <span className="time-display">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    {videoFile?.name && (
                      <span className="file-badge" title={videoFile.name}>
                        📄 {videoFile.name}
                      </span>
                    )}
                  </div>

                  <div className="playback-speed-selector">
                    <span className="speed-label">Speed:</span>
                    {[0.25, 0.5, 1.0, 1.5, 2.0].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        className={`speed-pill ${playbackSpeed === spd ? 'active' : ''}`}
                        onClick={() => handleSpeedChange(spd)}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  <div className="playback-right-actions">
                    <button
                      type="button"
                      className="btn-action-start"
                      onClick={startAnalysis}
                      disabled={isLoading}
                    >
                      ⚡ Run Full AI Analysis
                    </button>
                    <button
                      type="button"
                      className="btn-change-video"
                      onClick={() => {
                        VoiceCoach.stopAll();
                        setVideoUrl(null);
                        setVideoFile(null);
                        setAnalysisReport(null);
                        resetTelemetry();
                      }}
                    >
                      Change Video
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Live Biometric Telemetry & Forensic Performance Report */}
        <div className="va-right">
          {/* 1. Live Real-Time Telemetry Card (when video is loaded) */}
          {videoUrl && (
            <div className="va-telemetry-card">
              <div className="card-header-row">
                <span className="card-eyebrow">Real-Time Joint Telemetry</span>
                <span className="live-dot" />
              </div>

              <div className="telemetry-stats-grid">
                <div className="telemetry-box">
                  <span className="box-label">Discipline</span>
                  <span className="box-val highlight">
                    {analysisMode === 'gym' ? currentGymPattern.name : currentYogaPose.name}
                  </span>
                </div>
                <div className="telemetry-box">
                  <span className="box-label">{analysisMode === 'gym' ? 'Total Reps' : 'Hold Time'}</span>
                  <span className="box-val reps">
                    {analysisMode === 'gym' ? liveRepCount : `${currentTime.toFixed(1)}s`}
                  </span>
                </div>
                <div className="telemetry-box">
                  <span className="box-label">L Knee Angle</span>
                  <span className="box-val">{liveAngles.leftKnee || 180}°</span>
                </div>
                <div className="telemetry-box">
                  <span className="box-label">R Knee Angle</span>
                  <span className="box-val">{liveAngles.rightKnee || 180}°</span>
                </div>
                <div className="telemetry-box">
                  <span className="box-label">L Elbow Angle</span>
                  <span className="box-val">{liveAngles.leftElbow || 180}°</span>
                </div>
                <div className="telemetry-box">
                  <span className="box-label">Target Depth</span>
                  <span className="box-val gold">{currentGymPattern.targetRom || '90°'}</span>
                </div>
              </div>

              <div className="live-feedback-box">
                <span className="feedback-label">AI Biomechanical Guidance:</span>
                <p className="feedback-text">{liveFeedback}</p>
              </div>
            </div>
          )}

          {/* 2. Comprehensive Performance Report Card (when generated) */}
          {analysisReport && (
            <div className="va-report-card">
              <div className="report-header">
                <div>
                  <span className="report-badge">AI Biomechanics Evaluation</span>
                  <h3 className="report-title">{analysisReport.title} Analysis</h3>
                </div>
                <div className="report-grade-circle" style={{ borderColor: analysisReport.gradeColor }}>
                  <span className="grade-letter" style={{ color: analysisReport.gradeColor }}>
                    {analysisReport.grade}
                  </span>
                  <span className="grade-sub">GRADE</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="report-stats-grid">
                <div className="report-stat-item">
                  <span className="stat-label">Accuracy Rate</span>
                  <span className="stat-value">{analysisReport.accuracyPct}%</span>
                </div>
                <div className="report-stat-item">
                  <span className="stat-label">Clean Reps</span>
                  <span className="stat-value">
                    {analysisReport.cleanReps} / {analysisReport.totalReps}
                  </span>
                </div>
                <div className="report-stat-item">
                  <span className="stat-label">Average ROM Depth</span>
                  <span className="stat-value">{analysisReport.avgRom}%</span>
                </div>
                <div className="report-stat-item">
                  <span className="stat-label">Calories Burned</span>
                  <span className="stat-value fire">🔥 {analysisReport.caloriesBurned} kcal</span>
                </div>
              </div>

              {/* Interactive Timeline Events List */}
              {timelineEvents.length > 0 && (
                <div className="report-timeline-section">
                  <h4 className="section-heading">Key Timestamp Moments (Click to Jump):</h4>
                  <div className="timeline-events-list">
                    {timelineEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className={`timeline-event-item ${evt.isClean ? 'clean' : 'warning'}`}
                        onClick={() => jumpToTimestamp(evt.time)}
                      >
                        <span className="event-time">{formatTime(evt.time)}</span>
                        <div className="event-info">
                          <span className="event-title">{evt.title}</span>
                          <span className="event-detail">{evt.detail}</span>
                        </div>
                        <span className="event-jump-arrow">➔</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Biomechanical Prescriptions & Recommendations */}
              <div className="report-recommendations">
                <h4 className="section-heading">Form Improvement Recommendations:</h4>
                <ul className="rec-list">
                  {analysisReport.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Report Actions */}
              <div className="report-action-buttons">
                <button type="button" className="btn btn-primary btn-download-report" onClick={downloadReport}>
                  📥 Download Analysis Report
                </button>
              </div>
            </div>
          )}

          {/* 3. Empty State Card (When no video chosen) */}
          {!videoUrl && !isLoading && (
            <div className="va-empty-state-card">
              <div className="empty-icon-art">📹</div>
              <h3>Multi-Discipline Video Lab</h3>
              <p>
                Upload any workout or yoga video. FitVision AI tracks full-body keypoints, counts reps, measures joint angles, and speaks voice corrections in real-time.
              </p>

              <div className="features-checklist">
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  <span><strong>MoveNet Thunder AI</strong> — 17 anatomical keypoints with foreground subject isolation</span>
                </div>
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  <span><strong>10 Gym Disciplines</strong> — Squats, push-ups, lunges, bicep curls, crunches & more</span>
                </div>
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  <span><strong>28 Yoga Disciplines</strong> — Deep classification & joint angle posture mastery</span>
                </div>
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  <span><strong>Full Screen Theater Mode</strong> — High resolution canvas with frame-by-frame stepper</span>
                </div>
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  <span><strong>Intelligent Voice Coach</strong> — Real-time audio form feedback and rep announcements</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Webcam Recording Modal */}
      {isRecordingWebcam && (
        <div className="webcam-record-modal-overlay">
          <div className="webcam-record-modal">
            <div className="record-modal-header">
              <h3>🎥 Record Practice Workout Video</h3>
              <span className="rec-live-indicator">● REC {recordingSeconds}s / 15s</span>
            </div>
            <div className="record-video-wrapper">
              <video ref={webcamVideoPreviewRef} autoPlay playsInline muted className="record-preview-video" />
            </div>
            <p className="record-instruction">
              Perform your squats, push-ups, or yoga poses in front of the camera. The video will be captured and immediately analyzed.
            </p>
            <div className="record-actions-row">
              <button type="button" className="btn btn-danger btn-stop-rec" onClick={stopWebcamRecording}>
                ■ Finish & Analyze Video
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-cancel-rec"
                onClick={() => {
                  if (webcamStreamRef.current) {
                    webcamStreamRef.current.getTracks().forEach((t) => t.stop());
                    webcamStreamRef.current = null;
                  }
                  setIsRecordingWebcam(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
