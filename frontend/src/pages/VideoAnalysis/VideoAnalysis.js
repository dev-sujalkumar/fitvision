import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import './VideoAnalysis.css';
import { POINTS, keypointConnections, POSE_LIST, CLASS_NO } from '../../utils/data';
import { drawPoint, drawSegment } from '../../utils/helper';

const SKELETON_COLORS = {
  detected: '#10b981',
  normal: '#8b5cf6',
  joints: '#ffffff',
};

export default function VideoAnalysis() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const classifierRef = useRef(null);
  const animFrameRef = useRef(null);
  const analysisDataRef = useRef([]);

  const [isLoading, setIsLoading] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [currentPose, setCurrentPose] = useState(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [detectedPose, setDetectedPose] = useState('None');
  const [skeletonColor, setSkeletonColor] = useState(SKELETON_COLORS.normal);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [targetPose, setTargetPose] = useState('Tree');

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        setLoadingStage('Initializing TensorFlow...');
        await tf.ready();

        setLoadingStage('Loading MoveNet pose detector...');
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
        );
        detectorRef.current = detector;

        setLoadingStage('Loading pose classifier...');
        let classifier = null;
        try {
          classifier = await Promise.race([
            tf.loadLayersModel('https://models.s3.jp-tok.cloud-object-storage.appdomain.cloud/model.json'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
          ]);
        } catch {
          try {
            classifier = await tf.loadLayersModel('/model.json');
          } catch {
            console.warn('Pose classifier unavailable — detection only mode');
          }
        }
        classifierRef.current = classifier;

        setIsLoading(false);
        setLoadingStage('');
      } catch (err) {
        setModelError(err.message);
        setIsLoading(false);
      }
    };
    loadModels();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file (MP4, MOV, WebM, etc.)');
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setAnalysisResults(null);
    setCurrentPose(null);
    setProgress(0);
  };

  const handleFileInputChange = (e) => handleFileSelect(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  // Math helpers
  const get_center_point = (landmarks, a, b) => {
    let left = tf.gather(landmarks, a, 1);
    let right = tf.gather(landmarks, b, 1);
    return tf.add(tf.mul(left, 0.5), tf.mul(right, 0.5));
  };

  const get_pose_size = (landmarks, mul = 2.5) => {
    let hips_center = get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP);
    let shoulders_center = get_center_point(landmarks, POINTS.LEFT_SHOULDER, POINTS.RIGHT_SHOULDER);
    let torso_size = tf.norm(tf.sub(shoulders_center, hips_center));
    let pose_center_new = get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP);
    pose_center_new = tf.expandDims(pose_center_new, 1);
    pose_center_new = tf.broadcastTo(pose_center_new, [1, 17, 2]);
    let d = tf.gather(tf.sub(landmarks, pose_center_new), 0, 0);
    let max_dist = tf.max(tf.norm(d, 'euclidean', 0));
    return tf.maximum(tf.mul(torso_size, mul), max_dist);
  };

  const normalize_pose_landmarks = (landmarks) => {
    let pose_center = get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP);
    pose_center = tf.expandDims(pose_center, 1);
    pose_center = tf.broadcastTo(pose_center, [1, 17, 2]);
    landmarks = tf.sub(landmarks, pose_center);
    let pose_size = get_pose_size(landmarks);
    return tf.div(landmarks, pose_size);
  };

  const landmarks_to_embedding = (landmarks) => {
    landmarks = normalize_pose_landmarks(tf.expandDims(landmarks, 0));
    return tf.reshape(landmarks, [1, 34]);
  };

  // Draw poses on canvas
  const drawPoses = useCallback((keypoints, color) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    keypoints.forEach((kp) => {
      if (kp.score > 0.4) {
        if (kp.name !== 'left_eye' && kp.name !== 'right_eye') {
          drawPoint(ctx, kp.x, kp.y, 7, '#ffffff');
          const connections = keypointConnections[kp.name] || [];
          connections.forEach((conn) => {
            const connKp = keypoints[POINTS[conn.toUpperCase()]];
            if (connKp && connKp.score > 0.4) {
              drawSegment(ctx, [kp.x, kp.y], [connKp.x, connKp.y], color);
            }
          });
        }
      }
    });
  }, []);

  // Process a single video frame
  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !detectorRef.current || video.paused || video.ended) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    try {
      const poses = await detectorRef.current.estimatePoses(video, { maxPoses: 1 });
      if (poses.length > 0) {
        const kps = poses[0].keypoints;
        let poseLabel = 'No Pose';
        let confidence = 0;

        if (classifierRef.current) {
          const notDetected = kps.filter(k => k.score <= 0.4).length;
          if (notDetected <= 4) {
            try {
              const input = kps.map(k => [k.x, k.y]);
              const embedding = landmarks_to_embedding(input);
              const prediction = classifierRef.current.predict(embedding);
              const data = await prediction.array();

              const classNo = CLASS_NO[targetPose];
              confidence = Math.round(data[0][classNo] * 100);

              // Find best pose
              const allPoses = Object.entries(CLASS_NO);
              let bestIdx = -1, bestConf = 0;
              allPoses.forEach(([name, idx]) => {
                if (name !== 'No_Pose' && data[0][idx] > bestConf) {
                  bestConf = data[0][idx];
                  bestIdx = idx;
                  poseLabel = name;
                }
              });

              const color = confidence > 90 ? SKELETON_COLORS.detected : SKELETON_COLORS.normal;
              setSkeletonColor(color);
              setCurrentConfidence(confidence);
              setDetectedPose(poseLabel);

              // Store frame data
              const progress = Math.round((video.currentTime / video.duration) * 100);
              analysisDataRef.current.push({
                time: video.currentTime,
                detectedPose: poseLabel,
                targetConfidence: confidence,
                progress,
              });
            } catch (err) {
              // classifier error — continue with skeleton only
            }
          }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0);
        drawPoses(kps, skeletonColor);
      }
    } catch (err) {
      console.error('Frame processing error:', err);
    }

    // Update progress
    if (video.duration > 0) {
      setProgress(Math.round((video.currentTime / video.duration) * 100));
    }

    if (!video.paused && !video.ended) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    } else if (video.ended) {
      finishAnalysis();
    }
  }, [drawPoses, targetPose, skeletonColor]);

  const finishAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    const data = analysisDataRef.current;
    if (data.length === 0) {
      setAnalysisResults({ error: 'No pose data collected.' });
      return;
    }

    // Calculate results
    const totalFrames = data.length;
    const targetFrames = data.filter(d => d.targetConfidence > 90).length;
    const targetAccuracy = Math.round((targetFrames / totalFrames) * 100);

    const avgConfidence = Math.round(data.reduce((s, d) => s + d.targetConfidence, 0) / totalFrames);

    // Pose distribution
    const poseCounts = {};
    data.forEach(d => {
      poseCounts[d.detectedPose] = (poseCounts[d.detectedPose] || 0) + 1;
    });
    const poseDistribution = Object.entries(poseCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([pose, count]) => ({ pose, count, pct: Math.round((count / totalFrames) * 100) }));

    const videoDuration = videoRef.current?.duration || 0;

    setAnalysisResults({
      totalFrames,
      targetPose,
      targetAccuracy,
      avgConfidence,
      poseDistribution,
      videoDuration,
      grade: targetAccuracy >= 80 ? 'A' : targetAccuracy >= 60 ? 'B' : targetAccuracy >= 40 ? 'C' : 'D',
      gradeColor: targetAccuracy >= 80 ? '#10b981' : targetAccuracy >= 60 ? '#f59e0b' : targetAccuracy >= 40 ? '#f97316' : '#ef4444',
    });
  }, [targetPose]);

  const startAnalysis = () => {
    if (!videoRef.current || !detectorRef.current) return;
    analysisDataRef.current = [];
    setAnalysisResults(null);
    setIsAnalyzing(true);
    setProgress(0);
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    if (videoRef.current) videoRef.current.pause();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    finishAnalysis();
  };

  return (
    <div className="va-page">
      {/* Page Header */}
      <div className="va-header">
        <div>
          <h1 className="va-title">🎬 Video <span className="gradient-text">Analysis</span></h1>
          <p className="va-subtitle">Upload a video to analyze yoga poses frame-by-frame with AI</p>
        </div>
        <div>
          {isLoading ? (
            <span className="badge badge-warning">⟳ Loading AI...</span>
          ) : modelError ? (
            <span className="badge badge-error">⚠ Error</span>
          ) : (
            <span className="badge badge-success">✓ Ready</span>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="va-loading-banner">
          <div className="spinner-ring" />
          <div>
            <p className="loading-title">Initializing AI Engine</p>
            <p className="loading-sub">{loadingStage}</p>
          </div>
        </div>
      )}

      <div className="va-body">
        {/* Left Panel */}
        <div className="va-left">
          {/* Upload Area */}
          {!videoUrl ? (
            <div
              className={`va-upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('video-input').click()}
            >
              <div className="upload-icon">🎬</div>
              <h3 className="upload-title">Drop your video here</h3>
              <p className="upload-sub">or click to browse — MP4, MOV, WebM, AVI supported</p>
              <span className="upload-btn-label">Choose Video File</span>
              <input
                id="video-input"
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
            </div>
          ) : (
            <div className="va-video-section">
              {/* Video player with canvas overlay */}
              <div className="va-video-container">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="va-video"
                  onEnded={finishAnalysis}
                  controls={!isAnalyzing}
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="va-canvas"
                />
              </div>

              {/* Progress bar */}
              {isAnalyzing && (
                <div className="va-progress">
                  <div className="va-progress-bar">
                    <div className="va-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="va-progress-label">{progress}% analyzed</span>
                </div>
              )}

              {/* File info */}
              <div className="va-file-info">
                <span className="file-name">📄 {videoFile?.name}</span>
                <button
                  className="change-video-btn"
                  onClick={() => {
                    setVideoUrl(null);
                    setVideoFile(null);
                    setAnalysisResults(null);
                    setProgress(0);
                  }}
                >
                  Change Video
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          {videoUrl && (
            <div className="va-controls">
              {/* Target pose selector */}
              <div className="va-control-group">
                <label className="va-label">Target Pose to Analyze</label>
                <div className="va-pose-selector">
                  {POSE_LIST.map(pose => (
                    <button
                      key={pose}
                      className={`va-pose-btn ${targetPose === pose ? 'active' : ''}`}
                      onClick={() => setTargetPose(pose)}
                      disabled={isAnalyzing}
                    >
                      {pose}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="va-action-btns">
                {!isAnalyzing ? (
                  <button
                    className="btn-primary-glow va-start-btn"
                    onClick={startAnalysis}
                    disabled={isLoading || !!modelError}
                  >
                    ▶ Start Analysis
                  </button>
                ) : (
                  <button
                    className="btn-danger-glow va-stop-btn"
                    onClick={stopAnalysis}
                  >
                    ■ Stop & Get Results
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="va-right">
          {/* Real-time feedback (when analyzing) */}
          {isAnalyzing && (
            <div className="va-realtime-card">
              <h3 className="va-card-title">Live Detection</h3>
              <div className="va-realtime-grid">
                <div className="va-metric">
                  <span className="va-metric-label">Detected Pose</span>
                  <span className="va-metric-value" style={{ color: skeletonColor }}>{detectedPose}</span>
                </div>
                <div className="va-metric">
                  <span className="va-metric-label">Target: {targetPose}</span>
                  <span className="va-metric-value" style={{ color: currentConfidence > 80 ? '#10b981' : '#8b5cf6' }}>
                    {currentConfidence}%
                  </span>
                </div>
              </div>
              <div className="va-conf-bar">
                <div
                  className="va-conf-fill"
                  style={{
                    width: `${currentConfidence}%`,
                    background: currentConfidence > 80 ? '#10b981' : '#8b5cf6'
                  }}
                />
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResults && !analysisResults.error && (
            <div className="va-results">
              <h3 className="va-card-title">Analysis Report</h3>

              {/* Grade */}
              <div className="va-grade-card" style={{ borderColor: `${analysisResults.gradeColor}40` }}>
                <div className="va-grade" style={{ color: analysisResults.gradeColor }}>
                  {analysisResults.grade}
                </div>
                <div className="va-grade-info">
                  <p className="va-grade-title">Performance Grade</p>
                  <p className="va-grade-sub">{analysisResults.targetPose} pose accuracy</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="va-metrics-grid">
                <div className="va-metric-card">
                  <span className="va-mc-value">{analysisResults.targetAccuracy}%</span>
                  <span className="va-mc-label">Target Accuracy</span>
                </div>
                <div className="va-metric-card">
                  <span className="va-mc-value">{analysisResults.avgConfidence}%</span>
                  <span className="va-mc-label">Avg Confidence</span>
                </div>
                <div className="va-metric-card">
                  <span className="va-mc-value">{analysisResults.totalFrames}</span>
                  <span className="va-mc-label">Frames Analyzed</span>
                </div>
                <div className="va-metric-card">
                  <span className="va-mc-value">{Math.round(analysisResults.videoDuration)}s</span>
                  <span className="va-mc-label">Video Duration</span>
                </div>
              </div>

              {/* Pose Distribution */}
              <div className="va-dist-section">
                <h4 className="va-dist-title">Pose Distribution</h4>
                {analysisResults.poseDistribution.slice(0, 5).map((item, i) => (
                  <div key={i} className="va-dist-row">
                    <span className="va-dist-pose">{item.pose}</span>
                    <div className="va-dist-bar-wrap">
                      <div
                        className="va-dist-bar"
                        style={{
                          width: `${item.pct}%`,
                          background: item.pose === analysisResults.targetPose
                            ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                            : 'linear-gradient(90deg, #8b5cf6, #3b82f6)'
                        }}
                      />
                    </div>
                    <span className="va-dist-pct">{item.pct}%</span>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div className={`va-feedback ${analysisResults.targetAccuracy >= 70 ? 'good' : 'improve'}`}>
                {analysisResults.targetAccuracy >= 80
                  ? '🏆 Excellent! Your pose form is very accurate in this video.'
                  : analysisResults.targetAccuracy >= 60
                  ? '✅ Good job! Some areas could use improvement for perfect form.'
                  : analysisResults.targetAccuracy >= 40
                  ? '⚠️ Keep practicing! The pose needs more work for accurate detection.'
                  : '🔄 Needs significant improvement. Try watching the reference pose before recording.'}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!videoUrl && !isLoading && (
            <div className="va-empty-state">
              <div className="empty-icon">📹</div>
              <h3>No Video Selected</h3>
              <p>Upload a yoga practice video to get AI-powered pose analysis, accuracy scores, and detailed feedback.</p>
              <div className="va-features-list">
                <div className="va-feature-item">🤖 Frame-by-frame pose detection</div>
                <div className="va-feature-item">📊 Accuracy scoring & grade</div>
                <div className="va-feature-item">📈 Pose distribution analysis</div>
                <div className="va-feature-item">💡 Improvement feedback</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
