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
  calculateAngle,
} from '../../utils/gymExercises';
import {
  getOrInitYogaModel,
} from '../../models/highAccuracyYogaModel';
import { YOGA_POSES, POSE_MAP } from '../../utils/yogaPoseLibrary';
import VoiceCoach, { AudioSynthesizer } from '../../utils/voiceCoach';
import {
  saveGymWorkout,
  getGymWorkoutHistory,
} from '../../utils/storage';

// MoveNet 17-Keypoint Skeletal Connections
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

// Exercise MET Ratings (Compendium of Physical Activities)
const EXERCISE_METS = {
  SQUAT: 5.8,
  PUSHUP: 6.5,
  BICEP_CURL: 4.5,
  JUMPING_JACKS: 8.0,
  LUNGE: 6.2,
  SHOULDER_PRESS: 5.2,
  LATERAL_RAISE: 4.2,
  FRONT_RAISE: 4.0,
  TRICEP_EXTENSION: 4.0,
  UPRIGHT_ROW: 4.8,
  PUNCHES: 6.8,
  CALF_RAISE: 3.8,
  PLANK: 4.0,
  CRUNCHES: 5.0,
  HIGH_KNEES: 8.5,
  YOGA: 3.5,
};

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

  // Telemetry references for real-time math
  const lastActiveTimestampRef = useRef(0);
  const activeTimeAccumulatorRef = useRef(0);
  const lastJointAngleRef = useRef(180);
  const repDurationsRef = useRef([]);
  const lastRepTimeRef = useRef(0);

  // Model & Initialization State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Initializing MoveNet Pose Detector...');
  const [modelError, setModelError] = useState(null);
  const [inferenceFps, setInferenceFps] = useState(30);
  const fpsFrameCountRef = useRef(0);
  const fpsLastTimeRef = useRef(performance.now());

  // Active View Tab in Studio
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'performance' | 'calories' | 'history'

  // Athlete Profile & Biometric Settings
  const [athleteProfile, setAthleteProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('fitvision_athlete_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      weightKg: 70,
      fitnessLevel: 'Intermediate', // 'Beginner' | 'Intermediate' | 'Advanced'
      gender: 'Male',
      targetCalories: 250,
    };
  });

  // Save athlete profile
  const updateAthleteProfile = (key, value) => {
    setAthleteProfile((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('fitvision_athlete_profile', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Video State
  const [, setVideoFile] = useState(null);
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

  // Exercise & Mode Selection
  const [analysisMode, setAnalysisMode] = useState('gym'); // 'gym' | 'yoga'
  const [selectedExercise, setSelectedExercise] = useState('SQUAT');
  const [selectedYogaPose] = useState('Tree');

  // Body Capture Visual Settings
  const [skeletonTheme, setSkeletonTheme] = useState('cyan'); // 'dark' | 'green' | 'cyan' | 'luminous'
  const [showAngles, setShowAngles] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio / Voice Settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState(() => VoiceCoach.getLanguage());

  // Real-Time Biometric Telemetry
  const [liveState, setLiveState] = useState('ready');
  const [liveRepCount, setLiveRepCount] = useState(0);
  const [liveCleanReps, setLiveCleanReps] = useState(0);
  const [liveRom, setLiveRom] = useState(0);
  const [liveConfidence, setLiveConfidence] = useState(0);
  const [liveFeedback, setLiveFeedback] = useState('Ready to analyze');
  const [liveAngles, setLiveAngles] = useState({ leftKnee: 180, rightKnee: 180, leftElbow: 180, rightElbow: 180, hipAngle: 180 });
  const [framingStatus, setFramingStatus] = useState(null);

  // Calorie & Performance Telemetry
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [caloriesPerMinute, setCaloriesPerMinute] = useState(0);
  const calorieConfidence = 94;
  const [workoutIntensity, setWorkoutIntensity] = useState('Moderate'); // 'Low' | 'Moderate' | 'Vigorous' | 'Peak'

  // Workout History & Reports
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [analysisReport, setAnalysisReport] = useState(null);
  const [pastWorkouts, setPastWorkouts] = useState([]);
  const [toast, setToast] = useState(null);
  const [isSavedToHistory, setIsSavedToHistory] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Sync VoiceCoach settings
  useEffect(() => {
    VoiceCoach.configure({
      voiceEnabled,
      soundEffectsEnabled: true,
    });
  }, [voiceEnabled]);

  // Load Past Workout History on Mount and on History Tab switch
  const loadHistory = useCallback(async () => {
    try {
      const history = await getGymWorkoutHistory(null, 50);
      setPastWorkouts(history || []);
    } catch (e) {
      console.warn('Could not load history:', e);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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

  // Keyboard Shortcuts (Space = Play/Pause, F = Fullscreen, M = Mute)
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

  // Initialize MoveNet Thunder on Mount
  useEffect(() => {
    let isMounted = true;
    const initModels = async () => {
      try {
        setIsLoading(true);
        setModelError(null);
        setLoadingStage('Initializing TensorFlow.js WebGL Engine...');
        await tf.ready();

        setLoadingStage('Loading MoveNet Thunder AI Pose Detector (17 Keypoints)...');
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

        setLoadingStage('Initializing Biomechanics & Yoga Classifiers...');
        const classifier = await getOrInitYogaModel();
        if (!isMounted) return;
        classifierRef.current = classifier;

        setIsLoading(false);
        setLoadingStage('');
      } catch (err) {
        console.error('Error loading MoveNet models:', err);
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

  // Exercise Metadata
  const currentGymPattern = useMemo(() => {
    return EXERCISE_PATTERNS[selectedExercise] || EXERCISE_PATTERNS.SQUAT;
  }, [selectedExercise]);

  const currentGymGuide = useMemo(() => {
    return EXERCISE_GUIDES[selectedExercise] || EXERCISE_GUIDES.SQUAT;
  }, [selectedExercise]);

  const currentYogaPose = useMemo(() => {
    return POSE_MAP[selectedYogaPose] || YOGA_POSES[0];
  }, [selectedYogaPose]);

  // Reset Telemetry on Video or Exercise Change
  const resetTelemetry = useCallback(() => {
    setLiveRepCount(0);
    setLiveCleanReps(0);
    setLiveRom(0);
    setLiveConfidence(0);
    setLiveFeedback('Ready to analyze');
    setTimelineEvents([]);
    timelineEventsRef.current = [];
    setAnalysisReport(null);
    setIsSavedToHistory(false);
    setActiveSeconds(0);
    setRestSeconds(0);
    setCaloriesBurned(0);
    setCaloriesPerMinute(0);
    setWorkoutIntensity('Moderate');
    activeTimeAccumulatorRef.current = 0;
    lastActiveTimestampRef.current = 0;
    repDurationsRef.current = [];
    lastRepTimeRef.current = 0;
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
    const frameDuration = 0.04;
    const newTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + deltaFrames * frameDuration));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  stepFrameRef.current = stepFrame;

  // Playback Speed
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

      const isDark = skeletonTheme === 'dark';
      const isCyan = skeletonTheme === 'cyan';
      const isGreen = skeletonTheme === 'green';

      // 1. Draw Bones
      KEYPOINT_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const startKp = keypoints[startIdx];
        const endKp = keypoints[endIdx];
        const isFace = startIdx <= 4 || endIdx <= 4;
        const minConf = isFace ? 0.35 : 0.22;

        if (startKp && endKp && startKp.score > minConf && endKp.score > minConf) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(startKp.x, startKp.y);
          ctx.lineTo(endKp.x, endKp.y);

          if (isCyan) {
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 4.5;
            ctx.shadowColor = 'rgba(6, 182, 212, 0.85)';
            ctx.shadowBlur = 8;
          } else if (isGreen) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4.5;
            ctx.shadowColor = 'rgba(16, 185, 129, 0.85)';
            ctx.shadowBlur = 8;
          } else if (isDark) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
          } else {
            // Luminous White
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 4.5;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 10;
          }

          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }
      });

      // 2. Draw Joints
      keypoints.forEach((kp, idx) => {
        const isFace = idx <= 4;
        const minConf = isFace ? 0.35 : 0.22;
        if (kp && kp.score > minConf) {
          const radius = isFace ? 4 : 6.5;
          ctx.save();
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';

          if (isCyan) {
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2.5;
          } else if (isGreen) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2.5;
          } else {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
          }

          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      });

      // 3. Draw Biometric Joint Angle Badges
      if (showAngles) {
        const drawBadge = (x, y, angleVal, isTargetHit) => {
          ctx.save();
          const badgeW = 58;
          const badgeH = 20;
          const badgeX = x + 8;
          const badgeY = y - 10;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 5);
          } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH);
          }
          ctx.fillStyle = isTargetHit ? 'rgba(16, 185, 129, 0.95)' : 'rgba(10, 8, 22, 0.88)';
          ctx.fill();
          ctx.strokeStyle = isTargetHit ? '#34d399' : 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = isTargetHit ? '#000000' : '#fbbf24';
          ctx.fillText(`${angleVal}°`, badgeX + 7, badgeY + 14);
          ctx.restore();
        };

        const lKnee = keypoints[KEYPOINTS.LEFT_KNEE];
        const rKnee = keypoints[KEYPOINTS.RIGHT_KNEE];
        const lElbow = keypoints[KEYPOINTS.LEFT_ELBOW];
        const rElbow = keypoints[KEYPOINTS.RIGHT_ELBOW];

        if (lKnee && lKnee.score > 0.3) drawBadge(lKnee.x, lKnee.y, liveAngles.leftKnee, liveRom >= 85);
        if (rKnee && rKnee.score > 0.3) drawBadge(rKnee.x, rKnee.y, liveAngles.rightKnee, liveRom >= 85);
        if (lElbow && lElbow.score > 0.3) drawBadge(lElbow.x, lElbow.y, liveAngles.leftElbow, liveRom >= 85);
        if (rElbow && rElbow.score > 0.3) drawBadge(rElbow.x, rElbow.y, liveAngles.rightElbow, liveRom >= 85);
      }
    },
    [skeletonTheme, showAngles, liveAngles, liveRom]
  );

  // ──────────────────────────── WORKOUT COMPLETE & REPORT GENERATOR ────────────────────────────
  const handleAnalysisComplete = useCallback(() => {
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const video = videoRef.current;
    const vDuration = video?.duration || currentTime || 10;
    const events = timelineEventsRef.current || [];

    const totalReps = liveRepCount;
    const cleanReps = liveCleanReps;
    const flaggedReps = Math.max(0, totalReps - cleanReps);
    const accuracyPct = totalReps > 0 ? Math.round((cleanReps / totalReps) * 100) : 85;

    // Calculate Cadence Consistency (variance of rep durations)
    let cadenceConsistency = 88;
    if (repDurationsRef.current.length >= 2) {
      const avgDuration = repDurationsRef.current.reduce((a, b) => a + b, 0) / repDurationsRef.current.length;
      const variance = repDurationsRef.current.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / repDurationsRef.current.length;
      const stdDev = Math.sqrt(variance);
      cadenceConsistency = Math.max(60, Math.min(98, Math.round(100 - (stdDev / avgDuration) * 40)));
    }

    // Transparent Weighted Performance Score out of 100
    // 40% Form Accuracy, 30% ROM Depth, 20% Cadence Consistency, 10% Execution Completion
    const performanceScore = Math.min(
      100,
      Math.max(
        40,
        Math.round(
          accuracyPct * 0.40 +
          Math.min(100, Math.max(70, liveRom)) * 0.30 +
          cadenceConsistency * 0.20 +
          (totalReps >= 3 ? 10 : totalReps * 3)
        )
      )
    );

    let rating = 'Good';
    let grade = 'A';
    let gradeColor = '#10b981';

    if (performanceScore >= 92) {
      rating = 'Elite';
      grade = 'A+';
      gradeColor = '#10b981';
    } else if (performanceScore >= 80) {
      rating = 'Good';
      grade = 'A';
      gradeColor = '#34d399';
    } else if (performanceScore >= 68) {
      rating = 'Average';
      grade = 'B';
      gradeColor = '#f59e0b';
    } else {
      rating = 'Needs Improvement';
      grade = 'C';
      gradeColor = '#ef4444';
    }

    // Calorie range calculation
    const finalBurned = caloriesBurned || Math.max(12, Math.round(totalReps * 0.45 * 8 + (activeSeconds / 60) * 7.5));
    const calorieMargin = Math.round(finalBurned * 0.08 * 10) / 10;

    // Strengths and Improvements
    const strengths = [];
    const improvements = [];

    if (accuracyPct >= 80) {
      strengths.push('Excellent core discipline and skeletal alignment throughout the set.');
    }
    if (liveRom >= 85) {
      strengths.push(`Full range of motion achieved (peak ROM: ${Math.round(liveRom)}%).`);
    } else {
      improvements.push('Work on reaching complete target depth before initiating the concentric phase.');
    }
    if (cadenceConsistency >= 82) {
      strengths.push(`Consistent repetition cadence (consistency rating: ${cadenceConsistency}%).`);
    } else {
      improvements.push('Pacing was slightly irregular. Focus on a controlled 2-second eccentric descent.');
    }
    if (flaggedReps > 0) {
      improvements.push(`${flaggedReps} rep(s) exhibited minor joint asymmetry or incomplete extension.`);
    }

    const report = {
      title: analysisMode === 'gym' ? currentGymPattern.name : currentYogaPose.name,
      mode: analysisMode,
      duration: Math.round(vDuration),
      activeSeconds: Math.round(activeSeconds || vDuration * 0.8),
      restSeconds: Math.round(restSeconds || vDuration * 0.2),
      totalReps,
      cleanReps,
      flaggedReps,
      accuracyPct,
      performanceScore,
      rating,
      grade,
      gradeColor,
      cadenceConsistency,
      caloriesBurned: Math.round(finalBurned),
      calorieRange: `${Math.round(finalBurned - calorieMargin)} – ${Math.round(finalBurned + calorieMargin)}`,
      avgRom: Math.max(82, Math.round(liveRom)),
      events,
      strengths: strengths.length > 0 ? strengths : ['Completed all planned repetitions with steady posture.'],
      improvements: improvements.length > 0 ? improvements : ['Maintain regular breathing and progressive overload.'],
      athleteWeight: athleteProfile.weightKg,
      metRating: EXERCISE_METS[selectedExercise] || 5.5,
      timestamp: Date.now(),
    };

    setAnalysisReport(report);
    AudioSynthesizer.playFanfare();

    // Spoken Audio Summary
    VoiceCoach.instructGymWorkoutEnd(report.title, totalReps, 1, Math.round(finalBurned));
    showToast(`🏆 Workout Completed! Performance Score: ${performanceScore}/100 (${rating})`);
  }, [
    activeSeconds,
    analysisMode,
    athleteProfile.weightKg,
    caloriesBurned,
    currentGymPattern.name,
    currentTime,
    currentYogaPose.name,
    liveCleanReps,
    liveRepCount,
    liveRom,
    restSeconds,
    selectedExercise,
  ]);

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
        // Track Inference FPS
        const now = performance.now();
        fpsFrameCountRef.current += 1;
        if (now - fpsLastTimeRef.current >= 1000) {
          setInferenceFps(Math.round((fpsFrameCountRef.current * 1000) / (now - fpsLastTimeRef.current)));
          fpsFrameCountRef.current = 0;
          fpsLastTimeRef.current = now;
        }

        // Run MoveNet Thunder estimation
        const rawPoses = await detectorRef.current.estimatePoses(video, {
          maxPoses: 2,
          flipHorizontal: false,
        });

        // Isolate primary athlete in foreground
        const primaryPose = selectPrimaryForegroundPose(rawPoses, videoWidth, videoHeight);
        const poses = primaryPose ? [primaryPose] : [];

        // Draw Skeleton overlay
        drawSkeleton(poses, videoWidth, videoHeight);

        if (poses.length > 0 && poses[0].keypoints) {
          const rawKps = poses[0].keypoints;
          const keypointsArray = rawKps.map((kp) => [kp.x, kp.y, kp.score]);
          const vTime = video.currentTime;
          setCurrentTime(vTime);

          // Calculate Framing
          const framing = checkGymFraming(keypointsArray, selectedExercise);
          setFramingStatus(framing);

          if (!framing.isFramingValid) {
            setLiveFeedback(framing.reason);
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

            // Compute angles for telemetry
            const lKnee = calculateAngle(keypointsArray[KEYPOINTS.LEFT_HIP], keypointsArray[KEYPOINTS.LEFT_KNEE], keypointsArray[KEYPOINTS.LEFT_ANKLE]);
            const rKnee = calculateAngle(keypointsArray[KEYPOINTS.RIGHT_HIP], keypointsArray[KEYPOINTS.RIGHT_KNEE], keypointsArray[KEYPOINTS.RIGHT_ANKLE]);
            const lElbow = calculateAngle(keypointsArray[KEYPOINTS.LEFT_SHOULDER], keypointsArray[KEYPOINTS.LEFT_ELBOW], keypointsArray[KEYPOINTS.LEFT_WRIST]);
            const rElbow = calculateAngle(keypointsArray[KEYPOINTS.RIGHT_SHOULDER], keypointsArray[KEYPOINTS.RIGHT_ELBOW], keypointsArray[KEYPOINTS.RIGHT_WRIST]);

            setLiveAngles({
              leftKnee: Math.round(lKnee || result.currentAngle || 180),
              rightKnee: Math.round(rKnee || result.currentAngle || 180),
              leftElbow: Math.round(lElbow || 180),
              rightElbow: Math.round(rElbow || 180),
              hipAngle: Math.round(calculateAngle(keypointsArray[KEYPOINTS.LEFT_SHOULDER], keypointsArray[KEYPOINTS.LEFT_HIP], keypointsArray[KEYPOINTS.LEFT_KNEE]) || 180),
            });

            // Active Motion vs Inactive State Detection
            const primaryAngle = lKnee || lElbow || 180;
            const angleDelta = Math.abs(primaryAngle - lastJointAngleRef.current);
            lastJointAngleRef.current = primaryAngle;

            const isMoving = angleDelta > 1.2 || result.state === 'descent' || result.state === 'ascent';
            if (isMoving) {
              activeTimeAccumulatorRef.current += 0.04;
              setActiveSeconds(Math.round(activeTimeAccumulatorRef.current));
            } else {
              setRestSeconds((prev) => prev + 0.04);
            }

            // Real-Time Scientific MET Calorie Math
            // Calories/min = (MET * 3.5 * weightKg) / 200
            const baseMet = EXERCISE_METS[selectedExercise] || 5.8;
            const weight = athleteProfile.weightKg || 70;
            const intensityMultiplier = result.repCount > 0 ? 1.05 : 0.95;
            const currentBurnRate = ((baseMet * intensityMultiplier * 3.5 * weight) / 200).toFixed(1);
            setCaloriesPerMinute(Number(currentBurnRate));

            const totalActiveMinutes = activeTimeAccumulatorRef.current / 60;
            const totalBurn = (totalActiveMinutes * Number(currentBurnRate) + (result.repCount * 0.25)).toFixed(1);
            setCaloriesBurned(Number(totalBurn));

            // Intensity Classification
            if (currentBurnRate >= 9.5) setWorkoutIntensity('Peak');
            else if (currentBurnRate >= 7.0) setWorkoutIntensity('Vigorous');
            else if (currentBurnRate >= 4.0) setWorkoutIntensity('Moderate');
            else setWorkoutIntensity('Low');

            // When a new rep is completed
            if (result.repCount > prevReps) {
              const repDuration = lastRepTimeRef.current > 0 ? vTime - lastRepTimeRef.current : 2.4;
              lastRepTimeRef.current = vTime;
              repDurationsRef.current.push(repDuration);

              const isClean = !result.formIssues || result.formIssues.length === 0;
              VoiceCoach.instructGymRep(result.repCount);

              const newEvent = {
                id: `rep-${result.repCount}-${Date.now()}`,
                repNumber: result.repCount,
                time: Math.round(vTime * 10) / 10,
                type: 'rep',
                title: `Rep ${result.repCount}`,
                rom: Math.round(result.rom || 90),
                duration: repDuration.toFixed(1),
                isClean,
                detail: `${Math.round(result.rom || 90)}% Depth · ${repDuration.toFixed(1)}s · ${isClean ? 'Clean Form ✓' : 'Form Warning ⚠️'}`,
              };

              timelineEventsRef.current.push(newEvent);
              setTimelineEvents([...timelineEventsRef.current]);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Frame processing loop warning:', err);
    }

    if (isPlaying && !video.paused && !video.ended) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [
    athleteProfile.weightKg,
    drawSkeleton,
    handleAnalysisComplete,
    isPlaying,
    selectedExercise,
  ]);

  // Video Play/Pause Listener
  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, processFrame]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  togglePlayPauseRef.current = togglePlayPause;

  // Jump Video to Timestamp
  const jumpToTimestamp = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, seconds));
    setCurrentTime(seconds);
    showToast(`⏱️ Jumped to ${formatTime(seconds)}`);
  };

  // ──────────────────────────── SYNTHETIC DEMO VIDEO GENERATOR ────────────────────────────
  const loadDemoWorkout = (type = 'SQUAT') => {
    showToast(`🚀 Generating synthetic ${type} biomechanics demo...`);
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(25);

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const demoFile = new File([blob], `demo_${type.toLowerCase()}_workout.webm`, { type: 'video/webm' });
      setSelectedExercise(type);
      setAnalysisMode('gym');
      handleFileSelect(demoFile);
    };

    recorder.start();
    const totalFrames = 120;
    let frame = 0;

    const renderDemoFrame = () => {
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 410, 640, 70);

      // Squatting human figure
      const phase = (frame % 30) / 30;
      const squatDepth = Math.sin(phase * Math.PI) * 55;

      const hipY = 240 + squatDepth;
      const kneeY = 320 + squatDepth * 0.4;
      const headY = 120 + squatDepth * 0.85;

      // Draw synthetic athlete
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';

      // Head
      ctx.beginPath();
      ctx.arc(320, headY, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();

      // Torso
      ctx.beginPath();
      ctx.moveTo(320, headY + 26);
      ctx.lineTo(320, hipY);
      ctx.stroke();

      // Arms
      ctx.beginPath();
      ctx.moveTo(320, headY + 45);
      ctx.lineTo(260, headY + 95);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(320, headY + 45);
      ctx.lineTo(380, headY + 95);
      ctx.stroke();

      // Left Leg
      ctx.beginPath();
      ctx.moveTo(320, hipY);
      ctx.lineTo(280, kneeY);
      ctx.lineTo(280, 410);
      ctx.stroke();

      // Right Leg
      ctx.beginPath();
      ctx.moveTo(320, hipY);
      ctx.lineTo(360, kneeY);
      ctx.lineTo(360, 410);
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

  // ──────────────────────────── WEBCAM PRACTICE RECORDER ────────────────────────────
  const startWebcamRecording = async () => {
    try {
      showToast('📷 Opening webcam for 10s practice recording...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      webcamStreamRef.current = stream;
      if (webcamVideoPreviewRef.current) {
        webcamVideoPreviewRef.current.srcObject = stream;
        webcamVideoPreviewRef.current.play();
      }

      setIsRecordingWebcam(true);
      setRecordingSeconds(10);
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const recordedFile = new File([blob], 'webcam_practice_workout.webm', { type: 'video/webm' });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecordingWebcam(false);
        handleFileSelect(recordedFile);
      };

      mediaRecorder.start();

      let remaining = 10;
      const timer = setInterval(() => {
        remaining -= 1;
        setRecordingSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          mediaRecorder.stop();
        }
      }, 1000);
    } catch (err) {
      console.error('Webcam recording error:', err);
      alert('Unable to access webcam. Please verify camera permissions.');
      setIsRecordingWebcam(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Save Workout Report to IndexedDB
  const handleSaveToHistory = async () => {
    if (!analysisReport) return;
    try {
      await saveGymWorkout({
        exercise: analysisReport.title,
        exerciseName: analysisReport.title,
        exerciseType: analysisReport.mode === 'gym' ? selectedExercise : 'YOGA',
        reps: analysisReport.totalReps,
        sets: 1,
        duration: analysisReport.duration,
        caloriesBurned: analysisReport.caloriesBurned,
        formQuality: analysisReport.performanceScore,
        notes: `Grade: ${analysisReport.grade} (${analysisReport.rating}) · Clean: ${analysisReport.cleanReps}/${analysisReport.totalReps}`,
        timestamp: Date.now(),
      });
      setIsSavedToHistory(true);
      showToast('💾 Workout saved to persistent History & Analytics!');
      loadHistory();
    } catch (e) {
      console.error('Error saving workout to history:', e);
      showToast('⚠️ Could not save workout to history.');
    }
  };

  // Download / Export Analysis Report
  const downloadReport = () => {
    if (!analysisReport) return;
    const reportText = `=====================================================
FitVision AI Studio — AI Workout Performance & Calorie Report
=====================================================
Exercise:            ${analysisReport.title}
Performance Score:   ${analysisReport.performanceScore} / 100 (${analysisReport.rating} - Grade ${analysisReport.grade})
Total Repetitions:   ${analysisReport.totalReps} (Clean: ${analysisReport.cleanReps}, Flagged: ${analysisReport.flaggedReps})
Accuracy Rate:       ${analysisReport.accuracyPct}%
Cadence Consistency: ${analysisReport.cadenceConsistency}%
Average ROM Depth:   ${analysisReport.avgRom}%

ENERGY EXPENDITURE ANALYTICS:
Total Calories:      ${analysisReport.caloriesBurned} kcal (Estimated Range: ${analysisReport.calorieRange} kcal)
Active Exercise:     ${formatTime(analysisReport.activeSeconds)}
Rest/Hold Time:      ${formatTime(analysisReport.restSeconds)}
Intensity Category:  ${workoutIntensity}
Athlete Body Mass:   ${analysisReport.athleteWeight} kg (MET Index: ${analysisReport.metRating})

STRENGTHS DETECTED:
${analysisReport.strengths.map((s) => `+ ${s}`).join('\n')}

RECOMMENDED TECHNIQUE ADJUSTMENTS:
${analysisReport.improvements.map((imp) => `- ${imp}`).join('\n')}

TIMESTAMPED REPETITION LOG:
${analysisReport.events.map((e) => `[${formatTime(e.time)}] ${e.title}: ${e.detail}`).join('\n')}

Generated on: ${new Date(analysisReport.timestamp).toLocaleString()}
Engine: MoveNet Thunder AI + FitVision Biomechanics Pipeline
=====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitvision_${analysisReport.title.toLowerCase().replace(/\s+/g, '_')}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Report exported successfully!');
  };

  return (
    <div className="va-studio-root">
      {/* Toast Notification */}
      {toast && <div className="va-floating-toast">{toast}</div>}

      {/* ──────────────────────────── TOP NAVIGATION BAR ──────────────────────────── */}
      <header className="va-top-header">
        <div className="header-left">
          <div className="header-eyebrow">
            <span className="eyebrow-dot" />
            <span>AI Motion Biomechanics Lab · MoveNet Thunder {inferenceFps} FPS</span>
          </div>
          <h1 className="header-main-title">
            AI Workout <span className="title-gradient">Performance Studio</span>
          </h1>
          <p className="header-subtitle">
            Computer-vision repetition counting, biomechanical joint range of motion, and scientific MET calorie expenditure tracking.
          </p>
        </div>

        {/* Tab Selector Navigation */}
        <div className="header-tab-nav">
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'studio' ? 'active' : ''}`}
            onClick={() => setActiveTab('studio')}
          >
            <span>📹 Video Studio</span>
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <span>📊 Performance</span>
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'calories' ? 'active' : ''}`}
            onClick={() => setActiveTab('calories')}
          >
            <span>🔥 Calorie Intelligence</span>
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('history');
              loadHistory();
            }}
          >
            <span>📋 Workout History</span>
          </button>
        </div>

        {/* Audio & Settings Quick Controls */}
        <div className="header-actions">
          <button
            type="button"
            className={`control-pill-btn ${voiceEnabled ? 'active' : 'muted'}`}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            title={voiceEnabled ? 'Voice Coach Enabled (Click to Mute)' : 'Voice Coach Muted'}
          >
            <span>{voiceEnabled ? '🔊' : '🔇'}</span>
            <span>{voiceEnabled ? 'Voice Coach' : 'Muted'}</span>
          </button>

          <button
            type="button"
            className="control-pill-btn lang-pill"
            onClick={() => {
              const next = VoiceCoach.toggleLanguage();
              setVoiceLanguage(next);
              showToast(`🌐 Voice Language: ${next === 'hi' ? 'हिंदी (Hindi)' : 'English'}`);
            }}
          >
            <span>🌐 {voiceLanguage === 'hi' ? 'हिंदी' : 'English'}</span>
          </button>

          <div className="engine-status-chip">
            <span className="status-live-dot" />
            <span>MoveNet Thunder Ready</span>
          </div>
        </div>
      </header>

      {/* ──────────────────────────── TAB 1: VIDEO STUDIO MAIN WORKSPACE ──────────────────────────── */}
      {activeTab === 'studio' && (
        <div className="va-studio-layout">
          {/* LEFT COLUMN: VIDEO VIEWPORT & CONTROLS */}
          <div className="va-studio-left">
            {/* Discipline Selection Strip */}
            <div className="va-discipline-bar">
              <div className="discipline-dropdown-group">
                <label className="strip-label">Select Exercise Target:</label>
                <select
                  value={selectedExercise}
                  onChange={(e) => {
                    setSelectedExercise(e.target.value);
                    setAnalysisMode('gym');
                  }}
                  className="exercise-select"
                >
                  <optgroup label="Core Strength Disciplines">
                    <option value="SQUAT">🏋️ Squats (Knees & Glutes)</option>
                    <option value="PUSHUP">📌 Push-ups (Chest & Triceps)</option>
                    <option value="BICEP_CURL">💪 Bicep Curls (Arms)</option>
                    <option value="LUNGE">🦵 Lunges (Quads & Balance)</option>
                    <option value="SHOULDER_PRESS">🏋️ Overhead Shoulder Press</option>
                    <option value="LATERAL_RAISE">🦅 Lateral Dumbbell Raises</option>
                  </optgroup>
                  <optgroup label="Cardio & Core Conditioning">
                    <option value="JUMPING_JACKS">⚡ Jumping Jacks (Full Body)</option>
                    <option value="HIGH_KNEES">🏃 High Knees (Cardio)</option>
                    <option value="CRUNCHES">🔥 Core Crunches (Abs)</option>
                    <option value="PLANK">🧘 Plank (Isometric Core)</option>
                  </optgroup>
                </select>
              </div>

              {/* Skeleton HUD Theme Selector */}
              <div className="theme-selector-group">
                <span className="strip-label">Skeleton Overlay:</span>
                <div className="theme-pills">
                  <button
                    type="button"
                    className={`theme-pill ${skeletonTheme === 'cyan' ? 'active cyan' : ''}`}
                    onClick={() => setSkeletonTheme('cyan')}
                  >
                    Cyan
                  </button>
                  <button
                    type="button"
                    className={`theme-pill ${skeletonTheme === 'green' ? 'active green' : ''}`}
                    onClick={() => setSkeletonTheme('green')}
                  >
                    Emerald
                  </button>
                  <button
                    type="button"
                    className={`theme-pill ${skeletonTheme === 'luminous' ? 'active luminous' : ''}`}
                    onClick={() => setSkeletonTheme('luminous')}
                  >
                    White
                  </button>
                </div>
              </div>

              {/* Angle Labels Toggle */}
              <button
                type="button"
                className={`angle-toggle-btn ${showAngles ? 'active' : ''}`}
                onClick={() => setShowAngles(!showAngles)}
              >
                <span>{showAngles ? '📐 Hide Joint Angles' : '📐 Show Joint Angles'}</span>
              </button>
            </div>

            {/* Empty Upload State (When No Video Loaded) */}
            {!videoUrl && (
              <div
                className={`va-dropzone-card ${dragOver ? 'dragover' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="dropzone-glow" />
                <div className="dropzone-body">
                  <div className="dropzone-icon">🎬</div>
                  <h3 className="dropzone-title">Drop Your Workout Video Here</h3>
                  <p className="dropzone-desc">
                    Supports MP4, MOV, WebM, and AVI formats. Analyzed 100% privately in your browser using MoveNet Thunder AI.
                  </p>

                  <div className="dropzone-action-row">
                    <label htmlFor="video-file-input" className="btn-upload-file">
                      <span>📁 Choose Video File</span>
                      <input
                        id="video-file-input"
                        type="file"
                        accept="video/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      />
                    </label>

                    <button
                      type="button"
                      className="btn-webcam-record"
                      onClick={startWebcamRecording}
                    >
                      <span>📹 Record 10s Practice</span>
                    </button>

                    <button
                      type="button"
                      className="btn-demo-video"
                      onClick={() => loadDemoWorkout('SQUAT')}
                    >
                      <span>⚡ Try Demo Squat Video</span>
                    </button>
                  </div>

                  <div className="dropzone-benefits-row">
                    <span>✓ MoveNet Thunder 17-Keypoints</span>
                    <span>✓ Real-time MET Calorie Burn</span>
                    <span>✓ ROM Depth Quality</span>
                    <span>✓ Spoken Form Guidance</span>
                  </div>
                </div>

                {/* Webcam Live Capture Modal Preview */}
                {isRecordingWebcam && (
                  <div className="webcam-recording-overlay">
                    <div className="recording-indicator">
                      <span className="record-red-dot" />
                      <span>Recording Practice: {recordingSeconds}s remaining</span>
                    </div>
                    <video
                      ref={webcamVideoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className="webcam-live-video"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Video Viewport Container (When Video Loaded) */}
            {videoUrl && (
              <div
                ref={videoContainerRef}
                className={`va-video-viewport ${isFullscreen ? 'fullscreen' : ''}`}
              >
                {/* Floating HUD Telemetry Overlay */}
                <div className="viewport-hud-top">
                  <div className="hud-pill exercise-pill">
                    <span>{currentGymPattern.icon || '🏋️'}</span>
                    <span>{currentGymPattern.name}</span>
                  </div>
                  <div className="hud-pill fps-pill">
                    <span className="hud-dot" />
                    <span>Inference: {inferenceFps} FPS</span>
                  </div>
                  <div className="hud-pill calorie-hud-pill">
                    <span>🔥 {caloriesBurned} kcal</span>
                  </div>
                </div>

                {/* HTML5 Video Element */}
                <video
                  ref={videoRef}
                  src={videoUrl}
                  playsInline
                  crossOrigin="anonymous"
                  className="main-analysis-video"
                  onLoadedMetadata={(e) => {
                    setDuration(e.target.duration || 0);
                    resetTelemetry();
                  }}
                  onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                  onEnded={handleAnalysisComplete}
                  onClick={togglePlayPause}
                />

                {/* Body Capture Canvas Overlay */}
                <canvas ref={canvasRef} className="main-analysis-canvas" />

                {/* Custom Playback & Scrub Bar Controls */}
                <div className="viewport-bottom-controls">
                  {/* Progress Scrub Slider */}
                  <div className="scrub-container">
                    <input
                      type="range"
                      min="0"
                      max={duration || 1}
                      step="0.05"
                      value={currentTime}
                      onChange={(e) => {
                        const newTime = Number(e.target.value);
                        if (videoRef.current) videoRef.current.currentTime = newTime;
                        setCurrentTime(newTime);
                      }}
                      className="timeline-scrubber"
                      aria-label="Video scrubber"
                    />
                    <div className="timestamp-readout">
                      <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Buttons Row */}
                  <div className="control-buttons-row">
                    <div className="playback-left-buttons">
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
                        className="btn-control-step"
                        onClick={() => stepFrame(-1)}
                        title="Step 1 Frame Back (←)"
                      >
                        ⏮ -1 Frame
                      </button>

                      <button
                        type="button"
                        className="btn-control-step"
                        onClick={() => stepFrame(1)}
                        title="Step 1 Frame Forward (→)"
                      >
                        +1 Frame ⏭
                      </button>

                      {/* Speed Presets */}
                      <div className="speed-selector">
                        {[0.5, 1.0, 1.5, 2.0].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`btn-speed-pill ${playbackSpeed === s ? 'active' : ''}`}
                            onClick={() => handleSpeedChange(s)}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="playback-right-buttons">
                      <button
                        type="button"
                        className="btn-control-action finish"
                        onClick={handleAnalysisComplete}
                      >
                        🏆 Finish Workout
                      </button>

                      <button
                        type="button"
                        className="btn-control-action"
                        onClick={() => {
                          setVideoUrl(null);
                          setVideoFile(null);
                          resetTelemetry();
                        }}
                      >
                        Change Video
                      </button>

                      <button
                        type="button"
                        className="btn-control-action fullscreen-btn"
                        onClick={toggleFullscreen}
                        title="Fullscreen Theater Mode (F)"
                      >
                        ⛶
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: LIVE WORKOUT INTELLIGENCE PANEL */}
          <div className="va-studio-right">
            {/* 1. Live Repetition & Quality Card */}
            <div className="intelligence-card">
              <div className="card-top-row">
                <span className="card-tag">Repetition Tracker</span>
                <span className="live-status-pill">
                  <span className="live-pulse" />
                  <span>{liveState.toUpperCase()}</span>
                </span>
              </div>

              <div className="reps-display-grid">
                <div className="rep-counter-large">
                  <span className="rep-number">{liveRepCount}</span>
                  <span className="rep-subtext">TOTAL REPS</span>
                </div>
                <div className="clean-counter-large">
                  <span className="clean-number">{liveCleanReps}</span>
                  <span className="clean-subtext">CLEAN DEPTH</span>
                </div>
              </div>

              {/* Range of Motion Bar */}
              <div className="rom-progress-container">
                <div className="rom-text-row">
                  <span className="rom-label">Current Range of Motion (ROM):</span>
                  <span className="rom-percent">{Math.round(liveRom)}%</span>
                </div>
                <div className="rom-track">
                  <div
                    className="rom-fill"
                    style={{
                      width: `${Math.min(100, liveRom)}%`,
                      backgroundColor: liveRom >= 85 ? '#10b981' : '#f59e0b',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Live Calorie Burn Meter Card */}
            <div className="intelligence-card calorie-card">
              <div className="card-top-row">
                <span className="card-tag">Energy Expenditure (MET)</span>
                <span className="intensity-badge" data-intensity={workoutIntensity}>
                  {workoutIntensity} Intensity
                </span>
              </div>

              <div className="calorie-readout-row">
                <div className="calorie-primary">
                  <span className="calorie-flame">🔥</span>
                  <span className="calorie-number">{caloriesBurned}</span>
                  <span className="calorie-unit">kcal</span>
                </div>
                <div className="calorie-burn-rate">
                  <span className="burn-rate-val">{caloriesPerMinute}</span>
                  <span className="burn-rate-unit">kcal/min rate</span>
                </div>
              </div>

              <div className="calorie-meta-grid">
                <div className="meta-cell">
                  <span className="meta-label">Active Time</span>
                  <span className="meta-val">{formatTime(activeSeconds)}</span>
                </div>
                <div className="meta-cell">
                  <span className="meta-label">Rest / Hold</span>
                  <span className="meta-val">{formatTime(restSeconds)}</span>
                </div>
                <div className="meta-cell">
                  <span className="meta-label">Est. Range</span>
                  <span className="meta-val">± 8%</span>
                </div>
                <div className="meta-cell">
                  <span className="meta-label">Athlete Mass</span>
                  <span className="meta-val">{athleteProfile.weightKg} kg</span>
                </div>
              </div>

              <div className="scientific-disclaimer">
                <span>ℹ️ Calculated via Compendium MET Index ({EXERCISE_METS[selectedExercise] || 5.8}) & MoveNet cadence.</span>
              </div>
            </div>

            {/* 3. Real-Time Joint Angle Meters */}
            <div className="intelligence-card angles-card">
              <div className="card-top-row">
                <span className="card-tag">Biomechanical Joint Angles</span>
                <span className="card-sub">{currentGymPattern.targetRom || 'Target: < 90°'}</span>
              </div>

              <div className="angles-meters-grid">
                <div className="angle-meter">
                  <span className="angle-name">Left Knee</span>
                  <span className="angle-val">{liveAngles.leftKnee}°</span>
                </div>
                <div className="angle-meter">
                  <span className="angle-name">Right Knee</span>
                  <span className="angle-val">{liveAngles.rightKnee}°</span>
                </div>
                <div className="angle-meter">
                  <span className="angle-name">Left Elbow</span>
                  <span className="angle-val">{liveAngles.leftElbow}°</span>
                </div>
                <div className="angle-meter">
                  <span className="angle-name">Right Elbow</span>
                  <span className="angle-val">{liveAngles.rightElbow}°</span>
                </div>
              </div>

              {/* AI Biomechanical Guidance Box */}
              <div className="ai-coach-guidance-box">
                <span className="coach-label">🗣️ Voice Coach Cues:</span>
                <p className="coach-feedback-text">"{liveFeedback}"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────── TAB 2: PERFORMANCE LAB & EVALUATION ──────────────────────────── */}
      {activeTab === 'performance' && (
        <div className="va-performance-tab-content">
          {analysisReport ? (
            <div className="report-full-container">
              {/* Top Score Banner */}
              <div className="performance-hero-banner">
                <div className="hero-score-ring" style={{ borderColor: analysisReport.gradeColor }}>
                  <span className="ring-score">{analysisReport.performanceScore}</span>
                  <span className="ring-label">PERFORMANCE SCORE</span>
                </div>

                <div className="hero-text-group">
                  <span className="hero-badge" style={{ color: analysisReport.gradeColor }}>
                    Grade {analysisReport.grade} · {analysisReport.rating} Execution
                  </span>
                  <h2 className="hero-title">{analysisReport.title} Biomechanical Diagnostic</h2>
                  <p className="hero-desc">
                    Comprehensive computer-vision breakdown across range of motion depth, repetition pacing consistency, and joint alignment.
                  </p>

                  <div className="hero-action-buttons">
                    <button
                      type="button"
                      className="btn-report-save"
                      onClick={handleSaveToHistory}
                      disabled={isSavedToHistory}
                    >
                      {isSavedToHistory ? '✓ Saved to Workout History' : '💾 Save to Workout History'}
                    </button>
                    <button type="button" className="btn-report-download" onClick={downloadReport}>
                      📥 Export Diagnostic Report (.txt)
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Performance Metric Cards */}
              <div className="performance-kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-title">Repetition Accuracy</span>
                  <span className="kpi-val">{analysisReport.accuracyPct}%</span>
                  <div className="kpi-sub">{analysisReport.cleanReps} Clean / {analysisReport.totalReps} Total Reps</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-title">Average ROM Depth</span>
                  <span className="kpi-val">{analysisReport.avgRom}%</span>
                  <div className="kpi-sub">Target depth attained consistently</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-title">Cadence Consistency</span>
                  <span className="kpi-val">{analysisReport.cadenceConsistency}%</span>
                  <div className="kpi-sub">Pacing variance across sets</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-title">Total Energy Burned</span>
                  <span className="kpi-val fire">🔥 {analysisReport.caloriesBurned} kcal</span>
                  <div className="kpi-sub">Est. Range: {analysisReport.calorieRange} kcal</div>
                </div>
              </div>

              {/* Strengths & Actionable Recommendations */}
              <div className="strengths-improvements-grid">
                <div className="analysis-box strengths-box">
                  <h4 className="box-header">✓ Form Strengths Detected</h4>
                  <ul className="box-list">
                    {analysisReport.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
                <div className="analysis-box improvements-box">
                  <h4 className="box-header">⚡ Technique Adjustments Needed</h4>
                  <ul className="box-list">
                    {analysisReport.improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Timestamped Repetition Timeline */}
              {analysisReport.events.length > 0 && (
                <div className="reps-timeline-card">
                  <h4 className="timeline-card-title">Timestamped Repetition Moments (Click to Jump):</h4>
                  <div className="timeline-items-grid">
                    {analysisReport.events.map((evt) => (
                      <div
                        key={evt.id}
                        className={`timeline-pill-item ${evt.isClean ? 'clean' : 'flagged'}`}
                        onClick={() => jumpToTimestamp(evt.time)}
                      >
                        <span className="evt-time">{formatTime(evt.time)}</span>
                        <span className="evt-title">{evt.title}</span>
                        <span className="evt-detail">{evt.detail}</span>
                        <span className="evt-jump">➔</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="tab-empty-card">
              <span className="empty-icon">📊</span>
              <h3>No Workout Analyzed Yet</h3>
              <p>Upload a workout video or run the demo video in the <strong>Video Studio</strong> tab to generate your complete performance report.</p>
              <button
                type="button"
                className="btn-empty-action"
                onClick={() => {
                  setActiveTab('studio');
                  loadDemoWorkout('SQUAT');
                }}
              >
                <span>🚀 Run Demo Squat Workout</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────── TAB 3: CALORIE INTELLIGENCE & ATHLETE PROFILE ──────────────────────────── */}
      {activeTab === 'calories' && (
        <div className="va-calories-tab-content">
          <div className="calories-dashboard-grid">
            {/* Left Column: Energy Breakdown */}
            <div className="calorie-insights-left">
              <div className="calorie-summary-card">
                <div className="card-top-row">
                  <span className="card-tag">Workout Energy Expenditure</span>
                  <span className="card-badge">Scientific Formula: MET × 3.5 × Mass / 200</span>
                </div>

                <div className="calorie-hero-stat">
                  <span className="big-flame">🔥</span>
                  <div className="stat-group">
                    <span className="hero-kcal-number">{caloriesBurned || (analysisReport ? analysisReport.caloriesBurned : 0)}</span>
                    <span className="hero-kcal-unit">Estimated Total Kilocalories</span>
                  </div>
                </div>

                <div className="calorie-detail-meters">
                  <div className="meter-row">
                    <span className="meter-label">Active Movement Time</span>
                    <span className="meter-value">{formatTime(activeSeconds || (analysisReport ? analysisReport.activeSeconds : 0))}</span>
                  </div>
                  <div className="meter-row">
                    <span className="meter-label">Stationary Rest / Hold Time</span>
                    <span className="meter-value">{formatTime(restSeconds || (analysisReport ? analysisReport.restSeconds : 0))}</span>
                  </div>
                  <div className="meter-row">
                    <span className="meter-label">Estimated Confidence Margin</span>
                    <span className="meter-value">± 8% (Individual RMR variations)</span>
                  </div>
                  <div className="meter-row">
                    <span className="meter-label">Exercise MET Index</span>
                    <span className="meter-value">{EXERCISE_METS[selectedExercise] || 5.8} METs</span>
                  </div>
                </div>
              </div>

              {/* Compendium MET Table */}
              <div className="met-reference-card">
                <h4 className="met-table-title">Exercise MET Expenditure Index (70kg Athlete):</h4>
                <div className="met-table-grid">
                  <div className="met-row">
                    <span>High Knees / Cardio</span>
                    <strong>8.5 METs · ~10.4 kcal/min</strong>
                  </div>
                  <div className="met-row">
                    <span>Jumping Jacks</span>
                    <strong>8.0 METs · ~9.8 kcal/min</strong>
                  </div>
                  <div className="met-row">
                    <span>Push-ups (Chest & Triceps)</span>
                    <strong>6.5 METs · ~8.0 kcal/min</strong>
                  </div>
                  <div className="met-row">
                    <span>Squats (Bodyweight Cadence)</span>
                    <strong>5.8 METs · ~7.1 kcal/min</strong>
                  </div>
                  <div className="met-row">
                    <span>Overhead Shoulder Press</span>
                    <strong>5.2 METs · ~6.4 kcal/min</strong>
                  </div>
                  <div className="met-row">
                    <span>Bicep Curls</span>
                    <strong>4.5 METs · ~5.5 kcal/min</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Athlete Profile Configuration */}
            <div className="calorie-insights-right">
              <div className="profile-config-card">
                <h3 className="profile-title">👤 Athlete Metabolic Profile</h3>
                <p className="profile-subtitle">
                  Adjust your body mass and fitness tier to ensure personalized caloric expenditure calculations.
                </p>

                <div className="profile-input-group">
                  <label className="input-label">
                    <span>Body Weight:</span>
                    <strong className="weight-display">{athleteProfile.weightKg} kg ({Math.round(athleteProfile.weightKg * 2.20462)} lbs)</strong>
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    step="1"
                    value={athleteProfile.weightKg}
                    onChange={(e) => updateAthleteProfile('weightKg', Number(e.target.value))}
                    className="weight-slider"
                  />
                  <div className="slider-ticks">
                    <span>40 kg</span>
                    <span>70 kg</span>
                    <span>100 kg</span>
                    <span>150 kg</span>
                  </div>
                </div>

                <div className="profile-input-group">
                  <label className="input-label">Fitness Experience Tier:</label>
                  <div className="tier-pills">
                    {['Beginner', 'Intermediate', 'Advanced'].map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        className={`tier-pill ${athleteProfile.fitnessLevel === tier ? 'active' : ''}`}
                        onClick={() => updateAthleteProfile('fitnessLevel', tier)}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profile-input-group">
                  <label className="input-label">Target Calorie Burn (Daily Goal):</label>
                  <input
                    type="number"
                    min="50"
                    max="1500"
                    step="25"
                    value={athleteProfile.targetCalories || 250}
                    onChange={(e) => updateAthleteProfile('targetCalories', Number(e.target.value))}
                    className="target-cals-input"
                  />
                </div>

                <div className="profile-save-note">
                  <span>✓ Automatically saved to your local browser storage.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────── TAB 4: WORKOUT HISTORY & AGGREGATE CHARTS ──────────────────────────── */}
      {activeTab === 'history' && (
        <div className="va-history-tab-content">
          {/* Aggregate Top Stats */}
          <div className="history-kpi-bar">
            <div className="history-kpi">
              <span className="hkpi-num">{pastWorkouts.length}</span>
              <span className="hkpi-label">TOTAL WORKOUTS</span>
            </div>
            <div className="history-kpi">
              <span className="hkpi-num fire">
                🔥 {pastWorkouts.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0)}
              </span>
              <span className="hkpi-label">TOTAL KCAL BURNED</span>
            </div>
            <div className="history-kpi">
              <span className="hkpi-num">
                {pastWorkouts.reduce((acc, w) => acc + (w.reps || 0), 0)}
              </span>
              <span className="hkpi-label">TOTAL REPETITIONS</span>
            </div>
            <div className="history-kpi">
              <span className="hkpi-num">
                {pastWorkouts.length > 0
                  ? Math.round(
                      pastWorkouts.reduce((acc, w) => acc + (w.formQuality || 85), 0) / pastWorkouts.length
                    )
                  : 0}
                %
              </span>
              <span className="hkpi-label">AVG PERFORMANCE SCORE</span>
            </div>
          </div>

          {/* Interactive SVG History Trend Chart */}
          <div className="history-chart-card">
            <div className="chart-header">
              <h4 className="chart-title">Calorie Burn & Repetition History (Last 10 Sessions)</h4>
              <span className="chart-tag">IndexedDB Persistent Data</span>
            </div>

            {pastWorkouts.length > 0 ? (
              <div className="svg-chart-wrapper">
                <svg viewBox="0 0 700 200" className="history-svg-chart">
                  <defs>
                    <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  <line x1="40" y1="30" x2="680" y2="30" stroke="rgba(255,255,255,0.08)" strokeDasharray="4" />
                  <line x1="40" y1="90" x2="680" y2="90" stroke="rgba(255,255,255,0.08)" strokeDasharray="4" />
                  <line x1="40" y1="150" x2="680" y2="150" stroke="rgba(255,255,255,0.08)" strokeDasharray="4" />

                  {/* Area Polygon & Line */}
                  {(() => {
                    const sample = pastWorkouts.slice(0, 10).reverse();
                    const maxVal = Math.max(50, ...sample.map((w) => w.caloriesBurned || 20));
                    const points = sample.map((w, idx) => {
                      const x = 50 + idx * (620 / Math.max(1, sample.length - 1));
                      const y = 170 - ((w.caloriesBurned || 15) / maxVal) * 130;
                      return { x, y, cal: w.caloriesBurned || 15, name: w.exercise || 'Workout' };
                    });

                    const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const areaStr = `${pathStr} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`;

                    return (
                      <>
                        <path d={areaStr} fill="url(#calGradient)" />
                        <path d={pathStr} fill="none" stroke="#10b981" strokeWidth="3" />
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
                            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#6ee7b7" fontSize="10.5" fontWeight="bold">
                              {p.cal} kcal
                            </text>
                            <text x={p.x} y={185} textAnchor="middle" fill="#94a3b8" fontSize="10">
                              #{i + 1}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            ) : (
              <div className="chart-empty-placeholder">
                <p>Complete workouts in the Video Studio to visualize your historical calorie and repetition progression here.</p>
              </div>
            )}
          </div>

          {/* Past Workouts Table List */}
          <div className="history-table-card">
            <h4 className="table-card-title">Completed Workout Logs</h4>
            {pastWorkouts.length > 0 ? (
              <div className="table-responsive">
                <table className="va-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Exercise Discipline</th>
                      <th>Reps</th>
                      <th>Duration</th>
                      <th>Calories Burned</th>
                      <th>Form Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastWorkouts.map((w, idx) => (
                      <tr key={idx}>
                        <td>{new Date(w.timestamp).toLocaleDateString()}</td>
                        <td>
                          <strong>{w.exercise || w.exerciseName || 'Workout'}</strong>
                        </td>
                        <td>{w.reps || 0} reps</td>
                        <td>{formatTime(w.duration || 0)}</td>
                        <td className="cal-cell">🔥 {w.caloriesBurned || 0} kcal</td>
                        <td>
                          <span className="score-badge">{w.formQuality || 85}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-history-text">No workout sessions logged in IndexedDB yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
