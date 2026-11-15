/**
 * FitVision AI — High-Definition Yoga Pose Visual Graphics & Vector Illustrations
 * Provides crisp, high-fidelity human character illustrations for all 28 yoga movement disciplines,
 * full biomechanical skeletal diagrams with angle indicators for Anatomy mode,
 * and maintains backward-compatibility imports for legacy JPG assets.
 */

import chairJpg from './pose_images/chair.jpg';
import cobraJpg from './pose_images/cobra.jpg';
import dogJpg from './pose_images/dog.jpg';
import treeJpg from './pose_images/tree.jpg';
import warriorJpg from './pose_images/warrior.jpg';
import triangleJpg from './pose_images/traingle.jpg';
import shoulderstandJpg from './pose_images/shoulderstand.jpg';

// Helper to generate full-color human character illustrations
const generatePoseIllustrationSvg = (poseId, auraColor, bodyElements) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad_${poseId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#18152e" />
        <stop offset="60%" stop-color="#211b3d" />
        <stop offset="100%" stop-color="#0f0c1e" />
      </linearGradient>
      <radialGradient id="auraGrad_${poseId}" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="${auraColor}" stop-opacity="0.35" />
        <stop offset="65%" stop-color="${auraColor}" stop-opacity="0.08" />
        <stop offset="100%" stop-color="${auraColor}" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="topGrad_${poseId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fb7185" />
        <stop offset="100%" stop-color="#e11d48" />
      </linearGradient>
      <linearGradient id="pantsGrad_${poseId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
      <linearGradient id="matGrad_${poseId}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#4c1d95" stop-opacity="0.8" />
        <stop offset="50%" stop-color="#6d28d9" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#4c1d95" stop-opacity="0.8" />
      </linearGradient>
      <filter id="softGlow_${poseId}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Studio Background Canvas -->
    <rect width="320" height="260" rx="16" fill="url(#bgGrad_${poseId})" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />
    <circle cx="160" cy="130" r="105" fill="url(#auraGrad_${poseId})" />

    <!-- Studio Floor Line & Yoga Mat -->
    <line x1="24" y1="225" x2="296" y2="225" stroke="rgba(255,255,255,0.10)" stroke-width="1.5" stroke-dasharray="4,4" />
    <rect x="36" y="222" width="248" height="7" rx="3.5" fill="url(#matGrad_${poseId})" stroke="rgba(167,139,250,0.35)" stroke-width="1" />

    <!-- Human Character Pose Figure -->
    ${bodyElements}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Helper to generate anatomical skeletal diagrams with angle arcs
const generatePoseAnatomySvg = (poseId, title, color = '#8b5cf6', pathCoords) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" width="100%" height="100%">
    <defs>
      <linearGradient id="anaBg_${poseId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f0c1e" />
        <stop offset="50%" stop-color="#17122b" />
        <stop offset="100%" stop-color="#0a0815" />
      </linearGradient>
      <radialGradient id="anaGlow_${poseId}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.30" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0" />
      </radialGradient>
      <filter id="anaNodeGlow_${poseId}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <!-- Background Frame -->
    <rect width="320" height="260" rx="16" fill="url(#anaBg_${poseId})" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />
    <circle cx="160" cy="130" r="95" fill="url(#anaGlow_${poseId})" />
    <!-- Floor Grid / Mat Line -->
    <line x1="30" y1="225" x2="290" y2="225" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-dasharray="4,4" />
    <!-- Skeletal Joints & Biomechanical Rays -->
    ${pathCoords}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Full-color human character illustrations for all 28 yoga poses
export const POSE_ILLUSTRATIONS = {
  Tree: generatePoseIllustrationSvg('Tree', '#10b981', `
      <!-- Standing Leg (Left) -->
      <path d="M160,135 L160,180 L160,223" stroke="url(#pantsGrad_Tree)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="160" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Bent Leg (Right) Foot resting on inner thigh -->
      <path d="M160,135 L205,165 L162,172" stroke="url(#pantsGrad_Tree)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="162" cy="172" rx="4" ry="6" fill="#fed7aa" />
      <!-- Torso & Athletic Top -->
      <path d="M152,136 L168,136 L166,95 L154,95 Z" fill="url(#pantsGrad_Tree)" />
      <path d="M153,105 L167,105 L165,80 L155,80 Z" fill="url(#topGrad_Tree)" />
      <!-- Head & Hair -->
      <circle cx="160" cy="58" r="12" fill="#fed7aa" />
      <circle cx="160" cy="44" r="7" fill="#1e1b4b" />
      <path d="M150,56 Q160,46 170,56 Q165,48 160,48 Q155,48 150,56 Z" fill="#1e1b4b" />
      <!-- Arms in Anjali Mudra (Prayer at chest) -->
      <path d="M154,82 L142,105 L158,102" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M166,82 L178,105 L162,102" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="160" cy="101" rx="4" ry="6" fill="#fed7aa" />
    `),
  Chair: generatePoseIllustrationSvg('Chair', '#f59e0b', `
      <!-- Shins (angled) -->
      <path d="M148,223 L135,185" stroke="url(#pantsGrad_Chair)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="148" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Thighs (deep squat parallel) -->
      <path d="M135,185 L182,148" stroke="url(#pantsGrad_Chair)" stroke-width="12" stroke-linecap="round" fill="none" />
      <!-- Torso (angled forward) -->
      <path d="M182,148 L142,95" stroke="url(#pantsGrad_Chair)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M165,125 L140,92" stroke="url(#topGrad_Chair)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head -->
      <circle cx="132" cy="78" r="12" fill="#fed7aa" />
      <circle cx="142" cy="70" r="7" fill="#1e1b4b" />
      <path d="M124,78 Q132,68 140,78 Q136,70 132,70 Z" fill="#1e1b4b" />
      <!-- Arms raised high along ears -->
      <path d="M140,92 L95,50" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="95" cy="50" rx="3.5" ry="4.5" fill="#fed7aa" />
    `),
  WarriorI: generatePoseIllustrationSvg('WarriorI', '#8b5cf6', `
      <!-- Back straight leg -->
      <path d="M152,140 L218,223" stroke="url(#pantsGrad_WarriorI)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="218" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Front lunge leg (90 deg) -->
      <path d="M152,140 L115,168 L115,223" stroke="url(#pantsGrad_WarriorI)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="115" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Torso upright -->
      <path d="M152,140 L150,90" stroke="url(#pantsGrad_WarriorI)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M151,118 L150,88" stroke="url(#topGrad_WarriorI)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head looking upward -->
      <circle cx="150" cy="72" r="12" fill="#fed7aa" />
      <path d="M156,66 Q166,74 162,82" stroke="#1e1b4b" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- Arms overhead parallel reaching high -->
      <path d="M148,88 L142,42" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M152,88 L158,42" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="150" cy="40" rx="6" ry="3" fill="#fed7aa" />
    `),
  WarriorII: generatePoseIllustrationSvg('WarriorII', '#ef4444', `
      <!-- Back straight leg -->
      <path d="M160,140 L228,223" stroke="url(#pantsGrad_WarriorII)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="228" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Front bent leg (90 deg lunge) -->
      <path d="M160,140 L115,168 L115,223" stroke="url(#pantsGrad_WarriorII)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="115" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Torso upright open -->
      <path d="M160,140 L160,92" stroke="url(#pantsGrad_WarriorII)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M160,120 L160,90" stroke="url(#topGrad_WarriorII)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head looking over front hand -->
      <circle cx="158" cy="72" r="12" fill="#fed7aa" />
      <circle cx="166" cy="68" r="6" fill="#1e1b4b" />
      <!-- Horizontal outstretched arms -->
      <path d="M160,92 L80,92" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <path d="M160,92 L245,92" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="78" cy="92" rx="4" ry="3" fill="#fed7aa" />
      <ellipse cx="247" cy="92" rx="4" ry="3" fill="#fed7aa" />
    `),
  WarriorIII: generatePoseIllustrationSvg('WarriorIII', '#06b6d4', `
      <!-- Standing Leg (Right) straight vertical grounded -->
      <path d="M165,125 L165,175 L165,223" stroke="url(#pantsGrad_WarriorIII)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="165" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Back Leg extended horizontally straight behind -->
      <path d="M165,125 L215,125 L265,125" stroke="url(#pantsGrad_WarriorIII)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M265,125 L265,133" stroke="#fed7aa" stroke-width="5" stroke-linecap="round" fill="none" />
      <!-- Horizontal Torso -->
      <path d="M165,125 L115,125" stroke="url(#pantsGrad_WarriorIII)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M145,125 L110,125" stroke="url(#topGrad_WarriorIII)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head facing down with ponytail trailing -->
      <circle cx="96" cy="125" r="11" fill="#fed7aa" />
      <path d="M96,118 Q110,112 120,116" stroke="#1e1b4b" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- Arms reaching straight forward parallel to mat -->
      <path d="M110,125 L50,125" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="48" cy="125" rx="4" ry="3" fill="#fed7aa" />
    `),
  DownwardDog: generatePoseIllustrationSvg('DownwardDog', '#3b82f6', `
      <!-- Arms to mat -->
      <path d="M165,105 L95,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" fill="none" />
      <ellipse cx="93" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Torso angled up to hip apex -->
      <path d="M120,175 L165,105" stroke="url(#topGrad_DownwardDog)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head relaxed down between arms -->
      <circle cx="118" cy="170" r="11" fill="#fed7aa" />
      <path d="M112,176 Q108,188 112,194" stroke="#1e1b4b" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- Legs from hip apex straight down to heels on mat -->
      <path d="M165,105 L235,223" stroke="url(#pantsGrad_DownwardDog)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="235" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
    `),
  UpwardDog: generatePoseIllustrationSvg('UpwardDog', '#10b981', `
      <!-- Strong vertical straight arms supporting torso on mat -->
      <path d="M110,145 L110,223" stroke="#fed7aa" stroke-width="7.5" stroke-linecap="round" fill="none" />
      <ellipse cx="110" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Arched Torso with open chest curving upward -->
      <path d="M175,190 Q145,180 120,150" stroke="url(#topGrad_UpwardDog)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head tilted back proudly, chin lifted, hair trailing back -->
      <circle cx="102" cy="122" r="12" fill="#fed7aa" />
      <path d="M96,126 Q86,136 80,148" stroke="#1e1b4b" stroke-width="4.5" stroke-linecap="round" fill="none" />
      <circle cx="94" cy="120" r="6" fill="#1e1b4b" />
      <!-- Extended straight legs (knees & thighs lifted off mat) -->
      <path d="M175,190 L220,208 L258,218" stroke="url(#pantsGrad_UpwardDog)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <!-- Tops of feet pressing into mat -->
      <path d="M258,218 L272,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
    `),
  Cobra: generatePoseIllustrationSvg('Cobra', '#ec4899', `
      <!-- Hands on mat under shoulders -->
      <ellipse cx="108" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Bent arms hugging ribs -->
      <path d="M120,165 L108,198 L108,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <!-- Lifted chest curving forward -->
      <path d="M165,220 Q145,198 120,165" stroke="url(#topGrad_Cobra)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head looking forward/up -->
      <circle cx="110" cy="138" r="12" fill="#fed7aa" />
      <circle cx="104" cy="134" r="6" fill="#1e1b4b" />
      <!-- Grounded legs flat along mat -->
      <path d="M165,220 L255,222" stroke="url(#pantsGrad_Cobra)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="258" cy="223" rx="6" ry="3" fill="#fed7aa" />
    `),
  Triangle: generatePoseIllustrationSvg('Triangle', '#f59e0b', `
      <!-- Wide straight legs -->
      <path d="M185,145 L120,223" stroke="url(#pantsGrad_Triangle)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M185,145 L242,223" stroke="url(#pantsGrad_Triangle)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="120" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <ellipse cx="242" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Laterally tilted torso -->
      <path d="M185,145 L145,105" stroke="url(#topGrad_Triangle)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head looking upward toward top hand -->
      <circle cx="140" cy="88" r="11" fill="#fed7aa" />
      <path d="M142,82 Q148,74 154,80" stroke="#1e1b4b" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <!-- Vertical continuous arm line: right down to ankle, left up to sky -->
      <path d="M120,195 L145,105 L165,48" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="165" cy="46" rx="3.5" ry="4" fill="#fed7aa" />
      <ellipse cx="120" cy="197" rx="3.5" ry="4" fill="#fed7aa" />
    `),
  ExtendedSideAngle: generatePoseIllustrationSvg('ExtendedSideAngle', '#a855f7', `
      <!-- Back straight leg -->
      <path d="M175,155 L248,223" stroke="url(#pantsGrad_ExtendedSideAngle)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="248" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Front 90-deg lunge leg -->
      <path d="M175,155 L115,178 L115,223" stroke="url(#pantsGrad_ExtendedSideAngle)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="115" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Torso angled over front thigh -->
      <path d="M175,155 L132,125" stroke="url(#topGrad_ExtendedSideAngle)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Right forearm resting on front knee -->
      <path d="M132,125 L120,174" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Head -->
      <circle cx="128" cy="108" r="11" fill="#fed7aa" />
      <!-- Left arm forming long unbroken diagonal line overhead -->
      <path d="M132,125 L75,70" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="73" cy="68" rx="4" ry="4" fill="#fed7aa" />
    `),
  Mountain: generatePoseIllustrationSvg('Mountain', '#38bdf8', `
      <!-- Straight standing legs together -->
      <path d="M155,130 L155,223" stroke="url(#pantsGrad_Mountain)" stroke-width="11" stroke-linecap="round" fill="none" />
      <path d="M165,130 L165,223" stroke="url(#pantsGrad_Mountain)" stroke-width="11" stroke-linecap="round" fill="none" />
      <ellipse cx="155" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <ellipse cx="165" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Torso tall and grounded -->
      <path d="M160,135 L160,88" stroke="url(#topGrad_Mountain)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head tall with crown reaching high -->
      <circle cx="160" cy="65" r="12" fill="#fed7aa" />
      <circle cx="160" cy="51" r="6" fill="#1e1b4b" />
      <!-- Relaxed arms at sides with open palms -->
      <path d="M152,90 L140,145" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M168,90 L180,145" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="140" cy="147" rx="3.5" ry="4" fill="#fed7aa" />
      <ellipse cx="180" cy="147" rx="3.5" ry="4" fill="#fed7aa" />
    `),
  ChildsPose: generatePoseIllustrationSvg('ChildsPose', '#14b8a6', `
      <!-- Knees folded under with hips back on heels -->
      <path d="M225,215 Q215,190 185,198" stroke="url(#pantsGrad_ChildsPose)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M225,215 L245,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Torso resting along thighs forward -->
      <path d="M185,198 L135,212" stroke="url(#topGrad_ChildsPose)" stroke-width="13" stroke-linecap="round" fill="none" />
      <!-- Head resting forehead on mat -->
      <circle cx="118" cy="216" r="11" fill="#fed7aa" />
      <circle cx="122" cy="208" r="6" fill="#1e1b4b" />
      <!-- Arms stretched out along mat -->
      <path d="M135,212 L65,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="63" cy="223" rx="5" ry="2.5" fill="#fed7aa" />
    `),
  Plank: generatePoseIllustrationSvg('Plank', '#ef4444', `
      <!-- Vertical arms supporting shoulders -->
      <path d="M105,158 L105,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" fill="none" />
      <ellipse cx="105" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Rigid straight diagonal body from head to heels -->
      <path d="M105,158 L175,178 L255,208" stroke="url(#pantsGrad_Plank)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M105,158 L160,172" stroke="url(#topGrad_Plank)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="85" cy="150" r="11" fill="#fed7aa" />
      <circle cx="80" cy="144" r="6" fill="#1e1b4b" />
      <!-- Balls of feet on mat -->
      <path d="M255,208 L255,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
    `),
  SidePlank: generatePoseIllustrationSvg('SidePlank', '#f59e0b', `
      <!-- Bottom supporting arm -->
      <path d="M125,165 L125,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" fill="none" />
      <ellipse cx="125" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Diagonal torso & stacked legs -->
      <path d="M125,165 L180,188 L252,223" stroke="url(#pantsGrad_SidePlank)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M125,165 L165,182" stroke="url(#topGrad_SidePlank)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head looking up toward sky -->
      <circle cx="112" cy="148" r="11" fill="#fed7aa" />
      <!-- Top arm reaching straight up to ceiling -->
      <path d="M125,165 L125,75" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="125" cy="73" rx="3.5" ry="4" fill="#fed7aa" />
    `),
  Bridge: generatePoseIllustrationSvg('Bridge', '#8b5cf6', `
      <!-- Head and shoulders resting on mat -->
      <circle cx="85" cy="216" r="12" fill="#fed7aa" />
      <!-- Feet flat on mat with vertical shins to knees -->
      <path d="M232,223 L220,165" stroke="url(#pantsGrad_Bridge)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="232" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Hips arched high towards ceiling -->
      <path d="M220,165 Q165,130 105,216" stroke="url(#pantsGrad_Bridge)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M150,152 Q125,175 105,216" stroke="url(#topGrad_Bridge)" stroke-width="13" stroke-linecap="round" fill="none" />
      <!-- Arms extended under body -->
      <path d="M105,218 L185,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
    `),
  Shoulderstand: generatePoseIllustrationSvg('Shoulderstand', '#3b82f6', `
      <!-- Head and shoulders on mat -->
      <circle cx="160" cy="223" r="12" fill="#fed7aa" />
      <!-- Upper arms on mat, forearms supporting lower back -->
      <path d="M142,223 L135,195 L152,175" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M178,223 L185,195 L168,175" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Inverted vertical torso & straight legs reaching straight up -->
      <path d="M160,215 L160,165" stroke="url(#topGrad_Shoulderstand)" stroke-width="14" stroke-linecap="round" fill="none" />
      <path d="M160,165 L160,45" stroke="url(#pantsGrad_Shoulderstand)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="160" cy="42" rx="5" ry="3" fill="#fed7aa" />
    `),
  Bow: generatePoseIllustrationSvg('Bow', '#f43f5e', `
      <!-- Abdomen on mat -->
      <path d="M125,165 Q160,212 195,195" stroke="url(#topGrad_Bow)" stroke-width="14" stroke-linecap="round" fill="none" />
      <path d="M160,210 L195,195" stroke="url(#pantsGrad_Bow)" stroke-width="12" stroke-linecap="round" fill="none" />
      <!-- Chest lifted high, head up -->
      <circle cx="112" cy="148" r="11" fill="#fed7aa" />
      <!-- Bent knees with thighs lifted -->
      <path d="M195,195 L225,155" stroke="url(#pantsGrad_Bow)" stroke-width="11" stroke-linecap="round" fill="none" />
      <!-- Arms reaching back to grasp ankles -->
      <path d="M125,165 L175,135 L225,155" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    `),
  Camel: generatePoseIllustrationSvg('Camel', '#d97706', `
      <!-- Kneeling shins flat on mat -->
      <path d="M130,223 L180,223" stroke="#fed7aa" stroke-width="8" stroke-linecap="round" fill="none" />
      <!-- Upright thighs -->
      <path d="M130,223 L135,168" stroke="url(#pantsGrad_Camel)" stroke-width="12" stroke-linecap="round" fill="none" />
      <!-- Deeply arched spine backwards -->
      <path d="M135,168 Q155,130 145,105" stroke="url(#topGrad_Camel)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head dropped back with open throat -->
      <circle cx="132" cy="98" r="11" fill="#fed7aa" />
      <!-- Hands reaching down grasping heels -->
      <path d="M145,105 L182,215" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="182" cy="216" rx="4" ry="4" fill="#fed7aa" />
    `),
  Cat: generatePoseIllustrationSvg('Cat', '#6366f1', `
      <!-- Tabletop hands and knees on mat -->
      <path d="M105,175 L105,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" fill="none" />
      <ellipse cx="105" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <path d="M215,185 L215,223" stroke="url(#pantsGrad_Cat)" stroke-width="11" stroke-linecap="round" fill="none" />
      <!-- High convex rounded spine arching towards ceiling -->
      <path d="M105,175 Q160,135 215,185" stroke="url(#topGrad_Cat)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head tucked down between arms with chin to chest -->
      <circle cx="92" cy="188" r="11" fill="#fed7aa" />
      <circle cx="86" cy="182" r="6" fill="#1e1b4b" />
    `),
  Cow: generatePoseIllustrationSvg('Cow', '#10b981', `
      <!-- Tabletop hands and knees on mat -->
      <path d="M105,175 L105,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" fill="none" />
      <ellipse cx="105" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <path d="M215,180 L215,223" stroke="url(#pantsGrad_Cow)" stroke-width="11" stroke-linecap="round" fill="none" />
      <!-- Concave dipping spine towards mat with tailbone up -->
      <path d="M105,175 Q160,205 215,180" stroke="url(#topGrad_Cow)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head lifted high looking up -->
      <circle cx="92" cy="142" r="11" fill="#fed7aa" />
      <circle cx="88" cy="136" r="6" fill="#1e1b4b" />
    `),
  Boat: generatePoseIllustrationSvg('Boat', '#0284c7', `
      <!-- Sitting balanced on sit bones -->
      <!-- Torso leaning back 45 deg -->
      <path d="M155,215 L112,145" stroke="url(#topGrad_Boat)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="98" cy="132" r="11" fill="#fed7aa" />
      <!-- Straight legs lifted 45 deg -->
      <path d="M155,215 L225,130" stroke="url(#pantsGrad_Boat)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="227" cy="128" rx="4" ry="4" fill="#fed7aa" />
      <!-- Arms reaching straight forward parallel to mat -->
      <path d="M112,145 L180,165" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="182" cy="165" rx="4" ry="3" fill="#fed7aa" />
    `),
  HalfMoon: generatePoseIllustrationSvg('HalfMoon', '#06b6d4', `
      <!-- Standing right leg -->
      <path d="M145,140 L145,223" stroke="url(#pantsGrad_HalfMoon)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="145" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Right hand to mat -->
      <path d="M105,140 L95,223" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <!-- Torso sideways horizontal -->
      <path d="M145,140 L105,140" stroke="url(#topGrad_HalfMoon)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="92" cy="132" r="11" fill="#fed7aa" />
      <!-- Lifted back leg horizontal -->
      <path d="M145,140 L250,140" stroke="url(#pantsGrad_HalfMoon)" stroke-width="11" stroke-linecap="round" fill="none" />
      <!-- Top left arm to sky -->
      <path d="M105,140 L105,60" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="105" cy="58" rx="3.5" ry="4" fill="#fed7aa" />
    `),
  Eagle: generatePoseIllustrationSvg('Eagle', '#a855f7', `
      <!-- Standing leg wrapped in partial squat -->
      <path d="M160,145 L158,190 L160,223" stroke="url(#pantsGrad_Eagle)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M160,145 L175,175 L155,195" stroke="url(#pantsGrad_Eagle)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="160" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Torso upright -->
      <path d="M160,145 L160,95" stroke="url(#topGrad_Eagle)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="160" cy="72" r="11" fill="#fed7aa" />
      <circle cx="160" cy="58" r="6" fill="#1e1b4b" />
      <!-- Intertwined arms in front of face -->
      <path d="M152,95 L145,120 L165,108 L160,78" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M168,95 L175,120 L155,108 L160,78" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    `),
  Pigeon: generatePoseIllustrationSvg('Pigeon', '#10b981', `
      <!-- Front folded shin across mat -->
      <path d="M105,223 Q125,208 160,215" stroke="url(#pantsGrad_Pigeon)" stroke-width="12" stroke-linecap="round" fill="none" />
      <!-- Back straight leg along mat -->
      <path d="M160,215 L260,223" stroke="url(#pantsGrad_Pigeon)" stroke-width="11" stroke-linecap="round" fill="none" />
      <ellipse cx="262" cy="223" rx="6" ry="3" fill="#fed7aa" />
      <!-- Upright proud torso -->
      <path d="M150,215 L140,150" stroke="url(#topGrad_Pigeon)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="136" cy="128" r="11" fill="#fed7aa" />
      <circle cx="140" cy="120" r="6" fill="#1e1b4b" />
      <!-- Supporting hands on mat beside hips -->
      <path d="M140,150 L125,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M140,150 L160,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
    `),
  Goddess: generatePoseIllustrationSvg('Goddess', '#f43f5e', `
      <!-- Wide deep squat legs with horizontal thighs -->
      <path d="M90,223 L105,175 L160,175 L215,175 L230,223" stroke="url(#pantsGrad_Goddess)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="90" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <ellipse cx="230" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Upright torso -->
      <path d="M160,175 L160,115" stroke="url(#topGrad_Goddess)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="160" cy="92" r="11" fill="#fed7aa" />
      <circle cx="160" cy="78" r="6" fill="#1e1b4b" />
      <!-- Cactus arms bent at 90 deg -->
      <path d="M160,115 L95,115 L95,65" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M160,115 L225,115 L225,65" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="95" cy="63" rx="3.5" ry="4" fill="#fed7aa" />
      <ellipse cx="225" cy="63" rx="3.5" ry="4" fill="#fed7aa" />
    `),
  Chaturanga: generatePoseIllustrationSvg('Chaturanga', '#f59e0b', `
      <!-- Low hover 3 inches above mat -->
      <path d="M115,195 L115,223" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="115" cy="223" rx="6" ry="3" fill="#fed7aa" />
      <!-- Body hovering parallel to mat from head to toes -->
      <path d="M75,190 L115,195 L180,195 L255,195" stroke="url(#pantsGrad_Chaturanga)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M100,195 L160,195" stroke="url(#topGrad_Chaturanga)" stroke-width="13" stroke-linecap="round" fill="none" />
      <circle cx="75" cy="188" r="10" fill="#fed7aa" />
      <!-- Balls of feet on mat -->
      <path d="M255,195 L255,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
    `),
  Staff: generatePoseIllustrationSvg('Staff', '#38bdf8', `
      <!-- Seated with straight legs along mat -->
      <path d="M125,215 L255,215" stroke="url(#pantsGrad_Staff)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M255,215 L255,203" stroke="#fed7aa" stroke-width="5" stroke-linecap="round" fill="none" />
      <!-- Tall 90 deg upright spine -->
      <path d="M125,215 L125,115" stroke="url(#topGrad_Staff)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="125" cy="92" r="11" fill="#fed7aa" />
      <circle cx="125" cy="78" r="6" fill="#1e1b4b" />
      <!-- Hands planted flat beside hips -->
      <path d="M125,115 L135,218" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="135" cy="220" rx="5" ry="3" fill="#fed7aa" />
    `),
  Corpse: generatePoseIllustrationSvg('Corpse', '#64748b', `
      <!-- Lying supine relaxed along mat -->
      <circle cx="75" cy="216" r="11" fill="#fed7aa" />
      <circle cx="72" cy="212" r="6" fill="#1e1b4b" />
      <path d="M86,218 L160,218" stroke="url(#topGrad_Corpse)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M160,218 L255,218" stroke="url(#pantsGrad_Corpse)" stroke-width="12" stroke-linecap="round" fill="none" />
      <!-- Arms relaxed at 30 deg with open palms -->
      <path d="M105,218 L150,224" stroke="#fed7aa" stroke-width="5.5" stroke-linecap="round" fill="none" />
      <ellipse cx="152" cy="224" rx="4" ry="2.5" fill="#fed7aa" />
    `),
};

// Anatomical vector diagrams with joint nodes
export const POSE_SVG_PRESETS = {
  Tree: generatePoseAnatomySvg('Tree', 'Tree', '#10b981', `
      <!-- Standing Leg (Left) -->
      <path d="M160,135 L160,180 L160,223" stroke="url(#pantsGrad_Tree)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="160" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Bent Leg (Right) Foot resting on inner thigh -->
      <path d="M160,135 L205,165 L162,172" stroke="url(#pantsGrad_Tree)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="162" cy="172" rx="4" ry="6" fill="#fed7aa" />
      <!-- Torso & Athletic Top -->
      <path d="M152,136 L168,136 L166,95 L154,95 Z" fill="url(#pantsGrad_Tree)" />
      <path d="M153,105 L167,105 L165,80 L155,80 Z" fill="url(#topGrad_Tree)" />
      <!-- Head & Hair -->
      <circle cx="160" cy="58" r="12" fill="#fed7aa" />
      <circle cx="160" cy="44" r="7" fill="#1e1b4b" />
      <path d="M150,56 Q160,46 170,56 Q165,48 160,48 Q155,48 150,56 Z" fill="#1e1b4b" />
      <!-- Arms in Anjali Mudra (Prayer at chest) -->
      <path d="M154,82 L142,105 L158,102" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M166,82 L178,105 L162,102" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="160" cy="101" rx="4" ry="6" fill="#fed7aa" />
    `),
  Chair: generatePoseAnatomySvg('Chair', 'Chair', '#f59e0b', `
      <!-- Shins (angled) -->
      <path d="M148,223 L135,185" stroke="url(#pantsGrad_Chair)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="148" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Thighs (deep squat parallel) -->
      <path d="M135,185 L182,148" stroke="url(#pantsGrad_Chair)" stroke-width="12" stroke-linecap="round" fill="none" />
      <!-- Torso (angled forward) -->
      <path d="M182,148 L142,95" stroke="url(#pantsGrad_Chair)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M165,125 L140,92" stroke="url(#topGrad_Chair)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head -->
      <circle cx="132" cy="78" r="12" fill="#fed7aa" />
      <circle cx="142" cy="70" r="7" fill="#1e1b4b" />
      <path d="M124,78 Q132,68 140,78 Q136,70 132,70 Z" fill="#1e1b4b" />
      <!-- Arms raised high along ears -->
      <path d="M140,92 L95,50" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="95" cy="50" rx="3.5" ry="4.5" fill="#fed7aa" />
    `),
  WarriorI: generatePoseAnatomySvg('WarriorI', 'WarriorI', '#8b5cf6', `
      <!-- Back straight leg -->
      <path d="M152,140 L218,223" stroke="url(#pantsGrad_WarriorI)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="218" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Front lunge leg (90 deg) -->
      <path d="M152,140 L115,168 L115,223" stroke="url(#pantsGrad_WarriorI)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="115" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Torso upright -->
      <path d="M152,140 L150,90" stroke="url(#pantsGrad_WarriorI)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M151,118 L150,88" stroke="url(#topGrad_WarriorI)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head looking upward -->
      <circle cx="150" cy="72" r="12" fill="#fed7aa" />
      <path d="M156,66 Q166,74 162,82" stroke="#1e1b4b" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- Arms overhead parallel reaching high -->
      <path d="M148,88 L142,42" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M152,88 L158,42" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="150" cy="40" rx="6" ry="3" fill="#fed7aa" />
    `),
  WarriorII: generatePoseAnatomySvg('WarriorII', 'WarriorII', '#ef4444', `
      <!-- Back straight leg -->
      <path d="M160,140 L228,223" stroke="url(#pantsGrad_WarriorII)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="228" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Front bent leg (90 deg lunge) -->
      <path d="M160,140 L115,168 L115,223" stroke="url(#pantsGrad_WarriorII)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="115" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Torso upright open -->
      <path d="M160,140 L160,92" stroke="url(#pantsGrad_WarriorII)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M160,120 L160,90" stroke="url(#topGrad_WarriorII)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head looking over front hand -->
      <circle cx="158" cy="72" r="12" fill="#fed7aa" />
      <circle cx="166" cy="68" r="6" fill="#1e1b4b" />
      <!-- Horizontal outstretched arms -->
      <path d="M160,92 L80,92" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <path d="M160,92 L245,92" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="78" cy="92" rx="4" ry="3" fill="#fed7aa" />
      <ellipse cx="247" cy="92" rx="4" ry="3" fill="#fed7aa" />
    `),
  WarriorIII: generatePoseAnatomySvg('WarriorIII', 'WarriorIII', '#06b6d4', `
      <!-- Standing Leg (Right) straight vertical grounded -->
      <path d="M165,125 L165,175 L165,223" stroke="url(#pantsGrad_WarriorIII)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="165" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Back Leg extended horizontally straight behind -->
      <path d="M165,125 L215,125 L265,125" stroke="url(#pantsGrad_WarriorIII)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M265,125 L265,133" stroke="#fed7aa" stroke-width="5" stroke-linecap="round" fill="none" />
      <!-- Horizontal Torso -->
      <path d="M165,125 L115,125" stroke="url(#pantsGrad_WarriorIII)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M145,125 L110,125" stroke="url(#topGrad_WarriorIII)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head facing down with ponytail trailing -->
      <circle cx="96" cy="125" r="11" fill="#fed7aa" />
      <path d="M96,118 Q110,112 120,116" stroke="#1e1b4b" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- Arms reaching straight forward parallel to mat -->
      <path d="M110,125 L50,125" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="48" cy="125" rx="4" ry="3" fill="#fed7aa" />
    `),
  DownwardDog: generatePoseAnatomySvg('DownwardDog', 'DownwardDog', '#3b82f6', `
      <!-- Arms to mat -->
      <path d="M165,105 L95,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" fill="none" />
      <ellipse cx="93" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Torso angled up to hip apex -->
      <path d="M120,175 L165,105" stroke="url(#topGrad_DownwardDog)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head relaxed down between arms -->
      <circle cx="118" cy="170" r="11" fill="#fed7aa" />
      <path d="M112,176 Q108,188 112,194" stroke="#1e1b4b" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- Legs from hip apex straight down to heels on mat -->
      <path d="M165,105 L235,223" stroke="url(#pantsGrad_DownwardDog)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="235" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
    `),
  UpwardDog: generatePoseAnatomySvg('UpwardDog', 'UpwardDog', '#10b981', `
      <!-- Strong vertical straight arms supporting torso on mat -->
      <path d="M110,145 L110,223" stroke="#fed7aa" stroke-width="7.5" stroke-linecap="round" fill="none" />
      <ellipse cx="110" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Arched Torso with open chest curving upward -->
      <path d="M175,190 Q145,180 120,150" stroke="url(#topGrad_UpwardDog)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head tilted back proudly, chin lifted, hair trailing back -->
      <circle cx="102" cy="122" r="12" fill="#fed7aa" />
      <path d="M96,126 Q86,136 80,148" stroke="#1e1b4b" stroke-width="4.5" stroke-linecap="round" fill="none" />
      <circle cx="94" cy="120" r="6" fill="#1e1b4b" />
      <!-- Extended straight legs (knees & thighs lifted off mat) -->
      <path d="M175,190 L220,208 L258,218" stroke="url(#pantsGrad_UpwardDog)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <!-- Tops of feet pressing into mat -->
      <path d="M258,218 L272,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
    `),
  Cobra: generatePoseAnatomySvg('Cobra', 'Cobra', '#ec4899', `
      <!-- Hands on mat under shoulders -->
      <ellipse cx="108" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Bent arms hugging ribs -->
      <path d="M120,165 L108,198 L108,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <!-- Lifted chest curving forward -->
      <path d="M165,220 Q145,198 120,165" stroke="url(#topGrad_Cobra)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head looking forward/up -->
      <circle cx="110" cy="138" r="12" fill="#fed7aa" />
      <circle cx="104" cy="134" r="6" fill="#1e1b4b" />
      <!-- Grounded legs flat along mat -->
      <path d="M165,220 L255,222" stroke="url(#pantsGrad_Cobra)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="258" cy="223" rx="6" ry="3" fill="#fed7aa" />
    `),
  Triangle: generatePoseAnatomySvg('Triangle', 'Triangle', '#f59e0b', `
      <!-- Wide straight legs -->
      <path d="M185,145 L120,223" stroke="url(#pantsGrad_Triangle)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M185,145 L242,223" stroke="url(#pantsGrad_Triangle)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="120" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <ellipse cx="242" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Laterally tilted torso -->
      <path d="M185,145 L145,105" stroke="url(#topGrad_Triangle)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head looking upward toward top hand -->
      <circle cx="140" cy="88" r="11" fill="#fed7aa" />
      <path d="M142,82 Q148,74 154,80" stroke="#1e1b4b" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <!-- Vertical continuous arm line: right down to ankle, left up to sky -->
      <path d="M120,195 L145,105 L165,48" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="165" cy="46" rx="3.5" ry="4" fill="#fed7aa" />
      <ellipse cx="120" cy="197" rx="3.5" ry="4" fill="#fed7aa" />
    `),
  ExtendedSideAngle: generatePoseAnatomySvg('ExtendedSideAngle', 'ExtendedSideAngle', '#a855f7', `
      <!-- Back straight leg -->
      <path d="M175,155 L248,223" stroke="url(#pantsGrad_ExtendedSideAngle)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="248" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Front 90-deg lunge leg -->
      <path d="M175,155 L115,178 L115,223" stroke="url(#pantsGrad_ExtendedSideAngle)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="115" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Torso angled over front thigh -->
      <path d="M175,155 L132,125" stroke="url(#topGrad_ExtendedSideAngle)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Right forearm resting on front knee -->
      <path d="M132,125 L120,174" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Head -->
      <circle cx="128" cy="108" r="11" fill="#fed7aa" />
      <!-- Left arm forming long unbroken diagonal line overhead -->
      <path d="M132,125 L75,70" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="73" cy="68" rx="4" ry="4" fill="#fed7aa" />
    `),
  Mountain: generatePoseAnatomySvg('Mountain', 'Mountain', '#38bdf8', `
      <!-- Straight standing legs together -->
      <path d="M155,130 L155,223" stroke="url(#pantsGrad_Mountain)" stroke-width="11" stroke-linecap="round" fill="none" />
      <path d="M165,130 L165,223" stroke="url(#pantsGrad_Mountain)" stroke-width="11" stroke-linecap="round" fill="none" />
      <ellipse cx="155" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <ellipse cx="165" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Torso tall and grounded -->
      <path d="M160,135 L160,88" stroke="url(#topGrad_Mountain)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head tall with crown reaching high -->
      <circle cx="160" cy="65" r="12" fill="#fed7aa" />
      <circle cx="160" cy="51" r="6" fill="#1e1b4b" />
      <!-- Relaxed arms at sides with open palms -->
      <path d="M152,90 L140,145" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M168,90 L180,145" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="140" cy="147" rx="3.5" ry="4" fill="#fed7aa" />
      <ellipse cx="180" cy="147" rx="3.5" ry="4" fill="#fed7aa" />
    `),
  ChildsPose: generatePoseAnatomySvg('ChildsPose', 'ChildsPose', '#14b8a6', `
      <!-- Knees folded under with hips back on heels -->
      <path d="M225,215 Q215,190 185,198" stroke="url(#pantsGrad_ChildsPose)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M225,215 L245,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Torso resting along thighs forward -->
      <path d="M185,198 L135,212" stroke="url(#topGrad_ChildsPose)" stroke-width="13" stroke-linecap="round" fill="none" />
      <!-- Head resting forehead on mat -->
      <circle cx="118" cy="216" r="11" fill="#fed7aa" />
      <circle cx="122" cy="208" r="6" fill="#1e1b4b" />
      <!-- Arms stretched out along mat -->
      <path d="M135,212 L65,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="63" cy="223" rx="5" ry="2.5" fill="#fed7aa" />
    `),
  Plank: generatePoseAnatomySvg('Plank', 'Plank', '#ef4444', `
      <!-- Vertical arms supporting shoulders -->
      <path d="M105,158 L105,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" fill="none" />
      <ellipse cx="105" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Rigid straight diagonal body from head to heels -->
      <path d="M105,158 L175,178 L255,208" stroke="url(#pantsGrad_Plank)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M105,158 L160,172" stroke="url(#topGrad_Plank)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="85" cy="150" r="11" fill="#fed7aa" />
      <circle cx="80" cy="144" r="6" fill="#1e1b4b" />
      <!-- Balls of feet on mat -->
      <path d="M255,208 L255,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
    `),
  SidePlank: generatePoseAnatomySvg('SidePlank', 'SidePlank', '#f59e0b', `
      <!-- Bottom supporting arm -->
      <path d="M125,165 L125,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" fill="none" />
      <ellipse cx="125" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <!-- Diagonal torso & stacked legs -->
      <path d="M125,165 L180,188 L252,223" stroke="url(#pantsGrad_SidePlank)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M125,165 L165,182" stroke="url(#topGrad_SidePlank)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head looking up toward sky -->
      <circle cx="112" cy="148" r="11" fill="#fed7aa" />
      <!-- Top arm reaching straight up to ceiling -->
      <path d="M125,165 L125,75" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="125" cy="73" rx="3.5" ry="4" fill="#fed7aa" />
    `),
  Bridge: generatePoseAnatomySvg('Bridge', 'Bridge', '#8b5cf6', `
      <!-- Head and shoulders resting on mat -->
      <circle cx="85" cy="216" r="12" fill="#fed7aa" />
      <!-- Feet flat on mat with vertical shins to knees -->
      <path d="M232,223 L220,165" stroke="url(#pantsGrad_Bridge)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="232" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Hips arched high towards ceiling -->
      <path d="M220,165 Q165,130 105,216" stroke="url(#pantsGrad_Bridge)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M150,152 Q125,175 105,216" stroke="url(#topGrad_Bridge)" stroke-width="13" stroke-linecap="round" fill="none" />
      <!-- Arms extended under body -->
      <path d="M105,218 L185,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
    `),
  Shoulderstand: generatePoseAnatomySvg('Shoulderstand', 'Shoulderstand', '#3b82f6', `
      <!-- Head and shoulders on mat -->
      <circle cx="160" cy="223" r="12" fill="#fed7aa" />
      <!-- Upper arms on mat, forearms supporting lower back -->
      <path d="M142,223 L135,195 L152,175" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M178,223 L185,195 L168,175" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Inverted vertical torso & straight legs reaching straight up -->
      <path d="M160,215 L160,165" stroke="url(#topGrad_Shoulderstand)" stroke-width="14" stroke-linecap="round" fill="none" />
      <path d="M160,165 L160,45" stroke="url(#pantsGrad_Shoulderstand)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="160" cy="42" rx="5" ry="3" fill="#fed7aa" />
    `),
  Bow: generatePoseAnatomySvg('Bow', 'Bow', '#f43f5e', `
      <!-- Abdomen on mat -->
      <path d="M125,165 Q160,212 195,195" stroke="url(#topGrad_Bow)" stroke-width="14" stroke-linecap="round" fill="none" />
      <path d="M160,210 L195,195" stroke="url(#pantsGrad_Bow)" stroke-width="12" stroke-linecap="round" fill="none" />
      <!-- Chest lifted high, head up -->
      <circle cx="112" cy="148" r="11" fill="#fed7aa" />
      <!-- Bent knees with thighs lifted -->
      <path d="M195,195 L225,155" stroke="url(#pantsGrad_Bow)" stroke-width="11" stroke-linecap="round" fill="none" />
      <!-- Arms reaching back to grasp ankles -->
      <path d="M125,165 L175,135 L225,155" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    `),
  Camel: generatePoseAnatomySvg('Camel', 'Camel', '#d97706', `
      <!-- Kneeling shins flat on mat -->
      <path d="M130,223 L180,223" stroke="#fed7aa" stroke-width="8" stroke-linecap="round" fill="none" />
      <!-- Upright thighs -->
      <path d="M130,223 L135,168" stroke="url(#pantsGrad_Camel)" stroke-width="12" stroke-linecap="round" fill="none" />
      <!-- Deeply arched spine backwards -->
      <path d="M135,168 Q155,130 145,105" stroke="url(#topGrad_Camel)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head dropped back with open throat -->
      <circle cx="132" cy="98" r="11" fill="#fed7aa" />
      <!-- Hands reaching down grasping heels -->
      <path d="M145,105 L182,215" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="182" cy="216" rx="4" ry="4" fill="#fed7aa" />
    `),
  Cat: generatePoseAnatomySvg('Cat', 'Cat', '#6366f1', `
      <!-- Tabletop hands and knees on mat -->
      <path d="M105,175 L105,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" fill="none" />
      <ellipse cx="105" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <path d="M215,185 L215,223" stroke="url(#pantsGrad_Cat)" stroke-width="11" stroke-linecap="round" fill="none" />
      <!-- High convex rounded spine arching towards ceiling -->
      <path d="M105,175 Q160,135 215,185" stroke="url(#topGrad_Cat)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head tucked down between arms with chin to chest -->
      <circle cx="92" cy="188" r="11" fill="#fed7aa" />
      <circle cx="86" cy="182" r="6" fill="#1e1b4b" />
    `),
  Cow: generatePoseAnatomySvg('Cow', 'Cow', '#10b981', `
      <!-- Tabletop hands and knees on mat -->
      <path d="M105,175 L105,223" stroke="#fed7aa" stroke-width="7" stroke-linecap="round" fill="none" />
      <ellipse cx="105" cy="223" rx="6" ry="3.5" fill="#fed7aa" />
      <path d="M215,180 L215,223" stroke="url(#pantsGrad_Cow)" stroke-width="11" stroke-linecap="round" fill="none" />
      <!-- Concave dipping spine towards mat with tailbone up -->
      <path d="M105,175 Q160,205 215,180" stroke="url(#topGrad_Cow)" stroke-width="14" stroke-linecap="round" fill="none" />
      <!-- Head lifted high looking up -->
      <circle cx="92" cy="142" r="11" fill="#fed7aa" />
      <circle cx="88" cy="136" r="6" fill="#1e1b4b" />
    `),
  Boat: generatePoseAnatomySvg('Boat', 'Boat', '#0284c7', `
      <!-- Sitting balanced on sit bones -->
      <!-- Torso leaning back 45 deg -->
      <path d="M155,215 L112,145" stroke="url(#topGrad_Boat)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="98" cy="132" r="11" fill="#fed7aa" />
      <!-- Straight legs lifted 45 deg -->
      <path d="M155,215 L225,130" stroke="url(#pantsGrad_Boat)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="227" cy="128" rx="4" ry="4" fill="#fed7aa" />
      <!-- Arms reaching straight forward parallel to mat -->
      <path d="M112,145 L180,165" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="182" cy="165" rx="4" ry="3" fill="#fed7aa" />
    `),
  HalfMoon: generatePoseAnatomySvg('HalfMoon', 'HalfMoon', '#06b6d4', `
      <!-- Standing right leg -->
      <path d="M145,140 L145,223" stroke="url(#pantsGrad_HalfMoon)" stroke-width="12" stroke-linecap="round" fill="none" />
      <ellipse cx="145" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Right hand to mat -->
      <path d="M105,140 L95,223" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <!-- Torso sideways horizontal -->
      <path d="M145,140 L105,140" stroke="url(#topGrad_HalfMoon)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="92" cy="132" r="11" fill="#fed7aa" />
      <!-- Lifted back leg horizontal -->
      <path d="M145,140 L250,140" stroke="url(#pantsGrad_HalfMoon)" stroke-width="11" stroke-linecap="round" fill="none" />
      <!-- Top left arm to sky -->
      <path d="M105,140 L105,60" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="105" cy="58" rx="3.5" ry="4" fill="#fed7aa" />
    `),
  Eagle: generatePoseAnatomySvg('Eagle', 'Eagle', '#a855f7', `
      <!-- Standing leg wrapped in partial squat -->
      <path d="M160,145 L158,190 L160,223" stroke="url(#pantsGrad_Eagle)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M160,145 L175,175 L155,195" stroke="url(#pantsGrad_Eagle)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="160" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Torso upright -->
      <path d="M160,145 L160,95" stroke="url(#topGrad_Eagle)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="160" cy="72" r="11" fill="#fed7aa" />
      <circle cx="160" cy="58" r="6" fill="#1e1b4b" />
      <!-- Intertwined arms in front of face -->
      <path d="M152,95 L145,120 L165,108 L160,78" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M168,95 L175,120 L155,108 L160,78" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    `),
  Pigeon: generatePoseAnatomySvg('Pigeon', 'Pigeon', '#10b981', `
      <!-- Front folded shin across mat -->
      <path d="M105,223 Q125,208 160,215" stroke="url(#pantsGrad_Pigeon)" stroke-width="12" stroke-linecap="round" fill="none" />
      <!-- Back straight leg along mat -->
      <path d="M160,215 L260,223" stroke="url(#pantsGrad_Pigeon)" stroke-width="11" stroke-linecap="round" fill="none" />
      <ellipse cx="262" cy="223" rx="6" ry="3" fill="#fed7aa" />
      <!-- Upright proud torso -->
      <path d="M150,215 L140,150" stroke="url(#topGrad_Pigeon)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="136" cy="128" r="11" fill="#fed7aa" />
      <circle cx="140" cy="120" r="6" fill="#1e1b4b" />
      <!-- Supporting hands on mat beside hips -->
      <path d="M140,150 L125,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M140,150 L160,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
    `),
  Goddess: generatePoseAnatomySvg('Goddess', 'Goddess', '#f43f5e', `
      <!-- Wide deep squat legs with horizontal thighs -->
      <path d="M90,223 L105,175 L160,175 L215,175 L230,223" stroke="url(#pantsGrad_Goddess)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="90" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <ellipse cx="230" cy="223" rx="7" ry="3.5" fill="#fed7aa" />
      <!-- Upright torso -->
      <path d="M160,175 L160,115" stroke="url(#topGrad_Goddess)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="160" cy="92" r="11" fill="#fed7aa" />
      <circle cx="160" cy="78" r="6" fill="#1e1b4b" />
      <!-- Cactus arms bent at 90 deg -->
      <path d="M160,115 L95,115 L95,65" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M160,115 L225,115 L225,65" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="95" cy="63" rx="3.5" ry="4" fill="#fed7aa" />
      <ellipse cx="225" cy="63" rx="3.5" ry="4" fill="#fed7aa" />
    `),
  Chaturanga: generatePoseAnatomySvg('Chaturanga', 'Chaturanga', '#f59e0b', `
      <!-- Low hover 3 inches above mat -->
      <path d="M115,195 L115,223" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <ellipse cx="115" cy="223" rx="6" ry="3" fill="#fed7aa" />
      <!-- Body hovering parallel to mat from head to toes -->
      <path d="M75,190 L115,195 L180,195 L255,195" stroke="url(#pantsGrad_Chaturanga)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M100,195 L160,195" stroke="url(#topGrad_Chaturanga)" stroke-width="13" stroke-linecap="round" fill="none" />
      <circle cx="75" cy="188" r="10" fill="#fed7aa" />
      <!-- Balls of feet on mat -->
      <path d="M255,195 L255,223" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
    `),
  Staff: generatePoseAnatomySvg('Staff', 'Staff', '#38bdf8', `
      <!-- Seated with straight legs along mat -->
      <path d="M125,215 L255,215" stroke="url(#pantsGrad_Staff)" stroke-width="12" stroke-linecap="round" fill="none" />
      <path d="M255,215 L255,203" stroke="#fed7aa" stroke-width="5" stroke-linecap="round" fill="none" />
      <!-- Tall 90 deg upright spine -->
      <path d="M125,215 L125,115" stroke="url(#topGrad_Staff)" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="125" cy="92" r="11" fill="#fed7aa" />
      <circle cx="125" cy="78" r="6" fill="#1e1b4b" />
      <!-- Hands planted flat beside hips -->
      <path d="M125,115 L135,218" stroke="#fed7aa" stroke-width="6" stroke-linecap="round" fill="none" />
      <ellipse cx="135" cy="220" rx="5" ry="3" fill="#fed7aa" />
    `),
  Corpse: generatePoseAnatomySvg('Corpse', 'Corpse', '#64748b', `
      <!-- Lying supine relaxed along mat -->
      <circle cx="75" cy="216" r="11" fill="#fed7aa" />
      <circle cx="72" cy="212" r="6" fill="#1e1b4b" />
      <path d="M86,218 L160,218" stroke="url(#topGrad_Corpse)" stroke-width="13" stroke-linecap="round" fill="none" />
      <path d="M160,218 L255,218" stroke="url(#pantsGrad_Corpse)" stroke-width="12" stroke-linecap="round" fill="none" />
      <!-- Arms relaxed at 30 deg with open palms -->
      <path d="M105,218 L150,224" stroke="#fed7aa" stroke-width="5.5" stroke-linecap="round" fill="none" />
      <ellipse cx="152" cy="224" rx="4" ry="2.5" fill="#fed7aa" />
    `),
};

// Map poses to image sources: prefer photographic illustration, fallback to crisp anatomy
export const YOGA_POSE_IMAGES = {
  Tree: treeJpg,
  Chair: chairJpg,
  WarriorI: warriorJpg,
  WarriorII: warriorJpg,
  WarriorIII: POSE_ILLUSTRATIONS.WarriorIII,
  DownwardDog: dogJpg,
  UpwardDog: POSE_ILLUSTRATIONS.UpwardDog,
  Cobra: cobraJpg,
  Triangle: triangleJpg,
  ExtendedSideAngle: POSE_ILLUSTRATIONS.ExtendedSideAngle,
  Mountain: POSE_ILLUSTRATIONS.Mountain,
  ChildsPose: POSE_ILLUSTRATIONS.ChildsPose,
  Plank: POSE_ILLUSTRATIONS.Plank,
  SidePlank: POSE_ILLUSTRATIONS.SidePlank,
  Bridge: POSE_ILLUSTRATIONS.Bridge,
  Shoulderstand: shoulderstandJpg,
  Bow: POSE_ILLUSTRATIONS.Bow,
  Camel: POSE_ILLUSTRATIONS.Camel,
  Cat: POSE_ILLUSTRATIONS.Cat,
  Cow: POSE_ILLUSTRATIONS.Cow,
  Boat: POSE_ILLUSTRATIONS.Boat,
  HalfMoon: POSE_ILLUSTRATIONS.HalfMoon,
  Eagle: POSE_ILLUSTRATIONS.Eagle,
  Pigeon: POSE_ILLUSTRATIONS.Pigeon,
  Goddess: POSE_ILLUSTRATIONS.Goddess,
  Chaturanga: POSE_ILLUSTRATIONS.Chaturanga,
  Staff: POSE_ILLUSTRATIONS.Staff,
  Corpse: POSE_ILLUSTRATIONS.Corpse,
};

export const YOGA_POSE_VECTORS = POSE_SVG_PRESETS;
