# 🏋️ FitVision AI - Complete Fitness Platform

**Transform your fitness journey with AI-powered pose detection, workout tracking, and comprehensive health management.**

---

## 📋 Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Pages & Functionality](#pages--functionality)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Usage Guide](#usage-guide)
- [Data Storage](#data-storage)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### 🧘 Yoga Training
- **Real-time Pose Detection**: AI-powered MoveNet detector recognizes 7 yoga poses
- **7 Supported Poses**: Tree, Chair, Cobra, Warrior, Dog (Downward Dog), Shoulderstand, Triangle
- **Live Skeleton Visualization**: 17-point body skeleton with 13 connections
- **Performance Tracking**: Real-time duration and personal best tracking
- **Configurable Confidence Threshold**: Adjustable 80-100% detection sensitivity
- **Audio Feedback**: Count confirmation sounds for correct poses
- **Pose Instructions**: Detailed multi-step instructions with reference images
- **Session History**: Automatic persistence with timestamp and confidence scores

### 💪 Gym Exercise Detection
- **Rep Counting**: Automatic repetition counting for gym exercises
- **3 Exercise Types**: Squats, Push-ups, Bicep Curls (extensible)
- **Form Feedback**: Real-time guidance on exercise form and alignment
- **Joint Angle Calculations**: Precise angle tracking for form validation
- **Multi-Set Tracking**: Track sets and reps per workout
- **Real-time Canvas Visualization**: Live skeleton overlay during detection
- **Workout Duration**: Automatic timing for complete workouts
- **Calorie Estimation**: Automatic calorie burn calculation

### 📊 Dashboard
- **Comprehensive Statistics**: Total sessions, yoga minutes, gym reps, calories burned
- **Streak Tracking**: Current workout streak counter
- **Exercise Analytics**: Most performed exercises and favorite workouts
- **Recent Activity**: List of latest workouts with timestamps
- **Weekly Goals**: Progress bars for weekly fitness targets
- **Multi-Tab Interface**: Overview, Yoga Sessions, Gym Workouts tabs
- **Session Details**: Complete information per workout

### 📋 Workout History
- **Complete History Log**: All yoga sessions and gym workouts
- **Advanced Filtering**: Filter by type (All, Yoga, Gym)
- **Smart Sorting**: Sort by date, name, or duration
- **Detailed Statistics**: Total workouts, time spent, average duration
- **Rich Workout Cards**: Display pose/exercise name, reps, sets, duration, calories
- **Responsive Table Layout**: Mobile-friendly adaptive design
- **Date Formatting**: Intelligent "Today/Yesterday" + time display

### 📅 Workout Planner
- **Weekly Schedule**: Plan exercises for each day of the week
- **Goal Setting**: Configure daily calorie goals and weekly workout targets
- **Flexible Exercise Library**: 7 yoga poses + 6+ gym exercises
- **Exercise Configuration**: Set sets, reps, or duration per exercise
- **Weekly Statistics**: Total exercises, yoga/gym breakdown, active days
- **Modal Editor**: Easy add/remove exercise interface
- **Progress Persistence**: Saves weekly plan to local storage

### 🥗 Nutrition Tracker
- **Daily Macro Tracking**: Track calories, protein, carbs, fats
- **Progress Visualization**: Daily calorie goal progress bar
- **Macro Breakdown**: Color-coded macro nutrient display
- **Food Database**: 10+ common foods with preset nutritional info
- **Custom Entries**: Add custom foods with full macro details
- **Serving Sizes**: Configurable servings for flexible tracking
- **Recent History**: View last 20 food entries
- **Quick Select**: One-click selection of common foods

---

## 🚀 Getting Started

### Prerequisites
- Node.js v24+ and npm v11+
- Modern web browser with webcam support
- Internet connection (for cloud model loading)

### Installation

```bash
cd frontend
npm install
```

### Running the Application

```bash
# Linux/Mac
npm start

# Windows (with OpenSSL legacy provider fix)
$env:NODE_OPTIONS='--openssl-legacy-provider'; npm start
```

**Access at**: `http://localhost:3000`

---

## 📄 Pages & Functionality

### Home Page (`/`)
- **Welcome Screen**: Feature overview and navigation hub
- **Quick Links**: Direct access to all major features
- **Feature Cards**: 6 cards describing each feature
- **About Navigation**: Quick access to project information

### Yoga Page (`/start`)
- **Pose Selection**: Dropdown with 7 yoga poses
- **Live Webcam**: Real-time video feed with skeleton overlay
- **Pose Detection**: Start/Stop controls for detection
- **Performance Display**: Duration and best time tracking
- **Instructions Panel**: Detailed pose instructions and reference images
- **Confidence Slider**: Adjustable detection threshold (80-100%)
- **History Tab**: Recent yoga session statistics
- **Error Handling**: User-friendly error messages with recovery options

### Gym Page (`/gym`)
- **Exercise Selector**: Dropdown for squat, push-up, bicep curl
- **Live Skeleton**: Canvas visualization of pose with joints highlighted
- **Rep Counter**: Real-time repetition counting and display
- **Set Tracker**: Multi-set workout tracking
- **State Display**: Current exercise phase (setup, descent, bottom, ascent)
- **Form Feedback**: Real-time guidance on form quality
- **Workout History**: List of recent workouts with stats
- **Start/Stop/Complete Set Controls**: Full workout control interface

### Dashboard Page (`/dashboard`)
- **Quick Stats**: 6 key statistics in prominent cards
- **Tabs Interface**: Overview, Yoga, Gym workout tabs
- **Recent Activity**: Latest 10 workouts in chronological order
- **Weekly Goals**: Progress bars for fitness targets
- **Session Cards**: Detailed information per yoga/gym session
- **Statistics**: Total workouts, time, calories, performance metrics

### Workout History Page (`/history`)
- **Statistics Cards**: Total workouts, time, average duration
- **Filter Controls**: Type filter (All/Yoga/Gym)
- **Sort Options**: Date, Name, Duration sorting
- **Table View**: Desktop responsive table layout
- **Card View**: Mobile-friendly card layout
- **Color Coding**: Visual distinction between yoga and gym workouts
- **Date Formatting**: Smart date display

### Workout Planner Page (`/planner`)
- **Goal Configuration**: Set calorie and workout frequency goals
- **7-Day Schedule**: Plan each day of the week
- **Exercise Library**: Quick-select exercises with presets
- **Weekly Statistics**: Active days, exercise breakdown
- **Add/Remove Interface**: Modal dialog for managing exercises
- **Persistence**: Auto-saves to local storage
- **Configuration**: Sets, reps, duration per exercise

### Nutrition Page (`/nutrition`)
- **Daily Macro Display**: Real-time calorie, protein, carbs, fats totals
- **Calorie Goal Progress**: Visual progress bar with goal tracking
- **Add Entry Form**: Custom food entry or quick-select
- **Common Foods**: 10 preset foods (Chicken, Rice, Broccoli, etc.)
- **Serving Sizes**: Flexible serving configuration
- **Recent History**: Last 20 food entries with macros
- **Smart Calculations**: Automatic macro totals based on servings

---

## 🛠 Technology Stack

### Frontend Framework
- **React 18**: Component-based UI library
- **React Router**: Client-side routing
- **React Webcam**: Browser webcam integration

### AI/ML
- **TensorFlow.js**: Browser-based machine learning
- **MoveNet**: Real-time pose detection model
- **Custom Classifier**: Yoga pose classification (Keras/TensorFlow)

### Storage
- **IndexedDB**: Local browser database for persistent storage
- **localStorage**: Simple key-value persistence for preferences

### Styling
- **CSS3**: Grid, flexbox, animations, gradients
- **Responsive Design**: Mobile-first approach with media queries
- **Dark Theme**: Professional dark UI with accent colors

### Build Tools
- **Create React App**: Zero-config React setup
- **Webpack**: Module bundling (via CRA)
- **Babel**: ES6+ transpilation

---

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── pages/
│   │   ├── Home/
│   │   ├── Yoga/
│   │   ├── Gym/
│   │   ├── Dashboard/
│   │   ├── WorkoutHistory/
│   │   ├── WorkoutPlanner/
│   │   ├── Nutrition/
│   │   ├── About/
│   │   ├── Tutorials/
│   │   └── ...
│   ├── components/
│   │   ├── YogaHistory/
│   │   ├── DropDown/
│   │   ├── Instructions/
│   │   └── ...
│   ├── utils/
│   │   ├── storage.js          # IndexedDB utilities
│   │   ├── gymExercises.js     # Gym rep counting logic
│   │   ├── data/
│   │   │   └── index.js        # Pose definitions
│   │   ├── helper.js           # Skeleton drawing
│   │   ├── pose_process.js     # Pose normalization
│   │   └── images/             # Reference images
│   ├── App.js                  # Main router
│   ├── App.css
│   └── index.js
├── package.json
├── README_FITVISION.md         # This file
└── .gitignore
```

---

## 📖 Usage Guide

### Getting Started with Yoga

1. **Navigate to Yoga**: Click "🧘 Yoga Training" on home page
2. **Select Pose**: Choose from dropdown (e.g., "Tree")
3. **Read Instructions**: Review pose instructions and reference image
4. **Start Detection**: Click "Start Pose" button
5. **Allow Camera**: Grant browser permission to access webcam
6. **Perform Pose**: Hold the selected yoga pose for 3+ seconds
7. **Watch Skeleton**: See real-time skeleton turn green when correct
8. **Stop Pose**: Click "Stop Pose" when done
9. **Check History**: View session saved in History tab

### Getting Started with Gym

1. **Navigate to Gym**: Click "💪 Gym Workouts" on home page
2. **Select Exercise**: Choose from dropdown (Squat, Push-up, Bicep Curl)
3. **Start Exercise**: Click "Start Exercise" button
4. **Allow Camera**: Grant browser permission to access webcam
5. **Perform Exercise**: Do reps while skeleton is displayed
6. **Watch Counter**: Rep counter increments automatically
7. **Complete Set**: Click "Complete Set" when set is done
8. **Stop Workout**: Click "Stop Exercise" when finished
9. **View History**: Workout automatically saved with reps, sets, time

### Planning Your Week

1. **Open Planner**: Click "📅 Planner" on home page
2. **Set Goals**: Enter daily calorie goal and weekly workout count
3. **Add Exercises**: Click "+ Add Exercise" on any day
4. **Configure Exercise**: Select type (Yoga/Gym), exercise, sets/reps
5. **Build Schedule**: Add multiple exercises per day
6. **View Statistics**: See total exercises, active days, type breakdown
7. **Save Plan**: Auto-saves to local storage

### Tracking Nutrition

1. **Open Nutrition**: Click "🥗 Nutrition" on home page
2. **View Today**: See current calorie and macro totals
3. **Add Food**: Click "+ Add Food Entry"
4. **Quick Select**: Click common food or enter custom details
5. **Adjust Servings**: Modify serving size as needed
6. **Save Entry**: Click "✅ Add Entry"
7. **Monitor Progress**: Watch calorie progress bar update

---

## 💾 Data Storage

### IndexedDB Schema

**Stores:**
- `yogaSessions`: Yoga workouts with pose, duration, confidence, timestamp
- `gymWorkouts`: Gym exercises with reps, sets, duration, calories, exercise type
- `preferences`: User settings, goals, configurations
- `foodDiary`: Food entries with calories and macro nutrients
- `postureMeasurements`: Posture analysis data (for future features)

**Storage Limits:**
- ~50MB quota per domain
- Data persists across browser sessions
- Manual clear via browser dev tools or app reset

### Data Persistence

All data is stored locally in your browser:
- **Yoga Sessions**: Automatic on completion
- **Gym Workouts**: Automatic on "Stop Workout"
- **Nutrition Entries**: Automatic on "Add Entry"
- **Preferences**: Automatic on save
- **Planner**: Auto-saves when modified

---

## 🐛 Troubleshooting

### "This site can't be reached" / Connection Refused

**Solution:**
```bash
# Restart dev server with OpenSSL fix
$env:NODE_OPTIONS='--openssl-legacy-provider'; npm start
```

### Camera Not Working

**Check:**
1. Browser has permission to access camera
2. No other app is using camera
3. Camera drivers are installed
4. Try a different browser

**Fix:**
- Allow camera in browser settings
- Restart browser
- Check camera with another app

### Model Loading Timeout

**Solution:**
- Check internet connection
- Timeout falls back to lightweight model automatically
- If stuck, reload page

### Data Not Saving

**Check:**
1. Browser allows IndexedDB (check privacy settings)
2. Storage quota not exceeded
3. No browser extensions blocking storage

**Fix:**
- Clear browser cache
- Try incognito/private mode
- Check browser console for errors

### Slow Performance

**Optimize:**
- Close other browser tabs
- Ensure good lighting for detection
- Use Chrome for best performance
- Check browser console for warnings

### Linting Warnings on Build

**Note:** Warnings don't prevent builds. These are minor unused variables and CSS vendor prefixes that don't affect functionality.

---

## 📈 Features Roadmap

### Coming Soon (PHASE 5)
- [ ] Food Scanner (Image-based nutrition detection)
- [ ] Advanced Posture Analysis
- [ ] Mobile App (React Native)
- [ ] Social Features (Share workouts)
- [ ] Expert Recommendations
- [ ] More gym exercises (lunges, shoulder press, etc.)

### Future (PHASE 6+)
- [ ] Cloud Sync (Firebase backend)
- [ ] Premium Analytics
- [ ] Wearable Integration
- [ ] AI Personal Trainer
- [ ] Community Challenges

---

## 🔐 Privacy & Security

- **No Data Sent to Cloud**: All processing happens in your browser
- **Local Storage Only**: Your fitness data stays on your device
- **No Tracking**: No analytics, no telemetry
- **Camera Only Used When**: User explicitly clicks "Start"
- **Encryption**: Browser IndexedDB is secure by default

---

## 📞 Support

### Common Questions

**Q: Can I export my data?**
A: Yes, all data is in browser's IndexedDB. Use browser DevTools (F12 > Application) to access.

**Q: How accurate is pose detection?**
A: MoveNet achieves ~90%+ accuracy in good lighting. Performance depends on camera quality and lighting.

**Q: Can I use this offline?**
A: After initial load, most features work offline (except model download on first use).

**Q: Why is my rep count not increasing?**
A: Ensure full range of motion and proper form. Adjust confidence slider if too strict.

---

## 📄 License

This project is part of CSE471 Deep Learning for Computer Vision course.

---

## 👨‍💻 Technical Implementation

### Architecture Highlights

1. **Real-time Processing**: 100ms detection interval for smooth 10 FPS
2. **Memory Efficient**: Cleanup on component unmount, no resource leaks
3. **Error Resilient**: Cloud model fallback to local, user-friendly errors
4. **Responsive**: CSS Grid/Flexbox for all screen sizes
5. **Scalable**: New exercises easily added to RepCounter class

### Performance Metrics

- **Initial Load**: ~3-5 seconds (model download)
- **Detection Latency**: ~100-150ms (10 FPS)
- **Storage**: ~1MB per 100 workouts
- **Browser Support**: Chrome, Firefox, Safari, Edge

---

## 🎓 Educational Value

This project demonstrates:
- **Deep Learning**: MoveNet pose detection model
- **TensorFlow.js**: Browser-based ML inference
- **React Patterns**: Hooks, refs, lifecycle management
- **Real-time Processing**: Video stream analysis
- **Data Persistence**: IndexedDB web storage
- **UI/UX Design**: Responsive dark theme interface
- **State Management**: Complex app state with hooks
- **Algorithms**: Joint angle calculations, rep counting logic

---

**Last Updated**: October 20, 2026  
**Version**: 1.0 (PHASE 2-4 Complete)  
**Status**: Production Ready ✅

---

For the latest code, visit: [Project Repository]

**Enjoy your fitness journey! 🏋️💪🧘**
