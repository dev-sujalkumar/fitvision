# 🚀 Quick Start Guide - FitVision AI

## Prerequisites Checked ✅
- Node.js: v24.14.1 ✅
- npm: v11.11.0 ✅
- Dependencies: Already installed ✅

## Start the Application

### Option 1: Quick Start (Recommended)
```bash
cd frontend
npm start
```

The app will automatically open at `http://localhost:3000`

### Option 2: Manual Start
```bash
cd frontend
npm start
# Then manually open browser to http://localhost:3000
```

---

## What You'll See

### Welcome Screen
1. A landing page with "Start Pose" button
2. Navigation menu at the top
3. Yoga pose selection dropdown

### Testing the App

**Step 1: Start Yoga Detection**
- Click "Start Pose" button
- Allow camera access when prompted (browser will ask)

**Step 2: Select a Yoga Pose**
- Choose from: Tree, Chair, Cobra, Warrior, Dog, Shoulderstand, Triangle

**Step 3: Read Instructions**
- Follow 6-step instructions displayed on screen
- Reference image shown on the right

**Step 4: Perform the Pose**
- Position yourself in front of camera
- Try to match the reference pose

**Step 5: Watch for Feedback**
- **White skeleton** = Pose detected but not matching
- **Green skeleton** = Correct pose! (Audio will play)
- Skeleton shows 17 body keypoints in real-time

**Step 6: Track Performance**
- **Pose Time**: Duration skeleton is green
- **Best**: Best performance during session
- Adjust **Confidence Threshold** slider if too strict/loose (80-100%)

**Step 7: Stop Session**
- Click "Stop Pose" to end
- Session automatically saved to browser storage

---

## New Features to Try

### 1. Confidence Threshold Slider
Before clicking "Start Pose":
- Adjust the confidence slider (80-100%)
- Higher = stricter (needs better pose match)
- Lower = more forgiving

### 2. Session History
Look for "Yoga Session History" component showing:
- **Total Sessions**: Number of sessions recorded
- **Total Duration**: Sum of all pose times
- **Average Duration**: Average hold time
- **Best Duration**: Personal best
- **Recent Sessions List**: Timestamps and details

### 3. Error Handling (Test)
Try:
- Disconnect internet (cloud model fails) → Falls back to local
- Deny camera permission → See helpful error message
- Start with confidence at 100% → Very strict detection

---

## Troubleshooting

### "Module not found" error
```bash
cd frontend
npm install
npm start
```

### Camera permission denied
1. Go to browser settings
2. Allow camera access for localhost:3000
3. Refresh page

### App is slow
- Try reducing browser tabs
- Ensure good lighting in front of camera
- 10 FPS is normal (intentional for reliability)

### Can't see skeleton overlay
- Check camera is enabled
- Try different lighting
- Ensure full body visible in frame

---

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject (not recommended)
npm run eject
```

---

## File Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Yoga/Yoga.js          ← Main yoga component (REFACTORED)
│   │   ├── Home/
│   │   ├── About/
│   │   └── Tutorials/
│   ├── components/
│   │   ├── YogaHistory/          ← NEW history component
│   │   ├── DropDown/
│   │   └── Instrctions/
│   ├── utils/
│   │   ├── storage.js            ← NEW storage utilities
│   │   ├── data/index.js         ← Pose data (UPDATED)
│   │   ├── helper.js             ← Drawing functions
│   │   └── pose_images/
│   ├── App.js                     ← Main router
│   └── index.js                   ← Entry point
├── public/
├── package.json
└── node_modules/                  ← Already installed ✅
```

---

## Key Technologies Used

- **React 17**: UI framework
- **TensorFlow.js 3.10**: ML in browser
- **MoveNet Thunder**: Pose detection (17 keypoints)
- **IndexedDB**: Browser storage
- **react-webcam**: Camera access

---

## First Session Checklist

- [ ] Start the app (`npm start`)
- [ ] Camera permission granted
- [ ] Select "Tree" pose
- [ ] Read instructions
- [ ] Click "Start Pose"
- [ ] Perform tree pose in front of camera
- [ ] Watch skeleton turn green
- [ ] Stop when done
- [ ] View session in history

---

## Next Steps After Testing

1. **Review Code**: Check `frontend/src/pages/Yoga/Yoga.js`
2. **Understand Storage**: Review `frontend/src/utils/storage.js`
3. **Plan Phase 3**: Read `PHASE3_GYM_DETECTION_GUIDE.md`
4. **Deploy**: Follow production deployment steps

---

## Performance Info

- **Inference Rate**: 10 FPS (100ms per frame)
- **Model Loading**: 2-5 seconds first load
- **Skeleton Points**: 17 keypoints in real-time
- **Connections**: 13 skeleton connections
- **Storage**: IndexedDB (unlimited in browser)
- **Memory**: ~50-100MB during operation

---

## Keyboard Shortcuts

(Can be added in future phases)
- Currently: Mouse clicks only
- Touch support: Works on tablets

---

## Browser Support

- Chrome/Chromium: ✅ Recommended
- Firefox: ✅ Works
- Safari: ⚠️ May need WebGL backend
- Edge: ✅ Works

---

## Getting Help

1. **Errors on start**: Check console (F12 → Console tab)
2. **Camera issues**: See troubleshooting above
3. **Understanding code**: Read `PHASE1_ANALYSIS.md`
4. **Next features**: See `PHASE3_GYM_DETECTION_GUIDE.md`

---

## Production Deployment

When ready to deploy:

```bash
# Build for production
npm run build

# Output in: frontend/build/
# Deploy the 'build' folder to your hosting service
```

Common hosting options:
- Vercel (automatic from Git)
- Netlify (drag & drop or Git)
- AWS S3 + CloudFront
- Firebase Hosting
- Any static file host

---

**Ready to start? Run `npm start` in the frontend directory!** 🎉
