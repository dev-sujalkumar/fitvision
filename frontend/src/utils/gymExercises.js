/**
 * Gym Exercise Detection Utilities
 * Handles joint angle calculations, rep counting, and form feedback
 * Supports: Squats, Push-ups, Bicep Curls
 */

/**
 * Calculate angle between three points (in degrees)
 * @param {Array} a - Point A [x, y]
 * @param {Array} b - Point B (vertex) [x, y]
 * @param {Array} c - Point C [x, y]
 * @returns {number} Angle in degrees (0-180)
 */
export const calculateAngle = (a, b, c) => {
  const ax = a[0] - b[0]
  const ay = a[1] - b[1]
  const cx = c[0] - b[0]
  const cy = c[1] - b[1]

  const dotProduct = ax * cx + ay * cy
  const magnitudeA = Math.sqrt(ax * ax + ay * ay)
  const magnitudeC = Math.sqrt(cx * cx + cy * cy)

  if (magnitudeA === 0 || magnitudeC === 0) return 0

  const cosAngle = dotProduct / (magnitudeA * magnitudeC)
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle))
  const angleRadians = Math.acos(clampedCosAngle)
  const angleDegrees = (angleRadians * 180) / Math.PI

  return angleDegrees
}

/**
 * Get distance between two points
 * @param {Array} p1 - Point 1 [x, y]
 * @param {Array} p2 - Point 2 [x, y]
 * @returns {number} Euclidean distance
 */
export const getDistance = (p1, p2) => {
  const dx = p1[0] - p2[0]
  const dy = p1[1] - p2[1]
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Keypoint indices from MoveNet (17 points)
 */
export const KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
}

/**
 * Exercise patterns and thresholds
 */
export const EXERCISE_PATTERNS = {
  SQUAT: {
    name: 'Squat',
    states: ['standing', 'descent', 'bottom', 'ascent'],
    thresholds: {
      kneeAngleDown: 150,
      kneeAngleBottom: 120,
      kneeAngleRise: 135,
      kneeAngleUp: 155,
      torsoAngle: 30,
      hipKneeAnkleAlignment: 20,
    },
    countAt: 'ascent',
    stateMinDuration: 100, // ms
  },
  PUSHUP: {
    name: 'Push-up',
    states: ['up', 'descent', 'down', 'ascent'],
    thresholds: {
      elbowAngleDown: 80,
      elbowAngleUp: 160,
      bodyAlignment: 25,
      elbowFlare: 60,
    },
    countAt: 'ascent',
    stateMinDuration: 300, // ms
  },
  BICEP_CURL: {
    name: 'Bicep Curl',
    states: ['down', 'ascent', 'up', 'descent'],
    thresholds: {
      elbowAngleDown: 170,
      elbowAngleUp: 40,
      elbowDisplacement: 20,
      shoulderStability: 15,
    },
    countAt: 'up',
    stateMinDuration: 250, // ms
  },
}

export const EXERCISE_GUIDES = {
  SQUAT: {
    title: 'Squat Pose',
    focus: 'Glutes, quads, and core',
    summary: 'Stand with feet shoulder-width apart. Bend your knees and hips while keeping your chest up and heels grounded.',
    cues: ['Keep knees tracking over toes', 'Brace your core throughout the movement', 'Lower until thighs are parallel to the floor'],
  },
  PUSHUP: {
    title: 'Push-up Pose',
    focus: 'Chest, shoulders, and triceps',
    summary: 'Start in a plank position, lower your chest toward the floor, then press back up while keeping your body straight.',
    cues: ['Keep hips level with shoulders', 'Avoid dropping your head forward', 'Use a full range of motion without sagging'],
  },
  BICEP_CURL: {
    title: 'Bicep Curl Pose',
    focus: 'Biceps and forearms',
    summary: 'Hold the dumbbell with your elbow tucked at your side and curl upward without swinging the weight.',
    cues: ['Keep elbows pinned close to the body', 'Lift only to the shoulder line', 'Lower slowly with control'],
  },
}

/**
 * Rep Counting State Machine
 */
export class RepCounter {
  constructor(exerciseType = 'SQUAT') {
    this.exerciseType = exerciseType
    this.pattern = EXERCISE_PATTERNS[exerciseType]
    this.state = this.pattern.states[0]
    this.repCount = 0
    this.setCount = 0
    this.stateStartTime = Date.now()
    this.formIssues = []
  }

  /**
   * Update rep counter based on current keypoints
   * @param {Array} keypoints - 17 keypoints from MoveNet
   * @returns {Object} { repCount, setCount, state, formIssues, feedback }
   */
  update(keypoints) {
    const feedback = this._checkForm(keypoints)
    this.formIssues = feedback.issues

    if (this.exerciseType === 'SQUAT') {
      return this._updateSquat(keypoints, feedback)
    } else if (this.exerciseType === 'PUSHUP') {
      return this._updatePushup(keypoints, feedback)
    } else if (this.exerciseType === 'BICEP_CURL') {
      return this._updateBicepCurl(keypoints, feedback)
    }

    return {
      repCount: this.repCount,
      setCount: this.setCount,
      state: this.state,
      formIssues: this.formIssues,
      feedback: feedback.message,
    }
  }

  /**
   * Squat rep counting logic
   */
  _updateSquat(keypoints, feedback) {
    const leftHip = keypoints[KEYPOINTS.LEFT_HIP]
    const rightHip = keypoints[KEYPOINTS.RIGHT_HIP]
    const leftKnee = keypoints[KEYPOINTS.LEFT_KNEE]
    const rightKnee = keypoints[KEYPOINTS.RIGHT_KNEE]
    const leftAnkle = keypoints[KEYPOINTS.LEFT_ANKLE]
    const rightAnkle = keypoints[KEYPOINTS.RIGHT_ANKLE]

    const visibleKneeAngles = [
      [leftHip, leftKnee, leftAnkle],
      [rightHip, rightKnee, rightAnkle],
    ]
      .filter(points => this._pointsVisible(points))
      .map(([hip, knee, ankle]) =>
        calculateAngle([hip[0], hip[1]], [knee[0], knee[1]], [ankle[0], ankle[1]])
      )

    if (visibleKneeAngles.length === 0) {
      return this._getResult()
    }

    const averageKneeAngle = visibleKneeAngles.reduce((sum, angle) => sum + angle, 0) / visibleKneeAngles.length

    const stateElapsed = Date.now() - this.stateStartTime

    if (this.state === 'standing') {
      if (averageKneeAngle < this.pattern.thresholds.kneeAngleDown && stateElapsed >= this.pattern.stateMinDuration) {
        this._transitionState('descent')
      }
    } else if (this.state === 'descent') {
      if (averageKneeAngle < this.pattern.thresholds.kneeAngleBottom) {
        this._transitionState('bottom')
      }
    } else if (this.state === 'bottom') {
      if (averageKneeAngle > this.pattern.thresholds.kneeAngleRise && stateElapsed >= this.pattern.stateMinDuration) {
        this._transitionState('ascent')
      }
    } else if (this.state === 'ascent') {
      if (averageKneeAngle > this.pattern.thresholds.kneeAngleUp && stateElapsed >= this.pattern.stateMinDuration) {
        this.repCount++
        this._transitionState('standing')
      }
    }

    return this._getResult()
  }

  /**
   * Push-up rep counting logic
   */
  _updatePushup(keypoints, feedback) {
    const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER]
    const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER]
    const leftElbow = keypoints[KEYPOINTS.LEFT_ELBOW]
    const rightElbow = keypoints[KEYPOINTS.RIGHT_ELBOW]
    const leftWrist = keypoints[KEYPOINTS.LEFT_WRIST]
    const rightWrist = keypoints[KEYPOINTS.RIGHT_WRIST]

    if (!this._pointsVisible([leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist])) {
      return this._getResult()
    }

    // Calculate average elbow angle
    const leftElbowAngle = calculateAngle([leftShoulder[0], leftShoulder[1]], [leftElbow[0], leftElbow[1]], [leftWrist[0], leftWrist[1]])
    const rightElbowAngle = calculateAngle([rightShoulder[0], rightShoulder[1]], [rightElbow[0], rightElbow[1]], [rightWrist[0], rightWrist[1]])
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2

    const stateElapsed = Date.now() - this.stateStartTime

    if (this.state === 'up') {
      if (avgElbowAngle < this.pattern.thresholds.elbowAngleDown && stateElapsed > this.pattern.stateMinDuration) {
        this._transitionState('descent')
      }
    } else if (this.state === 'descent') {
      if (avgElbowAngle < 70) {
        this._transitionState('down')
      }
    } else if (this.state === 'down') {
      if (avgElbowAngle > 80 && stateElapsed > this.pattern.stateMinDuration) {
        this._transitionState('ascent')
      }
    } else if (this.state === 'ascent') {
      if (avgElbowAngle > this.pattern.thresholds.elbowAngleUp && stateElapsed > this.pattern.stateMinDuration) {
        this.repCount++
        this._transitionState('up')
      }
    }

    return this._getResult()
  }

  /**
   * Bicep Curl rep counting logic
   */
  _updateBicepCurl(keypoints, feedback) {
    const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER]
    const leftElbow = keypoints[KEYPOINTS.LEFT_ELBOW]
    const leftWrist = keypoints[KEYPOINTS.LEFT_WRIST]

    if (!this._pointsVisible([leftShoulder, leftElbow, leftWrist])) {
      return this._getResult()
    }

    const elbowAngle = calculateAngle([leftShoulder[0], leftShoulder[1]], [leftElbow[0], leftElbow[1]], [leftWrist[0], leftWrist[1]])
    const stateElapsed = Date.now() - this.stateStartTime

    if (this.state === 'down') {
      if (elbowAngle < this.pattern.thresholds.elbowAngleUp && stateElapsed > this.pattern.stateMinDuration) {
        this._transitionState('ascent')
      }
    } else if (this.state === 'ascent') {
      if (elbowAngle < this.pattern.thresholds.elbowAngleUp && stateElapsed > this.pattern.stateMinDuration) {
        this._transitionState('up')
      }
    } else if (this.state === 'up') {
      if (elbowAngle > this.pattern.thresholds.elbowAngleDown && stateElapsed > this.pattern.stateMinDuration) {
        this.repCount++
        this._transitionState('descent')
      }
    } else if (this.state === 'descent') {
      if (elbowAngle > 160 && stateElapsed > this.pattern.stateMinDuration) {
        this._transitionState('down')
      }
    }

    return this._getResult()
  }

  /**
   * Check form and provide feedback
   */
  _checkForm(keypoints) {
    const issues = []
    let message = 'Good form!'

    if (this.exerciseType === 'SQUAT') {
      const leftHip = keypoints[KEYPOINTS.LEFT_HIP]
      const rightHip = keypoints[KEYPOINTS.RIGHT_HIP]
      const leftKnee = keypoints[KEYPOINTS.LEFT_KNEE]
      const rightKnee = keypoints[KEYPOINTS.RIGHT_KNEE]
      const leftAnkle = keypoints[KEYPOINTS.LEFT_ANKLE]
      const rightAnkle = keypoints[KEYPOINTS.RIGHT_ANKLE]

      // Check if knees are caving inward
      if (leftAnkle[0] < leftKnee[0] || rightAnkle[0] > rightKnee[0]) {
        issues.push('Knees caving inward')
        message = '⚠️ Keep knees aligned over ankles'
      }

      // Check if heels lifting
      if (leftAnkle[1] > leftKnee[1] + 50 || rightAnkle[1] > rightKnee[1] + 50) {
        issues.push('Heels lifting off ground')
        message = '⚠️ Keep heels on ground'
      }

      // Check back angle
      if (this.state === 'bottom') {
        const torsoAngle = calculateAngle([leftHip[0], leftHip[1]], [leftKnee[0], leftKnee[1]], [leftAnkle[0], leftAnkle[1]])
        if (torsoAngle > this.pattern.thresholds.torsoAngle) {
          issues.push('Leaning too far forward')
          message = '⚠️ Keep torso upright'
        }
      }
    } else if (this.exerciseType === 'PUSHUP') {
      const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER]
      const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER]
      const leftHip = keypoints[KEYPOINTS.LEFT_HIP]
      const rightHip = keypoints[KEYPOINTS.RIGHT_HIP]

      // Check body alignment
      const shoulderHipDist = Math.abs(leftShoulder[1] - leftHip[1])
      if (shoulderHipDist > 50) {
        issues.push('Body not aligned (hips sagging)')
        message = '⚠️ Keep body straight'
      }
    } else if (this.exerciseType === 'BICEP_CURL') {
      const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER]
      const leftElbow = keypoints[KEYPOINTS.LEFT_ELBOW]

      // Check elbow stays at side
      const elbowDisplacement = Math.abs(leftElbow[0] - leftShoulder[0])
      if (elbowDisplacement > 30) {
        issues.push('Elbow moving away from body')
        message = '⚠️ Keep elbow at side'
      }
    }

    return { issues, message }
  }

  /**
   * Check if points are visible (confidence > threshold)
   */
  _pointsVisible(points, confidenceThreshold = 0.3) {
    return points.every(p => p && p.length >= 3 && p[2] >= confidenceThreshold)
  }

  /**
   * Transition to new state
   */
  _transitionState(newState) {
    this.state = newState
    this.stateStartTime = Date.now()
  }

  /**
   * Get current result object
   */
  _getResult() {
    return {
      repCount: this.repCount,
      setCount: this.setCount,
      state: this.state,
      formIssues: this.formIssues,
      feedback: this.formIssues.length > 0 ? this.formIssues[0] : 'Good form!',
    }
  }

  /**
   * Reset counter
   */
  reset() {
    this.state = this.pattern.states[0]
    this.repCount = 0
    this.setCount = 0
    this.formIssues = []
  }

  /**
   * Complete set and increment set count
   */
  completeSet() {
    this.setCount++
    this.repCount = 0
    this.state = this.pattern.states[0]
  }
}

export default RepCounter
