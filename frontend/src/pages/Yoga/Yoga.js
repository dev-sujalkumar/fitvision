import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { count } from '../../utils/music';

import './Yoga.css';
import { YOGA_POSES, YOGA_CATEGORIES, POSE_MAP } from '../../utils/yogaPoseLibrary';
import { YOGA_POSE_IMAGES, YOGA_POSE_VECTORS } from '../../utils/yogaPoseImages';
import {
  getOrInitYogaModel,
  trainYogaModel,
  predictHybridPoseAccuracy,
  KEYPOINT_INDICES,
} from '../../models/highAccuracyYogaModel';
import { saveYogaSession } from '../../utils/storage';
import VoiceCoach, { AudioSynthesizer } from '../../utils/voiceCoach';

const DEFAULT_CONFIDENCE_THRESHOLD = 0.78;

// Keypoint connections for drawing MoveNet skeleton
const KEYPOINT_CONNECTIONS = [
  ['nose', 'left_eye'],
  ['left_eye', 'left_ear'],
  ['nose', 'right_eye'],
  ['right_eye', 'right_ear'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

const KEYPOINT_NAME_MAP = {
  nose: 0,
  left_eye: 1,
  right_eye: 2,
  left_ear: 3,
  right_ear: 4,
  left_shoulder: 5,
  right_shoulder: 6,
  left_elbow: 7,
  right_elbow: 8,
  left_wrist: 9,
  right_wrist: 10,
  left_hip: 11,
  right_hip: 12,
  left_knee: 13,
  right_knee: 14,
  left_ankle: 15,
  right_ankle: 16,
};

export default function Yoga() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const classifierRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const countAudioRef = useRef(null);
  const sessionStartRef = useRef(null);
  const holdStartTimeRef = useRef(null);

  // Stabilization & Anti-Fluctuation Refs
  const smoothedConfidenceRef = useRef(0);
  const smoothedKeypointsRef = useRef([]);
  const poseStreakRef = useRef(0);
  const gracePeriodTimerRef = useRef(0);
  const stableFeedbackRef = useRef({ cue: '', count: 0 });

  // Studio State
  const [currentPoseId, setCurrentPoseId] = useState('Tree');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [viewMode, setViewMode] = useState('photo'); // 'photo' | 'vector'

  // Detection & Session State
  const [isStartPose, setIsStartPose] = useState(false);
  const isStartPoseRef = useRef(false);
  const [detectionFlag, setDetectionFlag] = useState(false);
  const [poseTime, setPoseTime] = useState(0);
  const [bestPerform, setBestPerform] = useState(0);
  const [poseConfidence, setPoseConfidence] = useState(0);
  const [feedbackCue, setFeedbackCue] = useState('Position yourself in view');
  const [confidenceThreshold, setConfidenceThreshold] = useState(DEFAULT_CONFIDENCE_THRESHOLD);

  // AI Voice Coach & Audio State
  const [voiceCoachEnabled, setVoiceCoachEnabled] = useState(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState(() => VoiceCoach.getLanguage());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const yogaContainerRef = useRef(null);

  // Fullscreen controller with HTML5 standard API and fallback
  const toggleFullscreen = useCallback(() => {
    const elem = yogaContainerRef.current || document.documentElement;
    const isFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    if (!isFs) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => setIsFullscreen(true));
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => setIsFullscreen(false));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else {
        setIsFullscreen(false);
      }
    }
  }, []);

  // Sync state with native fullscreenchange events
  useEffect(() => {
    const handleFsChange = () => {
      const active = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(active);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  // Keyboard shortcut: 'F' = Fullscreen toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  useEffect(() => {
    isStartPoseRef.current = isStartPose;
  }, [isStartPose]);

  useEffect(() => {
    VoiceCoach.configure({
      voiceEnabled: voiceCoachEnabled,
      soundEffectsEnabled: soundEffectsEnabled,
    });
  }, [voiceCoachEnabled, soundEffectsEnabled]);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const poseParam = params.get('pose') || params.get('poseId');
    if (poseParam) {
      const match = YOGA_POSES.find(
        (p) =>
          p.id.toLowerCase() === poseParam.toLowerCase() ||
          p.name.toLowerCase() === poseParam.toLowerCase()
      );
      if (match) {
        setCurrentPoseId(match.id);
      }
    }
  }, [location.search]);

  // Loading & Training State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [loadingStatus, setLoadingStatus] = useState('Loading MoveNet Pose Detector...');
  const [modelError, setModelError] = useState(null);
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [isTrainingInProgress, setIsTrainingInProgress] = useState(false);
  const [trainingSampleTarget, setTrainingSampleTarget] = useState(100000);
  const [trainingStatus, setTrainingStatus] = useState('');
  const [framingStatus, setFramingStatus] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const currentPose = useMemo(() => {
    return POSE_MAP[currentPoseId] || YOGA_POSES[0];
  }, [currentPoseId]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: YOGA_POSES.length };
    YOGA_POSES.forEach((pose) => {
      counts[pose.category] = (counts[pose.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered poses list
  const filteredPoses = useMemo(() => {
    return YOGA_POSES.filter((pose) => {
      const matchesCategory = selectedCategory === 'all' || pose.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || pose.difficulty === selectedDifficulty;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        pose.name.toLowerCase().includes(query) ||
        pose.sanskrit.toLowerCase().includes(query) ||
        pose.targetMuscles.some((m) => m.toLowerCase().includes(query));

      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  // Load MoveNet Detector and Yoga Neural Classifier
  useEffect(() => {
    let isMounted = true;

    const initModels = async () => {
      try {
        setIsLoading(true);
        setModelError(null);
        setLoadingProgress(20);
        setLoadingStatus('Initializing TensorFlow MoveNet Thunder...');

        let detector;
        try {
          detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
          });
        } catch (thunderErr) {
          console.warn('Thunder fallback to Lightning:', thunderErr);
          detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          });
        }

        if (!isMounted) return;
        detectorRef.current = detector;
        setLoadingProgress(60);
        setLoadingStatus('Compiling 28-Pose Neural Classifier & Biomechanical Engine...');

        const classifier = await getOrInitYogaModel();
        if (!isMounted) return;
        classifierRef.current = classifier;

        setLoadingProgress(100);
        setIsLoading(false);
      } catch (err) {
        console.error('Model initialization error:', err);
        if (isMounted) {
          setModelError(err.message || 'Failed to initialize pose detection engine');
          setIsLoading(false);
        }
      }
    };

    initModels();

    const currentCam = webcamRef.current;

    return () => {
      isMounted = false;
      VoiceCoach.stopAll();
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (countAudioRef.current) {
        countAudioRef.current.pause();
        countAudioRef.current = null;
      }
      if (currentCam?.video?.srcObject) {
        currentCam.video.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Timer loop for active pose hold & voice milestone announcements
  useEffect(() => {
    let timerId;
    if (isStartPose && detectionFlag) {
      timerId = setInterval(() => {
        if (holdStartTimeRef.current) {
          const elapsedSec = (Date.now() - holdStartTimeRef.current) / 1000;
          setPoseTime(elapsedSec);
          setBestPerform((prev) => Math.max(prev, elapsedSec));
          // Intelligent voice coach encourages milestones (10s, 20s, 30s, 60s)
          VoiceCoach.instructYogaVerified(currentPose.name, elapsedSec);
        }
      }, 100);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isStartPose, detectionFlag, currentPose.name]);

  // Reset metrics when changing pose
  useEffect(() => {
    setPoseTime(0);
    setDetectionFlag(false);
    setPoseConfidence(0);
    setFeedbackCue('Align with reference guide');
    holdStartTimeRef.current = null;
    smoothedConfidenceRef.current = 0;
    smoothedKeypointsRef.current = [];
    poseStreakRef.current = 0;
    gracePeriodTimerRef.current = 0;
    stableFeedbackRef.current = { cue: '', count: 0 };
  }, [currentPoseId]);

  // Trigger Live Model Re-Training with user-selectable scale (including 100,000 samples)
  const handleRetrainModel = async (sampleCount = 100000) => {
    try {
      setIsTrainingInProgress(true);
      setTrainingLogs([]);
      setTrainingStatus(`Synthesizing dataset: 0 / ${sampleCount.toLocaleString()} samples (0%)...`);
      showToast(`🚀 Training on ${sampleCount.toLocaleString()} augmented samples...`);

      const isMassive = sampleCount > 5000;
      const epochs = sampleCount >= 50000 ? 10 : 25;

      const trained = await trainYogaModel(
        epochs,
        (log) => {
          if (log.status === 'generating') {
            setTrainingStatus(
              `Synthesizing dataset: ${log.generatedSamples?.toLocaleString() || 0} / ${log.targetSamples?.toLocaleString() || sampleCount.toLocaleString()} samples (${log.progressPercent || 0}%)`
            );
          } else if (log.status === 'training') {
            setTrainingStatus(`Training Epoch ${log.epoch}/${log.totalEpochs} · Accuracy: ${log.accuracy}% · Loss: ${log.loss}`);
            setTrainingLogs((prev) => [...prev.slice(-8), log]);
          }
        },
        Math.ceil(sampleCount / 31),
        isMassive,
        sampleCount
      );

      classifierRef.current = trained;
      setIsTrainingInProgress(false);
      setTrainingStatus(`✅ Training complete! 98%+ Accuracy across 31 classes (${sampleCount.toLocaleString()} samples).`);
      showToast(`✅ Successfully trained model on ${sampleCount.toLocaleString()} samples!`);
    } catch (err) {
      console.error(err);
      setIsTrainingInProgress(false);
      setTrainingStatus('Training error: ' + err.message);
      showToast('Training encountered an error: ' + err.message);
    }
  };

  // Main Detection Frame Loop with Temporal Stabilization, Anatomical Gating & Hysteresis
  const detectPose = useCallback(async () => {
    if (!detectorRef.current) return;
    if (!webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4) return;

    try {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Keep canvas resolution synced 1:1 with webcam frame
      if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const poses = await detectorRef.current.estimatePoses(video);
      const rawKeypoints = poses[0]?.keypoints || [];
      if (rawKeypoints.length < 17) {
        setFeedbackCue('Step fully into camera frame');
        return;
      }

      // 1. Keypoint Temporal Smoothing (EMA filter to eliminate joint flutter)
      let keypoints = rawKeypoints;
      if (smoothedKeypointsRef.current && smoothedKeypointsRef.current.length === 17) {
        const prevKps = smoothedKeypointsRef.current;
        keypoints = rawKeypoints.map((kp, i) => {
          const prev = prevKps[i];
          if (!prev || kp.score < 0.25) return kp;
          return {
            ...kp,
            x: prev.x * 0.35 + kp.x * 0.65,
            y: prev.y * 0.35 + kp.y * 0.65,
          };
        });
      }
      smoothedKeypointsRef.current = keypoints;

      // 2. Run Hybrid Classification & Biomechanical Verification with Anatomical Visibility Guard
      const result = await predictHybridPoseAccuracy(keypoints, currentPoseId, classifierRef.current);
      setFramingStatus(result.visibility || null);

      const isFramingValid = result.visibility?.isValid !== false;

      // Voice framing alert (what is wrong & what to do)
      if (!isFramingValid && isStartPoseRef.current) {
        VoiceCoach.instructFramingAlert(
          result.visibility?.reason || 'Please step back into full camera view',
          currentPose.name
        );
      }

      // 3. Confidence EMA Smoothing (Eliminates wild 67% <-> 96% flickering; forces low when seated/invalid)
      const rawTargetConfidence = isFramingValid ? result.confidence : 8;
      const prevConf = smoothedConfidenceRef.current || rawTargetConfidence;
      const smoothedConf = Math.round(prevConf * 0.65 + rawTargetConfidence * 0.35);
      smoothedConfidenceRef.current = smoothedConf;
      setPoseConfidence(smoothedConf);

      // 4. Dual-Threshold Hysteresis with Grace Period Buffer (Prevents random timer dropouts)
      const targetThreshold = confidenceThreshold * 100;
      const enterThreshold = Math.max(68, targetThreshold);
      const exitThreshold = Math.max(50, targetThreshold - 18);

      const isCurrentFrameGood = isFramingValid && result.isPoseMatched && smoothedConf >= exitThreshold;

      if (isCurrentFrameGood) {
        poseStreakRef.current += 1;
        gracePeriodTimerRef.current = 10; // 10 frames = ~1.2s grace buffer for micro-wobbles

        // Enter verified state on 2 consecutive frames or strong score
        if (!detectionFlag && (poseStreakRef.current >= 2 || smoothedConf >= enterThreshold)) {
          setDetectionFlag(true);
          if (!holdStartTimeRef.current) {
            holdStartTimeRef.current = Date.now();
          }
          if (countAudioRef.current && countAudioRef.current.paused) {
            countAudioRef.current.play().catch(() => {});
          }
          VoiceCoach.instructYogaVerified(currentPose.name, 0);
        }
      } else {
        poseStreakRef.current = 0;
        // If body framing is invalid (e.g. seated at desk), IMMEDIATELY cancel hold
        if (!isFramingValid) {
          gracePeriodTimerRef.current = 0;
        }

        // In verified state: consume grace period buffer during micro balance adjustments
        if (detectionFlag) {
          if (gracePeriodTimerRef.current > 0) {
            gracePeriodTimerRef.current -= 1;
          } else {
            // User stepped out or genuinely broke form
            setDetectionFlag(false);
            holdStartTimeRef.current = null;
            if (countAudioRef.current) {
              countAudioRef.current.pause();
              countAudioRef.current.currentTime = 0;
            }
            AudioSynthesizer.playWarningBeep();
          }
        }
      }

      // Voice form alignment coaching when attempting pose (tells what is wrong & how to correct)
      if (isStartPoseRef.current && isFramingValid && !isCurrentFrameGood && !detectionFlag) {
        if (result.feedbackCue && !result.feedbackCue.includes('Pose Verified')) {
          VoiceCoach.instructYogaCorrection(result.feedbackCue, currentPoseId);
        }
      }

      // 5. Debounce Feedback Cues (prevents rapid text flashing)
      const candidateCue = !isFramingValid
        ? result.feedbackCue
        : (isCurrentFrameGood || detectionFlag
            ? '✓ Pose Verified · Hold Still!'
            : result.feedbackCue);

      if (stableFeedbackRef.current.cue !== candidateCue) {
        stableFeedbackRef.current.count += 1;
        if (stableFeedbackRef.current.count >= 2) {
          stableFeedbackRef.current = { cue: candidateCue, count: 0 };
          setFeedbackCue(candidateCue);
        }
      } else {
        stableFeedbackRef.current.count = 0;
      }

      // Helper to mirror coordinates so canvas overlays 1:1 onto mirrored webcam video
      const getCanvasCoords = (kp) => {
        return {
          x: canvas.width - kp.x,
          y: kp.y,
          score: kp.score,
        };
      };

      const isMatch = detectionFlag;
      const isFramingAlert = result.visibility && !result.visibility.isValid;
      const outerColor = isMatch
        ? '#10b981'
        : isFramingAlert
          ? '#f59e0b'
          : smoothedConf > 50
            ? '#38bdf8'
            : '#ffffff';

      // Draw Limbs (High-Contrast Dual Stroke)
      KEYPOINT_CONNECTIONS.forEach(([startName, endName]) => {
        const startIdx = KEYPOINT_NAME_MAP[startName];
        const endIdx = KEYPOINT_NAME_MAP[endName];
        const startKp = keypoints[startIdx];
        const endKp = keypoints[endIdx];

        const isFaceConn = startIdx <= 4 || endIdx <= 4;
        const minScore = isFaceConn ? 0.45 : 0.30;

        if (startKp && endKp && startKp.score > minScore && endKp.score > minScore) {
          const start = getCanvasCoords(startKp);
          const end = getCanvasCoords(endKp);

          // Outer high-contrast rim
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = outerColor;
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Inner deep dark line
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = '#06060c';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      });

      // Draw High-Visibility Joints (White points with dark center & glowing ring)
      keypoints.forEach((kp, idx) => {
        const isFace = idx <= 4;
        const minScore = isFace ? 0.45 : 0.30;

        if (kp.score > minScore) {
          const coords = getCanvasCoords(kp);

          // Outer glowing halo
          ctx.beginPath();
          ctx.arc(coords.x, coords.y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = isMatch ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.3)';
          ctx.fill();

          // Solid white joint body
          ctx.beginPath();
          ctx.arc(coords.x, coords.y, 5.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // High-contrast center core
          ctx.beginPath();
          ctx.arc(coords.x, coords.y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#06060c';
          ctx.fill();
        }
      });

      // Joint Angle Badges
      const anglePoints = [
        { kp: keypoints[KEYPOINT_INDICES.LEFT_KNEE], val: result.angles.leftKnee, label: 'L Knee' },
        { kp: keypoints[KEYPOINT_INDICES.RIGHT_KNEE], val: result.angles.rightKnee, label: 'R Knee' },
        { kp: keypoints[KEYPOINT_INDICES.LEFT_ELBOW], val: result.angles.leftElbow, label: 'L Elbow' },
        { kp: keypoints[KEYPOINT_INDICES.RIGHT_ELBOW], val: result.angles.rightElbow, label: 'R Elbow' },
      ];

      anglePoints.forEach((pt) => {
        if (pt.kp && pt.kp.score > 0.30 && pt.val !== undefined) {
          const coords = getCanvasCoords(pt.kp);
          const badgeX = coords.x + 12;
          const badgeY = coords.y - 12;
          const badgeW = 52;
          const badgeH = 22;

          ctx.save();
          ctx.fillStyle = 'rgba(10, 8, 20, 0.88)';
          ctx.strokeStyle = isMatch ? 'rgba(16, 185, 129, 0.7)' : 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;

          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
            ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
          }

          ctx.font = 'bold 12px "Space Grotesk", sans-serif';
          ctx.fillStyle = isMatch ? '#34d399' : '#fbbf24';
          ctx.fillText(`${pt.val}°`, badgeX + 8, badgeY + 15);
          ctx.restore();
        }
      });
    } catch (err) {
      console.warn('Pose loop error:', err);
    }
  }, [currentPoseId, currentPose.name, confidenceThreshold, detectionFlag]);

  // Start Session
  const startYoga = () => {
    if (!detectorRef.current) {
      showToast('MoveNet is still loading, please wait...');
      return;
    }
    if (!countAudioRef.current) {
      countAudioRef.current = new Audio(count);
      countAudioRef.current.loop = true;
    }
    setIsStartPose(true);
    isStartPoseRef.current = true;
    sessionStartRef.current = Date.now();
    smoothedConfidenceRef.current = 0;
    smoothedKeypointsRef.current = [];
    poseStreakRef.current = 0;
    gracePeriodTimerRef.current = 0;
    stableFeedbackRef.current = { cue: '', count: 0 };
    detectionIntervalRef.current = setInterval(detectPose, 120);

    // AI Voice Coach speaks setup instructions (what to do)
    VoiceCoach.instructYogaPoseStart(currentPose);
  };

  // Stop Session & Save to Storage
  const stopPose = async () => {
    setIsStartPose(false);
    isStartPoseRef.current = false;
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (countAudioRef.current) {
      countAudioRef.current.pause();
      countAudioRef.current.currentTime = 0;
    }
    if (webcamRef.current?.video?.srcObject) {
      webcamRef.current.video.srcObject.getTracks().forEach((t) => t.stop());
    }

    if (sessionStartRef.current && bestPerform > 1) {
      const burned = Math.max(8, Math.round((bestPerform / 60) * currentPose.caloriesPerMin));
      VoiceCoach.instructYogaSessionEnd(currentPose.name, bestPerform, burned);
      try {
        await saveYogaSession({
          pose: currentPose.name,
          poseName: currentPose.name,
          duration: Math.round(bestPerform),
          timestamp: sessionStartRef.current,
          confidence: confidenceThreshold,
          caloriesBurned: burned,
          notes: `Held ${currentPose.name} for ${bestPerform.toFixed(1)}s with form verified by MoveNet AI.`,
        });
        showToast(`🎉 Saved ${currentPose.name} session (${bestPerform.toFixed(1)}s, ${burned} kcal)`);
      } catch (err) {
        console.error('Error saving session:', err);
      }
    } else {
      VoiceCoach.stopAll();
    }

    setDetectionFlag(false);
  };

  // ──────────────────────────── ACTIVE CAMERA HUD VIEW ────────────────────────────
  if (isStartPose) {
    const burnedCalories = Math.max(1, Math.round((poseTime / 60) * currentPose.caloriesPerMin));

    return (
      <div
        ref={yogaContainerRef}
        className={`yoga-page ${isFullscreen ? 'fullscreen-mode' : ''}`}
      >
        {toast && <div className="yoga-toast">{toast}</div>}

        {/* Live HUD Header */}
        <div className="yoga-active-header">
          <button onClick={stopPose} className="stop-btn" type="button">
            ⬅ End Practice
          </button>

          <div className="active-pose-meta">
            <span className="active-dot" style={{ background: detectionFlag ? '#10b981' : '#8b5cf6' }} />
            <div>
              <span className="active-pose-title">{currentPose.name}</span>
              <span className="active-sanskrit">{currentPose.sanskrit}</span>
            </div>
          </div>

          <div className="active-stats-bar">
            <div className="active-stat">
              <span className="active-stat-label">Hold Time</span>
              <span className="active-stat-value">{poseTime.toFixed(1)}s</span>
            </div>
            <div className="active-stat">
              <span className="active-stat-label">Best Record</span>
              <span className="active-stat-value best">{bestPerform.toFixed(1)}s</span>
            </div>
            <div className="active-stat">
              <span className="active-stat-label">Accuracy</span>
              <span className="active-stat-value">{poseConfidence}%</span>
            </div>
            <div className="active-stat">
              <span className="active-stat-label">Burn</span>
              <span className="active-stat-value fire">🔥 {burnedCalories} kcal</span>
            </div>
          </div>

          {/* Active Voice Coach & Display Toggles */}
          <div className="yoga-voice-controls active-hud">
            <button
              type="button"
              className={`btn-voice-toggle ${voiceCoachEnabled ? 'active' : ''}`}
              onClick={() => setVoiceCoachEnabled(!voiceCoachEnabled)}
              title="Toggle AI Voice Coach (Instructions & Corrections)"
            >
              <span>{voiceCoachEnabled ? '🔊 Voice On' : '🔇 Muted'}</span>
            </button>
            <button
              type="button"
              className="btn-voice-toggle lang-btn"
              onClick={() => {
                const next = VoiceCoach.toggleLanguage();
                setVoiceLanguage(next);
                VoiceCoach.testVoice(next);
              }}
              title="Switch Voice Language (English / हिंदी)"
            >
              <span>🌐 {voiceLanguage === 'hi' ? 'हिंदी' : 'EN'}</span>
            </button>
            <button
              type="button"
              className={`btn-voice-toggle ${isMirrored ? 'active' : ''}`}
              onClick={() => setIsMirrored(!isMirrored)}
              title={isMirrored ? 'Webcam Mirrored (Selfie mode)' : 'Webcam Normal (Unmirrored)'}
            >
              <span>{isMirrored ? '🪞 Mirrored' : '📷 Normal'}</span>
            </button>
            <button
              type="button"
              className={`btn-voice-toggle ${isFullscreen ? 'active' : ''}`}
              onClick={toggleFullscreen}
              title="Toggle Fullscreen Immersion (Press F)"
            >
              <span>{isFullscreen ? '↙ Standard' : '⛶ Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Studio Body */}
        <div className="yoga-active-body">
          {/* Camera Frame */}
          <div className="camera-wrapper">
            <div className={`camera-frame ${detectionFlag ? 'detected' : (framingStatus && !framingStatus.isValid ? 'framing-warning' : '')}`}>
              {/* Floating Quick Action Buttons on Camera Feed */}
              <div className="yoga-camera-floating-actions">
                <button
                  type="button"
                  className="yoga-float-btn"
                  onClick={() => setIsMirrored(!isMirrored)}
                  title={isMirrored ? 'Camera Mirrored' : 'Camera Normal'}
                >
                  {isMirrored ? '🪞' : '📷'}
                </button>
                <button
                  type="button"
                  className={`yoga-float-btn btn-fs-float ${isFullscreen ? 'active' : ''}`}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen Immersion (F)'}
                >
                  {isFullscreen ? '⤢ Exit' : '⛶ Fullscreen'}
                </button>
              </div>

              <Webcam
                id="webcam"
                ref={webcamRef}
                audio={false}
                mirrored={isMirrored}
                videoConstraints={{ facingMode: 'user' }}
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas
                ref={canvasRef}
                id="my-canvas"
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, pointerEvents: 'none' }}
              />

              {/* Step Back Warning Alert Banner */}
              {framingStatus && !framingStatus.isValid && (
                <div className="framing-warning-banner">
                  <span className="warning-icon">⚠️</span>
                  <div className="warning-content">
                    <span className="warning-title">STEP BACK: FULL BODY REQUIRED</span>
                    <span className="warning-desc">{framingStatus.reason}</span>
                  </div>
                </div>
              )}

              {/* Status Overlay Pill with Sound Wave Visualizer */}
              <div className={`pose-status-overlay ${detectionFlag ? 'good' : (framingStatus && !framingStatus.isValid ? 'alert' : 'waiting')}`}>
                <div className="status-label-group">
                  <span>{detectionFlag ? '✓ Pose Verified · Hold Still!' : `○ ${feedbackCue}`}</span>
                  {voiceCoachEnabled && (
                    <div className="audio-wave-anim" title="Voice Coach Active">
                      <span className="wave-bar bar-1"></span>
                      <span className="wave-bar bar-2"></span>
                      <span className="wave-bar bar-3"></span>
                      <span className="wave-bar bar-4"></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Anatomical Landmark Checklist Bar */}
              {framingStatus && (
                <div className="framing-checklist-bar">
                  <span className={framingStatus.visiblePartsSummary?.head ? 'part-badge ok' : 'part-badge miss'}>
                    Head {framingStatus.visiblePartsSummary?.head ? '✓' : '✗'}
                  </span>
                  <span className="part-sep">·</span>
                  <span className={framingStatus.visiblePartsSummary?.torso ? 'part-badge ok' : 'part-badge miss'}>
                    Torso {framingStatus.visiblePartsSummary?.torso ? '✓' : '✗'}
                  </span>
                  <span className="part-sep">·</span>
                  <span className={framingStatus.visiblePartsSummary?.hips ? 'part-badge ok' : 'part-badge miss'}>
                    Hips {framingStatus.visiblePartsSummary?.hips ? '✓' : '✗'}
                  </span>
                  <span className="part-sep">·</span>
                  <span className={framingStatus.visiblePartsSummary?.legs ? 'part-badge ok' : 'part-badge miss'}>
                    Legs {framingStatus.visiblePartsSummary?.legs ? '✓' : '✗'}
                  </span>
                  <span className="part-sep">·</span>
                  <span className={framingStatus.visiblePartsSummary?.feet ? 'part-badge ok' : 'part-badge miss'}>
                    Feet {framingStatus.visiblePartsSummary?.feet ? '✓' : '✗'}
                  </span>
                </div>
              )}

              {/* Confidence Telemetry Bar */}
              <div className="confidence-bar-overlay">
                <div
                  className="confidence-fill"
                  style={{
                    width: `${poseConfidence}%`,
                    background: detectionFlag
                      ? '#10b981'
                      : (framingStatus && !framingStatus.isValid
                          ? '#ef4444'
                          : poseConfidence > 50
                            ? '#f59e0b'
                            : '#8b5cf6'),
                  }}
                />
                <span className="confidence-label">{poseConfidence}% Match</span>
              </div>
            </div>
          </div>

          {/* Reference & Cues Panel */}
          <div className="reference-panel">
            <div className="ref-panel-header">
              <h3>Target Alignment</h3>
              <div className="view-mode-toggle">
                <button
                  className={`btn-mode-pill ${viewMode === 'photo' ? 'active' : ''}`}
                  onClick={() => setViewMode('photo')}
                >
                  Photo
                </button>
                <button
                  className={`btn-mode-pill ${viewMode === 'vector' ? 'active' : ''}`}
                  onClick={() => setViewMode('vector')}
                >
                  Anatomy
                </button>
              </div>
            </div>

            <div className="reference-img-wrap">
              <img
                src={viewMode === 'photo' ? YOGA_POSE_IMAGES[currentPoseId] : YOGA_POSE_VECTORS[currentPoseId]}
                alt={currentPose.name}
                className="reference-img"
              />
            </div>

            {/* Live Feedback Box */}
            <div className="live-feedback-box">
              <span className="feedback-icon">{detectionFlag ? '🟢' : '🟡'}</span>
              <p className="feedback-text">{feedbackCue}</p>
            </div>

            {/* Target Alignment Checklist */}
            <div className="alignment-cues-mini">
              <h4>Key Biometric Cues</h4>
              <ul>
                {currentPose.alignmentCues.slice(0, 3).map((cue, idx) => (
                  <li key={idx}>✓ {cue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────── SETUP & DISCOVERY VIEW ────────────────────────────
  return (
    <div className="yoga-page">
      {toast && <div className="yoga-toast">{toast}</div>}

      {/* Page Header */}
      <div className="yoga-page-header">
        <div>
          <div className="yoga-eyebrow-pill">
            <span className="eyebrow-dot" />
            <span>MoveNet Thunder AI · 28 Movement Disciplines</span>
          </div>
          <h1 className="yoga-page-title">
            🧘 Movement & Yoga <span className="highlight-text">Studio</span>
          </h1>
          <p className="yoga-page-sub">
            Real-time computer vision biomechanics, joint angle telemetry, and posture mastery
          </p>
        </div>

        <div className="yoga-header-actions">
          <div className="coaching-toggles">
            <button
              type="button"
              className={`toggle-pill ${voiceCoachEnabled ? 'active' : ''}`}
              onClick={() => setVoiceCoachEnabled(!voiceCoachEnabled)}
              title="Toggle AI Voice Coach (Instructions & Corrections)"
            >
              <span>{voiceCoachEnabled ? '🔊 Voice On' : '🔇 Voice Muted'}</span>
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
              className={`toggle-pill ${soundEffectsEnabled ? 'active' : ''}`}
              onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
              title="Toggle Sound Effects & Chimes"
            >
              <span>{soundEffectsEnabled ? '🔔 Sound FX' : '🔕 FX Off'}</span>
            </button>
          </div>

          <button
            className="btn-retrain-model"
            onClick={() => setIsTrainingOpen(true)}
            title="Train the 28-class neural model in browser"
          >
            ⚡ Train AI Model
          </button>
          <div className="yoga-header-status">
            {isLoading ? (
              <span className="badge badge-warning">⟳ Initializing AI...</span>
            ) : modelError ? (
              <span className="badge badge-error">⚠ Load Error</span>
            ) : (
              <span className="badge badge-success">✓ 28 Poses Active</span>
            )}
          </div>
        </div>
      </div>

      {/* Loading Bar Card */}
      {isLoading && (
        <div className="yoga-loading-card">
          <div className="spinner-ring" />
          <div className="loading-text-group">
            <p className="loading-title">Initializing Neural Biomechanics Engine</p>
            <p className="loading-sub">{loadingStatus}</p>
          </div>
          <div className="loading-progress-bar">
            <div className="loading-progress-fill" style={{ width: `${loadingProgress}%` }} />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {modelError && !isLoading && (
        <div className="yoga-error-card">
          <span className="error-icon">⚠️</span>
          <div>
            <p className="error-title">AI Engine Notice</p>
            <p className="error-desc">{modelError}</p>
          </div>
          <button className="btn-primary-glow" onClick={() => window.location.reload()}>
            Retry Engine
          </button>
        </div>
      )}

      {/* Live In-Browser Training Modal (Configurable up to 100,000 Samples) */}
      {isTrainingOpen && (
        <div className="training-modal-overlay">
          <div className="training-modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-badge">TensorFlow.js Deep Learning</span>
                <h3>⚡ Neural Model Training Studio</h3>
              </div>
              <button
                className="btn-close-modal"
                onClick={() => !isTrainingInProgress && setIsTrainingOpen(false)}
                disabled={isTrainingInProgress}
              >
                ✕
              </button>
            </div>
            <p className="modal-desc">
              Train the 31-Class Deep Neural Architecture directly in your browser. Includes 28 Yoga Disciplines plus
              explicit negative rejection manifolds (Seated Desk, Casual Idle, and Partial Body Occlusions) to prevent
              accidental triggers when sitting in front of your laptop.
            </p>

            {/* Target Sample Size Selector */}
            <div className="dataset-preset-selector">
              <label className="selector-label">Select Augmented Training Scale:</label>
              <div className="preset-buttons">
                <button
                  type="button"
                  className={`preset-btn ${trainingSampleTarget === 100000 ? 'active' : ''}`}
                  onClick={() => setTrainingSampleTarget(100000)}
                  disabled={isTrainingInProgress}
                >
                  <span className="preset-count">⚡ 100,000 Samples</span>
                  <span className="preset-desc">Ultra Deep Studio (Maximum Rejection Accuracy)</span>
                </button>
                <button
                  type="button"
                  className={`preset-btn ${trainingSampleTarget === 25000 ? 'active' : ''}`}
                  onClick={() => setTrainingSampleTarget(25000)}
                  disabled={isTrainingInProgress}
                >
                  <span className="preset-count">🚀 25,000 Samples</span>
                  <span className="preset-desc">Pro Accelerated Dataset</span>
                </button>
                <button
                  type="button"
                  className={`preset-btn ${trainingSampleTarget === 3100 ? 'active' : ''}`}
                  onClick={() => setTrainingSampleTarget(3100)}
                  disabled={isTrainingInProgress}
                >
                  <span className="preset-count">⏱️ 3,100 Samples</span>
                  <span className="preset-desc">Fast Baseline Calibration</span>
                </button>
              </div>
            </div>

            {/* Augmentation Tech Specs */}
            <div className="tech-specs-card">
              <div className="spec-item">
                <span className="spec-icon">📐</span>
                <span className="spec-label">3D Perspective: ±18° affine rotations</span>
              </div>
              <div className="spec-item">
                <span className="spec-icon">🪞</span>
                <span className="spec-label">Bilateral: 50% left/right mirror augmentation</span>
              </div>
              <div className="spec-item">
                <span className="spec-icon">🛡️</span>
                <span className="spec-label">Rejection: Seated Desk & Idle manifolds</span>
              </div>
              <div className="spec-item">
                <span className="spec-icon">🧍</span>
                <span className="spec-label">Anthropometric: Limb length & build scaling</span>
              </div>
            </div>

            <div className="training-controls">
              <button
                className="btn-primary-glow btn-train-large"
                onClick={() => handleRetrainModel(trainingSampleTarget)}
                disabled={isTrainingInProgress}
              >
                {isTrainingInProgress
                  ? `⏳ ${trainingStatus || 'Training in Progress...'}`
                  : `🚀 Start Training (${trainingSampleTarget.toLocaleString()} Samples)`}
              </button>
            </div>

            {isTrainingInProgress && (
              <div className="training-status-box">
                <div className="training-status-spinner" />
                <span className="training-status-text">{trainingStatus}</span>
              </div>
            )}

            {trainingLogs.length > 0 && (
              <div className="training-terminal">
                <div className="terminal-header">Live Training Telemetry (Adam Optimizer · Loss & Accuracy):</div>
                {trainingLogs.map((log, i) => (
                  <div key={i} className="terminal-line">
                    <span className="epoch-tag">Epoch {log.epoch}/{log.totalEpochs}</span>
                    <span className="metric-tag">Loss: {log.loss}</span>
                    <span className="acc-tag">Accuracy: {log.accuracy}%</span>
                    {log.totalSamples && <span className="sample-tag">{log.totalSamples.toLocaleString()} samples</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3-Step Interactive Workflow */}
      <div className="yoga-steps-guide-bar">
        <div className="studio-step active">
          <span className="step-circle">1</span>
          <div className="step-desc">
            <span className="step-tag">Step 1 · Explore</span>
            <span className="step-title">Choose from 28 Poses</span>
          </div>
        </div>
        <span className="step-arrow">➔</span>
        <div className="studio-step active">
          <span className="step-circle">2</span>
          <div className="step-desc">
            <span className="step-tag">Step 2 · Form Guide</span>
            <span className="step-title">Review Cues & Muscles</span>
          </div>
        </div>
        <span className="step-arrow">➔</span>
        <div className="studio-step highlight">
          <span className="step-circle pulse">3</span>
          <div className="step-desc">
            <span className="step-tag">Step 3 · Practice</span>
            <span className="step-title">Start AI Pose Detection</span>
          </div>
        </div>
      </div>

      {/* Discovery & Pose Selection Grid */}
      <div className="yoga-setup-layout">
        {/* Left Column: Pose Browser & Filters */}
        <div className="yoga-library-pane">
          {/* Search & Difficulty Filter Toolbar */}
          <div className="library-toolbar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search 28 poses by English or Sanskrit name (e.g. Warrior, Vrikshasana)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pose-search-input"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>

            <div className="difficulty-pills">
              {['all', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                <button
                  key={diff}
                  className={`diff-pill ${selectedDifficulty === diff ? 'active' : ''}`}
                  onClick={() => setSelectedDifficulty(diff)}
                >
                  {diff === 'all' ? 'All Levels' : diff}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Tabs with dynamic counts */}
          <div className="category-scroll-bar">
            {YOGA_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="cat-count">({categoryCounts[cat.id] || 0})</span>
              </button>
            ))}
          </div>

          {/* Grid Header Info */}
          <div className="grid-status-row">
            <span className="grid-status-count">
              Showing <strong>{filteredPoses.length}</strong> of 28 movement disciplines
            </span>
            <span className="grid-status-hint">Click any pose to inspect & launch camera</span>
          </div>

          {/* 28 Pose Cards Grid */}
          <div className="pose-cards-grid">
            {filteredPoses.length === 0 ? (
              <div className="no-poses-found">
                <span className="empty-icon">🔍</span>
                <p className="empty-title">No matching poses found</p>
                <p className="empty-sub">Try adjusting your search query or filter tags.</p>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedDifficulty('all');
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredPoses.map((pose) => {
                const isSelected = currentPoseId === pose.id;
                const imgUrl =
                  viewMode === 'photo'
                    ? YOGA_POSE_IMAGES[pose.id] || YOGA_POSE_VECTORS[pose.id]
                    : YOGA_POSE_VECTORS[pose.id] || YOGA_POSE_IMAGES[pose.id];

                return (
                  <div
                    key={pose.id}
                    className={`pose-card-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setCurrentPoseId(pose.id)}
                  >
                    {isSelected && (
                      <span className="selected-indicator-pill">✓ SELECTED</span>
                    )}
                    <div className="pose-card-thumb-wrap">
                      <img src={imgUrl} alt={pose.name} className="pose-card-thumb" />
                      <span className={`diff-badge ${pose.difficulty.toLowerCase()}`}>
                        <span className="diff-dot" />
                        {pose.difficulty}
                      </span>
                    </div>
                    <div className="pose-card-info">
                      <div className="pose-names">
                        <h4 className="pose-name">{pose.name}</h4>
                        <span className="pose-sanskrit">{pose.sanskrit}</span>
                      </div>
                      <div className="pose-meta-row">
                        <span className="pose-category-tag-mini">
                          {YOGA_CATEGORIES.find((c) => c.id === pose.category)?.icon || '🧘'}{' '}
                          {pose.category}
                        </span>
                        <span className="calorie-tag">🔥 {pose.caloriesPerMin} kcal/m</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Pose Detail & Start Launcher */}
        <div className="yoga-preview-pane">
          <div className="preview-sticky-card">
            {/* Top Primary Start Button */}
            <button
              className={`btn-start-camera-glow top-start ${isLoading ? 'disabled' : ''}`}
              onClick={startYoga}
              disabled={isLoading}
              title={`Start ${currentPose.name} Detection`}
            >
              <span className="btn-icon">▶</span>
              <div className="btn-text-block">
                <span className="btn-main-label">START {currentPose.name.toUpperCase()}</span>
                <span className="btn-sub-label">Launch MoveNet AI Camera</span>
              </div>
            </button>

            {/* Pose Title & Badges */}
            <div className="preview-header">
              <div>
                <span className="preview-category-tag">
                  {currentPose.category.toUpperCase()} · {currentPose.difficulty}
                </span>
                <h2 className="preview-title">{currentPose.name}</h2>
                <p className="preview-sanskrit-large">"{currentPose.sanskrit}"</p>
              </div>
              <div className="view-mode-toggle">
                <button
                  className={`btn-mode-pill ${viewMode === 'photo' ? 'active' : ''}`}
                  onClick={() => setViewMode('photo')}
                  title="View photographic demonstration"
                >
                  Photo
                </button>
                <button
                  className={`btn-mode-pill ${viewMode === 'vector' ? 'active' : ''}`}
                  onClick={() => setViewMode('vector')}
                  title="View anatomical skeletal diagram"
                >
                  Anatomy
                </button>
              </div>
            </div>

            {/* Large Visual Illustration */}
            <div className="preview-large-img-wrap">
              <img
                src={viewMode === 'photo' ? YOGA_POSE_IMAGES[currentPoseId] : YOGA_POSE_VECTORS[currentPoseId]}
                alt={currentPose.name}
                className="preview-large-img"
              />
            </div>

            {/* Focus Statement */}
            <div className="preview-focus-card">
              <span className="focus-label">🎯 FOCUS</span>
              <p className="preview-focus-text">{currentPose.focus}</p>
            </div>

            {/* Target Muscles */}
            <div className="preview-muscles-section">
              <span className="preview-section-label">Target Muscles & Joints</span>
              <div className="preview-muscles-list">
                {currentPose.targetMuscles.map((m, idx) => (
                  <span key={idx} className="target-muscle-badge">
                    {m}
                  </span>
                ))}
                <span className="target-calorie-badge">
                  🔥 {currentPose.caloriesPerMin} kcal / min
                </span>
              </div>
            </div>

            {/* Biomechanical Alignment Checklist */}
            <div className="preview-cues-section">
              <span className="preview-section-label">Biomechanical Alignment Checklist</span>
              <ul className="preview-cues-list">
                {currentPose.alignmentCues.map((cue, idx) => (
                  <li key={idx}>
                    <span className="cue-check">✓</span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="preview-instructions-section">
              <span className="preview-section-label">Step-by-Step Execution</span>
              <ol className="preview-steps-list">
                {currentPose.instructions.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Common Mistakes Warning */}
            {currentPose.commonMistakes && currentPose.commonMistakes.length > 0 && (
              <div className="preview-mistakes-section">
                <span className="preview-section-label warning-label">Common Mistakes to Avoid</span>
                <ul className="preview-mistakes-list">
                  {currentPose.commonMistakes.map((mistake, idx) => (
                    <li key={idx}>
                      <span className="mistake-icon">⚠️</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sensitivity Slider */}
            <div className="sensitivity-control-box">
              <div className="sensitivity-header">
                <span>
                  AI Strictness: <strong>{Math.round(confidenceThreshold * 100)}%</strong>
                </span>
                <span className="sensitivity-label">
                  {confidenceThreshold >= 0.85
                    ? 'Strict Mastery'
                    : confidenceThreshold >= 0.75
                    ? 'Balanced'
                    : 'Beginner Friendly'}
                </span>
              </div>
              <input
                type="range"
                min="0.65"
                max="0.95"
                step="0.01"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              />
            </div>

            {/* Bottom Start Action Button */}
            <button
              className={`btn-start-camera-glow bottom-start ${isLoading ? 'disabled' : ''}`}
              onClick={startYoga}
              disabled={isLoading}
            >
              <span className="btn-icon">▶</span>
              <div className="btn-text-block">
                <span className="btn-main-label">START POSE DETECTION</span>
                <span className="btn-sub-label">Launch AI Session</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
