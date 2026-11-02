import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import React, { useRef, useState, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import { count } from '../../utils/music';

import './Yoga.css'
import { poseImages } from '../../utils/pose_images';
import { POINTS, keypointConnections, POSE_LIST, CLASS_NO } from '../../utils/data';
import { drawPoint, drawSegment } from '../../utils/helper'
import { saveYogaSession } from '../../utils/storage';

const DEFAULT_CONFIDENCE_THRESHOLD = 0.97;
const MODEL_LOAD_TIMEOUT = 30000;
const LOCAL_MODEL_PATHS = [
  `${process.env.PUBLIC_URL || ''}/model/model.json`,
  `${process.env.PUBLIC_URL || ''}/model.json`,
  'https://models.s3.jp-tok.cloud-object-storage.appdomain.cloud/model.json',
];

const POSE_COLORS = {
  detected: '#10b981',
  notDetected: '#8b5cf6',
  joints: '#ffffff',
};

function Yoga() {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const detectorRef = useRef(null)
  const classifierRef = useRef(null)
  const detectionIntervalRef = useRef(null)
  const countAudioRef = useRef(null)
  const sessionStartRef = useRef(null)

  const [startingTime, setStartingTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [poseTime, setPoseTime] = useState(0)
  const [bestPerform, setBestPerform] = useState(0)
  const [currentPose, setCurrentPose] = useState('Tree')
  const [isStartPose, setIsStartPose] = useState(false)
  const [skeletonColor, setSkeletonColor] = useState(POSE_COLORS.notDetected)
  const [detectionFlag, setDetectionFlag] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [modelError, setModelError] = useState(null)
  const [confidenceThreshold, setConfidenceThreshold] = useState(DEFAULT_CONFIDENCE_THRESHOLD)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [poseConfidence, setPoseConfidence] = useState(0)

  const loadPoseClassifier = async () => {
    let lastError = null

    for (const modelUrl of LOCAL_MODEL_PATHS) {
      try {
        return await Promise.race([
          tf.loadLayersModel(modelUrl),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Model loading timeout')), MODEL_LOAD_TIMEOUT)
          )
        ])
      } catch (error) {
        lastError = error
      }
    }

    throw new Error(
      lastError && lastError.message
        ? `Failed to load pose classifier (${lastError.message})`
        : 'Failed to load pose classifier. The model files are missing or the server is unavailable.'
    )
  }

  useEffect(() => {
    const timeDiff = (currentTime - startingTime) / 1000
    if (detectionFlag) setPoseTime(timeDiff)
    if ((currentTime - startingTime) / 1000 > bestPerform) setBestPerform(timeDiff)
  }, [currentTime, detectionFlag, startingTime, bestPerform])

  useEffect(() => {
    setCurrentTime(0)
    setPoseTime(0)
    setDetectionFlag(false)
    setPoseConfidence(0)
  }, [currentPose])

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true)
        setModelError(null)
        setLoadingProgress(10)

        let detector
        try {
          detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
          )
        } catch (thunderError) {
          console.warn('Thunder model unavailable, falling back to Lightning model:', thunderError)
          detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
          )
        }
        detectorRef.current = detector
        setLoadingProgress(50)

        classifierRef.current = await loadPoseClassifier()
        setLoadingProgress(100)
        setIsLoading(false)
      } catch (error) {
        setModelError(error.message);
        setIsLoading(false)
      }
    };

    loadModels();

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (countAudioRef.current) {
        countAudioRef.current.pause();
        countAudioRef.current = null;
      }
      if (webcamRef.current?.video?.srcObject) {
        webcamRef.current.video.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const get_center_point = (landmarks, left_bodypart, right_bodypart) => {
    let left = tf.gather(landmarks, left_bodypart, 1)
    let right = tf.gather(landmarks, right_bodypart, 1)
    return tf.add(tf.mul(left, 0.5), tf.mul(right, 0.5))
  }

  const get_pose_size = (landmarks, torso_size_multiplier = 2.5) => {
    let hips_center = get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP)
    let shoulders_center = get_center_point(landmarks, POINTS.LEFT_SHOULDER, POINTS.RIGHT_SHOULDER)
    let torso_size = tf.norm(tf.sub(shoulders_center, hips_center))
    let pose_center_new = get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP)
    pose_center_new = tf.expandDims(pose_center_new, 1)
    pose_center_new = tf.broadcastTo(pose_center_new, [1, 17, 2])
    let d = tf.gather(tf.sub(landmarks, pose_center_new), 0, 0)
    let max_dist = tf.max(tf.norm(d, 'euclidean', 0))
    return tf.maximum(tf.mul(torso_size, torso_size_multiplier), max_dist)
  }

  const normalize_pose_landmarks = (landmarks) => {
    let pose_center = get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP)
    pose_center = tf.expandDims(pose_center, 1)
    pose_center = tf.broadcastTo(pose_center, [1, 17, 2])
    landmarks = tf.sub(landmarks, pose_center)
    let pose_size = get_pose_size(landmarks)
    return tf.div(landmarks, pose_size)
  }

  const landmarks_to_embedding = (landmarks) => {
    landmarks = normalize_pose_landmarks(tf.expandDims(landmarks, 0))
    return tf.reshape(landmarks, [1, 34])
  }

  const detectPose = useCallback(async () => {
    if (!detectorRef.current || !classifierRef.current) return;
    if (
      !webcamRef.current ||
      !webcamRef.current.video ||
      webcamRef.current.video.readyState !== 4
    ) return;

    try {
      let notDetected = 0
      const video = webcamRef.current.video
      const pose = await detectorRef.current.estimatePoses(video)
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

      const keypoints = pose[0]?.keypoints || []
      let input = keypoints.map((keypoint) => {
        if (keypoint.score > 0.4) {
          if (!(keypoint.name === 'left_eye' || keypoint.name === 'right_eye')) {
            drawPoint(ctx, keypoint.x, keypoint.y, 8, POSE_COLORS.joints)
            let connections = keypointConnections[keypoint.name] || []
            connections.forEach((connection) => {
              let conName = connection.toUpperCase()
              const connectedKeypoint = keypoints[POINTS[conName]]
              if (connectedKeypoint) {
                drawSegment(ctx, [keypoint.x, keypoint.y], [connectedKeypoint.x, connectedKeypoint.y], skeletonColor)
              }
            })
          }
        } else {
          notDetected += 1
        }
        return [keypoint.x, keypoint.y]
      })

      if (notDetected > 4) {
        setSkeletonColor(POSE_COLORS.notDetected)
        setDetectionFlag(false)
        return
      }

      const processedInput = landmarks_to_embedding(input)
      const classification = classifierRef.current.predict(processedInput)

      classification.array().then((data) => {
        const classNo = CLASS_NO[currentPose]
        const confidence = data[0][classNo]
        setPoseConfidence(Math.round(confidence * 100))

        if (confidence > confidenceThreshold) {
          if (!detectionFlag) {
            if (countAudioRef.current) {
              countAudioRef.current.currentTime = 0
              countAudioRef.current.play().catch(() => {})
            }
            setStartingTime(new Date(Date()).getTime())
            setDetectionFlag(true)
            sessionStartRef.current = new Date(Date()).getTime()
          }
          setCurrentTime(new Date(Date()).getTime())
          setSkeletonColor(POSE_COLORS.detected)
        } else {
          setDetectionFlag(false)
          setSkeletonColor(POSE_COLORS.notDetected)
          if (countAudioRef.current) {
            countAudioRef.current.pause()
            countAudioRef.current.currentTime = 0
          }
        }
      }).catch(() => {})
    } catch (err) {
      console.error('Pose detection error:', err)
    }
  }, [currentPose, detectionFlag, confidenceThreshold, skeletonColor])

  const startYoga = () => {
    if (!detectorRef.current || !classifierRef.current) {
      setModelError('Models are still loading. Please wait...');
      return;
    }
    if (!countAudioRef.current) {
      countAudioRef.current = new Audio(count)
      countAudioRef.current.loop = true
    }
    setIsStartPose(true)
    sessionStartRef.current = new Date().getTime()
    detectionIntervalRef.current = setInterval(detectPose, 100)
  }

  const stopPose = async () => {
    setIsStartPose(false)
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    if (countAudioRef.current) {
      countAudioRef.current.pause()
      countAudioRef.current.currentTime = 0
    }
    if (webcamRef.current?.video?.srcObject) {
      webcamRef.current.video.srcObject.getTracks().forEach(t => t.stop());
    }
    if (sessionStartRef.current && bestPerform > 0) {
      try {
        await saveYogaSession({
          pose: currentPose,
          duration: bestPerform,
          timestamp: sessionStartRef.current,
          confidence: confidenceThreshold
        })
      } catch (err) {
        console.error('Error saving session:', err)
      }
    }
    setDetectionFlag(false)
    setSkeletonColor(POSE_COLORS.notDetected)
  }

  // ─────────────── Active Detection View ───────────────
  if (isStartPose) {
    return (
      <div className="yoga-page">
        <div className="yoga-active-header">
          <button onClick={stopPose} className="stop-btn">
            ⬅ Stop Session
          </button>
          <div className="active-pose-name">
            <span className="active-dot" style={{ background: detectionFlag ? '#10b981' : '#8b5cf6' }} />
            {currentPose} Pose
          </div>
          <div className="active-stats-bar">
            <div className="active-stat">
              <span className="active-stat-label">Pose Time</span>
              <span className="active-stat-value">{poseTime.toFixed(1)}s</span>
            </div>
            <div className="active-stat">
              <span className="active-stat-label">Best</span>
              <span className="active-stat-value best">{bestPerform.toFixed(1)}s</span>
            </div>
            <div className="active-stat">
              <span className="active-stat-label">Confidence</span>
              <span className="active-stat-value">{poseConfidence}%</span>
            </div>
          </div>
        </div>

        <div className="yoga-active-body">
          {/* Camera Feed */}
          <div className="camera-wrapper">
            <div className={`camera-frame ${detectionFlag ? 'detected' : ''}`}>
              <Webcam
                width='640px'
                height='480px'
                id="webcam"
                ref={webcamRef}
                audio={false}
                mirrored={true}
                videoConstraints={{ facingMode: 'user' }}
                style={{ position: 'absolute', left: 0, top: 0 }}
              />
              <canvas
                ref={canvasRef}
                id="my-canvas"
                width='640px'
                height='480px'
                style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}
              />
              {/* Status overlay */}
              <div className={`pose-status-overlay ${detectionFlag ? 'good' : 'waiting'}`}>
                {detectionFlag ? '✓ Pose Detected!' : '○ Align your pose...'}
              </div>
              {/* Confidence bar */}
              <div className="confidence-bar-overlay">
                <div className="confidence-fill" style={{ width: `${poseConfidence}%`, background: detectionFlag ? '#10b981' : '#8b5cf6' }} />
                <span className="confidence-label">{poseConfidence}%</span>
              </div>
            </div>
          </div>

          {/* Reference Image */}
          <div className="reference-panel">
            <h3>Reference Pose</h3>
            <div className="reference-img-wrap">
              <img
                src={poseImages[currentPose]}
                alt={`${currentPose} pose reference`}
                className="reference-img"
              />
            </div>
            <div className={`detection-badge ${detectionFlag ? 'badge-success' : 'badge-info'}`}>
              {detectionFlag ? '🟢 Keep Holding!' : '🔵 Keep Trying'}
            </div>
            <div className="best-time-card">
              <span className="best-time-label">Best Time</span>
              <span className="best-time-value">{bestPerform.toFixed(2)}s</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────── Setup View ───────────────
  return (
    <div className="yoga-page">
      {/* Page Header */}
      <div className="yoga-page-header">
        <div>
          <h1 className="yoga-page-title">
            🧘 Yoga <span style={{ color: '#8b5cf6' }}>AI Trainer</span>
          </h1>
          <p className="yoga-page-sub">Real-time pose detection with MoveNet AI</p>
        </div>
        <div className="yoga-header-status">
          {isLoading ? (
            <span className="badge badge-warning">⟳ Loading AI...</span>
          ) : modelError ? (
            <span className="badge badge-error">⚠ Error</span>
          ) : (
            <span className="badge badge-success">✓ AI Ready</span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="yoga-loading-card">
          <div className="spinner-ring" />
          <div className="loading-text-group">
            <p className="loading-title">Loading AI Models</p>
            <p className="loading-sub">Initializing MoveNet & pose classifier...</p>
          </div>
          <div className="loading-progress-bar">
            <div className="loading-progress-fill" style={{ width: `${loadingProgress}%` }} />
          </div>
        </div>
      )}

      {/* Error State */}
      {modelError && !isLoading && (
        <div className="yoga-error-card">
          <span className="error-icon">⚠️</span>
          <div>
            <p className="error-title">Failed to Load AI Models</p>
            <p className="error-desc">{modelError}</p>
          </div>
          <button className="btn-primary-glow" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {/* Main setup grid */}
      <div className="yoga-setup-grid">
        {/* Left: Pose selection & settings */}
        <div className="yoga-controls-panel">
          {/* Pose Selector */}
          <div className="yoga-section-card">
            <h3 className="section-card-title">Select Pose</h3>
            <div className="pose-grid">
              {POSE_LIST.map((pose) => (
                <button
                  key={pose}
                  className={`pose-btn ${currentPose === pose ? 'active' : ''}`}
                  onClick={() => setCurrentPose(pose)}
                >
                  {pose}
                </button>
              ))}
            </div>
          </div>

          {/* Confidence Threshold */}
          <div className="yoga-section-card">
            <h3 className="section-card-title">Sensitivity</h3>
            <div className="threshold-row">
              <span className="threshold-label">Confidence: <strong>{(confidenceThreshold * 100).toFixed(0)}%</strong></span>
              <div className="threshold-hints">
                <span style={{ color: '#10b981' }}>Easy</span>
                <span style={{ color: '#6060a0' }}>Strict</span>
              </div>
            </div>
            <input
              type="range"
              min="0.80"
              max="1.00"
              step="0.01"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              disabled={isLoading || modelError}
            />
            <p className="threshold-hint">Higher = stricter matching. Lower = more forgiving.</p>
          </div>

          {/* Start Button */}
          <button
            className={`start-yoga-btn ${(isLoading || modelError) ? 'disabled' : ''}`}
            onClick={startYoga}
            disabled={isLoading || !!modelError}
          >
            <span className="start-icon">▶</span>
            Start Pose Detection
          </button>
        </div>

        {/* Right: Instructions & Preview */}
        <div className="yoga-info-panel">
          {/* Pose Preview */}
          <div className="yoga-section-card pose-preview-card">
            <h3 className="section-card-title">Pose Preview — {currentPose}</h3>
            <div className="pose-preview-img-wrap">
              <img
                src={poseImages[currentPose]}
                alt={`${currentPose} reference`}
                className="pose-preview-img"
              />
            </div>
          </div>

          {/* How to use */}
          <div className="yoga-section-card">
            <h3 className="section-card-title">🎯 How to Use</h3>
            <ol className="instructions-list">
              <li>Allow camera permission when prompted</li>
              <li>Select the yoga pose you want to practice</li>
              <li>Click "Start Pose Detection" to begin</li>
              <li>Replicate the reference pose shown on the right</li>
              <li>Skeleton turns <strong style={{ color: '#10b981' }}>green</strong> when pose is correctly detected</li>
              <li>Hold the pose as long as possible to set a new best!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Yoga
