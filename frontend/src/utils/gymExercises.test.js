import { RepCounter, checkGymFraming, selectPrimaryForegroundPose, EXERCISE_PATTERNS } from './gymExercises';

const createSquatKeypoints = (kneeAngle, visibleSides = ['left', 'right']) => {
  const keypoints = Array.from({ length: 17 }, () => [0, 0, 0.9]);
  const setLeg = (side, hipIndex, kneeIndex, ankleIndex, offset) => {
    const radians = ((180 - kneeAngle) * Math.PI) / 180;
    keypoints[hipIndex] = [offset - 1, 0, visibleSides.includes(side) ? 0.9 : 0.1];
    keypoints[kneeIndex] = [offset, 0, visibleSides.includes(side) ? 0.9 : 0.1];
    keypoints[ankleIndex] = [
      offset + Math.cos(radians),
      Math.sin(radians),
      visibleSides.includes(side) ? 0.9 : 0.1,
    ];
  };

  setLeg('left', 11, 13, 15, 0);
  setLeg('right', 12, 14, 16, 3);
  return keypoints;
};

const advanceStateClock = (counter) => {
  counter.stateStartTime = Date.now() - 150;
};

describe('RepCounter squat tracking', () => {
  test('counts a full squat when the user returns to standing', () => {
    const counter = new RepCounter('SQUAT');

    advanceStateClock(counter);
    counter.update(createSquatKeypoints(175));
    advanceStateClock(counter);
    expect(counter.update(createSquatKeypoints(145)).state).toBe('descent');
    expect(counter.update(createSquatKeypoints(110)).state).toBe('bottom');
    advanceStateClock(counter);
    expect(counter.update(createSquatKeypoints(140)).state).toBe('ascent');
    advanceStateClock(counter);
    const result = counter.update(createSquatKeypoints(170));

    expect(result.repCount).toBe(1);
    expect(result.state).toBe('standing');
  });

  test('counts a squat when only one leg is confidently visible', () => {
    const counter = new RepCounter('SQUAT');

    advanceStateClock(counter);
    counter.update(createSquatKeypoints(175, ['left']));
    advanceStateClock(counter);
    counter.update(createSquatKeypoints(145, ['left']));
    counter.update(createSquatKeypoints(110, ['left']));
    advanceStateClock(counter);
    counter.update(createSquatKeypoints(140, ['left']));
    advanceStateClock(counter);
    const result = counter.update(createSquatKeypoints(170, ['left']));

    expect(result.repCount).toBe(1);
  });

  test('checkGymFraming flags missing lower body when seated at desk for squats', () => {
    // Seated at desk: nose & shoulders high confidence, knees/ankles low confidence
    const seatedKeypoints = Array.from({ length: 17 }, () => [0, 0, 0.05]);
    seatedKeypoints[0] = [320, 150, 0.95]; // nose
    seatedKeypoints[5] = [280, 250, 0.90]; // lShoulder
    seatedKeypoints[6] = [360, 250, 0.90]; // rShoulder

    const check = checkGymFraming(seatedKeypoints, 'SQUAT');
    expect(check.isFramingValid).toBe(false);
    expect(check.reason).toContain('Step back');
  });

  test('selectPrimaryForegroundPose chooses the larger foreground subject over background person', () => {
    const foregroundPose = {
      keypoints: Array.from({ length: 17 }, () => ({ x: 300, y: 300, score: 0.9 })),
    };
    // Large torso in foreground: width 200, height 250
    foregroundPose.keypoints[5] = { x: 200, y: 150, score: 0.9 }; // lSh
    foregroundPose.keypoints[6] = { x: 400, y: 150, score: 0.9 }; // rSh
    foregroundPose.keypoints[11] = { x: 220, y: 400, score: 0.9 }; // lHip
    foregroundPose.keypoints[12] = { x: 380, y: 400, score: 0.9 }; // rHip

    const backgroundPose = {
      keypoints: Array.from({ length: 17 }, () => ({ x: 500, y: 200, score: 0.8 })),
    };
    // Tiny torso in distant doorway: width 30, height 40
    backgroundPose.keypoints[5] = { x: 485, y: 180, score: 0.8 };
    backgroundPose.keypoints[6] = { x: 515, y: 180, score: 0.8 };
    backgroundPose.keypoints[11] = { x: 490, y: 220, score: 0.8 };
    backgroundPose.keypoints[12] = { x: 510, y: 220, score: 0.8 };

    const selected = selectPrimaryForegroundPose([backgroundPose, foregroundPose], 640, 480);
    expect(selected).toBe(foregroundPose);
  });

  test('EXERCISE_PATTERNS contains 15 comprehensive exercises including lateral & front raises', () => {
    const keys = Object.keys(EXERCISE_PATTERNS);
    expect(keys.length).toBeGreaterThanOrEqual(15);
    expect(keys).toContain('SQUAT');
    expect(keys).toContain('PUSHUP');
    expect(keys).toContain('BICEP_CURL');
    expect(keys).toContain('JUMPING_JACKS');
    expect(keys).toContain('LUNGE');
    expect(keys).toContain('SHOULDER_PRESS');
    expect(keys).toContain('LATERAL_RAISE');
    expect(keys).toContain('FRONT_RAISE');
    expect(keys).toContain('TRICEP_EXTENSION');
    expect(keys).toContain('UPRIGHT_ROW');
    expect(keys).toContain('PUNCHES');
    expect(keys).toContain('CALF_RAISE');
    expect(keys).toContain('PLANK');
    expect(keys).toContain('CRUNCHES');
    expect(keys).toContain('HIGH_KNEES');
  });

  test('RepCounter lateral raise counts reps on arm elevation and descent', () => {
    const counter = new RepCounter('LATERAL_RAISE');
    // Keypoints with shoulders (5, 6), hips (11, 12), and elbows (7, 8)
    const createLateralRaiseKeypoints = (angleDeg) => {
      const kp = Array.from({ length: 17 }, () => [0, 0, 0.9]);
      kp[5] = [280, 200, 0.9]; // lShoulder
      kp[6] = [360, 200, 0.9]; // rShoulder
      kp[11] = [280, 350, 0.9]; // lHip
      kp[12] = [360, 350, 0.9]; // rHip

      const rad = (angleDeg * Math.PI) / 180;
      // Hip is (280, 350), Shoulder is (280, 200). Vector from shoulder to hip is (0, 150).
      // Vector from shoulder to elbow rotated by angleDeg:
      kp[7] = [280 - Math.sin(rad) * 100, 200 + Math.cos(rad) * 100, 0.9];
      kp[8] = [360 + Math.sin(rad) * 100, 200 + Math.cos(rad) * 100, 0.9];
      return kp;
    };

    advanceStateClock(counter);
    counter.update(createLateralRaiseKeypoints(20)); // down
    advanceStateClock(counter);
    const raisedResult = counter.update(createLateralRaiseKeypoints(75)); // raised
    expect(raisedResult.state).toBe('raised');
    advanceStateClock(counter);
    const repResult = counter.update(createLateralRaiseKeypoints(25)); // back down
    expect(repResult.repCount).toBe(1);
    expect(repResult.state).toBe('down');
  });
});
