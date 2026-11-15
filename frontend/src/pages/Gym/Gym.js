import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import {
  RepCounter,
  EXERCISE_PATTERNS,
  EXERCISE_GUIDES,
  GYM_CATEGORIES,
  checkGymFraming,
  selectPrimaryForegroundPose,
  KEYPOINTS,
} from '../../utils/gymExercises';
import { saveGymWorkout, getGymWorkoutHistory } from '../../utils/storage';
import VoiceCoach, { AudioSynthesizer } from '../../utils/voiceCoach';
import './Gym.css';

const GymPage = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const repCounterRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const isDetectingRef = useRef(false);

  // Exercise & Tracking State
  const [isStarted, setIsStarted] = useState(false);
  const isStartedRef = useRef(false);
  const [selectedExercise, setSelectedExercise] = useState('SQUAT');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [repCount, setRepCount] = useState(0);
  const [setCount, setSetCount] = useState(0);
  const [cleanReps, setCleanReps] = useState(0);
  const [currentState, setCurrentState] = useState('standing');
  const [formFeedback, setFormFeedback] = useState('Get ready...');
  const [currentRom, setCurrentRom] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(180);
  const [targetAngle, setTargetAngle] = useState(100);
  const [lastRepCadence, setLastRepCadence] = useState(0);

  // System & Model State
  const [isLoading, setIsLoading] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [isBodyDetected, setIsBodyDetected] = useState(false);
  const [skeletonTheme, setSkeletonTheme] = useState('dark');
  const [framingStatus, setFramingStatus] = useState(null);

  // Coaching & Target Settings
  const gymContainerRef = useRef(null);
  const [showExerciseDrawer, setShowExerciseDrawer] = useState(false);
  const [targetReps, setTargetReps] = useState(10);
  const [voiceCoachEnabled, setVoiceCoachEnabled] = useState(true);
  const [soundChimeEnabled, setSoundChimeEnabled] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState(() => VoiceCoach.getLanguage());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [isResting, setIsResting] = useState(false);
  const isRestingRef = useRef(false);
  const [restTimer, setRestTimer] = useState(45);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Fullscreen Controller using HTML5 Fullscreen API with graceful fallback
  const toggleFullscreen = useCallback(() => {
    const elem = gymContainerRef.current || document.documentElement;
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

  // Synchronize state with browser native fullscreen events
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

  useEffect(() => {
    isStartedRef.current = isStarted;
  }, [isStarted]);

  useEffect(() => {
    isRestingRef.current = isResting;
  }, [isResting]);

  // Synchronize VoiceCoach configuration
  useEffect(() => {
    VoiceCoach.configure({
      voiceEnabled: voiceCoachEnabled,
      soundEffectsEnabled: soundChimeEnabled,
    });
  }, [voiceCoachEnabled, soundChimeEnabled]);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const exParam = params.get('exercise') || params.get('id');
    if (exParam) {
      const upper = exParam.toUpperCase();
      if (EXERCISE_PATTERNS[upper]) {
        setSelectedExercise(upper);
      } else {
        const found = Object.values(EXERCISE_PATTERNS).find(
          (p) => p.name.toLowerCase() === exParam.toLowerCase()
        );
        if (found) setSelectedExercise(found.id);
      }
    }
  }, [location.search]);

  // Rest Timer Interval & Audio Telemetry Countdown
  useEffect(() => {
    let timer;
    if (isResting && restTimer >= 0) {
      timer = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            VoiceCoach.instructRestCountdown(0);
            return 0;
          }
          const nextSec = prev - 1;
          VoiceCoach.instructRestCountdown(nextSec);
          return nextSec;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isResting, restTimer]);

  // Filtered Exercises List
  const filteredExercises = useMemo(() => {
    return Object.values(EXERCISE_PATTERNS).filter((ex) => {
      return selectedCategory === 'all' || ex.category === selectedCategory;
    });
  }, [selectedCategory]);

  const activePattern = EXERCISE_PATTERNS[selectedExercise] || EXERCISE_PATTERNS.SQUAT;
  const activeGuide = EXERCISE_GUIDES[selectedExercise] || EXERCISE_GUIDES.SQUAT;

  // Camera Ready Polling
  useEffect(() => {
    const checkCamera = () => {
      const video = webcamRef.current?.video;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        setCameraReady(true);
      }
    };
    const timer = setInterval(checkCamera, 400);
    return () => clearInterval(timer);
  }, []);

  // Continuous Detection Loop
  useEffect(() => {
    if (!detectorRef.current || !cameraReady) return;

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(detectPose, 90);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [cameraReady, selectedExercise, skeletonTheme, isStarted]);

  // Load MoveNet Model on Mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        setModelError(null);
        await tf.ready();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model loading timeout')), 30000)
        );

        try {
          const detectorPromise = poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.Thunder }
          );
          detectorRef.current = await Promise.race([detectorPromise, timeoutPromise]);
        } catch (err) {
          console.warn('MoveNet Thunder fallback to Lite:', err.message);
          detectorRef.current = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.Lite }
          );
        }

        const history = await getGymWorkoutHistory();
        setWorkoutHistory(history || []);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading MoveNet:', err);
        setModelError(`Failed to load model: ${err.message}`);
        setIsLoading(false);
      }
    };

    loadModels();

    return () => {
      VoiceCoach.stopAll();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (webcamRef.current?.video?.srcObject) {
        webcamRef.current.video.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Workout Duration Timer
  useEffect(() => {
    let durationInterval;
    if (isStarted && !isResting) {
      durationInterval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (durationInterval) clearInterval(durationInterval);
    };
  }, [isStarted, isResting]);

  /**
   * Draw Skeleton & Live Joint Angle Badges
   */
  const drawSkeleton = (poses) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const video = webcamRef.current?.video;

    if (video && video.readyState >= 2 && video.videoWidth > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (poses.length > 0) {
        const pose = poses[0];
        const keypoints = pose.keypoints;

        const connections = [
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

        const isDarkTheme = skeletonTheme === 'dark';
        const isCyanTheme = skeletonTheme === 'cyan';

        // 1. Draw Bones
        connections.forEach(([start, end]) => {
          const startKp = keypoints[start];
          const endKp = keypoints[end];
          if (startKp && endKp && startKp.score > 0.22 && endKp.score > 0.22) {
            ctx.save();
            if (isDarkTheme) {
              ctx.beginPath();
              ctx.moveTo(startKp.x, startKp.y);
              ctx.lineTo(endKp.x, endKp.y);
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 8.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(startKp.x, startKp.y);
              ctx.lineTo(endKp.x, endKp.y);
              ctx.strokeStyle = '#05050a';
              ctx.lineWidth = 4.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.stroke();
            } else if (isCyanTheme) {
              ctx.beginPath();
              ctx.moveTo(startKp.x, startKp.y);
              ctx.lineTo(endKp.x, endKp.y);
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 4.5;
              ctx.lineCap = 'round';
              ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
              ctx.shadowBlur = 8;
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.moveTo(startKp.x, startKp.y);
              ctx.lineTo(endKp.x, endKp.y);
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 4.5;
              ctx.lineCap = 'round';
              ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
              ctx.shadowBlur = 8;
              ctx.stroke();
            }
            ctx.restore();
          }
        });

        // 2. Draw Joint Points
        keypoints.forEach((kp, idx) => {
          if (kp && kp.score > 0.22) {
            const isHead = idx >= 0 && idx <= 4;
            const radius = isHead ? 5 : 7.5;

            ctx.save();
            if (isDarkTheme) {
              ctx.beginPath();
              ctx.arc(kp.x, kp.y, radius + 2.5, 0, 2 * Math.PI);
              ctx.fillStyle = '#05050a';
              ctx.fill();

              ctx.beginPath();
              ctx.arc(kp.x, kp.y, radius, 0, 2 * Math.PI);
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 6;
              ctx.fill();
            } else if (isCyanTheme) {
              ctx.beginPath();
              ctx.arc(kp.x, kp.y, radius + 2, 0, 2 * Math.PI);
              ctx.fillStyle = '#083344';
              ctx.fill();

              ctx.beginPath();
              ctx.arc(kp.x, kp.y, radius, 0, 2 * Math.PI);
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 2.5;
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(kp.x, kp.y, radius + 2, 0, 2 * Math.PI);
              ctx.fillStyle = '#022c22';
              ctx.fill();

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

        // 3. Draw Biometric Joint Angle Badges when exercise is in progress
        if (isStartedRef.current && keypoints) {
          const drawAngleBadge = (x, y, angleVal, isTargetHit) => {
            ctx.save();
            // Counter canvas horizontal flip (scaleX(-1)) if mirrored so text renders natively
            ctx.translate(x, y);
            if (isMirrored) {
              ctx.scale(-1, 1);
            }

            const badgeW = 54;
            const badgeH = 22;
            const badgeX = -badgeW / 2;
            const badgeY = -badgeH - 12;

            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
            } else {
              ctx.rect(badgeX, badgeY, badgeW, badgeH);
            }
            ctx.fillStyle = isTargetHit ? 'rgba(16, 185, 129, 0.95)' : 'rgba(12, 10, 24, 0.88)';
            ctx.fill();
            ctx.strokeStyle = isTargetHit ? '#34d399' : 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = 'bold 11.5px "Space Grotesk", sans-serif';
            ctx.fillStyle = isTargetHit ? '#000000' : '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${angleVal}°`, 0, badgeY + badgeH / 2);

            ctx.restore();
          };

          if (selectedExercise === 'SQUAT' || selectedExercise === 'LUNGE') {
            const lKnee = keypoints[KEYPOINTS.LEFT_KNEE];
            const rKnee = keypoints[KEYPOINTS.RIGHT_KNEE];
            if (lKnee && lKnee.score > 0.3) {
              drawAngleBadge(lKnee.x, lKnee.y, currentAngle, currentRom >= 90);
            } else if (rKnee && rKnee.score > 0.3) {
              drawAngleBadge(rKnee.x, rKnee.y, currentAngle, currentRom >= 90);
            }
          } else if (selectedExercise === 'PUSHUP' || selectedExercise === 'BICEP_CURL' || selectedExercise === 'SHOULDER_PRESS') {
            const lElbow = keypoints[KEYPOINTS.LEFT_ELBOW];
            const rElbow = keypoints[KEYPOINTS.RIGHT_ELBOW];
            if (lElbow && lElbow.score > 0.3) {
              drawAngleBadge(lElbow.x, lElbow.y, currentAngle, currentRom >= 90);
            } else if (rElbow && rElbow.score > 0.3) {
              drawAngleBadge(rElbow.x, rElbow.y, currentAngle, currentRom >= 90);
            }
          }
        }
      }
    }
  };

  /**
   * Main Pose Detection & Rep Counting Loop
   */
  const detectPose = async () => {
    if (isDetectingRef.current) return;
    const video = webcamRef.current?.video;
    if (!video || !detectorRef.current || video.readyState < 2) return;

    isDetectingRef.current = true;
    try {
      const rawPoses = await detectorRef.current.estimatePoses(video, {
        maxPoses: 2,
        flipHorizontal: false,
      });

      // Filter multi-person frames: isolate foreground user over background individuals
      const primaryPose = selectPrimaryForegroundPose(rawPoses, video.videoWidth, video.videoHeight);
      const poses = primaryPose ? [primaryPose] : [];

      const hasValidPose = poses.length > 0 && poses[0].keypoints && poses[0].keypoints.some((kp) => kp.score > 0.22);
      setIsBodyDetected(hasValidPose);

      drawSkeleton(poses);

      if (poses.length > 0) {
        const keypoints = poses[0].keypoints.map((kp) => [kp.x, kp.y, kp.score]);
        const framing = checkGymFraming(keypoints, selectedExercise);
        setFramingStatus(framing);

        // If user is seated at desk or stepped out for an exercise, give audible framing notice
        if (!framing.isFramingValid) {
          if (isStartedRef.current) {
            setFormFeedback(framing.reason);
            VoiceCoach.instructFramingAlert(framing.reason, activePattern.name);
          }
          return;
        }

        if (isStartedRef.current && repCounterRef.current) {
          const prevReps = repCounterRef.current.repCount;
          const result = repCounterRef.current.update(keypoints);

          setRepCount(result.repCount);
          setSetCount(result.setCount);
          setCleanReps(result.cleanReps || 0);
          setCurrentState(result.state);
          setCurrentRom(result.rom || 0);
          setCurrentAngle(result.currentAngle || 180);
          setTargetAngle(result.targetAngle || 90);
          setLastRepCadence(result.lastRepCadence || 0);

          const activeFeedback = result.formIssues?.length > 0 ? result.formIssues[0] : result.feedback || 'Good form!';
          setFormFeedback(activeFeedback);

          // Audio rep announcement & intelligent coaching
          if (result.repCount > prevReps) {
            VoiceCoach.instructGymRep(result.repCount, targetReps);

            // Check if target reps for set reached
            if (targetReps > 0 && result.repCount >= targetReps && !isRestingRef.current) {
              VoiceCoach.instructSetComplete(result.setCount + 1, result.repCount, 45);
              setIsResting(true);
              setRestTimer(45);
              showToast(`🎯 Target Met! Set ${result.setCount + 1} Complete.`);
            }
          } else if (result.formIssues && result.formIssues.length > 0) {
            // Real-time form correction: tells what is wrong & how to correct
            VoiceCoach.instructGymCorrection(result.formIssues[0]);
          }
        }
      }
    } catch (err) {
      console.error('Pose detection error:', err);
    } finally {
      isDetectingRef.current = false;
    }
  };

  /**
   * Start Exercise Tracking
   */
  const handleStart = async () => {
    if (!detectorRef.current) {
      setModelError('Model not loaded. Please refresh and try again.');
      return;
    }

    try {
      setIsStarted(true);
      isStartedRef.current = true;
      setDuration(0);
      setRepCount(0);
      setSetCount(0);
      setCleanReps(0);
      setCurrentState('standing');
      setFormFeedback('Get ready...');
      setCurrentRom(0);
      setIsResting(false);
      setWorkoutSummary(null);
      repCounterRef.current = new RepCounter(selectedExercise);

      // AI Voice Coach speaks setup guidance (what to do)
      VoiceCoach.instructGymExerciseStart(activePattern, activeGuide);
    } catch (err) {
      console.error('Error starting exercise:', err);
      setModelError(`Error: ${err.message}`);
    }
  };

  /**
   * Stop Exercise & Show Celebration Summary
   */
  const handleStop = async () => {
    setIsStarted(false);
    isStartedRef.current = false;
    setIsResting(false);

    if (repCounterRef.current && (duration > 0 || repCount > 0)) {
      const exerciseTitle = activePattern.name || selectedExercise;
      const burned = Math.max(10, Math.round(repCount * activePattern.caloriesPerRep * 10 + duration * 0.25));
      const totalSets = Math.max(1, setCount + (repCount > 0 ? 1 : 0));

      const summaryData = {
        exercise: exerciseTitle,
        exerciseType: selectedExercise,
        exerciseName: exerciseTitle,
        reps: repCount,
        sets: totalSets,
        cleanReps: cleanReps,
        accuracyPct: repCount > 0 ? Math.round((cleanReps / repCount) * 100) : 100,
        duration: duration,
        timestamp: new Date().toISOString(),
        caloriesBurned: burned,
      };

      setWorkoutSummary(summaryData);
      await saveGymWorkout(summaryData);
      const history = await getGymWorkoutHistory();
      setWorkoutHistory(history || []);

      VoiceCoach.instructGymWorkoutEnd(exerciseTitle, repCount, totalSets, burned);
    } else {
      VoiceCoach.stopAll();
    }
  };

  /**
   * Complete Set & Start Rest Countdown
   */
  const handleCompleteSet = () => {
    if (repCounterRef.current) {
      repCounterRef.current.completeSet();
      const newSetCount = repCounterRef.current.setCount;
      const completedReps = repCount;
      setSetCount(newSetCount);
      setRepCount(0);
      setCurrentRom(0);
      setIsResting(true);
      setRestTimer(45);
      VoiceCoach.instructSetComplete(newSetCount, completedReps, 45);
    }
  };

  /**
   * Format Duration
   */
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard Shortcuts: 'F' = Fullscreen toggle, 'Space' = Start workout / Complete set
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (!isStartedRef.current) {
          handleStart();
        } else {
          handleCompleteSet();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  return (
    <div
      ref={gymContainerRef}
      className={`gym-container ${isFullscreen ? 'fullscreen-mode' : ''}`}
    >
      {toast && <div className="gym-toast">{toast}</div>}

      {/* Page Header */}
      <div className="gym-page-header">
        <div>
          <div className="gym-eyebrow-pill">
            <span className="eyebrow-pulse-dot" />
            <span>MoveNet Strength Engine · 15 Supported Movements</span>
          </div>
          <h1 className="gym-page-title">
            💪 Gym <span className="highlight-text-red">AI Trainer</span>
          </h1>
          <p className="gym-page-sub">
            Real-time biometric rep counting, depth telemetry, and AI voice coaching
          </p>
        </div>

        <div className="gym-header-controls">
          <div className="coaching-toggles">
            <button
              type="button"
              className={`toggle-pill ${voiceCoachEnabled ? 'active' : ''}`}
              onClick={() => setVoiceCoachEnabled(!voiceCoachEnabled)}
              title="Toggle AI Voice Feedback"
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
              className={`toggle-pill ${soundChimeEnabled ? 'active' : ''}`}
              onClick={() => setSoundChimeEnabled(!soundChimeEnabled)}
              title="Toggle Rep Completion Chimes"
            >
              <span>{soundChimeEnabled ? '🔔 Chimes On' : '🔕 Muted'}</span>
            </button>
          </div>

          <div className="gym-header-status">
            {isLoading ? (
              <span className="badge badge-warning">⟳ Initializing AI...</span>
            ) : modelError ? (
              <span className="badge badge-error">⚠ Load Error</span>
            ) : (
              <span className="badge badge-success">✓ 15 Exercises Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {modelError && (
        <div className="error-message">
          <span>❌ {modelError}</span>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Initializing MoveNet Thunder AI Model...</p>
        </div>
      )}

      {/* Workout Completion Summary Modal */}
      {workoutSummary && (
        <div className="workout-summary-overlay">
          <div className="workout-summary-card">
            <div className="summary-header">
              <span className="summary-celebrate-icon">🎉</span>
              <h3>Workout Completed!</h3>
              <p className="summary-sub">Great job crushing your session</p>
            </div>

            <div className="summary-stats-grid">
              <div className="summary-stat-box">
                <span className="stat-label">Total Reps</span>
                <span className="stat-value-big">{workoutSummary.reps}</span>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Clean Form Rate</span>
                <span className="stat-value-big">{workoutSummary.accuracyPct}%</span>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Sets</span>
                <span className="stat-value-big">{workoutSummary.sets}</span>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Calories Burned</span>
                <span className="stat-value-big fire">🔥 {workoutSummary.caloriesBurned}</span>
              </div>
            </div>

            <div className="summary-meta-line">
              <span>Exercise: <strong>{workoutSummary.exercise}</strong></span>
              <span>Duration: <strong>{formatDuration(workoutSummary.duration)}</strong></span>
            </div>

            <button className="btn-close-summary" onClick={() => setWorkoutSummary(null)}>
              Done & Return to Studio
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Content */}
      {!isLoading && !modelError && (
        <div className="gym-content">
          {/* Left Column - Video & Canvas HUD */}
          <div className="gym-video-panel">
            {/* Top Toolbar */}
            <div className="video-panel-toolbar">
              <div className="detection-status-pill">
                {isBodyDetected ? (
                  <span className="status-live-badge active">
                    <span className="pulse-indicator-green" />
                    <strong>Subject Isolated</strong> (Primary User)
                  </span>
                ) : (
                  <span className="status-live-badge standby">
                    <span className="pulse-indicator-amber" />
                    Stand in camera frame
                  </span>
                )}
              </div>

              <div className="video-toolbar-right-group">
                <div className="skeleton-theme-picker">
                  <span className="theme-picker-label">Style:</span>
                  <button
                    type="button"
                    className={`theme-pill ${skeletonTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => setSkeletonTheme('dark')}
                    title="Dark Line with White Points (High Contrast)"
                  >
                    <span className="theme-dot dot-dark" />
                    Dark & White
                  </button>
                  <button
                    type="button"
                    className={`theme-pill ${skeletonTheme === 'green' ? 'active' : ''}`}
                    onClick={() => setSkeletonTheme('green')}
                    title="Cyber Green Skeleton"
                  >
                    <span className="theme-dot dot-green" />
                    Cyber Green
                  </button>
                  <button
                    type="button"
                    className={`theme-pill ${skeletonTheme === 'cyan' ? 'active' : ''}`}
                    onClick={() => setSkeletonTheme('cyan')}
                    title="Neon Cyan Skeleton"
                  >
                    <span className="theme-dot dot-cyan" />
                    Neon Cyan
                  </button>
                </div>

                <div className="camera-view-actions">
                  <button
                    type="button"
                    className={`action-pill ${isMirrored ? 'active' : ''}`}
                    onClick={() => setIsMirrored(!isMirrored)}
                    title={isMirrored ? 'Camera Mirrored (Selfie)' : 'Camera Normal (Unmirrored)'}
                  >
                    <span>{isMirrored ? '🪞 Mirrored' : '📷 Normal'}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-fullscreen-toggle ${isFullscreen ? 'active' : ''}`}
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen Workout Theater (Press F)"
                  >
                    <span className="fs-icon">{isFullscreen ? '⤢' : '⛶'}</span>
                    <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                    <kbd className="fs-kbd">F</kbd>
                  </button>
                </div>
              </div>
            </div>

            {/* Video Container */}
            <div className={`gym-video-container ${isStarted ? 'active-workout' : ''} ${framingStatus && !framingStatus.isFramingValid ? 'framing-alert' : ''}`}>
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={isMirrored}
                onUserMedia={() => setCameraReady(true)}
                videoConstraints={{ facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }}
                className="gym-webcam-feed"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: isFullscreen ? 'contain' : 'cover',
                  display: 'block',
                  background: '#000',
                }}
              />
              <canvas
                ref={canvasRef}
                className="gym-canvas"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  zIndex: 2,
                  pointerEvents: 'none',
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                }}
              />

              {/* Floating Quick Action Buttons on Video */}
              <div className="gym-video-floating-actions">
                <button
                  type="button"
                  className="gym-float-btn"
                  onClick={() => setIsMirrored(!isMirrored)}
                  title={isMirrored ? 'Camera Mirrored (Selfie)' : 'Camera Normal (Unmirrored)'}
                >
                  {isMirrored ? '🪞' : '📷'}
                </button>
                <button
                  type="button"
                  className={`gym-float-btn btn-fs-float ${isFullscreen ? 'active' : ''}`}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen Workout Theater (F)'}
                >
                  {isFullscreen ? '⤢ Exit' : '⛶ Fullscreen'}
                </button>
              </div>

              {/* Anatomical Step Back Alert Banner */}
              {framingStatus && !framingStatus.isFramingValid && (
                <div className="gym-framing-banner">
                  <span className="alert-icon">⚠️</span>
                  <div className="alert-text">
                    <span className="alert-title">BODY FRAMING NOTICE</span>
                    <span className="alert-desc">{framingStatus.reason}</span>
                  </div>
                </div>
              )}

              {/* Landmark Checklist Overlay */}
              {framingStatus && (
                <div className="gym-checklist-bar">
                  <span className={framingStatus.visibleSummary?.head ? 'part ok' : 'part miss'}>
                    Head {framingStatus.visibleSummary?.head ? '✓' : '✗'}
                  </span>
                  <span className="sep">·</span>
                  <span className={framingStatus.visibleSummary?.torso ? 'part ok' : 'part miss'}>
                    Torso {framingStatus.visibleSummary?.torso ? '✓' : '✗'}
                  </span>
                  <span className="sep">·</span>
                  <span className={framingStatus.visibleSummary?.hips ? 'part ok' : 'part miss'}>
                    Hips {framingStatus.visibleSummary?.hips ? '✓' : '✗'}
                  </span>
                  <span className="sep">·</span>
                  <span className={framingStatus.visibleSummary?.knees ? 'part ok' : 'part miss'}>
                    Knees {framingStatus.visibleSummary?.knees ? '✓' : '✗'}
                  </span>
                  <span className="sep">·</span>
                  <span className={framingStatus.visibleSummary?.feet ? 'part ok' : 'part miss'}>
                    Feet {framingStatus.visibleSummary?.feet ? '✓' : '✗'}
                  </span>
                </div>
              )}

              {/* STANDARD MODE OVERLAYS */}
              {!isFullscreen && (
                <>
                  {/* Idle Standby Overlay */}
                  {!isStarted && (
                    <div className="no-video-overlay">
                      <div className={`no-video-badge ${framingStatus && !framingStatus.isFramingValid ? 'framing-warning' : ''}`}>
                        <span className="badge-pulse-dot" />
                        <span>
                          {isBodyDetected
                            ? (framingStatus && !framingStatus.isFramingValid
                                ? framingStatus.reason
                                : `✓ ${activePattern.name} Ready — Click Start Exercise to track reps`)
                            : 'Stand in frame — MoveNet detecting body...'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Active Live HUD Overlay */}
                  {isStarted && (
                    <div className="video-live-hud">
                      <div className="hud-phase-chip">
                        <span className="hud-label">PHASE</span>
                        <span className="hud-value">{currentState.toUpperCase()}</span>
                      </div>
                      <div className="hud-feedback-chip">
                        <span>{formFeedback}</span>
                        {voiceCoachEnabled && (
                          <div className="audio-wave-anim" title="AI Voice Coach Active">
                            <span className="wave-bar bar-1"></span>
                            <span className="wave-bar bar-2"></span>
                            <span className="wave-bar bar-3"></span>
                            <span className="wave-bar bar-4"></span>
                          </div>
                        )}
                      </div>
                      {lastRepCadence > 0 && (
                        <div className="hud-cadence-chip">
                          <span>⚡ {lastRepCadence}s tempo</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Rest Overlay */}
                  {isResting && (
                    <div className="rest-timer-overlay">
                      <div className="rest-timer-card">
                        <span className="rest-icon">⏳</span>
                        <h3>Rest & Recover</h3>
                        <div className="rest-countdown-number">{restTimer}s</div>
                        <p className="rest-subtitle">Next set starting soon</p>
                        <button className="btn-skip-rest" onClick={() => setIsResting(false)}>
                          ⏩ Skip Rest Now
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* FULLSCREEN THEATER MODE OVERLAYS */}
              {isFullscreen && (
                <div className="fs-theater-hud-layer">
                  {/* Top HUD Floating Bar */}
                  <div className="fs-top-hud">
                    <div className="fs-top-left">
                      <div className="fs-exercise-tag">
                        <span className="fs-exercise-icon">{activePattern.icon}</span>
                        <div className="fs-exercise-info">
                          <span className="fs-exercise-name">{activePattern.name}</span>
                          <span className="fs-exercise-sub">Target: {activePattern.targetRom}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-fs-change-exercise"
                        onClick={() => setShowExerciseDrawer(!showExerciseDrawer)}
                        title="Switch Exercise"
                      >
                        <span>⇄ Switch Exercise</span>
                      </button>
                    </div>

                    <div className="fs-top-center">
                      <div className="fs-telemetry-pill">
                        <span className="fs-time-badge">⏱ {formatDuration(duration)}</span>
                        <span className="fs-cal-badge">🔥 {Math.max(4, Math.round(repCount * activePattern.caloriesPerRep * 10 + duration * 0.25))} kcal</span>
                        <span className="fs-set-badge">Set {setCount + 1}</span>
                      </div>
                    </div>

                    <div className="fs-top-right">
                      <button
                        type="button"
                        className={`fs-tool-pill ${voiceCoachEnabled ? 'active' : ''}`}
                        onClick={() => setVoiceCoachEnabled(!voiceCoachEnabled)}
                        title="Toggle Voice Coach"
                      >
                        {voiceCoachEnabled ? '🔊 Voice ON' : '🔇 Muted'}
                      </button>
                      <button
                        type="button"
                        className="fs-tool-pill"
                        onClick={() => {
                          const next = VoiceCoach.toggleLanguage();
                          setVoiceLanguage(next);
                          VoiceCoach.testVoice(next);
                        }}
                        title="Switch Language"
                      >
                        🌐 {voiceLanguage === 'hi' ? 'हिंदी' : 'EN'}
                      </button>
                      <button
                        type="button"
                        className="btn-fs-exit-theater"
                        onClick={toggleFullscreen}
                        title="Exit Fullscreen (Esc or F)"
                      >
                        <span>⤢ Exit Fullscreen</span>
                        <kbd className="fs-kbd-tag">Esc</kbd>
                      </button>
                    </div>
                  </div>

                  {/* Left Biometrics HUD: Hero Reps Counter */}
                  <div className="fs-biometrics-hud">
                    <div className="fs-rep-hero-card">
                      <div className="fs-rep-ring-wrap">
                        <svg className="fs-progress-svg" viewBox="0 0 120 120">
                          <circle className="fs-ring-bg" cx="60" cy="60" r="52" />
                          <circle
                            className="fs-ring-fill"
                            cx="60"
                            cy="60"
                            r="52"
                            style={{
                              strokeDasharray: 326.7,
                              strokeDashoffset: targetReps > 0
                                ? 326.7 * (1 - Math.min(1, repCount / targetReps))
                                : 326.7 * (1 - Math.min(100, currentRom) / 100),
                            }}
                          />
                        </svg>
                        <div className="fs-rep-center-text">
                          <span className="fs-rep-huge-num">{repCount}</span>
                          <span className="fs-rep-goal-text">
                            {targetReps > 0 ? `/ ${targetReps} GOAL` : 'REPS'}
                          </span>
                        </div>
                      </div>

                      <div className="fs-rep-meta">
                        <span className="fs-phase-pill">
                          {currentState.toUpperCase()}
                        </span>
                        <span className="fs-clean-pill">
                          {cleanReps > 0 ? `⭐ ${cleanReps} Clean` : '✓ AI Form Verified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Center: Form Feedback, Live ROM Depth & Dock */}
                  <div className="fs-bottom-hud">
                    <div className={`fs-feedback-card ${currentRom >= 90 ? 'achieved' : ''}`}>
                      <div className="fs-feedback-text-row">
                        <span className="fs-feedback-text">{formFeedback}</span>
                        {voiceCoachEnabled && (
                          <div className="audio-wave-anim" title="Voice Coach Active">
                            <span className="wave-bar bar-1"></span>
                            <span className="wave-bar bar-2"></span>
                            <span className="wave-bar bar-3"></span>
                            <span className="wave-bar bar-4"></span>
                          </div>
                        )}
                      </div>

                      {isStarted && (
                        <div className="fs-rom-tracker">
                          <div className="fs-rom-info">
                            <span className="fs-joint-label">
                              {activePattern.activeJoint}: {currentAngle}° (Target: {activePattern.targetRom})
                            </span>
                            <span className={`fs-rom-badge ${currentRom >= 90 ? 'complete' : ''}`}>
                              {currentRom >= 90 ? '✓ FULL DEPTH!' : `${currentRom}% Depth`}
                            </span>
                          </div>
                          <div className="fs-rom-bar-track">
                            <div
                              className={`fs-rom-bar-fill ${currentRom >= 90 ? 'complete' : ''}`}
                              style={{ width: `${currentRom}%` }}
                            />
                            <div className="fs-rom-target-line" style={{ left: '90%' }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Floating Controls Dock */}
                    <div className="fs-controls-dock">
                      {!isStarted ? (
                        <button
                          type="button"
                          className="btn-fs-start-workout"
                          onClick={handleStart}
                        >
                          ▶ Start Exercise Tracking <kbd className="dock-kbd">Space</kbd>
                        </button>
                      ) : (
                        <div className="fs-active-dock-buttons">
                          <button
                            type="button"
                            className="btn-fs-set-complete"
                            onClick={handleCompleteSet}
                          >
                            ✓ Complete Set & Rest <kbd className="dock-kbd">Space</kbd>
                          </button>
                          <button
                            type="button"
                            className="btn-fs-stop-workout"
                            onClick={handleStop}
                          >
                            ■ Finish Workout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rest Timer in Fullscreen */}
                  {isResting && (
                    <div className="fs-rest-overlay">
                      <div className="fs-rest-card">
                        <span className="fs-rest-icon">⏳</span>
                        <h3>Rest & Recover</h3>
                        <div className="fs-rest-seconds">{restTimer}s</div>
                        <p>Catch your breath for the next set</p>
                        <button
                          type="button"
                          className="btn-skip-rest"
                          onClick={() => setIsResting(false)}
                        >
                          ⏩ Skip Rest Now
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Slide-in Exercise Switcher Drawer in Fullscreen */}
                  {showExerciseDrawer && (
                    <div className="fs-drawer-backdrop" onClick={() => setShowExerciseDrawer(false)}>
                      <div className="fs-drawer-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="fs-drawer-header">
                          <h4>Choose Movement Discipline</h4>
                          <button
                            type="button"
                            className="fs-drawer-close"
                            onClick={() => setShowExerciseDrawer(false)}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="fs-drawer-exercises">
                          {Object.values(EXERCISE_PATTERNS).map((ex) => (
                            <div
                              key={ex.id}
                              className={`fs-drawer-item ${selectedExercise === ex.id ? 'active' : ''}`}
                              onClick={() => {
                                if (!isStarted) {
                                  setSelectedExercise(ex.id);
                                  setShowExerciseDrawer(false);
                                  showToast(`Switched to ${ex.name}`);
                                } else {
                                  showToast('Finish current set first before switching');
                                }
                              }}
                            >
                              <span className="fs-item-icon">{ex.icon}</span>
                              <div className="fs-item-details">
                                <span className="fs-item-name">{ex.name}</span>
                                <span className="fs-item-meta">{ex.targetMuscle} · {ex.difficulty}</span>
                              </div>
                              {selectedExercise === ex.id && <span className="fs-item-check">✓</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Depth & Range of Motion (ROM) Gauge */}
            {isStarted && (
              <div className="rom-telemetry-card">
                <div className="rom-header-row">
                  <div className="rom-title-group">
                    <span className="rom-label">Depth / Range of Motion (ROM)</span>
                    <span className="rom-joint-hint">{activePattern.activeJoint}: {currentAngle}° (Target: {activePattern.targetRom})</span>
                  </div>
                  <span className={`rom-pct-badge ${currentRom >= 90 ? 'achieved' : ''}`}>
                    {currentRom >= 90 ? '✓ FULL DEPTH!' : `${currentRom}% Depth`}
                  </span>
                </div>
                <div className="rom-bar-track">
                  <div
                    className={`rom-bar-fill ${currentRom >= 90 ? 'complete' : ''}`}
                    style={{ width: `${currentRom}%` }}
                  />
                  <div className="rom-target-marker" style={{ left: '90%' }} title="Target Depth" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Controls, Exercise Grid, Telemetry & Form Guide */}
          <div className="gym-control-panel">
            {/* Top Action & Goal Controls Card */}
            <div className="gym-action-card">
              <div className="action-card-header">
                <div>
                  <span className="action-card-eyebrow">Exercise Selected</span>
                  <h3 className="active-exercise-display">
                    {activePattern.icon} {activePattern.name}
                  </h3>
                </div>

                {/* Target Reps Goal Selector */}
                <div className="target-reps-group">
                  <span className="target-reps-label">Target Reps:</span>
                  <div className="target-reps-pills">
                    {[8, 10, 12, 15, 0].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`target-pill ${targetReps === num ? 'active' : ''}`}
                        onClick={() => setTargetReps(num)}
                        disabled={isStarted}
                      >
                        {num === 0 ? 'Max' : num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="controls-button-wrapper">
                {!isStarted ? (
                  <button
                    className="btn btn-primary btn-workout-toggle"
                    onClick={handleStart}
                    disabled={isLoading || !!modelError}
                    type="button"
                  >
                    <span className="play-icon">▶</span> Start Exercise Tracking
                  </button>
                ) : (
                  <div className="active-button-row">
                    <button className="btn btn-success btn-workout-set" onClick={handleCompleteSet} type="button">
                      ✓ Complete Set & Rest
                    </button>
                    <button className="btn btn-danger btn-workout-stop" onClick={handleStop} type="button">
                      ■ Finish Workout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Statistics Cards */}
            <div className="gym-stats">
              <div className="stat-card stat-reps">
                <span className="stat-card-label">Reps Completed</span>
                <p className="stat-value rep-number">{repCount}</p>
                {targetReps > 0 && (
                  <span className="stat-sub-text">Goal: {targetReps} reps</span>
                )}
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Sets</span>
                <p className="stat-value">{setCount}</p>
                <span className="stat-sub-text">
                  {cleanReps > 0 ? `${cleanReps} clean form` : 'Clean tracking'}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Time</span>
                <p className="stat-value">{formatDuration(duration)}</p>
                <span className="stat-sub-text">
                  🔥 {Math.max(4, Math.round(repCount * activePattern.caloriesPerRep * 10 + duration * 0.25))} kcal
                </span>
              </div>
            </div>

            {/* Interactive Exercise Library Browser */}
            <div className="exercise-browser-card">
              <div className="browser-header">
                <h4>Strength & Movement Disciplines</h4>
                <div className="category-filter-chips">
                  {GYM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cat-filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="exercise-cards-scroll">
                {filteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    className={`exercise-select-card ${selectedExercise === ex.id ? 'selected' : ''} ${isStarted ? 'disabled' : ''}`}
                    onClick={() => !isStarted && setSelectedExercise(ex.id)}
                  >
                    <div className="card-top-row">
                      <span className="ex-icon">{ex.icon}</span>
                      <span className="ex-diff-pill">{ex.difficulty}</span>
                    </div>
                    <span className="ex-title">{ex.name}</span>
                    <span className="ex-muscles">{ex.targetMuscle}</span>
                    <span className="ex-rom-tag">Target: {ex.targetRom}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Alignment Guide */}
            <div className="exercise-guide-card">
              <div className="guide-card-header">
                <div>
                  <h3 className="exercise-guide-title">{activeGuide.title}</h3>
                  <p className="exercise-guide-focus">
                    <strong>Target Activation:</strong> {activeGuide.focus}
                  </p>
                </div>
              </div>
              <p className="exercise-guide-summary">{activeGuide.summary}</p>
              <div className="cues-section">
                <span className="cues-title">✓ Biomechanical Cues:</span>
                <ul className="exercise-guide-cues">
                  {activeGuide.cues.map((cue, index) => (
                    <li key={index}>{cue}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recent History */}
            {workoutHistory.length > 0 && (
              <div className="workout-history-card">
                <h3 className="history-heading">Recent Sets</h3>
                <div className="history-list">
                  {workoutHistory.slice(-4).reverse().map((workout, idx) => (
                    <div key={idx} className="history-item">
                      <span className="history-name">{workout.exerciseName}</span>
                      <span className="history-reps">{workout.reps} reps × {workout.sets || 1}</span>
                      <span className="history-time">{formatDuration(workout.duration)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GymPage;
