/**
 * FitVision AI — Master Yoga & Movement Pose Library (Core Photographic Poses)
 * Retains the 8 foundational yoga movement disciplines that possess authentic,
 * high-definition photographic references in the frontend studio.
 *
 * Poses:
 * 1. Tree (Vrikshasana) - Balance
 * 2. Chair (Utkatasana) - Standing
 * 3. Warrior I (Virabhadrasana I) - Standing
 * 4. Warrior II (Virabhadrasana II) - Standing
 * 5. Downward Dog (Adho Mukha Svanasana) - Inversion
 * 6. Cobra (Bhujangasana) - Backbend
 * 7. Triangle (Trikonasana) - Standing
 * 8. Shoulderstand (Sarvangasana) - Inversion
 */

export const YOGA_CATEGORIES = [
  { id: 'all', label: 'All Poses', icon: '✨' },
  { id: 'standing', label: 'Standing', icon: '🧍' },
  { id: 'balance', label: 'Balance', icon: '⚖️' },
  { id: 'backbend', label: 'Backbends', icon: '🏹' },
  { id: 'inversion', label: 'Inversions', icon: '🔄' },
];

export const YOGA_POSES = [
  {
    id: 'Tree',
    name: 'Tree Pose',
    sanskrit: 'Vrikshasana',
    category: 'balance',
    difficulty: 'Beginner',
    caloriesPerMin: 4.2,
    targetMuscles: ['Calves', 'Ankles', 'Thighs', 'Core'],
    focus: 'Balance, focus, hip external rotation, and grounding stability.',
    instructions: [
      'Begin in Mountain Pose with both feet grounded and spine neutral.',
      'Shift your weight onto your left foot, grounding firmly into the floor.',
      'Bend your right knee and place the sole of your right foot on your left inner calf or inner thigh (never directly on the knee joint).',
      'Bring hands together in Anjali Mudra (prayer position) at your heart or extend them overhead.',
      'Fix your gaze on an unmoving focal point (Drishti) 4 to 5 feet in front of you.',
      'Hold steadily for 20-60 seconds, breathe smoothly, then switch sides.',
    ],
    alignmentCues: [
      'Standing leg fully extended without locking knee',
      'Bent knee turned outward at 90 degrees',
      'Hips level and squared forward',
      'Chest open, shoulders drawn away from ears',
    ],
    commonMistakes: [
      'Pressing foot directly against side of standing knee',
      'Tilting pelvis to one side instead of keeping hips level',
      'Holding breath or tensing shoulders',
    ],
    biometrics: {
      standingLegMinAngle: 165,
      bentKneeMaxAngle: 85,
      torsoVerticalityMaxTilt: 15,
      requiresBalanceFootRaised: true,
    },
    canonicalEmbedding: [
      0.0, -0.85,  // 0: nose
      -0.03, -0.88, 0.03, -0.88, // 1: l_eye, 2: r_eye
      -0.08, -0.87, 0.08, -0.87, // 3: l_ear, 4: r_ear
      -0.22, -0.60, 0.22, -0.60, // 5: l_shoulder, 6: r_shoulder
      -0.12, -0.42, 0.12, -0.42, // 7: l_elbow, 8: r_elbow
      -0.02, -0.38, 0.02, -0.38, // 9: l_wrist, 10: r_wrist (hands in prayer)
      -0.14, 0.00,  0.14, 0.00,  // 11: l_hip, 12: r_hip
      -0.12, 0.48,  0.32, 0.22,  // 13: l_knee, 14: r_knee (bent out)
      -0.10, 0.95,  0.02, 0.42,  // 15: l_ankle, 16: r_ankle (on inner thigh)
    ],
  },
  {
    id: 'Chair',
    name: 'Chair Pose',
    sanskrit: 'Utkatasana',
    category: 'standing',
    difficulty: 'Beginner',
    caloriesPerMin: 5.6,
    targetMuscles: ['Quadriceps', 'Glutes', 'Calves', 'Spine'],
    focus: 'Leg endurance, core recruitment, and shoulder elevation.',
    instructions: [
      'Stand with big toes touching and heels slightly apart.',
      'Inhale and raise arms straight alongside ears, palms facing inward.',
      'Exhale and bend knees as if sitting back into an imaginary chair.',
      'Lower hips until thighs are near parallel to the mat.',
      'Keep weight rooted down through the heels and chest proud.',
      'Hold for 30-60 seconds while taking steady breaths.',
    ],
    alignmentCues: [
      'Knees tracking over second toe, behind toes in perspective',
      'Knee flexion angle between 85° and 130°',
      'Arms fully extended overhead alongside ears',
      'Torso angled forward ~45° with neutral lumbar spine',
    ],
    commonMistakes: [
      'Knees collapsing inward (valgus collapse)',
      'Excessive arch in lower back',
      'Weight shifted onto toes instead of grounded in heels',
    ],
    biometrics: {
      kneeAngleRange: [80, 135],
      hipAngleRange: [75, 130],
      armsOverhead: true,
    },
    canonicalEmbedding: [
      0.0, -0.55,
      -0.03, -0.58, 0.03, -0.58,
      -0.07, -0.57, 0.07, -0.57,
      -0.18, -0.35, 0.18, -0.35,
      -0.24, -0.65, 0.24, -0.65,
      -0.28, -0.92, 0.28, -0.92,
      -0.16, 0.05, 0.16, 0.05,
      -0.28, 0.38, 0.28, 0.38,
      -0.22, 0.85, 0.22, 0.85,
    ],
  },
  {
    id: 'WarriorI',
    name: 'Warrior I',
    sanskrit: 'Virabhadrasana I',
    category: 'standing',
    difficulty: 'Beginner',
    caloriesPerMin: 5.2,
    targetMuscles: ['Hip Flexors', 'Quadriceps', 'Calves', 'Shoulders'],
    focus: 'Pelvic stability, deep lunging strength, and thoracic opening.',
    instructions: [
      'Step right foot back 3 to 4 feet and angle foot at 45 degrees.',
      'Bend front left knee directly over front ankle into a 90-degree lunge.',
      'Square hips toward the front edge of your mat.',
      'Reach both arms overhead, drawing shoulders down away from ears.',
      'Press firmly into the outer edge of back heel.',
      'Hold for 5-10 deep breaths, then switch legs.',
    ],
    alignmentCues: [
      'Front thigh near parallel to floor, knee stacked over ankle',
      'Back leg straight, back heel pinned to the floor',
      'Hips squared forward, core engaged',
    ],
    commonMistakes: [
      'Front knee drifting inward past toes',
      'Back heel lifting off mat',
      'Hips flaring wide instead of squaring forward',
    ],
    biometrics: {
      frontKneeAngleRange: [85, 120],
      backKneeMinAngle: 160,
      armsOverhead: true,
    },
    canonicalEmbedding: [
      -0.15, -0.65,
      -0.18, -0.68, -0.12, -0.68,
      -0.20, -0.67, -0.10, -0.67,
      -0.25, -0.42, 0.00, -0.42,
      -0.28, -0.75, 0.02, -0.75,
      -0.30, -0.98, 0.04, -0.98,
      -0.20, 0.00, 0.05, 0.00,
      -0.45, 0.35, 0.35, 0.40,
      -0.45, 0.88, 0.58, 0.82,
    ],
  },
  {
    id: 'WarriorII',
    name: 'Warrior II',
    sanskrit: 'Virabhadrasana II',
    category: 'standing',
    difficulty: 'Beginner',
    caloriesPerMin: 5.4,
    targetMuscles: ['Quadriceps', 'Adductors', 'Deltoids', 'Glutes'],
    focus: 'Hip opening, stamina, and focused determination.',
    instructions: [
      'Stand in a wide stance, 3.5 to 4 feet apart.',
      'Turn front foot out 90 degrees; back foot angled slightly in at 15 degrees.',
      'Bend front knee to 90 degrees directly over front ankle.',
      'Extend arms parallel to the floor, reaching actively front and back.',
      'Gaze softly over front fingertips (Drishti).',
      'Keep torso upright and centered directly between hips.',
    ],
    alignmentCues: [
      'Arms horizontal and parallel to floor at shoulder height',
      'Front knee stacked over ankle, tracking over middle toe',
      'Back leg straight and fully activated',
      'Torso vertical, not leaning forward',
    ],
    commonMistakes: [
      'Leaning torso forward toward front leg',
      'Dropping back arm below shoulder height',
      'Front knee caving inward toward big toe',
    ],
    biometrics: {
      frontKneeAngleRange: [85, 115],
      backKneeMinAngle: 162,
      armsParallel: true,
      torsoVertical: true,
    },
    canonicalEmbedding: [
      -0.05, -0.60,
      -0.08, -0.63, -0.02, -0.63,
      -0.12, -0.62, 0.02, -0.62,
      -0.20, -0.38, 0.15, -0.38,
      -0.55, -0.38, 0.52, -0.38,
      -0.88, -0.38, 0.85, -0.38,
      -0.14, 0.00, 0.12, 0.00,
      -0.48, 0.32, 0.38, 0.38,
      -0.48, 0.85, 0.62, 0.80,
    ],
  },
  {
    id: 'DownwardDog',
    name: 'Downward-Facing Dog',
    sanskrit: 'Adho Mukha Svanasana',
    category: 'inversion',
    difficulty: 'Beginner',
    caloriesPerMin: 4.8,
    targetMuscles: ['Hamstrings', 'Calves', 'Shoulders', 'Lats'],
    focus: 'Full posterior elongation, shoulder girdle strength, and mild inversion.',
    instructions: [
      'Start on hands and knees with wrists slightly ahead of shoulders.',
      'Spread fingers wide, rooting through index finger knuckles and thumbs.',
      'Tuck toes, exhale, and lift knees off floor, reaching sitting bones toward ceiling.',
      'Lengthen spine, creating an inverted "V" shape with your body.',
      'Press heels toward or onto the mat, keeping knees micro-bent if hamstrings are tight.',
      'Let head hang naturally between biceps.',
    ],
    alignmentCues: [
      'Hips form apex of an inverted V (body angle ~75-95°)',
      'Arms fully extended, shoulders rotated away from ears',
      'Spine elongated without rounding',
    ],
    commonMistakes: [
      'Rounding lower spine instead of bending knees to lengthen back',
      'Dumping weight onto wrists instead of pressing into finger pads',
      'Collapsing shoulders toward neck',
    ],
    biometrics: {
      hipApexAngleRange: [70, 105],
      armsStraightMinAngle: 160,
      legsStraightMinAngle: 145,
    },
    canonicalEmbedding: [
      -0.55, 0.40,
      -0.58, 0.38, -0.58, 0.42,
      -0.52, 0.35, -0.52, 0.45,
      -0.40, 0.20, -0.40, 0.20,
      -0.20, 0.05, -0.20, 0.05,
      0.00, -0.10, 0.00, -0.10,
      0.22, 0.15, 0.22, 0.15,
      0.52, 0.30, 0.52, 0.30,
      0.82, 0.45, 0.82, 0.45,
    ],
  },
  {
    id: 'Cobra',
    name: 'Cobra Pose',
    sanskrit: 'Bhujangasana',
    category: 'backbend',
    difficulty: 'Beginner',
    caloriesPerMin: 4.0,
    targetMuscles: ['Erector Spinae', 'Glutes', 'Chest', 'Shoulders'],
    focus: 'Spinal mobility, back strengthening, and respiratory expansion.',
    instructions: [
      'Lie prone on mat with legs extended and tops of feet pressing down.',
      'Place hands under shoulders with fingers pointing forward.',
      'Hug elbows close to your torso.',
      'Inhale and gently peel chest up off the mat using back muscles.',
      'Keep pelvic bone and tops of thighs firmly rooted to the floor.',
      'Gaze softly forward or slightly upward for 15-30 seconds.',
    ],
    alignmentCues: [
      'Pelvis and thighs remain grounded on the floor',
      'Elbows bent and hugging side ribs',
      'Shoulders relaxed down and back',
    ],
    commonMistakes: [
      'Pushing too hard with hands instead of using back strength',
      'Lifting hips off the floor',
      'Crunched back of neck',
    ],
    biometrics: {
      hipsGrounded: true,
      elbowFlexionRange: [80, 140],
      torsoAngleLift: 35,
    },
    canonicalEmbedding: [
      -0.40, -0.35,
      -0.43, -0.38, -0.37, -0.38,
      -0.35, -0.35, -0.30, -0.35,
      -0.28, -0.15, -0.20, -0.15,
      -0.25, 0.10, -0.18, 0.10,
      -0.28, 0.35, -0.20, 0.35,
      0.00, 0.20, 0.08, 0.20,
      0.42, 0.25, 0.48, 0.25,
      0.85, 0.30, 0.90, 0.30,
    ],
  },
  {
    id: 'Triangle',
    name: 'Triangle Pose',
    sanskrit: 'Trikonasana',
    category: 'standing',
    difficulty: 'Beginner',
    caloriesPerMin: 4.8,
    targetMuscles: ['Hamstrings', 'Groin', 'Obliques', 'Chest'],
    focus: 'Lateral spinal extension, hamstring flexibility, and chest opening.',
    instructions: [
      'Stand wide on mat (about 3.5 to 4 feet apart).',
      'Turn front right foot out 90 degrees, back foot in 15 degrees.',
      'Extend arms out horizontally at shoulder height.',
      'Reach right arm far forward over right leg, then hinge at the right hip.',
      'Lower right hand to shin, ankle, or floor; extend left arm straight up toward ceiling.',
      'Stack shoulders and gaze upward toward top hand for 5-8 breaths.',
    ],
    alignmentCues: [
      'Both legs straight and strong without hyperextending front knee',
      'Arms form a vertical line perpendicular to the floor',
      'Torso extended laterally without collapsing forward',
    ],
    commonMistakes: [
      'Rounding chest forward to force hand to the floor',
      'Collapsing onto bottom hand instead of using core',
      'Bending front knee',
    ],
    biometrics: {
      bothLegsStraightMinAngle: 160,
      armsVerticalAlignmentMaxDeviation: 25,
      lateralSpineAngle: 45,
    },
    canonicalEmbedding: [
      -0.25, -0.45,
      -0.28, -0.48, -0.22, -0.48,
      -0.26, -0.45, -0.18, -0.45,
      -0.20, -0.25, -0.05, -0.25,
      -0.15, 0.00, -0.02, -0.60,
      -0.10, 0.25, 0.00, -0.92,
      -0.10, 0.05, 0.10, 0.05,
      -0.25, 0.45, 0.35, 0.45,
      -0.38, 0.88, 0.58, 0.85,
    ],
  },
  {
    id: 'Shoulderstand',
    name: 'Shoulderstand',
    sanskrit: 'Sarvangasana',
    category: 'inversion',
    difficulty: 'Intermediate',
    caloriesPerMin: 4.8,
    targetMuscles: ['Shoulders', 'Upper Back', 'Core', 'Glutes'],
    focus: 'Full body inversion, venous blood return, and calm mental stillness.',
    instructions: [
      'Lie supine on mat. Bend knees, lift feet, and bring thighs into chest.',
      'Lift hips off floor, bringing hands onto lower back for support, elbows grounded.',
      'Walk hands up back toward shoulder blades as you extend legs straight up toward ceiling.',
      'Align hips over shoulders and feet over hips into a vertical line.',
      'Never turn head to the side once in the inversion.',
      'Breathe smoothly for 5 to 15 slow breaths.',
    ],
    alignmentCues: [
      'Vertical alignment through shoulders, hips, and feet',
      'Elbows drawn close together, not flared wide',
      'Weight supported on shoulders and upper arms, not cervical spine',
    ],
    commonMistakes: [
      'Turning head to look around while in inversion',
      'Elbows sliding out wide, losing back shelf support',
      'Hips hanging back behind shoulders',
    ],
    biometrics: {
      verticalLegsAngleMin: 165,
      verticalTorsoAngleMin: 155,
      shouldersGroundedInverted: true,
    },
    canonicalEmbedding: [
      0.00, 0.75,
      -0.03, 0.78, 0.03, 0.78,
      -0.08, 0.76, 0.08, 0.76,
      -0.20, 0.55, 0.20, 0.55,
      -0.18, 0.72, 0.18, 0.72,
      -0.10, 0.38, 0.10, 0.38,
      -0.12, 0.10, 0.12, 0.10,
      -0.10, -0.38, 0.10, -0.38,
      -0.08, -0.85, 0.08, -0.85,
    ],
  },
];

export const POSE_MAP = YOGA_POSES.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

export const POSE_IDS = YOGA_POSES.map((p) => p.id);
