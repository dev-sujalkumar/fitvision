import {
  calculateJointAngle,
  normalizePoseEmbedding,
  verifyBiomechanicalAngles,
  checkPoseBodyVisibility,
  trainYogaModel,
  predictHybridPoseAccuracy,
  generateMassiveAugmentedDataset,
  ALL_MODEL_CLASSES,
  TOTAL_CLASSES_COUNT,
} from './highAccuracyYogaModel';
import { YOGA_POSES } from '../utils/yogaPoseLibrary';

describe('High Accuracy Yoga Model & Biomechanical Engine', () => {
  jest.setTimeout(30000);

  test('Model classes include 28 yoga poses plus 3 negative rejection classes', () => {
    expect(YOGA_POSES.length).toBe(28);
    expect(TOTAL_CLASSES_COUNT).toBe(31);
    expect(ALL_MODEL_CLASSES.length).toBe(31);

    const negativeClasses = ALL_MODEL_CLASSES.filter((c) => c.isNegative);
    expect(negativeClasses.length).toBe(3);
    expect(negativeClasses.map((c) => c.id)).toContain('Seated_Desk');
    expect(negativeClasses.map((c) => c.id)).toContain('Idle_Standing');
    expect(negativeClasses.map((c) => c.id)).toContain('Partial_UpperBody');
  });

  test('calculateJointAngle calculates correct angles and returns null on low confidence or degenerate joints', () => {
    // 90 degree corner: (0, 1) -> (0, 0) -> (1, 0) with high score
    const a = { x: 0, y: 1, score: 0.95 };
    const b = { x: 0, y: 0, score: 0.95 };
    const c = { x: 1, y: 0, score: 0.95 };
    const angle90 = calculateJointAngle(a, b, c);
    expect(angle90).toBe(90);

    // 180 degree line: (-1, 0) -> (0, 0) -> (1, 0)
    const d = { x: -1, y: 0, score: 0.95 };
    const angle180 = calculateJointAngle(d, b, c);
    expect(angle180).toBe(180);

    // Low confidence joint returns null
    const lowConfidence = { x: 1, y: 0, score: 0.10 };
    expect(calculateJointAngle(a, b, lowConfidence)).toBeNull();

    // Degenerate/coincident joints return null
    expect(calculateJointAngle(b, b, c)).toBeNull();
  });

  test('checkPoseBodyVisibility rejects seated desk posture when user is sitting in front of laptop', () => {
    // Simulate user sitting at desk: only head and shoulders visible with high score
    const seatedKeypoints = Array.from({ length: 17 }, () => ({ x: 0, y: 0, score: 0.05 }));
    // Head (0: nose, 1: lEye, 2: rEye)
    seatedKeypoints[0] = { x: 300, y: 150, score: 0.92 };
    seatedKeypoints[1] = { x: 290, y: 140, score: 0.90 };
    seatedKeypoints[2] = { x: 310, y: 140, score: 0.90 };
    // Shoulders (5, 6)
    seatedKeypoints[5] = { x: 230, y: 280, score: 0.88 };
    seatedKeypoints[6] = { x: 370, y: 280, score: 0.88 };
    // Hips, knees, ankles remain score 0.05 (cropped out of webcam frame)

    const check = checkPoseBodyVisibility(seatedKeypoints, 'Tree');
    expect(check.isValid).toBe(false);
    expect(check.status).toBe('SEATED_DESK');
    expect(check.reason).toContain('Seated at desk detected');
    expect(check.missingLimbs).toContain('Hips');
    expect(check.missingLimbs).toContain('Legs');
  });

  test('verifyBiomechanicalAngles rejects Tree Pose when user is seated at desk', () => {
    const seatedKeypoints = Array.from({ length: 17 }, () => ({ x: 0, y: 0, score: 0.05 }));
    seatedKeypoints[0] = { x: 300, y: 150, score: 0.92 };
    seatedKeypoints[5] = { x: 230, y: 280, score: 0.88 };
    seatedKeypoints[6] = { x: 370, y: 280, score: 0.88 };

    const verification = verifyBiomechanicalAngles(seatedKeypoints, 'Tree');
    expect(verification.passed).toBe(false);
    expect(verification.score).toBeLessThanOrEqual(20);
    expect(verification.feedback).toContain('Seated at desk detected');
  });

  test('verifyBiomechanicalAngles assesses valid standing Tree Pose balance correctly', () => {
    // Mock keypoints with full body visible: left knee bent (90 deg) and right knee straight (175 deg)
    const mockKeypoints = Array.from({ length: 17 }, () => ({ x: 100, y: 100, score: 0.90 }));
    // Head & Shoulders
    mockKeypoints[0] = { x: 100, y: 40, score: 0.95 };
    mockKeypoints[5] = { x: 80, y: 80, score: 0.95 };
    mockKeypoints[6] = { x: 120, y: 80, score: 0.95 };

    // Hip = 11, Knee = 13, Ankle = 15
    mockKeypoints[11] = { x: 90, y: 140, score: 0.90 }; // lHip
    mockKeypoints[13] = { x: 50, y: 190, score: 0.90 }; // lKnee (bent out)
    mockKeypoints[15] = { x: 105, y: 190, score: 0.90 }; // lAnkle (on inner thigh)

    // Standing Right Leg
    mockKeypoints[12] = { x: 110, y: 140, score: 0.90 }; // rHip
    mockKeypoints[14] = { x: 110, y: 220, score: 0.90 }; // rKnee (straight)
    mockKeypoints[16] = { x: 110, y: 300, score: 0.90 }; // rAnkle (straight)

    const verification = verifyBiomechanicalAngles(mockKeypoints, 'Tree');
    expect(verification).toBeDefined();
    expect(typeof verification.score).toBe('number');
    expect(verification.passed).toBe(true);
    expect(verification.score).toBeGreaterThanOrEqual(90);
  });

  test('generateMassiveAugmentedDataset generates requested sample batch cleanly', () => {
    // Generate small test batch of massive generator
    const data = generateMassiveAugmentedDataset(310);
    expect(data.totalSamples).toBeGreaterThanOrEqual(310);
    expect(data.xs.shape[0]).toBe(data.totalSamples);
    expect(data.xs.shape[1]).toBe(34);
    expect(data.ys.shape[1]).toBe(TOTAL_CLASSES_COUNT);
    data.xs.dispose();
    data.ys.dispose();
  });

  test('trainYogaModel trains neural classifier with 31 classes and rejects seated desk', async () => {
    const model = await trainYogaModel(1, null, 1);
    expect(model).toBeDefined();

    // Test seated person in predictHybridPoseAccuracy
    const seatedKeypoints = Array.from({ length: 17 }, () => ({ x: 0, y: 0, score: 0.05 }));
    seatedKeypoints[0] = { x: 300, y: 150, score: 0.92 };
    seatedKeypoints[5] = { x: 230, y: 280, score: 0.88 };
    seatedKeypoints[6] = { x: 370, y: 280, score: 0.88 };

    const result = await predictHybridPoseAccuracy(seatedKeypoints, 'Tree', model);
    expect(result.isPoseMatched).toBe(false);
    expect(result.confidence).toBeLessThanOrEqual(20);
    expect(result.feedbackCue).toContain('Seated at desk detected');
  });
});
