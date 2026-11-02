# PHASE 3: GYM EXERCISE DETECTION - IMPLEMENTATION GUIDE

**Target Start**: After PHASE 2 completion ✅  
**Estimated Duration**: 3-5 days  
**Difficulty**: Moderate (builds on proven patterns)

---

## WHAT WE'RE BUILDING

A new "Gym" section that detects and counts gym exercises in real-time:

1. **Squats** — Detect descent/ascent cycles, count reps
2. **Push-ups** — Detect down/up cycles, count reps
3. **Bicep Curls** — Detect arm bend/extend, count reps

Later extensions:
- Lunges, shoulder presses, lateral raises, jumping jacks, glute bridges, sit-ups, planks

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────┐
│          Frontend (React)               │
├─────────────────────────────────────────┤
│ Pages/Gym/Gym.js                        │
│ ├─ Use existing webcam + MoveNet        │
│ ├─ Use pose normalization from Yoga.js  │
│ ├─ Call gymExercises.js for logic       │
│ └─ Display reps + form feedback         │
├─────────────────────────────────────────┤
│ Utils/gymExercises.js (NEW)             │
│ ├─ Joint angle calculations             │
│ ├─ Rep counting state machine           │
│ ├─ Form feedback rules (per exercise)   │
│ └─ Visibility checks                    │
├─────────────────────────────────────────┤
│ Models/gym_classifier.js (NEW)          │
│ ├─ TensorFlow.js model for exercises    │
│ └─ 34D embedding → exercise type        │
├─────────────────────────────────────────┤
│ Storage: saveGymWorkout()                │
│ └─ Records: exercise, reps, sets, form  │
└─────────────────────────────────────────┘

Backend (Training - Python):
├─ classification model/gym_training.py (NEW)
│  ├─ Train on squat/push-up/bicep curl images
│  ├─ Generate 34D embeddings
│  └─ Export to TensorFlow.js
└─ classification model/gym_images/ (NEW)
   └─ Organized by exercise type
```

---

## STEP-BY-STEP IMPLEMENTATION

### Step 1: Create Gym Exercise Utilities (Day 1)

**File**: `frontend/src/utils/gymExercises.js`

```javascript
// Joint angle calculation functions
export const calculateAngle = (a, b, c) => {
  // Three-point angle calculation
  // Used for: elbow angle (push-ups), knee angle (squats), etc.
}

// Rep counting state machines for each exercise
export const EXERCISE_PATTERNS = {
  SQUAT: {
    states: ['standing', 'descent', 'bottom', 'ascent'],
    thresholds: {
      kneeAngleDown: 90,      // Knee bend threshold
      kneeAngleUp: 150,       // Full extension threshold
    },
    countAt: 'ascent',        // Count when returning to standing
  },
  PUSHUP: {
    states: ['up', 'descent', 'down', 'ascent'],
    thresholds: {
      elbowAngleDown: 80,     // Bent elbow
      elbowAngleUp: 160,      // Extended elbow
    },
    countAt: 'ascent',
  },
  BICEP_CURL: {
    states: ['down', 'ascent', 'up', 'descent'],
    thresholds: {
      elbowAngleDown: 170,    // Straight arm
      elbowAngleUp: 40,       // Fully bent
    },
    countAt: 'up',
  },
}

// Rep counting logic
export const countReps = (currentAngle, state, exercise) => {
  // Returns: { count, newState, formQuality }
}

// Form feedback rules
export const getFormFeedback = (posture, exercise) => {
  // Check: alignment, visibility, range of motion
  // Returns: feedback string or null
}
```

### Step 2: Create Gym Page (Day 1-2)

**File**: `frontend/src/pages/Gym/Gym.js`

```javascript
import React, { useRef, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import { getGymWorkoutHistory, saveGymWorkout } from '../../utils/storage'
import { calculateAngle, countReps, getFormFeedback } from '../../utils/gymExercises'

function Gym() {
  // State for:
  // - Selected exercise
  // - Rep count
  // - Set count
  // - Form quality feedback
  // - Workout duration
  // - Pause/resume controls
  
  // Use existing pose detection pattern from Yoga.js:
  // 1. Load MoveNet detector (on mount)
  // 2. Run pose detection loop (100ms interval)
  // 3. Calculate joint angles
  // 4. Check form and count reps
  // 5. Display feedback in real-time
}

export default Gym
```

### Step 3: Train Gym Classifier (Day 2-3)

**File**: `classification model/gym_training.py`

```python
# Similar to yoga_training.py but for gym exercises
# Input: Images of squats, push-ups, bicep curls
# Process:
#   1. Extract keypoints with MoveNet
#   2. Normalize to 34D embeddings
#   3. Train classifier: 34D → exercise type (+ repetition phase)
#   4. Export to TensorFlow.js

# Training data structure:
# gym_images/train/
#   ├── squat/
#   │   ├── rep1_top.jpg
#   │   ├── rep1_middle.jpg
#   │   ├── rep1_bottom.jpg
#   │   └── ...
#   ├── pushup/
#   │   ├── rep1_up.jpg
#   │   ├── rep1_down.jpg
#   │   └── ...
#   └── bicep_curl/
#       ├── rep1_down.jpg
#       ├── rep1_mid.jpg
#       └── ...
```

### Step 4: Create Gym Route (Day 3)

**File**: `frontend/src/App.js` (add route)

```javascript
import Gym from './pages/Gym/Gym'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/start' element={<Yoga />} />
        <Route path='/gym' element={<Gym />} />  // ← NEW
        <Route path='/about' element={<About />} />
        <Route path='/tutorials' element={<Tutorials />} />
      </Routes>
    </Router>
  )
}
```

### Step 5: Add Gym Styling (Day 3)

**File**: `frontend/src/pages/Gym/Gym.css`

```css
/* Similar to Yoga.css but with:
   - Rep counter display (large, prominent)
   - Set counter
   - Form feedback message
   - Exercise selector
   - Start/Pause/Finish controls
   - Real-time angle visualization (optional)
*/
```

### Step 6: Test & Verify (Day 4-5)

- [ ] Squat detection works at 10+ FPS
- [ ] Rep counting accurate for 5+ consecutive reps
- [ ] Push-ups detect different heights correctly
- [ ] Bicep curls count in both directions
- [ ] Form feedback shows at least 3 common mistakes
- [ ] Workouts save to IndexedDB
- [ ] No regressions in yoga functionality

---

## REUSABLE CODE FROM YOGA.JS

You can directly reuse these functions from Yoga.js:

```javascript
// Import these functions from Yoga.js or refactor to shared utils
import { 
  get_center_point,
  get_pose_size,
  normalize_pose_landmarks,
  landmarks_to_embedding,
} from '../utils/poseProcessing'

// These patterns are proven and tested:
const detectorRef = useRef(null)
const classifierRef = useRef(null)
const detectionIntervalRef = useRef(null)

useEffect(() => {
  const loadModels = async () => {
    // Load MoveNet (same as Yoga)
  }
}, [])

const detectPose = async () => {
  // Get keypoints from video (same pattern)
  // Process with your exercise-specific logic
}
```

---

## KEY DIFFERENCES FROM YOGA

| Aspect | Yoga | Gym |
|--------|------|-----|
| **Metric** | Duration held | Reps counted |
| **State** | Binary: correct/incorrect | Multi-state: setup→descent→bottom→ascent |
| **Feedback** | Color (green/white) | Text + angle display |
| **Timing** | Continuous hold | Cycle-based counting |
| **Classifier** | 8 pose classes | 3+ exercise types (+ rep phases) |

---

## ALGORITHM: SQUAT REP COUNTING

```
State Machine:

STANDING (90° < knee angle < 170°)
  ↓
  [Descent starts when knee angle < 90°]
  ↓
DESCENT (knee angle decreasing, ankle visible)
  ↓
  [Bottom when knee angle at minimum]
  ↓
BOTTOM (knee angle < 70°, pause ~500ms)
  ↓
  [Ascent starts when knee angle > 75°]
  ↓
ASCENT (knee angle increasing)
  ↓
  [Count increment when knee angle > 150°]
  ↓
STANDING (repeat)

Form Checks:
✓ Both feet visible (ankle visibility > 0.5)
✓ Back straight (torso angle < 30° from vertical)
✓ Knees aligned over ankles (hip/knee/ankle collinear)
✗ Knees caving inward (ankle inside hip)
✗ Heels lifting off ground (ankle y-coordinate)
```

---

## TRAINING DATA COLLECTION

**Recommended**: 100-200 images per exercise, multiple angles/people

```
For each exercise:
  - Top position (starting): 30-50 images
  - Mid-descent position: 30-50 images
  - Bottom position: 30-50 images
  - Collect from multiple people, angles, lighting

Total: ~150-200 images per exercise × 3 exercises = 450-600 images
```

---

## FORM FEEDBACK RULES

### Squats
```
✓ Good form:
  - Knee angle: 60-90° at bottom
  - Torso upright: 0-15° forward lean
  - Feet flat: ankle not lifting
  - Depth consistent: ±10° variation

✗ Common mistakes:
  - "Knees caving inward" (ankle inside hip plane)
  - "Heels lifting off ground" (can't see full foot)
  - "Leaning too far forward" (torso >30° forward)
  - "Shallow squat" (knee angle >100° at bottom)
```

### Push-ups
```
✓ Good form:
  - Elbow angle: 45-90° when lowered
  - Body straight: head-to-heels alignment
  - Shoulder alignment: elbows ~45° from body

✗ Common mistakes:
  - "Elbows flaring out" (elbow >60° from body)
  - "Hips sagging" (hip below shoulder level)
  - "Head jutting forward" (head above shoulder plane)
  - "Not going low enough" (elbow >100° when down)
```

### Bicep Curls
```
✓ Good form:
  - Elbow angle: 30-40° when fully curled
  - Elbow stays at side: x displacement <10px
  - Shoulder stable: shoulder height constant

✗ Common mistakes:
  - "Swinging the weight" (elbow moving forward)
  - "Shoulder raising" (shoulder elevation >20px)
  - "Not fully extending" (elbow <160° when down)
  - "Only curling partway" (elbow >60° when up)
```

---

## TESTING CHECKLIST

- [ ] Gym page loads without errors
- [ ] MoveNet detector initializes on Gym page
- [ ] Webcam starts and displays video
- [ ] Skeleton visualization works
- [ ] Exercise selector changes detection logic
- [ ] Rep counter increments on completed reps
- [ ] Form feedback displays for mistakes
- [ ] Workout saves to IndexedDB
- [ ] Multiple reps counted accurately (5+ test)
- [ ] Different exercises counted separately
- [ ] Yoga page still works (no regression)
- [ ] Sessions display in history

---

## DEPENDENCIES TO ADD

```json
{
  "mathjs": "^12.0.0"  // For angle calculations (optional, can use vanilla JS)
}
```

No major new dependencies needed! Everything reuses existing libraries.

---

## ESTIMATED IMPLEMENTATION SIZE

| Component | Estimated Lines | Complexity |
|-----------|-----------------|------------|
| Gym.js | 300-400 | Medium |
| gymExercises.js | 200-300 | High |
| Gym.css | 100-150 | Low |
| gym_training.py | 150-200 | Medium |
| Total New Code | ~800-1050 | - |

---

## SUCCESS CRITERIA

✅ **Minimum Viable**:
1. Squats detected and counted
2. Form feedback for 2+ issues
3. Workouts saved and retrieved
4. Zero regressions in yoga

✅ **Nice to Have**:
1. Push-ups and bicep curls working
2. Multi-exercise workout sessions
3. Visual angle display on skeleton
4. Rep/set tracking

✅ **Advanced** (if time):
1. All 7+ exercise types
2. Set/rep programming
3. Progressive overload suggestions
4. Form quality scoring

---

## QUICK REFERENCE: JOINT ANGLES

```
Keypoint Indices (from POINTS):
LEFT_SHOULDER: 5   RIGHT_SHOULDER: 6
LEFT_ELBOW: 7      RIGHT_ELBOW: 8
LEFT_WRIST: 9      RIGHT_WRIST: 10
LEFT_HIP: 11       RIGHT_HIP: 12
LEFT_KNEE: 13      RIGHT_KNEE: 14
LEFT_ANKLE: 15     RIGHT_ANKLE: 16

Common Angles to Track:
- Squat: angle(hip, knee, ankle) for quad angle
- Push-up: angle(shoulder, elbow, wrist) for arm angle
- Bicep curl: angle(shoulder, elbow, wrist) for forearm angle
- Back: angle(shoulder, hip, knee) for body lean
```

---

## NEXT STEPS

1. Create `frontend/src/utils/gymExercises.js` with angle calculation functions
2. Create `frontend/src/pages/Gym/Gym.js` with basic structure
3. Collect training images for the 3 exercises
4. Create `classification model/gym_training.py` to train model
5. Export model and integrate into Gym.js
6. Implement rep counting state machine
7. Add form feedback rules
8. Test and iterate

---

**Ready to start PHASE 3? 🏋️**

All foundation work is complete. The architecture is proven. Gym detection is the next logical step.
