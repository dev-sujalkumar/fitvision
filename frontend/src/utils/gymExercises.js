/**
 * FitVision AI — Gym Exercise Detection & Biomechanical Rep Engine
 * Handles joint angle calculations, state transitions, ROM tracking,
 * form correction, and anatomical framing gating.
 *
 * Supported Exercises:
 * 1. SQUAT (Knees, Hips, Core)
 * 2. PUSHUP (Chest, Shoulders, Triceps)
 * 3. BICEP_CURL (Biceps, Forearms)
 * 4. JUMPING_JACKS (Cardio, Full Body)
 * 5. LUNGE (Quads, Glutes, Hamstrings)
 * 6. SHOULDER_PRESS (Deltoids, Triceps)
 * 7. LATERAL_RAISE (Lateral Deltoids)
 * 8. PLANK (Core Isometric Hold)
 * 9. CRUNCHES (Abdominals)
 * 10. HIGH_KNEES (Cardio, Hip Flexors)
 */

/**
 * Calculate angle between three points (in degrees)
 * @param {Array} a - Point A [x, y]
 * @param {Array} b - Point B (vertex) [x, y]
 * @param {Array} c - Point C [x, y]
 * @returns {number} Angle in degrees (0-180)
 */
export const calculateAngle = (a, b, c) => {
  if (!a || !b || !c) return 0;
  const ax = a[0] - b[0];
  const ay = a[1] - b[1];
  const cx = c[0] - b[0];
  const cy = c[1] - b[1];

  const dotProduct = ax * cx + ay * cy;
  const magnitudeA = Math.sqrt(ax * ax + ay * ay);
  const magnitudeC = Math.sqrt(cx * cx + cy * cy);

  if (magnitudeA === 0 || magnitudeC === 0) return 0;

  const cosAngle = dotProduct / (magnitudeA * magnitudeC);
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
  const angleRadians = Math.acos(clampedCosAngle);
  const angleDegrees = (angleRadians * 180) / Math.PI;

  return Math.round(angleDegrees);
};

/**
 * Get distance between two points
 */
export const getDistance = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
};

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
};

/**
 * Exercise Categories & Filter Tabs
 */
export const GYM_CATEGORIES = [
  { id: 'all', label: 'All Exercises', icon: '⚡' },
  { id: 'legs', label: 'Legs & Glutes', icon: '🦵' },
  { id: 'upper', label: 'Upper Body', icon: '💪' },
  { id: 'core', label: 'Core & Cardio', icon: '🔥' },
];

/**
 * Complete Exercise Patterns & Biomechanical Thresholds
 */
export const EXERCISE_PATTERNS = {
  SQUAT: {
    id: 'SQUAT',
    name: 'Squat',
    category: 'legs',
    difficulty: 'Beginner',
    caloriesPerRep: 0.32,
    targetMuscle: 'Quads, Glutes & Core',
    icon: '🏋️',
    states: ['standing', 'descent', 'bottom', 'ascent'],
    thresholds: {
      kneeAngleDown: 150,
      kneeAngleBottom: 115,
      kneeAngleRise: 135,
      kneeAngleUp: 158,
    },
    countAt: 'ascent',
    stateMinDuration: 100,
    activeJoint: 'Knees',
    targetRom: 'Knees < 105°',
  },
  PUSHUP: {
    id: 'PUSHUP',
    name: 'Push-up',
    category: 'upper',
    difficulty: 'Intermediate',
    caloriesPerRep: 0.38,
    targetMuscle: 'Chest, Triceps & Core',
    icon: '🧘',
    states: ['up', 'descent', 'down', 'ascent'],
    thresholds: {
      elbowAngleDown: 85,
      elbowAngleUp: 155,
    },
    countAt: 'ascent',
    stateMinDuration: 200,
    activeJoint: 'Elbows',
    targetRom: 'Elbows < 85°',
  },
  BICEP_CURL: {
    id: 'BICEP_CURL',
    name: 'Bicep Curl',
    category: 'upper',
    difficulty: 'Beginner',
    caloriesPerRep: 0.22,
    targetMuscle: 'Biceps & Forearms',
    icon: '💪',
    states: ['down', 'ascent', 'up', 'descent'],
    thresholds: {
      elbowAngleDown: 160,
      elbowAngleUp: 50,
    },
    countAt: 'up',
    stateMinDuration: 180,
    activeJoint: 'Elbows',
    targetRom: 'Elbows < 50°',
  },
  JUMPING_JACKS: {
    id: 'JUMPING_JACKS',
    name: 'Jumping Jacks',
    category: 'core',
    difficulty: 'Beginner',
    caloriesPerRep: 0.28,
    targetMuscle: 'Full Body Cardio & Calves',
    icon: '⭐',
    states: ['closed', 'open'],
    thresholds: {
      armAbductionOpen: 135,
      armAbductionClosed: 40,
    },
    countAt: 'closed',
    stateMinDuration: 150,
    activeJoint: 'Shoulders & Legs',
    targetRom: 'Arms Overhead (>135°)',
  },
  LUNGE: {
    id: 'LUNGE',
    name: 'Forward Lunge',
    category: 'legs',
    difficulty: 'Intermediate',
    caloriesPerRep: 0.35,
    targetMuscle: 'Quadriceps, Glutes & Hamstrings',
    icon: '🚶',
    states: ['standing', 'lunge_deep', 'returning'],
    thresholds: {
      frontKneeDeep: 105,
      frontKneeStand: 155,
    },
    countAt: 'returning',
    stateMinDuration: 180,
    activeJoint: 'Front Knee',
    targetRom: 'Front Knee ~90°',
  },
  SHOULDER_PRESS: {
    id: 'SHOULDER_PRESS',
    name: 'Overhead Press',
    category: 'upper',
    difficulty: 'Intermediate',
    caloriesPerRep: 0.34,
    targetMuscle: 'Deltoids, Upper Traps & Triceps',
    icon: '🏋️‍♂️',
    states: ['racked', 'overhead'],
    thresholds: {
      elbowAngleRacked: 85,
      elbowAngleOverhead: 155,
    },
    countAt: 'overhead',
    stateMinDuration: 200,
    activeJoint: 'Elbows',
    targetRom: 'Full Lockout (>155°)',
  },
  LATERAL_RAISE: {
    id: 'LATERAL_RAISE',
    name: 'Lateral Raise',
    category: 'upper',
    difficulty: 'Beginner',
    caloriesPerRep: 0.24,
    targetMuscle: 'Side Deltoids & Shoulders',
    icon: '🦅',
    states: ['down', 'raised'],
    thresholds: {
      shoulderAngleDown: 30,
      shoulderAngleRaised: 75,
    },
    countAt: 'raised',
    stateMinDuration: 200,
    activeJoint: 'Shoulders',
    targetRom: 'Parallel with Shoulders (~80°)',
  },
  PLANK: {
    id: 'PLANK',
    name: 'Plank Hold',
    category: 'core',
    difficulty: 'Beginner',
    caloriesPerRep: 0.15,
    targetMuscle: 'Transverse Abdominis & Lower Back',
    icon: '🪵',
    isIsometric: true,
    states: ['holding', 'sagging', 'rest'],
    thresholds: {
      torsoHipAngleMin: 145,
    },
    countAt: 'holding',
    stateMinDuration: 1000,
    activeJoint: 'Spine & Hips',
    targetRom: 'Rigid Straight Spine',
  },
  CRUNCHES: {
    id: 'CRUNCHES',
    name: 'Core Crunches',
    category: 'core',
    difficulty: 'Beginner',
    caloriesPerRep: 0.25,
    targetMuscle: 'Rectus Abdominis (Abs)',
    icon: '🔥',
    states: ['flat', 'contracted'],
    thresholds: {
      hipTorsoAngleFlat: 150,
      hipTorsoAngleCrunch: 120,
    },
    countAt: 'flat',
    stateMinDuration: 200,
    activeJoint: 'Torso Flexion',
    targetRom: 'Shoulders Lifted Off Mat',
  },
  HIGH_KNEES: {
    id: 'HIGH_KNEES',
    name: 'High Knees',
    category: 'core',
    difficulty: 'Beginner',
    caloriesPerRep: 0.20,
    targetMuscle: 'Hip Flexors, Calves & Cardio',
    icon: '🏃',
    states: ['ground', 'knee_lift'],
    thresholds: {
      hipKneeLiftAngle: 95,
      hipKneeGroundAngle: 155,
    },
    countAt: 'ground',
    stateMinDuration: 120,
    activeJoint: 'Hip Flexion',
    targetRom: 'Knee Above Hip Height',
  },
};

/**
 * Rich Educational Form Guides & Biometrics
 */
export const EXERCISE_GUIDES = {
  SQUAT: {
    title: 'Squat Mastery',
    focus: 'Glutes, quadriceps, and core stabilization',
    summary: 'Stand tall with feet shoulder-width apart. Hinge at hips and bend knees until thighs are parallel to the floor.',
    cues: [
      'Keep knees tracking outwards over toes',
      'Brace core and maintain proud, upright chest',
      'Drive through heels upon ascending',
    ],
    mistakes: ['Knees caving inwards', 'Excessive forward torso tilt', 'Heels peeling off the floor'],
  },
  PUSHUP: {
    title: 'Push-up Alignment',
    focus: 'Pectorals, triceps, anterior deltoid, and rigid plank core',
    summary: 'Start in a locked plank, lower chest until elbows reach 90 degrees, then forcefully press floor away.',
    cues: [
      'Body creates one unbroken line from head to heels',
      'Elbows tucked at ~45-degree angle, not flared 90°',
      'Full lockout at top without sagging lower back',
    ],
    mistakes: ['Hips sagging towards mat', 'Flaring elbows excessively wide', 'Half reps without full chest depth'],
  },
  BICEP_CURL: {
    title: 'Strict Bicep Curl',
    focus: 'Biceps brachii and brachialis peak contraction',
    summary: 'Pin elbows firmly against your ribs. Curl weight upwards smoothly without swinging torso or shoulders.',
    cues: [
      'Elbows remained anchored at sides as a stationary hinge',
      'Squeeze biceps hard at the top contraction',
      'Lower under controlled 2-second eccentric tempo',
    ],
    mistakes: ['Swinging torso back for momentum', 'Elbows drifting forward or outward', 'Incomplete extension at bottom'],
  },
  JUMPING_JACKS: {
    title: 'Jumping Jacks Tempo',
    focus: 'Cardiovascular endurance, calves, and deltoids',
    summary: 'Jump feet outward slightly wider than shoulder-width while raising arms overhead into an expansive X-shape.',
    cues: [
      'Land softly on balls of feet with slight knee bend',
      'Touch hands or bring them near overhead',
      'Maintain continuous brisk rhythm',
    ],
    mistakes: ['Landing heavily on flat feet', 'Incomplete arm reach overhead'],
  },
  LUNGE: {
    title: 'Forward Lunge Depth',
    focus: 'Quadriceps, gluteus maximus, and balance',
    summary: 'Step forward into a deep lunge. Lower back knee until both front and back knees form 90-degree right angles.',
    cues: [
      'Front knee stacked directly over front ankle',
      'Torso remains tall and perpendicular to floor',
      'Press firmly through front heel to return',
    ],
    mistakes: ['Front knee drifting far past front toes', 'Torso leaning excessively forward', 'Stance too narrow causing wobble'],
  },
  SHOULDER_PRESS: {
    title: 'Overhead Press Lockout',
    focus: 'Deltoids, triceps, and upper chest stabilization',
    summary: 'Hold weight at shoulder level with forearms vertical. Press straight overhead until arms are fully extended.',
    cues: [
      'Maintain neutral spine without hyperextending lumbar',
      'Lock out arms directly overhead aligned with ears',
      'Lower weights to collarbone height under control',
    ],
    mistakes: ['Arching lower back excessively', 'Incomplete lockout', 'Pressing forward rather than directly vertical'],
  },
  LATERAL_RAISE: {
    title: 'Side Lateral Raise',
    focus: 'Lateral deltoid width and shoulder boulder cap',
    summary: 'Raise arms out to sides with slight elbow bend until arms are parallel to floor at shoulder height.',
    cues: [
      'Lead with elbows, keeping hands level or slightly lower',
      'Pause for a beat at parallel shoulder height',
      'Avoid shrugging traps towards ears',
    ],
    mistakes: ['Using swinging hip momentum', 'Raising arms way above shoulder height', 'Leading with hands rather than elbows'],
  },
  PLANK: {
    title: 'Plank Isometric Endurance',
    focus: 'Transverse abdominis, rectus abdominis, glutes & shoulders',
    summary: 'Support body on forearms and toes. Create a rigid horizontal bridge, maintaining tension throughout core.',
    cues: [
      'Squeeze glutes and tuck pelvis slightly',
      'Press floor away through forearms to fill shoulder blades',
      'Keep gaze down at hands to keep cervical spine neutral',
    ],
    mistakes: ['Hips sagging towards mat', 'Piking hips too high in air', 'Holding breath'],
  },
  CRUNCHES: {
    title: 'Controlled Core Crunches',
    focus: 'Rectus abdominis upper fibers and core compression',
    summary: 'Lie supine with knees bent. Contract abdominals to lift shoulder blades 3-4 inches off mat while exhaling.',
    cues: [
      'Lead with chest towards ceiling, do not pull on neck',
      'Hold peak contraction for 1 second at top',
      'Lower slowly, keeping constant tension in abs',
    ],
    mistakes: ['Yanking head and neck forward with hands', 'Using momentum instead of abdominal contraction'],
  },
  HIGH_KNEES: {
    title: 'High Knees Cadence',
    focus: 'Hip flexors, calves, cardiovascular conditioning',
    summary: 'Run in place, driving alternating knees up to waist height while pumping opposite arms actively.',
    cues: [
      'Drive knee up until thigh is parallel to floor',
      'Stay light and bouncy on the balls of feet',
      'Keep torso tall with slight forward athletic tilt',
    ],
    mistakes: ['Leaning too far back', 'Knees lifting only halfway'],
  },
};

/**
 * Check anatomical framing & limb visibility specifically for Gym exercises
 */
export const checkGymFraming = (keypoints, exerciseType) => {
  if (!keypoints || keypoints.length < 17) {
    return {
      isFramingValid: false,
      reason: 'Stand into camera view',
      visibleSummary: { head: false, torso: false, hips: false, knees: false, feet: false },
    };
  }

  const getScore = (idx) => {
    const kp = keypoints[idx];
    if (!kp) return 0;
    return kp[2] !== undefined ? kp[2] : (kp.score !== undefined ? kp.score : 0.85);
  };

  const hasHead = getScore(KEYPOINTS.NOSE) > 0.35 || getScore(KEYPOINTS.LEFT_EYE) > 0.35;
  const hasShoulders = getScore(KEYPOINTS.LEFT_SHOULDER) > 0.30 || getScore(KEYPOINTS.RIGHT_SHOULDER) > 0.30;
  const hasHips = getScore(KEYPOINTS.LEFT_HIP) > 0.40 || getScore(KEYPOINTS.RIGHT_HIP) > 0.40;
  const hasKnees = getScore(KEYPOINTS.LEFT_KNEE) > 0.36 || getScore(KEYPOINTS.RIGHT_KNEE) > 0.36;
  const hasAnkles = getScore(KEYPOINTS.LEFT_ANKLE) > 0.32 || getScore(KEYPOINTS.RIGHT_ANKLE) > 0.32;

  const visibleSummary = {
    head: hasHead,
    torso: hasShoulders,
    hips: hasHips,
    knees: hasKnees,
    feet: hasAnkles,
  };

  // Check if seated at desk (head/shoulders detected, but hips/knees absent)
  const isSeatedAtDesk = hasHead && hasShoulders && (!hasHips || (!hasKnees && !hasAnkles));

  const LOWER_BODY_EXERCISES = ['SQUAT', 'LUNGE', 'JUMPING_JACKS', 'HIGH_KNEES'];
  const UPPER_BODY_EXERCISES = ['PUSHUP', 'BICEP_CURL', 'SHOULDER_PRESS', 'LATERAL_RAISE'];

  if (LOWER_BODY_EXERCISES.includes(exerciseType)) {
    if (isSeatedAtDesk || !hasKnees || !hasHips) {
      return {
        isFramingValid: false,
        reason: `⚠️ Step back 6-8 ft: Show full legs and hips for ${EXERCISE_PATTERNS[exerciseType]?.name || 'Squats'}`,
        visibleSummary,
      };
    }
  } else if (UPPER_BODY_EXERCISES.includes(exerciseType)) {
    if (!hasShoulders) {
      return {
        isFramingValid: false,
        reason: '⚠️ Position camera so upper body and arms are clearly visible',
        visibleSummary,
      };
    }
  }

  return {
    isFramingValid: true,
    reason: 'Framing ready',
    visibleSummary,
  };
};

/**
 * Filter multi-person detections to pick the primary foreground user
 * Bounding box area & camera center proximity heuristic
 */
export const selectPrimaryForegroundPose = (poses, videoWidth = 640, videoHeight = 480) => {
  if (!poses || poses.length === 0) return null;
  if (poses.length === 1) return poses[0];

  let bestPose = poses[0];
  let bestScore = -1;

  const centerX = videoWidth / 2;
  const centerY = videoHeight / 2;

  poses.forEach((p) => {
    if (!p.keypoints || p.keypoints.length < 17) return;

    // Calculate torso bounding box
    const lSh = p.keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rSh = p.keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const lHip = p.keypoints[KEYPOINTS.LEFT_HIP];
    const rHip = p.keypoints[KEYPOINTS.RIGHT_HIP];

    const minX = Math.min(lSh?.x || 0, rSh?.x || 0, lHip?.x || 0, rHip?.x || 0);
    const maxX = Math.max(lSh?.x || 0, rSh?.x || 0, lHip?.x || 0, rHip?.x || 0);
    const minY = Math.min(lSh?.y || 0, rSh?.y || 0, lHip?.y || 0, rHip?.y || 0);
    const maxY = Math.max(lSh?.y || 0, rSh?.y || 0, lHip?.y || 0, rHip?.y || 0);

    const torsoArea = Math.max(10, (maxX - minX) * (maxY - minY));

    // Distance of torso center from camera center
    const torsoMidX = (minX + maxX) / 2;
    const torsoMidY = (minY + maxY) / 2;
    const distFromCenter = Math.sqrt((torsoMidX - centerX) ** 2 + (torsoMidY - centerY) ** 2);

    // Primary score: big area in foreground, penalized slightly by extreme off-center placement
    const score = torsoArea / (1 + distFromCenter * 0.002);

    if (score > bestScore) {
      bestScore = score;
      bestPose = p;
    }
  });

  return bestPose;
};

/**
 * Master Rep Counter State Machine
 * Calculates real-time Range of Motion (ROM), joint angles, tempo cadence, and form cues.
 */
export class RepCounter {
  constructor(exerciseType = 'SQUAT') {
    this.exerciseType = exerciseType;
    this.pattern = EXERCISE_PATTERNS[exerciseType] || EXERCISE_PATTERNS.SQUAT;
    this.state = this.pattern.states[0];
    this.repCount = 0;
    this.setCount = 0;
    this.cleanReps = 0;
    this.stateStartTime = Date.now();
    this.repStartTime = Date.now();
    this.lastRepCadence = 0; // seconds
    this.formIssues = [];
    this.currentAngle = 180;
    this.targetAngle = 90;
    this.rom = 0; // 0% - 100% range of motion
    this.holdTimer = 0; // for isometric holds like plank
  }

  /**
   * Update rep counter based on current keypoints
   * @param {Array} keypoints - 17 keypoints from MoveNet [x, y, score]
   * @returns {Object} telemetry result
   */
  update(keypoints) {
    const feedback = this._checkForm(keypoints);
    this.formIssues = feedback.issues;

    let result;
    switch (this.exerciseType) {
      case 'SQUAT':
        result = this._updateSquat(keypoints, feedback);
        break;
      case 'PUSHUP':
        result = this._updatePushup(keypoints, feedback);
        break;
      case 'BICEP_CURL':
        result = this._updateBicepCurl(keypoints, feedback);
        break;
      case 'JUMPING_JACKS':
        result = this._updateJumpingJacks(keypoints, feedback);
        break;
      case 'LUNGE':
        result = this._updateLunge(keypoints, feedback);
        break;
      case 'SHOULDER_PRESS':
        result = this._updateShoulderPress(keypoints, feedback);
        break;
      case 'LATERAL_RAISE':
        result = this._updateLateralRaise(keypoints, feedback);
        break;
      case 'PLANK':
        result = this._updatePlank(keypoints, feedback);
        break;
      case 'CRUNCHES':
        result = this._updateCrunches(keypoints, feedback);
        break;
      case 'HIGH_KNEES':
        result = this._updateHighKnees(keypoints, feedback);
        break;
      default:
        result = this._updateSquat(keypoints, feedback);
        break;
    }

    return result;
  }

  /**
   * Squat tracking
   */
  _updateSquat(keypoints, feedback) {
    const leftHip = keypoints[KEYPOINTS.LEFT_HIP];
    const rightHip = keypoints[KEYPOINTS.RIGHT_HIP];
    const leftKnee = keypoints[KEYPOINTS.LEFT_KNEE];
    const rightKnee = keypoints[KEYPOINTS.RIGHT_KNEE];
    const leftAnkle = keypoints[KEYPOINTS.LEFT_ANKLE];
    const rightAnkle = keypoints[KEYPOINTS.RIGHT_ANKLE];

    const visibleKneeAngles = [
      [leftHip, leftKnee, leftAnkle],
      [rightHip, rightKnee, rightAnkle],
    ]
      .filter((points) => this._pointsVisible(points))
      .map(([hip, knee, ankle]) => calculateAngle([hip[0], hip[1]], [knee[0], knee[1]], [ankle[0], ankle[1]]));

    if (visibleKneeAngles.length === 0) {
      return this._getResult();
    }

    const averageKneeAngle = Math.round(
      visibleKneeAngles.reduce((sum, angle) => sum + angle, 0) / visibleKneeAngles.length
    );
    this.currentAngle = averageKneeAngle;
    this.targetAngle = 100;

    // Calculate ROM: 175° is 0%, 100° is 100%
    const rawRom = ((175 - averageKneeAngle) / (175 - 100)) * 100;
    this.rom = Math.max(0, Math.min(100, Math.round(rawRom)));

    const stateElapsed = Date.now() - this.stateStartTime;

    if (this.state === 'standing') {
      if (averageKneeAngle < this.pattern.thresholds.kneeAngleDown && stateElapsed >= this.pattern.stateMinDuration) {
        this.repStartTime = Date.now();
        this._transitionState('descent');
      }
    } else if (this.state === 'descent') {
      if (averageKneeAngle < this.pattern.thresholds.kneeAngleBottom) {
        this._transitionState('bottom');
      }
    } else if (this.state === 'bottom') {
      if (averageKneeAngle > this.pattern.thresholds.kneeAngleRise && stateElapsed >= this.pattern.stateMinDuration) {
        this._transitionState('ascent');
      }
    } else if (this.state === 'ascent') {
      if (averageKneeAngle > this.pattern.thresholds.kneeAngleUp && stateElapsed >= this.pattern.stateMinDuration) {
        this.repCount++;
        if (this.formIssues.length === 0) this.cleanReps++;
        this.lastRepCadence = Math.round(((Date.now() - this.repStartTime) / 1000) * 10) / 10;
        this._transitionState('standing');
      }
    }

    return this._getResult();
  }

  /**
   * Push-up tracking
   */
  _updatePushup(keypoints, feedback) {
    const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const leftElbow = keypoints[KEYPOINTS.LEFT_ELBOW];
    const rightElbow = keypoints[KEYPOINTS.RIGHT_ELBOW];
    const leftWrist = keypoints[KEYPOINTS.LEFT_WRIST];
    const rightWrist = keypoints[KEYPOINTS.RIGHT_WRIST];

    const leftVisible = this._pointsVisible([leftShoulder, leftElbow, leftWrist]);
    const rightVisible = this._pointsVisible([rightShoulder, rightElbow, rightWrist]);

    if (!leftVisible && !rightVisible) {
      return this._getResult();
    }

    const angles = [];
    if (leftVisible) {
      angles.push(calculateAngle([leftShoulder[0], leftShoulder[1]], [leftElbow[0], leftElbow[1]], [leftWrist[0], leftWrist[1]]));
    }
    if (rightVisible) {
      angles.push(calculateAngle([rightShoulder[0], rightShoulder[1]], [rightElbow[0], rightElbow[1]], [rightWrist[0], rightWrist[1]]));
    }
    const avgElbowAngle = Math.round(angles.reduce((sum, a) => sum + a, 0) / angles.length);
    this.currentAngle = avgElbowAngle;
    this.targetAngle = 80;

    // ROM: 160° is 0%, 80° is 100%
    const rawRom = ((160 - avgElbowAngle) / (160 - 80)) * 100;
    this.rom = Math.max(0, Math.min(100, Math.round(rawRom)));

    const stateElapsed = Date.now() - this.stateStartTime;

    if (this.state === 'up') {
      if (avgElbowAngle < this.pattern.thresholds.elbowAngleDown && stateElapsed > this.pattern.stateMinDuration) {
        this.repStartTime = Date.now();
        this._transitionState('descent');
      }
    } else if (this.state === 'descent') {
      if (avgElbowAngle < 75) {
        this._transitionState('down');
      }
    } else if (this.state === 'down') {
      if (avgElbowAngle > 85 && stateElapsed > this.pattern.stateMinDuration) {
        this._transitionState('ascent');
      }
    } else if (this.state === 'ascent') {
      if (avgElbowAngle > this.pattern.thresholds.elbowAngleUp && stateElapsed > this.pattern.stateMinDuration) {
        this.repCount++;
        if (this.formIssues.length === 0) this.cleanReps++;
        this.lastRepCadence = Math.round(((Date.now() - this.repStartTime) / 1000) * 10) / 10;
        this._transitionState('up');
      }
    }

    return this._getResult();
  }

  /**
   * Bicep Curl tracking
   */
  _updateBicepCurl(keypoints, feedback) {
    const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const leftElbow = keypoints[KEYPOINTS.LEFT_ELBOW];
    const rightElbow = keypoints[KEYPOINTS.RIGHT_ELBOW];
    const leftWrist = keypoints[KEYPOINTS.LEFT_WRIST];
    const rightWrist = keypoints[KEYPOINTS.RIGHT_WRIST];

    const leftVisible = this._pointsVisible([leftShoulder, leftElbow, leftWrist]);
    const rightVisible = this._pointsVisible([rightShoulder, rightElbow, rightWrist]);

    if (!leftVisible && !rightVisible) {
      return this._getResult();
    }

    let elbowAngle;
    if (leftVisible && rightVisible) {
      const leftAngle = calculateAngle([leftShoulder[0], leftShoulder[1]], [leftElbow[0], leftElbow[1]], [leftWrist[0], leftWrist[1]]);
      const rightAngle = calculateAngle([rightShoulder[0], rightShoulder[1]], [rightElbow[0], rightElbow[1]], [rightWrist[0], rightWrist[1]]);
      elbowAngle = Math.min(leftAngle, rightAngle);
    } else if (leftVisible) {
      elbowAngle = calculateAngle([leftShoulder[0], leftShoulder[1]], [leftElbow[0], leftElbow[1]], [leftWrist[0], leftWrist[1]]);
    } else {
      elbowAngle = calculateAngle([rightShoulder[0], rightShoulder[1]], [rightElbow[0], rightElbow[1]], [rightWrist[0], rightWrist[1]]);
    }

    this.currentAngle = Math.round(elbowAngle);
    this.targetAngle = 45;

    // ROM: 165° is 0%, 45° is 100%
    const rawRom = ((165 - elbowAngle) / (165 - 45)) * 100;
    this.rom = Math.max(0, Math.min(100, Math.round(rawRom)));

    const stateElapsed = Date.now() - this.stateStartTime;

    if (this.state === 'down') {
      if (elbowAngle < 135 && stateElapsed > this.pattern.stateMinDuration) {
        this.repStartTime = Date.now();
        this._transitionState('ascent');
      }
    } else if (this.state === 'ascent') {
      if (elbowAngle < this.pattern.thresholds.elbowAngleUp && stateElapsed > this.pattern.stateMinDuration) {
        this._transitionState('up');
      }
    } else if (this.state === 'up') {
      if (elbowAngle > 80 && stateElapsed > this.pattern.stateMinDuration) {
        this.repCount++;
        if (this.formIssues.length === 0) this.cleanReps++;
        this.lastRepCadence = Math.round(((Date.now() - this.repStartTime) / 1000) * 10) / 10;
        this._transitionState('descent');
      }
    } else if (this.state === 'descent') {
      if (elbowAngle > this.pattern.thresholds.elbowAngleDown && stateElapsed > this.pattern.stateMinDuration) {
        this._transitionState('down');
      }
    }

    return this._getResult();
  }

  /**
   * Jumping Jacks tracking
   */
  _updateJumpingJacks(keypoints, feedback) {
    const lSh = keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rSh = keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const lHip = keypoints[KEYPOINTS.LEFT_HIP];
    const rHip = keypoints[KEYPOINTS.RIGHT_HIP];
    const lEl = keypoints[KEYPOINTS.LEFT_ELBOW];
    const rEl = keypoints[KEYPOINTS.RIGHT_ELBOW];

    if (!this._pointsVisible([lSh, rSh, lHip, rHip])) {
      return this._getResult();
    }

    const leftArmAngle = calculateAngle([lHip[0], lHip[1]], [lSh[0], lSh[1]], [lEl[0], lEl[1]]);
    const rightArmAngle = calculateAngle([rHip[0], rHip[1]], [rSh[0], rSh[1]], [rEl[0], rEl[1]]);
    const avgArmAngle = Math.round((leftArmAngle + rightArmAngle) / 2);

    this.currentAngle = avgArmAngle;
    this.targetAngle = 140;

    // ROM: 35° is 0%, 140° is 100%
    const rawRom = ((avgArmAngle - 35) / (140 - 35)) * 100;
    this.rom = Math.max(0, Math.min(100, Math.round(rawRom)));

    const stateElapsed = Date.now() - this.stateStartTime;

    if (this.state === 'closed') {
      if (avgArmAngle > 80 && stateElapsed > this.pattern.stateMinDuration) {
        this.repStartTime = Date.now();
        this._transitionState('open');
      }
    } else if (this.state === 'open') {
      if (avgArmAngle < 45 && stateElapsed > this.pattern.stateMinDuration) {
        this.repCount++;
        if (this.formIssues.length === 0) this.cleanReps++;
        this.lastRepCadence = Math.round(((Date.now() - this.repStartTime) / 1000) * 10) / 10;
        this._transitionState('closed');
      }
    }

    return this._getResult();
  }

  /**
   * Forward Lunge tracking
   */
  _updateLunge(keypoints, feedback) {
    const lHip = keypoints[KEYPOINTS.LEFT_HIP];
    const rHip = keypoints[KEYPOINTS.RIGHT_HIP];
    const lKnee = keypoints[KEYPOINTS.LEFT_KNEE];
    const rKnee = keypoints[KEYPOINTS.RIGHT_KNEE];
    const lAnk = keypoints[KEYPOINTS.LEFT_ANKLE];
    const rAnk = keypoints[KEYPOINTS.RIGHT_ANKLE];

    const lAngle = calculateAngle([lHip[0], lHip[1]], [lKnee[0], lKnee[1]], [lAnk[0], lAnk[1]]);
    const rAngle = calculateAngle([rHip[0], rHip[1]], [rKnee[0], rKnee[1]], [rAnk[0], rAnk[1]]);

    const activeKneeAngle = Math.min(lAngle, rAngle);
    this.currentAngle = activeKneeAngle;
    this.targetAngle = 90;

    const rawRom = ((170 - activeKneeAngle) / (170 - 90)) * 100;
    this.rom = Math.max(0, Math.min(100, Math.round(rawRom)));

    const stateElapsed = Date.now() - this.stateStartTime;

    if (this.state === 'standing') {
      if (activeKneeAngle < 135 && stateElapsed > this.pattern.stateMinDuration) {
        this.repStartTime = Date.now();
        this._transitionState('lunge_deep');
      }
    } else if (this.state === 'lunge_deep') {
      if (activeKneeAngle < 105) {
        this._transitionState('returning');
      }
    } else if (this.state === 'returning') {
      if (activeKneeAngle > 155 && stateElapsed > this.pattern.stateMinDuration) {
        this.repCount++;
        if (this.formIssues.length === 0) this.cleanReps++;
        this.lastRepCadence = Math.round(((Date.now() - this.repStartTime) / 1000) * 10) / 10;
        this._transitionState('standing');
      }
    }

    return this._getResult();
  }

  /**
   * Overhead Shoulder Press tracking
   */
  _updateShoulderPress(keypoints, feedback) {
    const lSh = keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rSh = keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const lEl = keypoints[KEYPOINTS.LEFT_ELBOW];
    const rEl = keypoints[KEYPOINTS.RIGHT_ELBOW];
    const lWr = keypoints[KEYPOINTS.LEFT_WRIST];
    const rWr = keypoints[KEYPOINTS.RIGHT_WRIST];

    const lAngle = calculateAngle([lSh[0], lSh[1]], [lEl[0], lEl[1]], [lWr[0], lWr[1]]);
    const rAngle = calculateAngle([rSh[0], rSh[1]], [rEl[0], rEl[1]], [rWr[0], rWr[1]]);

    const avgElbow = Math.round((lAngle + rAngle) / 2);
    this.currentAngle = avgElbow;
    this.targetAngle = 160;

    const rawRom = ((avgElbow - 75) / (160 - 75)) * 100;
    this.rom = Math.max(0, Math.min(100, Math.round(rawRom)));

    const stateElapsed = Date.now() - this.stateStartTime;

    if (this.state === 'racked') {
      if (avgElbow > 115 && stateElapsed > this.pattern.stateMinDuration) {
        this.repStartTime = Date.now();
        this._transitionState('overhead');
      }
    } else if (this.state === 'overhead') {
      if (avgElbow < 95 && stateElapsed > this.pattern.stateMinDuration) {
        this.repCount++;
        if (this.formIssues.length === 0) this.cleanReps++;
        this.lastRepCadence = Math.round(((Date.now() - this.repStartTime) / 1000) * 10) / 10;
        this._transitionState('racked');
      }
    }

    return this._getResult();
  }

  /**
   * Lateral Raise tracking
   */
  _updateLateralRaise(keypoints, feedback) {
    const lSh = keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rSh = keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const lHip = keypoints[KEYPOINTS.LEFT_HIP];
    const rHip = keypoints[KEYPOINTS.RIGHT_HIP];
    const lEl = keypoints[KEYPOINTS.LEFT_ELBOW];
    const rEl = keypoints[KEYPOINTS.RIGHT_ELBOW];

    const lAngle = calculateAngle([lHip[0], lHip[1]], [lSh[0], lSh[1]], [lEl[0], lEl[1]]);
    const rAngle = calculateAngle([rHip[0], rHip[1]], [rSh[0], rSh[1]], [rEl[0], rEl[1]]);

    const avgAngle = Math.round((lAngle + rAngle) / 2);
    this.currentAngle = avgAngle;
    this.targetAngle = 80;

    const rawRom = ((avgAngle - 20) / (80 - 20)) * 100;
    this.rom = Math.max(0, Math.min(100, Math.round(rawRom)));

    const stateElapsed = Date.now() - this.stateStartTime;

    if (this.state === 'down') {
      if (avgAngle > 55 && stateElapsed > this.pattern.stateMinDuration) {
        this.repStartTime = Date.now();
        this._transitionState('raised');
      }
    } else if (this.state === 'raised') {
      if (avgAngle < 35 && stateElapsed > this.pattern.stateMinDuration) {
        this.repCount++;
        if (this.formIssues.length === 0) this.cleanReps++;
        this.lastRepCadence = Math.round(((Date.now() - this.repStartTime) / 1000) * 10) / 10;
        this._transitionState('down');
      }
    }

    return this._getResult();
  }

  /**
   * Plank Isometric Hold tracking
   */
  _updatePlank(keypoints, feedback) {
    const lSh = keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rSh = keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const lHip = keypoints[KEYPOINTS.LEFT_HIP];
    const rHip = keypoints[KEYPOINTS.RIGHT_HIP];
    const lAnk = keypoints[KEYPOINTS.LEFT_ANKLE];
    const rAnk = keypoints[KEYPOINTS.RIGHT_ANKLE];

    const lAngle = calculateAngle([lSh[0], lSh[1]], [lHip[0], lHip[1]], [lAnk[0], lAnk[1]]);
    const rAngle = calculateAngle([rSh[0], rSh[1]], [rHip[0], rHip[1]], [rAnk[0], rAnk[1]]);
    const avgSpine = Math.round((lAngle + rAngle) / 2);

    this.currentAngle = avgSpine;
    this.targetAngle = 175;
    this.rom = Math.max(0, Math.min(100, Math.round(((avgSpine - 130) / 45) * 100)));

    if (avgSpine > 150) {
      this.state = 'holding';
      this.repCount = Math.floor((Date.now() - this.stateStartTime) / 1000); // reps = hold seconds
    } else {
      this.state = 'sagging';
    }

    return this._getResult();
  }

  /**
   * Crunches tracking
   */
  _updateCrunches(keypoints, feedback) {
    const lSh = keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rSh = keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const lHip = keypoints[KEYPOINTS.LEFT_HIP];
    const rHip = keypoints[KEYPOINTS.RIGHT_HIP];
    const lKnee = keypoints[KEYPOINTS.LEFT_KNEE];
    const rKnee = keypoints[KEYPOINTS.RIGHT_KNEE];

    const lAngle = calculateAngle([lSh[0], lSh[1]], [lHip[0], lHip[1]], [lKnee[0], lKnee[1]]);
    const rAngle = calculateAngle([rSh[0], rSh[1]], [rHip[0], rHip[1]], [rKnee[0], rKnee[1]]);
    const avgCrunch = Math.round((lAngle + rAngle) / 2);

    this.currentAngle = avgCrunch;
    this.targetAngle = 110;
    this.rom = Math.max(0, Math.min(100, Math.round(((150 - avgCrunch) / (150 - 110)) * 100)));

    const stateElapsed = Date.now() - this.stateStartTime;

    if (this.state === 'flat') {
      if (avgCrunch < 135 && stateElapsed > this.pattern.stateMinDuration) {
        this.repStartTime = Date.now();
        this._transitionState('contracted');
      }
    } else if (this.state === 'contracted') {
      if (avgCrunch > 145 && stateElapsed > this.pattern.stateMinDuration) {
        this.repCount++;
        if (this.formIssues.length === 0) this.cleanReps++;
        this.lastRepCadence = Math.round(((Date.now() - this.repStartTime) / 1000) * 10) / 10;
        this._transitionState('flat');
      }
    }

    return this._getResult();
  }

  /**
   * High Knees tracking
   */
  _updateHighKnees(keypoints, feedback) {
    const lSh = keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rSh = keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const lHip = keypoints[KEYPOINTS.LEFT_HIP];
    const rHip = keypoints[KEYPOINTS.RIGHT_HIP];
    const lKnee = keypoints[KEYPOINTS.LEFT_KNEE];
    const rKnee = keypoints[KEYPOINTS.RIGHT_KNEE];

    const lAngle = calculateAngle([lSh[0], lSh[1]], [lHip[0], lHip[1]], [lKnee[0], lKnee[1]]);
    const rAngle = calculateAngle([rSh[0], rSh[1]], [rHip[0], rHip[1]], [rKnee[0], rKnee[1]]);

    const highestLiftAngle = Math.min(lAngle, rAngle);
    this.currentAngle = highestLiftAngle;
    this.targetAngle = 90;
    this.rom = Math.max(0, Math.min(100, Math.round(((165 - highestLiftAngle) / (165 - 90)) * 100)));

    const stateElapsed = Date.now() - this.stateStartTime;

    if (this.state === 'ground') {
      if (highestLiftAngle < 115 && stateElapsed > this.pattern.stateMinDuration) {
        this.repStartTime = Date.now();
        this._transitionState('knee_lift');
      }
    } else if (this.state === 'knee_lift') {
      if (highestLiftAngle > 145 && stateElapsed > this.pattern.stateMinDuration) {
        this.repCount++;
        if (this.formIssues.length === 0) this.cleanReps++;
        this.lastRepCadence = Math.round(((Date.now() - this.repStartTime) / 1000) * 10) / 10;
        this._transitionState('ground');
      }
    }

    return this._getResult();
  }

  /**
   * Check form and provide biomechanical feedback
   */
  _checkForm(keypoints) {
    const issues = [];
    let message = 'Good form!';

    if (this.exerciseType === 'SQUAT') {
      const leftKnee = keypoints[KEYPOINTS.LEFT_KNEE];
      const rightKnee = keypoints[KEYPOINTS.RIGHT_KNEE];
      const leftAnkle = keypoints[KEYPOINTS.LEFT_ANKLE];
      const rightAnkle = keypoints[KEYPOINTS.RIGHT_ANKLE];
      const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
      const leftHip = keypoints[KEYPOINTS.LEFT_HIP];

      // Check if knees are caving inward
      if (this._pointsVisible([leftKnee, rightKnee, leftAnkle, rightAnkle])) {
        if (leftAnkle[0] < leftKnee[0] || rightAnkle[0] > rightKnee[0]) {
          issues.push('Knees caving inward');
          message = '⚠️ Push knees out in line with toes';
        }
      }

      // Check torso forward lean
      if (this.state === 'bottom') {
        const torsoAngle = calculateAngle([leftShoulder[0], leftShoulder[1]], [leftHip[0], leftHip[1]], [leftKnee[0], leftKnee[1]]);
        if (torsoAngle < 45) {
          issues.push('Excessive torso forward lean');
          message = '⚠️ Keep chest proud and upright';
        }
      }
    } else if (this.exerciseType === 'PUSHUP') {
      const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
      const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];
      const leftHip = keypoints[KEYPOINTS.LEFT_HIP];
      const rightHip = keypoints[KEYPOINTS.RIGHT_HIP];

      const leftSide = this._pointsVisible([leftShoulder, leftHip]);
      const rightSide = this._pointsVisible([rightShoulder, rightHip]);
      let diff = 0;
      if (leftSide) diff = Math.abs(leftShoulder[1] - leftHip[1]);
      else if (rightSide) diff = Math.abs(rightShoulder[1] - rightHip[1]);

      if ((leftSide || rightSide) && diff > 75) {
        issues.push('Hips sagging below shoulder plane');
        message = '⚠️ Squeeze glutes and maintain rigid plank';
      }
    } else if (this.exerciseType === 'BICEP_CURL') {
      const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
      const leftElbow = keypoints[KEYPOINTS.LEFT_ELBOW];
      if (this._pointsVisible([leftShoulder, leftElbow])) {
        const elbowDisplacement = Math.abs(leftElbow[0] - leftShoulder[0]);
        if (elbowDisplacement > 48) {
          issues.push('Elbow flaring away from ribs');
          message = '⚠️ Pin elbows close to your torso';
        }
      }
    }

    return { issues, message };
  }

  /**
   * Check if points are visible (confidence > threshold)
   */
  _pointsVisible(points, confidenceThreshold = 0.25) {
    if (!points || points.length === 0) return false;
    return points.every((p) => p && p.length >= 3 && p[2] >= confidenceThreshold);
  }

  /**
   * Transition to new state
   */
  _transitionState(newState) {
    this.state = newState;
    this.stateStartTime = Date.now();
  }

  /**
   * Get current result object
   */
  _getResult() {
    return {
      repCount: this.repCount,
      setCount: this.setCount,
      cleanReps: this.cleanReps,
      state: this.state,
      formIssues: this.formIssues,
      feedback: this.formIssues.length > 0 ? this.formIssues[0] : 'Good form!',
      currentAngle: this.currentAngle,
      targetAngle: this.targetAngle,
      rom: this.rom,
      lastRepCadence: this.lastRepCadence,
    };
  }

  /**
   * Reset counter
   */
  reset() {
    this.state = this.pattern.states[0];
    this.repCount = 0;
    this.setCount = 0;
    this.cleanReps = 0;
    this.formIssues = [];
    this.currentAngle = 180;
    this.rom = 0;
  }

  /**
   * Complete set and increment set count
   */
  completeSet() {
    this.setCount++;
    this.repCount = 0;
    this.state = this.pattern.states[0];
  }
}

export default RepCounter;
