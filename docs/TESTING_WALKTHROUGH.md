# 🎬 Testing Walkthrough - FitVision AI Yoga Detection

## Expected User Experience

### Screen 1: Home Page
```
╔═══════════════════════════════════════════════╗
║         FitVision AI - Yoga Detector          ║
├─────────────────────────────────────────────── ┤
║ [Home] [Start] [About] [Tutorials]            ║
├─────────────────────────────────────────────── ┤
║                                                ║
║         Welcome to FitVision AI               ║
║                                                ║
║    Track your yoga practice with AI           ║
║    Real-time pose detection & feedback        ║
║                                                ║
║           [Start Yoga] button                 ║
║                                                ║
└─────────────────────────────────────────────── ┘
```

### Screen 2: Yoga Setup (Before Detection)
```
╔═══════════════════════════════════════════════╗
║         Select Your Yoga Pose                 ║
├─────────────────────────────────────────────── ┤
║ Pose: [▼ Tree          ]  (Dropdown)          ║
│                                                │
║ INSTRUCTIONS:                                 ║
║ 1. Get into position. Tree pose often        ║
║    starts from mountain pose...              ║
║ 2. Bend one leg at the knee...               ║
║ 3. Lengthen your body...                     ║
║ 4. Hold and repeat...                        ║
│                                                │
║ Confidence Threshold: [===●===] 97%          ║
║ Higher = stricter, Lower = more forgiving    ║
│                                                │
║              [Start Pose] button              ║
│                                                │
└─────────────────────────────────────────────── ┘
```

### Screen 3: During Detection (Live)
```
╔═══════════════════════════════════════════════╗
║    Performance: Pose Time: 5.2s  Best: 8.3s  ║
├─────────────────────────────────────────────── ┤
║                           ┌─────────────────┐ ║
║                           │ Reference Image │ ║
║  [Webcam Feed]           │   (Tree Pose)   │ ║
║  with skeleton           │                 │ ║
║  overlay (GREEN)         │  [Image shown]  │ ║
║                           │                 │ ║
║  17 keypoints             │                 │ ║
║  13 connections           │                 │ ║
║  Real-time               │                 │ ║
║                           └─────────────────┘ ║
│                                                │
║                 [Stop Pose] button             ║
│                                                │
└─────────────────────────────────────────────── ┘

Skeleton Colors:
  ⚪ WHITE = Pose detected but not matching threshold
  🟢 GREEN = Correct pose! (Audio plays "count" sound)
```

### Screen 4: Session Ended (History)
```
╔═══════════════════════════════════════════════╗
║     Yoga Session History                      ║
├─────────────────────────────────────────────── ┤
║ Statistics:                                   ║
║  ┌──────────┬──────────┬──────────┬─────────┐ ║
║  │ Sessions │  Total   │ Average  │  Best   │ ║
║  │    5     │ 45.2s    │  9.0s    │ 12.5s   │ ║
║  └──────────┴──────────┴──────────┴─────────┘ ║
│                                                │
║ Recent Sessions:                              ║
║ ┌───────────────────────────────────────────┐ ║
║ │ Tree    | Oct 20, 2:45 PM | 8.3s | 97%   │ ║
║ │ Chair   | Oct 20, 2:30 PM | 6.1s | 95%   │ ║
║ │ Tree    | Oct 20, 2:15 PM | 12.5s| 99%   │ ║
║ │ Cobra   | Oct 20, 2:00 PM | 5.2s | 98%   │ ║
║ │ Dog     | Oct 19, 8:45 PM | 13.1s| 97%   │ ║
║ └───────────────────────────────────────────┘ ║
│                                                │
└─────────────────────────────────────────────── ┘
```

---

## 🎯 What to Expect During Testing

### ✅ Normal Operation

**On First Load (2-5 seconds)**
- Blank screen with loading spinner: "Loading AI models... Please wait."
- MoveNet detector initializes
- Custom yoga classifier loads from cloud (or local fallback)

**On Camera Start**
- Browser asks for camera permission
- Webcam feed appears in upper left
- Canvas overlay with skeleton appears
- Reference image appears on right side

**During Pose Detection**
- Skeleton renders in real-time (10 FPS = 1 update every 100ms)
- Skeleton stays WHITE while you're not matching the pose
- When you match the pose threshold:
  - Skeleton turns GREEN ✅
  - "Count" audio plays (beeping/counting sound)
  - Pose Time counter starts
  - Best Performance updates if this is better

**When You Stop**
- Click "Stop Pose"
- Skeleton disappears
- Webcam stops
- Session automatically saves to browser storage
- Can navigate away or select another pose

### ⚠️ Potential Issues & Fixes

**Issue: "Loading AI models... Please wait" takes >10 seconds**
- ✅ Normal on first run (models downloading)
- Try again (uses cache after first time)

**Issue: Error message: "Failed to load model..."**
- ✅ FIXED in Phase 2 - will fallback to local model
- Check internet connection
- Refresh page

**Issue: Camera says "Permission denied"**
- Click browser settings
- Allow camera for localhost:3000
- Refresh page

**Issue: No skeleton appears**
- Ensure full body is in frame
- Check lighting
- Move closer to camera
- Keypoints need score > 0.4 to render

**Issue: Skeleton white but you're doing the right pose**
- Confidence threshold too high
- Lower the slider before starting
- Try 90% instead of 97%

**Issue: Skeleton green all the time**
- Confidence threshold too low
- Increase the slider
- Try 98% or 99%

---

## 📊 What Each UI Element Does

### Confidence Threshold Slider (80-100%)
```
Slider Position      Detection Behavior
─────────────────────────────────────────
80% (Left)          Very forgiving, detects most poses
90%                 Balanced
97% (Default)       Strict, requires near-perfect match
100% (Right)        Extremely strict, rarely triggers
```

### Performance Metrics
```
Pose Time:   5.2s  ← How long skeleton is currently green
Best:        12.3s ← Personal best during this session
```

### Skeleton Colors
```
⚪ WHITE          Your pose doesn't match the selected pose
🟢 GREEN (+ Audio) Your pose matches! Time is running
```

---

## 🧪 Test Cases to Try

### Test 1: Basic Detection
**Goal**: Get the skeleton to turn green

1. Start app
2. Select "Tree" pose
3. Read the instructions
4. Click "Start Pose"
5. Stand on one leg and reach arms up
6. Watch for green skeleton + audio

**Expected Result**: Skeleton turns green within 2-3 seconds ✅

---

### Test 2: Confidence Threshold
**Goal**: Test the slider affects detection

1. Set threshold to 80% (very forgiving)
2. Perform a rough version of Tree
3. Should turn green easily
4. Then set to 100% (very strict)
5. Do the same rough pose
6. Should NOT turn green

**Expected Result**: Higher threshold = stricter detection ✅

---

### Test 3: Session History
**Goal**: Verify sessions save

1. Do 3 different yoga poses (5+ seconds each)
2. Each time click "Stop Pose"
3. Scroll down to see "Yoga Session History"
4. Should show:
   - Statistics (total sessions, etc.)
   - Recent sessions list with timestamps

**Expected Result**: All 3 sessions appear in history ✅

---

### Test 4: Persistence
**Goal**: Verify data survives page refresh

1. Do a yoga session
2. Note the "Best" time (e.g., 12.3s)
3. Refresh the page (F5)
4. Data should still be there
5. "Best" time should still be 12.3s

**Expected Result**: Data persists across page refresh ✅

---

### Test 5: Error Handling
**Goal**: Test error messages

1. Start app with internet off (optional)
   - Should either load from cache or show error
   - Error message should be clear
2. Deny camera permission
   - Should show error message
3. Check console (F12) for any errors
   - Should see mostly info/warning, not errors

**Expected Result**: Graceful error handling ✅

---

## 🎥 Sample Recording Script (If Sharing)

```
1. Open http://localhost:3000
   "This is FitVision AI - a yoga pose detection app"

2. Click "Start Pose"
   "Let me select Tree pose"

3. Select Tree from dropdown
   "Here are the step-by-step instructions"

4. Click "Start Pose"
   "Camera is now active. Watch the skeleton overlay"

5. Perform Tree pose
   "Notice the skeleton is white initially..."
   "...now it's turning green as I match the pose!"
   "The audio feedback confirms detection"

6. Hold for a few seconds
   "Pose time and best time are tracked automatically"

7. Stop
   "The session is saved to browser storage"
   "I can view my history anytime"
```

---

## 📋 Testing Checklist

| Feature | Expected | Actual | ✅/❌ |
|---------|----------|--------|------|
| App loads without errors | Yes | | |
| Camera permission prompt | Shows | | |
| Pose dropdown works | Selects pose | | |
| Instructions display | 6 steps shown | | |
| Confidence slider works | 80-100% range | | |
| Start button works | Detection starts | | |
| Skeleton renders | 17 points visible | | |
| Skeleton changes color | White/green | | |
| Audio feedback | Count sound plays | | |
| Performance metrics | Time displays | | |
| Session saves | Appears in history | | |
| History persists | Survives refresh | | |
| Error handling | Messages show | | |
| No console errors | Clean console | | |

---

## 🎉 Success Criteria

**Application is working correctly if:**

✅ App loads in browser
✅ Camera works and shows in real-time
✅ Skeleton overlay renders (17 keypoints)
✅ Skeleton turns green when you perform correct pose
✅ Audio plays on correct detection
✅ Metrics track performance
✅ Session history saves and displays
✅ Data persists on page refresh
✅ Error messages appear for issues
✅ No console errors

If all of the above work: **PHASE 2 is validated!** 🚀

---

## 📞 Troubleshooting During Testing

| Problem | Solution |
|---------|----------|
| Blank screen on load | Wait 5 sec (models loading), check console |
| No camera feed | Allow permission, check browser console |
| Skeleton not visible | Ensure full body in frame, check lighting |
| Always white skeleton | Lower confidence threshold |
| Always green skeleton | Raise confidence threshold |
| Audio not playing | Unmute browser, check browser settings |
| History not showing | Scroll down on page, check storage in DevTools |
| Page feels slow | Reduce browser tabs, check CPU usage |
| Model loading failed | Check internet, refresh page |

---

**Now you're ready to test!** Run `npm start` and follow these steps. 🚀
