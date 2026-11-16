/**
 * FitVision AI — Voice Coach & Audio Telemetry Engine
 * Delivers natural voice instruction, anti-repetitive form coaching,
 * hold milestones, rep announcements, Hindi & English speech synthesis,
 * and Web Audio synthesizers.
 */

// Memory of last spoken timestamps and issue occurrences
const speechCooldowns = new Map();
const issueRepeatCounts = new Map();
let globalLastSpeechTime = 0;
let lastSpokenText = '';
let lastSpokenTime = 0;
let lastSpokenCategory = '';
let lastSpokenCategoryTime = 0;
const spokenSetups = new Set();
let currentSpeechUtterance = null;

// Settings state
const getStoredLanguage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('fitvision_voice_lang') || 'en';
    }
  } catch (e) {}
  return 'en';
};

const coachSettings = {
  voiceEnabled: true,
  soundEffectsEnabled: true,
  volume: 0.95,
  rate: 1.0,
  pitch: 1.0,
  preferredVoice: null,
  language: getStoredLanguage(), // 'en' | 'hi'
  chatterLevel: 'smart', // 'smart' (anti-repetitive) | 'quiet' | 'verbose'
};

// Hindi number names for rep counting
const HINDI_NUMBERS = [
  'शून्य', 'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाइस', 'उनतीस', 'तीस',
  'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास'
];

/**
 * Hindi Translation Mappings for Biomechanics & Coaching
 */
const HINDI_TRANSLATIONS = {
  // Common gym form corrections
  'keep back straight': 'अपनी पीठ सीधी रखें और आगे झुकने से बचें।',
  'back straight': 'रीढ़ और पीठ को सीधा रखें।',
  'knees tracking': 'घुटनों को पंजों की सीध में रखें, अंदर न झुकने दें।',
  'knees past toes': 'घुटनों को पंजों से ज्यादा आगे न जाने दें।',
  'lower your hips': 'कूल्हों को और नीचे लाएं, पूरी गहराई तक जाएं।',
  'full depth': 'पूरी गहराई तक जाएं, जांघों को समानांतर लाएं।',
  'elbows tucked': 'कोहनियों को शरीर के करीब रखें।',
  'elbow bend': 'कोहनियों को नब्बे डिग्री तक मोड़ें।',
  'brace core': 'पेट और कोर को कसकर रखें।',
  'avoid swinging': 'झटके से बचें, गति को नियंत्रित रखें।',
  'chest up': 'छाती को ऊपर और खुला रखें।',
  'drive through heels': 'एड़ियों पर दबाव बनाकर ऊपर उठें।',
  'full extension': 'पूरा ऊपर आएं और मांसपेशियों को सिकोड़ें।',

  // Common yoga form corrections
  'standing leg fully extended': 'खड़े पैर को सीधा रखें, घुटने को ढीला न छोड़ें।',
  'bent knee turned outward': 'मुड़े हुए घुटने को बाहर की ओर नब्बे डिग्री पर रखें।',
  'hips level': 'कूल्हों को एक समान सीध में रखें।',
  'chest open': 'छाती खोलें और कंधों को कानों से दूर रखें।',
  'straight strong spine': 'रीढ़ की हड्डी को सीधा और लंबा रखें।',
  'arms form vertical line': 'दोनों हाथों को एक सीधी रेखा में फैलाएं।',
  'press palms flat': 'हथेलियों को ज़मीन पर मजबूती से दबाएं।',
  'breathe deeply': 'गहरी और सहज सांस लेते रहें।',
  'hold steady': 'संतुलन बनाए रखें और स्थिर रहें।',

  // Framing cues
  'seated at desk': 'कृपया कैमरे से 6 से 8 फीट पीछे हटें ताकि सिर से पैर तक पूरा शरीर दिखे।',
  'step back': 'कृपया थोड़ा पीछे हटें ताकि आपका पूरा शरीर कैमरे में आ सके।',
  'step into view': 'कृपया कैमरे के सामने आएं ताकि ट्रैकिंग शुरू हो सके।',
  'adjust lighting': 'कृपया रोशनी ठीक करें ताकि शरीर साफ दिखाई दे।',
  'knees caving inward': 'घुटनों को अंदर की ओर न झुकने दें। उन्हें पंजों की सीध में रखें।',
  'excessive torso forward lean': 'धड़ को बहुत आगे न झुकाएं। पीठ सीधी रखें।',
  'hips sagging below shoulder plane': 'कूल्हों को नीचे न गिरने दें। कंधों और कूल्हों को एक सीध में रखें।',
  'elbow flaring away from ribs': 'कोहनियों को बाहर न फैलाएं। उन्हें पसलियों के पास रखें।',
  'arms raised above shoulder plane': 'हाथों को कंधों से ऊपर न उठाएं।',
  'arms swinging past shoulder level': 'हाथों को कंधों से ऊपर झुलाने से बचें। गति नियंत्रित रखें।',
  'elbows dropped below shoulder level': 'कोहनियों को कंधों की ऊंचाई पर रखें।',
  'elbows not lifted high enough': 'कोहनियों को थोड़ा और ऊपर उठाएं।',
  'keep hips in line with shoulders': 'कूल्हों को कंधों की सीध में रखें और कमर को नीचे न झुकने दें।',
  'stand tall with knees straight': 'सीधे खड़े रहें, घुटनों को सीधा रखें और कंधों को ढीला छोड़ें।',
  'show full body': 'पूरा शरीर कैमरे में दिखाने के लिए थोड़ा पीछे हटें।',
  'feet must be visible': 'पैरों को कैमरे में दिखाने के लिए थोड़ा पीछे हटें।',
};

/**
 * Translate an English coaching instruction to Hindi
 */
export const translateToHindi = (text, category = '') => {
  if (!text) return '';
  const lower = text.toLowerCase().trim();

  // Check exact or partial dictionary matches
  for (const [enKey, hiVal] of Object.entries(HINDI_TRANSLATIONS)) {
    if (lower.includes(enKey)) {
      return hiVal;
    }
  }

  // Common category-based fallbacks
  if (category === 'framing') {
    return 'कृपया थोड़ा पीछे हटें ताकि आपका पूरा शरीर कैमरे में दिखाई दे।';
  }
  if (category === 'correction') {
    return 'आसन में सुधार करें और संतुलन बनाए रखें।';
  }

  return text;
};

/**
 * Initialize and select the best natural voice available in the browser
 */
export const getBestVoice = (language = coachSettings.language) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;
  const normalizedLanguage = String(language).toLowerCase();

  // 1. If Hindi requested, search for native Hindi voices
  if (normalizedLanguage === 'hi' || normalizedLanguage.startsWith('hi-')) {
    const hindiVoice = voices.find(
      (v) =>
        String(v.lang).toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.includes('हिन्दी') ||
        v.name.toLowerCase().includes('swara') ||
        v.name.toLowerCase().includes('madhur') ||
        v.name.toLowerCase().includes('hemant') ||
        v.name.toLowerCase().includes('kalpana')
    );
    if (hindiVoice) return hindiVoice;

    // Fallback: Indian English voices pronounce Hindi/Sanskrit accurately
    const indianVoice = voices.find(
      (v) => String(v.lang).toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india')
    );
    if (indianVoice) return indianVoice;
    return null;
  }

  // 2. English voice selection
  const preferredNames = [
    'Google UK English Female',
    'Google US English',
    'Microsoft Zira',
    'Microsoft Jenny Online (Natural)',
    'Samantha',
    'Karen',
    'Daniel',
    'Serena',
  ];

  for (const name of preferredNames) {
    const match = voices.find((v) => v.name.includes(name) && String(v.lang).toLowerCase().startsWith('en'));
    if (match) return match;
  }

  const anyEnglish = voices.find((v) => String(v.lang).toLowerCase().startsWith('en'));
  return anyEnglish || voices[0];
};

/**
 * Web Audio API Synthesizer for high-fidelity audio cues
 */
export const AudioSynthesizer = {
  ctx: null,

  getContext() {
    if (typeof window === 'undefined') return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch (e) {
        return null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume().catch(() => {});
      } catch (e) {}
    }
    return this.ctx;
  },

  // Crisp chime on rep completion or pose verification
  playSuccessChime() {
    if (!coachSettings.soundEffectsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.22 * coachSettings.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {}
  },

  // Soft warning beep when form breaks or person steps out
  playWarningBeep() {
    if (!coachSettings.soundEffectsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.15);

      gain.gain.setValueAtTime(0.18 * coachSettings.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  },

  // Countdown tick beep
  playCountdownTick(isFinal = false) {
    if (!coachSettings.soundEffectsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);

      gain.gain.setValueAtTime(0.25 * coachSettings.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.3 : 0.12));

      osc.start(now);
      osc.stop(now + (isFinal ? 0.3 : 0.12));
    } catch (e) {}
  },

  // Celebration fanfare chord upon set/goal completion
  playFanfare() {
    if (!coachSettings.soundEffectsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.18 * coachSettings.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch (e) {}
  },
};

/**
 * Core Speech Dispatcher with Smart Anti-Repetition & Cooldown Pacing
 */
export const speakUtterance = (text, options = {}) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  if (!coachSettings.voiceEnabled || !text) return false;

  const {
    key = text,
    category = 'general',
    cooldownMs = 6000,
    priority = 'normal', // 'urgent' | 'high' | 'normal' | 'low'
    rate = coachSettings.rate,
    pitch = coachSettings.pitch,
    lang = coachSettings.language,
    onStart = null,
    onEnd = null,
  } = options;

  const now = Date.now();
  const normalizedText = text.trim().toLowerCase();

  // 1. ANTI-REPETITION: Drop identical speech if spoken within the last 15 seconds
  if (normalizedText === lastSpokenText && now - lastSpokenTime < 15000 && priority !== 'urgent') {
    return false;
  }

  // 2. ANTI-REPETITION: Specific key cooldown
  const lastSpokenForKey = speechCooldowns.get(key) || 0;
  if (now - lastSpokenForKey < cooldownMs) {
    return false;
  }

  // 3. CATEGORY PACING: Do not speak two form corrections within 10 seconds of each other
  if (category === 'correction') {
    if (now - lastSpokenCategoryTime < 10000 && priority !== 'urgent') {
      return false;
    }
  }

  // 4. GLOBAL PACING: Enforce at least 3.2s between spoken phrases (except urgent announcements)
  if (priority !== 'urgent' && now - globalLastSpeechTime < 3200) {
    return false;
  }

  try {
    // If urgent, stop speaking to deliver immediate safety/framing message
    if (priority === 'urgent' && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.volume = coachSettings.volume;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Apply voice and target language
    const voice = getBestVoice(lang);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = voice?.lang || (String(lang).toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-US');

    utterance.onstart = () => {
      currentSpeechUtterance = utterance;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (currentSpeechUtterance === utterance) {
        currentSpeechUtterance = null;
      }
      if (onEnd) onEnd();
    };

    speechCooldowns.set(key, now);
    globalLastSpeechTime = now;
    lastSpokenText = normalizedText;
    lastSpokenTime = now;
    if (category) {
      lastSpokenCategory = category;
      lastSpokenCategoryTime = now;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.warn('Speech synthesis error:', e);
    return false;
  }
};

/**
 * High-Level Voice Coach Engine for FitVision
 */
export const VoiceCoach = {
  // Update configuration
  configure(newSettings = {}) {
    Object.assign(coachSettings, newSettings);
    if (newSettings.language && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('fitvision_voice_lang', newSettings.language);
      } catch (e) {}
    }
  },

  getSettings() {
    return { ...coachSettings };
  },

  setLanguage(lang) {
    const validLang = lang === 'hi' ? 'hi' : 'en';
    coachSettings.language = validLang;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('fitvision_voice_lang', validLang);
      }
    } catch (e) {}
    return validLang;
  },

  getLanguage() {
    return coachSettings.language;
  },

  getLastCategory() {
    return lastSpokenCategory;
  },

  speak(text, options = {}) {
    return speakUtterance(text, {
      ...options,
      lang: options.lang || coachSettings.language,
    });
  },

  toggleLanguage() {
    const nextLang = coachSettings.language === 'hi' ? 'en' : 'hi';
    this.setLanguage(nextLang);
    return nextLang;
  },

  stopAll() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  // Clear session issues so user gets fresh feedback on a new pose
  resetSessionState() {
    issueRepeatCounts.clear();
    lastSpokenText = '';
    lastSpokenCategoryTime = 0;
  },

  // Quick test of selected language voice
  testVoice(targetLang = coachSettings.language) {
    AudioSynthesizer.playSuccessChime();
    const testText = targetLang === 'hi'
      ? 'नमस्ते! फिटविज़न हिंदी वॉइस कोच तैयार है।'
      : 'FitVision Voice Coach is active and ready.';

    speakUtterance(testText, {
      key: `voice_test_${targetLang}`,
      cooldownMs: 2000,
      priority: 'urgent',
      lang: targetLang,
      rate: 1.0,
    });
  },

  // ──────────────────────────── YOGA INSTRUCTION SUITE ────────────────────────────

  // 1. Initial pose setup guidance (what to do) — Spoken once per pose to avoid irritation
  instructYogaPoseStart(pose) {
    if (!pose) return;
    this.stopAll();

    const isHindi = coachSettings.language === 'hi';
    const poseKey = `setup_${coachSettings.language}_${pose.id || pose.name}`;

    // Never repeat identical setup cue in the same session
    if (spokenSetups.has(poseKey)) {
      return;
    }
    spokenSetups.add(poseKey);

    let speechText = '';
    if (isHindi) {
      const sanskrit = pose.sanskrit || pose.name;
      speechText = `${sanskrit} शुरू करें। एक पैर पर संतुलन बनाएं और रीढ़ सीधी रखें।`;
    } else {
      const primaryInstruction = pose.instructions && pose.instructions[0]
        ? pose.instructions[0]
        : `Stand tall and prepare for ${pose.name}.`;
      speechText = `Starting ${pose.name}. ${primaryInstruction}`;
    }

    speakUtterance(speechText, {
      key: `yoga_start_${pose.id}`,
      category: 'setup',
      cooldownMs: 25000,
      priority: 'high',
      lang: coachSettings.language,
      rate: 1.0,
    });
  },

  // 2. Framing alert (generous 18s cooldown to avoid annoying users while adjusting)
  instructFramingAlert(reason, poseName = 'this pose') {
    AudioSynthesizer.playWarningBeep();

    const isHindi = coachSettings.language === 'hi';
    let text = '';

    if (isHindi) {
      if (reason && reason.includes('Seated at desk')) {
        text = 'कृपया कैमरे से 6 से 8 फीट पीछे हटें ताकि पूरा शरीर दिखाई दे।';
      } else {
        text = 'कृपया थोड़ा पीछे हटें ताकि आपका पूरा शरीर कैमरे में आ सके।';
      }
    } else {
      if (reason && reason.includes('Seated at desk')) {
        text = 'Please step back 6 to 8 feet so your full body is inside the camera.';
      } else {
        text = `Please step back so your full body is visible for ${poseName}.`;
      }
    }

    speakUtterance(text, {
      key: 'framing_alert',
      category: 'framing',
      cooldownMs: 18000, // 18 seconds spacing prevents irritating chatter
      priority: 'urgent',
      lang: coachSettings.language,
      rate: 1.05,
    });
  },

  // 3. Form alignment correction with exponential backoff & chime fallback
  instructYogaCorrection(feedbackCue, poseId) {
    if (!feedbackCue || feedbackCue.includes('Pose Verified') || feedbackCue.includes('Position yourself')) return;
    const cleanText = feedbackCue.replace(/^[⚠️✓✗⚡🔥○•]\s*/g, '').trim();
    if (!cleanText) return;

    const issueKey = `yoga_cue_${cleanText}`;
    const repeatCount = issueRepeatCounts.get(issueKey) || 0;

    // If repeated 2+ times, DO NOT speak again to avoid irritation — play soft chime instead
    if (repeatCount >= 2) {
      AudioSynthesizer.playWarningBeep();
      return;
    }

    const isHindi = coachSettings.language === 'hi';
    const spokenText = isHindi ? translateToHindi(cleanText, 'correction') : cleanText;

    // Backoff cooldowns: 1st time 16s, 2nd time 28s
    const cooldown = repeatCount === 0 ? 16000 : 28000;
    issueRepeatCounts.set(issueKey, repeatCount + 1);

    speakUtterance(spokenText, {
      key: issueKey,
      category: 'correction',
      cooldownMs: cooldown,
      priority: 'normal',
      lang: coachSettings.language,
      rate: 1.0,
    });
  },

  // 4. Pose verified celebration & hold milestones
  instructYogaVerified(poseName, holdSeconds = 0) {
    const isHindi = coachSettings.language === 'hi';

    if (holdSeconds < 1) {
      // Clear issue counters on successful pose lock
      issueRepeatCounts.clear();
      AudioSynthesizer.playSuccessChime();

      const text = isHindi
        ? 'मुद्रा बिल्कुल सही है! इसी स्थिति में बने रहें और गहरी सांस लें।'
        : 'Form locked in! Hold steady and breathe deeply.';

      speakUtterance(text, {
        key: 'yoga_verified_start',
        category: 'milestone',
        cooldownMs: 20000,
        priority: 'high',
        lang: coachSettings.language,
      });
      return;
    }

    const roundedSec = Math.floor(holdSeconds);
    const milestones = [10, 20, 30, 45, 60, 90, 120];

    if (milestones.includes(roundedSec)) {
      let msg = '';
      if (isHindi) {
        if (roundedSec === 10) msg = '10 सेकंड पूरे! बहुत बढ़िया संतुलन।';
        else if (roundedSec === 20) msg = '20 सेकंड! सांस पर ध्यान बनाए रखें।';
        else if (roundedSec === 30) msg = '30 सेकंड पूरे! आधा मिनट शानदार रहा।';
        else if (roundedSec === 60) msg = 'एक पूरा मिनट! अद्भुत नियंत्रण और स्थिरता!';
        else msg = `${roundedSec} सेकंड पूरे! बहुत खूब।`;
      } else {
        if (roundedSec === 10) msg = '10 seconds held, excellent balance!';
        else if (roundedSec === 20) msg = '20 seconds, stay centered and breathe.';
        else if (roundedSec === 30) msg = '30 seconds held, halfway to one minute!';
        else if (roundedSec === 60) msg = 'One full minute completed, incredible focus!';
        else msg = `${roundedSec} seconds held!`;
      }

      AudioSynthesizer.playSuccessChime();
      speakUtterance(msg, {
        key: `yoga_hold_${roundedSec}`,
        category: 'milestone',
        cooldownMs: 12000,
        priority: 'normal',
        lang: coachSettings.language,
      });
    }
  },

  // 5. Personal best record celebration
  instructPersonalBest(seconds) {
    AudioSynthesizer.playFanfare();
    const isHindi = coachSettings.language === 'hi';
    const text = isHindi
      ? `नया व्यक्तिगत रिकॉर्ड! ${seconds.toFixed(0)} सेकंड!`
      : `New personal best record! ${seconds.toFixed(0)} seconds!`;

    speakUtterance(text, {
      key: 'yoga_best_record',
      category: 'celebration',
      cooldownMs: 20000,
      priority: 'high',
      lang: coachSettings.language,
    });
  },

  // 6. Practice session completion
  instructYogaSessionEnd(poseName, durationSec, calories) {
    this.stopAll();
    AudioSynthesizer.playFanfare();

    const isHindi = coachSettings.language === 'hi';
    let text = '';
    if (isHindi) {
      text = `योगाभ्यास पूरा हुआ! आपने ${poseName} का शानदार अभ्यास किया, लगभग ${calories} कैलोरी बर्न की।`;
    } else {
      const durationText = durationSec > 60
        ? `${Math.floor(durationSec / 60)} minutes and ${Math.round(durationSec % 60)} seconds`
        : `${Math.round(durationSec)} seconds`;
      text = `Great session! You practiced ${poseName} for ${durationText}, burning approximately ${calories} calories.`;
    }

    speakUtterance(text, {
      key: 'yoga_end_summary',
      category: 'summary',
      cooldownMs: 6000,
      priority: 'high',
      lang: coachSettings.language,
    });
  },

  // ──────────────────────────── GYM INSTRUCTION SUITE ────────────────────────────

  // 1. Initial exercise setup guidance (spoken once per exercise)
  instructGymExerciseStart(exercisePattern, exerciseGuide) {
    if (!exercisePattern) return;
    this.stopAll();

    const exKey = `gym_setup_${coachSettings.language}_${exercisePattern.id}`;
    if (spokenSetups.has(exKey)) return;
    spokenSetups.add(exKey);

    const isHindi = coachSettings.language === 'hi';
    let speechText = '';
    if (isHindi) {
      speechText = `${exercisePattern.name} शुरू करें। कैमरे के सामने सही स्थिति लें और तैयार होने पर शुरू करें।`;
    } else {
      const summary = exerciseGuide?.summary || 'Position yourself in frame and begin when ready.';
      speechText = `Starting ${exercisePattern.name}. ${summary}`;
    }

    speakUtterance(speechText, {
      key: `gym_start_${exercisePattern.id}`,
      category: 'setup',
      cooldownMs: 25000,
      priority: 'high',
      lang: coachSettings.language,
      rate: 1.05,
    });
  },

  // 2. Rep count announcement with encouraging cadence (Hindi & English)
  instructGymRep(repCount, targetGoal = 0) {
    AudioSynthesizer.playSuccessChime();
    // Clear issue repeat counts when user completes a rep
    issueRepeatCounts.clear();

    const isHindi = coachSettings.language === 'hi';
    let text = '';
    let priority = 'normal';

    if (isHindi) {
      const hindiNum = HINDI_NUMBERS[repCount] || `${repCount}`;
      text = hindiNum;

      if (targetGoal > 0) {
        if (repCount === Math.floor(targetGoal / 2)) {
          text = `रैप ${hindiNum}, आधा लक्ष्य पूरा!`;
          priority = 'high';
        } else if (repCount === targetGoal - 2) {
          text = 'दो रैप्स और, जारी रखें!';
          priority = 'high';
        } else if (repCount === targetGoal - 1) {
          text = 'अंतिम रैप, पूरा दम लगाएं!';
          priority = 'high';
        } else if (repCount >= targetGoal) {
          text = `रैप ${hindiNum}! लक्ष्य पूरा हुआ!`;
          priority = 'urgent';
        }
      }
    } else {
      text = `${repCount}`;
      if (targetGoal > 0) {
        if (repCount === Math.floor(targetGoal / 2)) {
          text = `Rep ${repCount}, halfway there!`;
          priority = 'high';
        } else if (repCount === targetGoal - 2) {
          text = `Rep ${repCount}, two more reps!`;
          priority = 'high';
        } else if (repCount === targetGoal - 1) {
          text = `Rep ${repCount}, last clean rep!`;
          priority = 'high';
        } else if (repCount >= targetGoal) {
          text = `Rep ${repCount}! Target crushed!`;
          priority = 'urgent';
        }
      }
    }

    speakUtterance(text, {
      key: `rep_${repCount}`,
      category: 'rep',
      cooldownMs: 800,
      priority,
      lang: coachSettings.language,
      rate: 1.1,
    });
  },

  // 3. Form correction with anti-irritation exponential backoff & chime
  instructGymCorrection(issue) {
    if (!issue || issue.includes('Good form') || issue.includes('Get ready')) return;
    const cleanText = issue.replace(/^[⚠️✓✗⚡🔥○•]\s*/g, '').trim();
    if (!cleanText) return;

    const issueKey = `gym_issue_${cleanText}`;
    const repeatCount = issueRepeatCounts.get(issueKey) || 0;

    // If repeated 2+ times, avoid speaking voice again so user isn't irritated
    if (repeatCount >= 2) {
      AudioSynthesizer.playWarningBeep();
      return;
    }

    const isHindi = coachSettings.language === 'hi';
    const spokenText = isHindi ? translateToHindi(cleanText, 'correction') : cleanText;

    // Generous spacing: 16s on first mention, 30s on second
    const cooldown = repeatCount === 0 ? 16000 : 30000;
    issueRepeatCounts.set(issueKey, repeatCount + 1);

    AudioSynthesizer.playWarningBeep();
    speakUtterance(spokenText, {
      key: issueKey,
      category: 'correction',
      cooldownMs: cooldown,
      priority: 'high',
      lang: coachSettings.language,
      rate: 1.05,
    });
  },

  // 4. Set complete & rest announcement
  instructSetComplete(setNumber, repsDone, restSeconds = 45) {
    AudioSynthesizer.playFanfare();
    issueRepeatCounts.clear();

    const isHindi = coachSettings.language === 'hi';
    const text = isHindi
      ? `सेट ${setNumber} पूरा हुआ! ${repsDone} रैप्स बहुत अच्छे। ${restSeconds} सेकंड आराम करें।`
      : `Set ${setNumber} complete with ${repsDone} reps! Take ${restSeconds} seconds to recover.`;

    speakUtterance(text, {
      key: `gym_set_complete_${setNumber}`,
      category: 'milestone',
      cooldownMs: 12000,
      priority: 'high',
      lang: coachSettings.language,
    });
  },

  // 5. Rest timer countdown
  instructRestCountdown(secondsRemaining) {
    const isHindi = coachSettings.language === 'hi';

    if (secondsRemaining <= 3 && secondsRemaining >= 1) {
      AudioSynthesizer.playCountdownTick(secondsRemaining === 1);
    } else if (secondsRemaining === 10) {
      const text = isHindi
        ? '10 सेकंड का आराम बाकी है। अगले सेट के लिए तैयार हो जाएं।'
        : '10 seconds of rest remaining. Prepare for your next set.';

      speakUtterance(text, {
        key: 'rest_10s',
        category: 'rest',
        cooldownMs: 15000,
        priority: 'normal',
        lang: coachSettings.language,
      });
    } else if (secondsRemaining === 0) {
      AudioSynthesizer.playCountdownTick(true);
      const text = isHindi
        ? 'आराम पूरा हुआ! चलिए अगला सेट शुरू करते हैं।'
        : 'Rest complete! Let’s crush this next set.';

      speakUtterance(text, {
        key: 'rest_done',
        category: 'rest',
        cooldownMs: 10000,
        priority: 'high',
        lang: coachSettings.language,
      });
    }
  },

  // 6. Workout finished celebration
  instructGymWorkoutEnd(exerciseName, totalReps, totalSets, calories) {
    this.stopAll();
    AudioSynthesizer.playFanfare();

    const isHindi = coachSettings.language === 'hi';
    const text = isHindi
      ? `वर्कआउट पूरा! आपने ${totalReps} रैप्स और ${totalSets} सेट्स पूरे किए, लगभग ${calories} कैलोरी बर्न की। शानदार मेहनत!`
      : `Workout complete! You conquered ${totalReps} total reps across ${totalSets} sets of ${exerciseName}, burning ${calories} calories. Excellent dedication!`;

    speakUtterance(text, {
      key: 'gym_end_summary',
      category: 'celebration',
      cooldownMs: 6000,
      priority: 'high',
      lang: coachSettings.language,
    });
  },
};

export const soundEffects = {
  ...AudioSynthesizer,
  playRepSuccess: () => AudioSynthesizer.playSuccessChime(),
  playFormMilestone: () => AudioSynthesizer.playSuccessChime(),
  playFanfare: () => AudioSynthesizer.playFanfare(),
};

export const speakInstruction = (text, options = {}) => {
  return VoiceCoach.speak(text, options);
};

export default VoiceCoach;
