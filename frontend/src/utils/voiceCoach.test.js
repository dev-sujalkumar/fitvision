import { VoiceCoach, AudioSynthesizer, speakUtterance, translateToHindi } from './voiceCoach';

describe('VoiceCoach and Audio Synthesizer Unit Tests', () => {
  beforeEach(() => {
    VoiceCoach.configure({
      voiceEnabled: true,
      soundEffectsEnabled: true,
      volume: 1.0,
      rate: 1.0,
      language: 'en',
    });
    VoiceCoach.resetSessionState();
  });

  test('VoiceCoach configuration getter and setter work properly', () => {
    VoiceCoach.configure({ volume: 0.75, voiceEnabled: false, language: 'hi' });
    const settings = VoiceCoach.getSettings();
    expect(settings.volume).toBe(0.75);
    expect(settings.voiceEnabled).toBe(false);
    expect(settings.language).toBe('hi');
  });

  test('VoiceCoach language toggle and getter work properly', () => {
    VoiceCoach.setLanguage('hi');
    expect(VoiceCoach.getLanguage()).toBe('hi');
    VoiceCoach.toggleLanguage();
    expect(VoiceCoach.getLanguage()).toBe('en');
  });

  test('translateToHindi maps English cues to natural Hindi phrases', () => {
    const hindi1 = translateToHindi('Keep back straight and chest lifted');
    expect(hindi1).toContain('पीठ');
    const hindi2 = translateToHindi('Knees tracking over toes');
    expect(hindi2).toContain('घुटनों');
  });

  test('AudioSynthesizer methods run safely without throwing in headless environments', () => {
    expect(() => AudioSynthesizer.playSuccessChime()).not.toThrow();
    expect(() => AudioSynthesizer.playWarningBeep()).not.toThrow();
    expect(() => AudioSynthesizer.playCountdownTick(true)).not.toThrow();
    expect(() => AudioSynthesizer.playFanfare()).not.toThrow();
  });

  test('speakUtterance runs safely in headless environments', () => {
    expect(() => speakUtterance('Test guidance', { priority: 'normal' })).not.toThrow();
    expect(() => speakUtterance('Urgent step back', { priority: 'urgent' })).not.toThrow();
    expect(() => speakUtterance('हिंदी परीक्षण', { lang: 'hi' })).not.toThrow();
  });

  test('VoiceCoach Yoga instructions run safely in English and Hindi', () => {
    const mockPose = {
      id: 'Tree',
      name: 'Tree Pose',
      sanskrit: 'Vrikshasana',
      instructions: ['Bend knee and place foot on calf'],
      focus: 'Balance',
    };

    // English
    expect(() => VoiceCoach.instructYogaPoseStart(mockPose)).not.toThrow();
    expect(() => VoiceCoach.instructFramingAlert('Seated at desk detected', 'Tree Pose')).not.toThrow();
    expect(() => VoiceCoach.instructYogaCorrection('Lift one foot onto calf', 'Tree')).not.toThrow();
    expect(() => VoiceCoach.instructYogaVerified('Tree Pose', 0)).not.toThrow();
    expect(() => VoiceCoach.instructYogaVerified('Tree Pose', 10)).not.toThrow();
    expect(() => VoiceCoach.instructPersonalBest(30)).not.toThrow();
    expect(() => VoiceCoach.instructYogaSessionEnd('Tree Pose', 45, 12)).not.toThrow();

    // Hindi mode
    VoiceCoach.setLanguage('hi');
    expect(() => VoiceCoach.instructYogaPoseStart(mockPose)).not.toThrow();
    expect(() => VoiceCoach.instructFramingAlert('Step back to fit frame', 'वृक्षासन')).not.toThrow();
    expect(() => VoiceCoach.instructYogaCorrection('Keep back straight', 'Tree')).not.toThrow();
    expect(() => VoiceCoach.instructYogaVerified('वृक्षासन', 0)).not.toThrow();
    expect(() => VoiceCoach.instructYogaVerified('वृक्षासन', 20)).not.toThrow();
    expect(() => VoiceCoach.instructPersonalBest(45)).not.toThrow();
    expect(() => VoiceCoach.instructYogaSessionEnd('वृक्षासन', 60, 20)).not.toThrow();
  });

  test('VoiceCoach Gym instructions run safely in English and Hindi', () => {
    const mockPattern = { id: 'SQUAT', name: 'Squat' };
    const mockGuide = { summary: 'Stand with feet shoulder-width apart' };

    // English
    expect(() => VoiceCoach.instructGymExerciseStart(mockPattern, mockGuide)).not.toThrow();
    expect(() => VoiceCoach.instructGymRep(1, 10)).not.toThrow();
    expect(() => VoiceCoach.instructGymRep(5, 10)).not.toThrow();
    expect(() => VoiceCoach.instructGymRep(10, 10)).not.toThrow();
    expect(() => VoiceCoach.instructGymCorrection('Push knees outward over toes')).not.toThrow();
    expect(() => VoiceCoach.instructSetComplete(1, 10, 45)).not.toThrow();
    expect(() => VoiceCoach.instructRestCountdown(10)).not.toThrow();
    expect(() => VoiceCoach.instructRestCountdown(2)).not.toThrow();
    expect(() => VoiceCoach.instructGymWorkoutEnd('Squat', 30, 3, 45)).not.toThrow();

    // Hindi mode
    VoiceCoach.setLanguage('hi');
    expect(() => VoiceCoach.instructGymExerciseStart(mockPattern, mockGuide)).not.toThrow();
    expect(() => VoiceCoach.instructGymRep(1, 10)).not.toThrow();
    expect(() => VoiceCoach.instructGymRep(5, 10)).not.toThrow();
    expect(() => VoiceCoach.instructGymRep(10, 10)).not.toThrow();
    expect(() => VoiceCoach.instructGymCorrection('Keep back straight')).not.toThrow();
    expect(() => VoiceCoach.instructSetComplete(2, 12, 45)).not.toThrow();
    expect(() => VoiceCoach.instructRestCountdown(10)).not.toThrow();
    expect(() => VoiceCoach.instructRestCountdown(0)).not.toThrow();
    expect(() => VoiceCoach.instructGymWorkoutEnd('Squat', 30, 3, 45)).not.toThrow();
  });

  test('Anti-repetition suppresses consecutive identical cues', () => {
    VoiceCoach.resetSessionState();
    // Repeating the same correction multiple times triggers chime fallback instead of error
    expect(() => VoiceCoach.instructGymCorrection('Keep back straight')).not.toThrow();
    expect(() => VoiceCoach.instructGymCorrection('Keep back straight')).not.toThrow();
    expect(() => VoiceCoach.instructGymCorrection('Keep back straight')).not.toThrow();
  });
});
