import React, { useRef, useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import { RepCounter, EXERCISE_PATTERNS, EXERCISE_GUIDES, KEYPOINTS } from '../../utils/gymExercises'
import { saveGymWorkout, getGymWorkoutHistory } from '../../utils/storage'
import './Gym.css'

const GymPage = () => {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const detectorRef = useRef(null)
  const repCounterRef = useRef(null)
  const detectionIntervalRef = useRef(null)

  // State variables
  const [isStarted, setIsStarted] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('SQUAT')
  const [repCount, setRepCount] = useState(0)
  const [setCount, setSetCount] = useState(0)
  const [currentState, setCurrentState] = useState('standing')
  const [formFeedback, setFormFeedback] = useState('Get ready...')
  const [isLoading, setIsLoading] = useState(false)
  const [modelError, setModelError] = useState(null)
  const [duration, setDuration] = useState(0)
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [cameraReady, setCameraReady] = useState(false)

  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true)
        setModelError(null)

        // Load TensorFlow.js backend
        await tf.ready()

        // Load MoveNet detector with timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model loading timeout')), 30000)
        )

        try {
          const detectorPromise = poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.Thunder }
          )
          detectorRef.current = await Promise.race([detectorPromise, timeoutPromise])
        } catch (err) {
          console.warn('Cloud model failed, using lightweight model:', err.message)
          detectorRef.current = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.Lite }
          )
        }

        const history = await getGymWorkoutHistory()
        setWorkoutHistory(history || [])

        setIsLoading(false)
      } catch (err) {
        console.error('Error loading models:', err)
        setModelError(`Failed to load models: ${err.message}`)
        setIsLoading(false)
      }
    }

    loadModels()

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (webcamRef.current?.video?.srcObject) {
        webcamRef.current.video.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    const video = webcamRef.current?.video
    if (video) {
      const handleLoadedMetadata = () => setCameraReady(true)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [isStarted])

  // Duration timer
  useEffect(() => {
    let durationInterval
    if (isStarted) {
      durationInterval = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (durationInterval) clearInterval(durationInterval)
    }
  }, [isStarted])

  /**
   * Draw skeleton on canvas
   */
  const drawSkeleton = (poses) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const video = webcamRef.current?.video

    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      if (poses.length > 0) {
        const pose = poses[0]
        const keypoints = pose.keypoints

        // Draw keypoints
        keypoints.forEach((kp, idx) => {
          if (kp.score > 0.3) {
            ctx.fillStyle = '#00ff00'
            ctx.beginPath()
            ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI)
            ctx.fill()

            // Draw label
            ctx.fillStyle = '#fff'
            ctx.font = '12px Arial'
            ctx.fillText(idx, kp.x + 8, kp.y + 8)
          }
        })

        // Draw skeleton connections
        const connections = [
          [5, 7], [7, 9],       // Left arm
          [6, 8], [8, 10],      // Right arm
          [5, 11], [11, 13],    // Left leg
          [6, 12], [12, 14],    // Right leg
          [11, 12],             // Hips
          [5, 6],               // Shoulders
          [13, 15], [14, 16],   // Ankles
        ]

        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 2
        connections.forEach(([start, end]) => {
          const startKp = keypoints[start]
          const endKp = keypoints[end]
          if (startKp.score > 0.3 && endKp.score > 0.3) {
            ctx.beginPath()
            ctx.moveTo(startKp.x, startKp.y)
            ctx.lineTo(endKp.x, endKp.y)
            ctx.stroke()
          }
        })
      }
    }
  }

  /**
   * Detect pose and count reps
   */
  const detectPose = async () => {
    const video = webcamRef.current?.video
    if (!video || !detectorRef.current) return

    try {
      const poses = await detectorRef.current.estimatePoses(video, {
        maxPoses: 1,
        flipHorizontal: true,
      })

      drawSkeleton(poses)

      if (poses.length > 0 && repCounterRef.current) {
        const keypoints = poses[0].keypoints.map(kp => [kp.x, kp.y, kp.score])
        const result = repCounterRef.current.update(keypoints)

        setRepCount(result.repCount)
        setSetCount(result.setCount)
        setCurrentState(result.state)
        setFormFeedback(result.feedback || 'Good form!')
      }
    } catch (err) {
      console.error('Pose detection error:', err)
    }
  }

  /**
   * Start exercise tracking
   */
  const handleStart = async () => {
    if (!detectorRef.current) {
      setModelError('Model not loaded. Please refresh and try again.')
      return
    }

    try {
      setCameraReady(false)
      setIsStarted(true)
      setDuration(0)
      setRepCount(0)
      setSetCount(0)
      setCurrentState('standing')
      setFormFeedback('Get ready...')
      repCounterRef.current = new RepCounter(selectedExercise)

      const video = webcamRef.current?.video
      if (video && video.readyState >= 2) {
        setCameraReady(true)
      }

      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = setInterval(detectPose, 100)
    } catch (err) {
      console.error('Error starting exercise:', err)
      setModelError(`Error: ${err.message}`)
    }
  }

  /**
   * Stop exercise tracking
   */
  const handleStop = async () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }

    setIsStarted(false)

    if (repCounterRef.current && duration > 0) {
      const workoutData = {
        exerciseType: selectedExercise,
        exerciseName: EXERCISE_PATTERNS[selectedExercise].name,
        reps: repCount,
        sets: setCount,
        duration: duration,
        timestamp: new Date().toISOString(),
        caloriesBurned: Math.round(repCount * 5 + duration * 0.5), // Rough estimation
      }

      await saveGymWorkout(workoutData)
      const history = await getGymWorkoutHistory()
      setWorkoutHistory(history || [])
    }
  }

  /**
   * Complete set
   */
  const handleCompleteSet = () => {
    if (repCounterRef.current) {
      repCounterRef.current.completeSet()
      setSetCount(repCounterRef.current.setCount)
      setRepCount(0)
    }
  }

  /**
   * Format duration
   */
  const formatDuration = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="gym-container">
      <div className="gym-page-header">
        <div>
          <h1 className="gym-page-title">💪 Gym <span style={{ color: '#ef4444' }}>AI Trainer</span></h1>
          <p className="gym-page-sub">Real-time rep counting & form feedback with MoveNet</p>
        </div>
        <div>
          {isLoading ? (
            <span className="badge badge-warning">⟳ Loading AI...</span>
          ) : modelError ? (
            <span className="badge badge-error">⚠ Error</span>
          ) : (
            <span className="badge badge-success">✓ AI Ready</span>
          )}
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
          <p>Loading pose detection model...</p>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !modelError && (
        <div className="gym-content">
          {/* Left Panel - Video & Canvas */}
          <div className="gym-video-panel">
            <div className="gym-video-container">
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored
                videoConstraints={{ facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  background: '#000',
                  filter: isStarted ? 'none' : 'brightness(0.7) saturate(0.8)',
                }}
              />
              <canvas
                ref={canvasRef}
                className="gym-canvas"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: isStarted ? 'block' : 'none',
                  width: '100%',
                  height: '100%',
                  border: '2px solid #00ff00',
                  borderRadius: '8px',
                  zIndex: 2,
                  pointerEvents: 'none',
                }}
              />
              {!isStarted && (
                <div className="no-video-message">
                  <p>Select exercise and click Start to begin</p>
                </div>
              )}
              {isStarted && !cameraReady && (
                <div className="no-video-message" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                  <p>Starting camera…</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Controls & Feedback */}
          <div className="gym-control-panel">
            {/* Exercise Selector */}
            <div className="exercise-selector">
              <label htmlFor="exercise">Exercise:</label>
              <select
                id="exercise"
                value={selectedExercise}
                onChange={e => setSelectedExercise(e.target.value)}
                disabled={isStarted}
              >
                <option value="SQUAT">🏋️ Squat</option>
                <option value="PUSHUP">📌 Push-up</option>
                <option value="BICEP_CURL">💪 Bicep Curl</option>
              </select>
            </div>

            <div style={{
              background: 'rgba(17, 24, 39, 0.65)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '18px',
              color: '#f8fafc'
            }}>
              <p style={{ margin: 0, color: '#a5f3fc', fontWeight: 700, fontSize: '0.9rem' }}>
                {EXERCISE_GUIDES[selectedExercise].title}
              </p>
              <p style={{ margin: '8px 0 0' }}>
                <strong>Focus:</strong> {EXERCISE_GUIDES[selectedExercise].focus}
              </p>
              <p style={{ margin: '8px 0 0' }}>
                {EXERCISE_GUIDES[selectedExercise].summary}
              </p>
              <ul style={{ margin: '12px 0 0 18px', padding: 0 }}>
                {EXERCISE_GUIDES[selectedExercise].cues.map((cue, index) => (
                  <li key={index} style={{ marginBottom: '6px' }}>{cue}</li>
                ))}
              </ul>
            </div>

            {/* Statistics Display */}
            <div className="gym-stats">
              <div className="stat-card">
                <h3>Reps</h3>
                <p className="stat-value">{repCount}</p>
              </div>
              <div className="stat-card">
                <h3>Sets</h3>
                <p className="stat-value">{setCount}</p>
              </div>
              <div className="stat-card">
                <h3>Time</h3>
                <p className="stat-value">{formatDuration(duration)}</p>
              </div>
            </div>

            {/* Current State */}
            <div className="current-state">
              <p><strong>State:</strong> {currentState}</p>
              <p><strong>Form:</strong> {formFeedback}</p>
            </div>

            {/* Control Buttons */}
            <div className="gym-controls">
              {!isStarted ? (
                <button
                  className="btn btn-primary"
                  onClick={handleStart}
                  disabled={isLoading || modelError}
                >
                  Start Exercise
                </button>
              ) : (
                <>
                  <button className="btn btn-success" onClick={handleCompleteSet}>
                    Complete Set
                  </button>
                  <button className="btn btn-danger" onClick={handleStop}>
                    Stop Exercise
                  </button>
                </>
              )}
            </div>

            {/* Workout History */}
            <div className="workout-history">
              <h3>Recent Workouts</h3>
              <div className="history-list">
                {workoutHistory.slice(-5).reverse().map((workout, idx) => (
                  <div key={idx} className="history-item">
                    <span>{workout.exerciseName}</span>
                    <span>{workout.reps} reps × {workout.sets} sets</span>
                    <span>{formatDuration(workout.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GymPage
