/**
 * IndexedDB Storage Utility for FitVision AI
 * Handles persistent storage of yoga sessions, gym workouts, and user data
 */

const DB_NAME = 'FitVisionAI';
const DB_VERSION = 2;

// Object store names
const STORES = {
  YOGA_SESSIONS: 'yogaSessions',
  GYM_WORKOUTS: 'gymWorkouts',
  USER_PREFERENCES: 'userPreferences',
  POSTURE_MEASUREMENTS: 'postureMeasurements',
  FOOD_DIARY: 'foodDiary',
};

/**
 * Initialize database and create object stores
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create yoga sessions store
      if (!db.objectStoreNames.contains(STORES.YOGA_SESSIONS)) {
        const yogaStore = db.createObjectStore(STORES.YOGA_SESSIONS, { keyPath: 'id', autoIncrement: true });
        yogaStore.createIndex('timestamp', 'timestamp', { unique: false });
        yogaStore.createIndex('pose', 'pose', { unique: false });
      }

      // Create gym workouts store
      if (!db.objectStoreNames.contains(STORES.GYM_WORKOUTS)) {
        const gymStore = db.createObjectStore(STORES.GYM_WORKOUTS, { keyPath: 'id', autoIncrement: true });
        gymStore.createIndex('timestamp', 'timestamp', { unique: false });
        gymStore.createIndex('exercise', 'exercise', { unique: false });
      }

      // Create user preferences store
      if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
        db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'key' });
      }

      // Create posture measurements store
      if (!db.objectStoreNames.contains(STORES.POSTURE_MEASUREMENTS)) {
        const postureStore = db.createObjectStore(STORES.POSTURE_MEASUREMENTS, { keyPath: 'id', autoIncrement: true });
        postureStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create food diary store
      if (!db.objectStoreNames.contains(STORES.FOOD_DIARY)) {
        const foodStore = db.createObjectStore(STORES.FOOD_DIARY, { keyPath: 'id' });
        foodStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

/**
 * Save a yoga session
 */
export const saveYogaSession = async (session) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.YOGA_SESSIONS], 'readwrite');
    const store = transaction.objectStore(STORES.YOGA_SESSIONS);

    const sessionData = {
      pose: session.pose || session.poseName || 'Yoga Pose',
      poseName: session.poseName || session.pose || 'Yoga Pose',
      duration: session.duration || 0,
      caloriesBurned: session.caloriesBurned || Math.round((session.duration || 0) * 0.08 + 12),
      timestamp: session.timestamp || new Date().getTime(),
      confidence: session.confidence || 0.97,
      notes: session.notes || '',
    };

    return new Promise((resolve, reject) => {
      const request = store.add(sessionData);
      request.onsuccess = () => {
        console.log('Yoga session saved with ID:', request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(new Error('Failed to save yoga session'));
    });
  } catch (error) {
    console.error('Error saving yoga session:', error);
    throw error;
  }
};

/**
 * Get yoga session history
 */
export const getYogaHistory = async (limit = 50) => {
  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains(STORES.YOGA_SESSIONS)) {
      return [];
    }
    const transaction = db.transaction([STORES.YOGA_SESSIONS], 'readonly');
    const store = transaction.objectStore(STORES.YOGA_SESSIONS);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const sessions = request.result || [];
        sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        resolve(sessions.slice(0, limit));
      };
      request.onerror = () => resolve([]);
    });
  } catch (error) {
    console.error('Error retrieving yoga history:', error);
    return [];
  }
};

/**
 * Save a gym workout session
 */
export const saveGymWorkout = async (workout) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.GYM_WORKOUTS], 'readwrite');
    const store = transaction.objectStore(STORES.GYM_WORKOUTS);

    const workoutData = {
      exercise: workout.exercise || workout.exerciseType || workout.exerciseName || 'Gym Workout',
      exerciseName: workout.exerciseName || workout.exercise || workout.exerciseType || 'Gym Workout',
      exerciseType: workout.exerciseType || workout.exercise || 'GYM',
      reps: workout.reps || 0,
      sets: workout.sets || 0,
      duration: workout.duration || 0,
      caloriesBurned: workout.caloriesBurned || Math.round((workout.reps || 0) * 5 + (workout.duration || 0) * 0.35 + 8),
      timestamp: workout.timestamp || new Date().getTime(),
      formQuality: workout.formQuality || 0,
      notes: workout.notes || '',
    };

    return new Promise((resolve, reject) => {
      const request = store.add(workoutData);
      request.onsuccess = () => {
        console.log('Gym workout saved with ID:', request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(new Error('Failed to save gym workout'));
    });
  } catch (error) {
    console.error('Error saving gym workout:', error);
    throw error;
  }
};

/**
 * Get gym workout history
 */
export const getGymWorkoutHistory = async (exercise = null, limit = 50) => {
  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains(STORES.GYM_WORKOUTS)) {
      return [];
    }
    const transaction = db.transaction([STORES.GYM_WORKOUTS], 'readonly');
    const store = transaction.objectStore(STORES.GYM_WORKOUTS);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let workouts = request.result || [];
        if (exercise) {
          workouts = workouts.filter(
            w => w.exercise === exercise || w.exerciseType === exercise || w.exerciseName === exercise
          );
        }
        workouts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        resolve(workouts.slice(0, limit));
      };
      request.onerror = () => resolve([]);
    });
  } catch (error) {
    console.error('Error retrieving gym workout history:', error);
    return [];
  }
};

/**
 * Delete a gym workout by ID
 */
export const deleteGymWorkout = async (id) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.GYM_WORKOUTS], 'readwrite');
    const store = transaction.objectStore(STORES.GYM_WORKOUTS);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Failed to delete gym workout'));
    });
  } catch (error) {
    console.error('Error deleting gym workout:', error);
    throw error;
  }
};

/**
 * Delete a yoga session by ID
 */
export const deleteYogaSession = async (id) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.YOGA_SESSIONS], 'readwrite');
    const store = transaction.objectStore(STORES.YOGA_SESSIONS);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Failed to delete yoga session'));
    });
  } catch (error) {
    console.error('Error deleting yoga session:', error);
    throw error;
  }
};

/**
 * Clear all gym and yoga workout history
 */
export const clearAllWorkoutHistory = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction([STORES.GYM_WORKOUTS, STORES.YOGA_SESSIONS], 'readwrite');
    tx.objectStore(STORES.GYM_WORKOUTS).clear();
    tx.objectStore(STORES.YOGA_SESSIONS).clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(new Error('Failed to clear workout history'));
    });
  } catch (error) {
    console.error('Error clearing workout history:', error);
    throw error;
  }
};

/**
 * Save user preferences
 */
export const saveUserPreference = async (key, value) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.USER_PREFERENCES], 'readwrite');
    const store = transaction.objectStore(STORES.USER_PREFERENCES);

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => {
        console.log('User preference saved:', key);
        resolve();
      };
      request.onerror = () => reject(new Error(`Failed to save preference: ${key}`));
    });
  } catch (error) {
    console.error('Error saving user preference:', error);
    throw error;
  }
};

/**
 * Get user preference
 */
export const getUserPreference = async (key) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.USER_PREFERENCES], 'readonly');
    const store = transaction.objectStore(STORES.USER_PREFERENCES);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => reject(new Error(`Failed to retrieve preference: ${key}`));
    });
  } catch (error) {
    console.error('Error retrieving user preference:', error);
    throw error;
  }
};





/**
 * Save posture measurement
 */
export const savePostureMeasurement = async (measurement) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.POSTURE_MEASUREMENTS], 'readwrite');
    const store = transaction.objectStore(STORES.POSTURE_MEASUREMENTS);

    const measurementData = {
      shoulderAlignment: measurement.shoulderAlignment || 0,
      neckAngle: measurement.neckAngle || 0,
      torsoAlignment: measurement.torsoAlignment || 0,
      hipAlignment: measurement.hipAlignment || 0,
      timestamp: measurement.timestamp || new Date().getTime(),
      notes: measurement.notes || '',
    };

    return new Promise((resolve, reject) => {
      const request = store.add(measurementData);
      request.onsuccess = () => {
        console.log('Posture measurement saved with ID:', request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(new Error('Failed to save posture measurement'));
    });
  } catch (error) {
    console.error('Error saving posture measurement:', error);
    throw error;
  }
};

/**
 * Get posture measurement history
 */
export const getPostureMeasurementHistory = async (limit = 50) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.POSTURE_MEASUREMENTS], 'readonly');
    const store = transaction.objectStore(STORES.POSTURE_MEASUREMENTS);
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const measurements = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          measurements.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(measurements);
        }
      };
      request.onerror = () => reject(new Error('Failed to retrieve posture measurements'));
    });
  } catch (error) {
    console.error('Error retrieving posture measurements:', error);
    throw error;
  }
};

/**
 * Save a food diary meal entry (IndexedDB with LocalStorage sync)
 */
export const saveFoodEntry = async (entry) => {
  const foodItem = {
    id: entry.id || `meal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: entry.timestamp || Date.now(),
    dateStr: entry.dateStr || new Date().toISOString().split('T')[0],
    mealName: entry.mealName || 'Logged Meal',
    dishes: entry.dishes || [],
    totals: entry.totals || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
    imageUrl: entry.imageUrl || null,
    confidence: entry.confidence || 0.94,
    nutriScore: entry.nutriScore || null,
    notes: entry.notes || '',
  };

  // Sync to LocalStorage for instant access & fallback
  try {
    const localExisting = JSON.parse(localStorage.getItem('fitvision_food_diary') || '[]');
    const updated = [foodItem, ...localExisting.filter(item => item.id !== foodItem.id)].slice(0, 100);
    localStorage.setItem('fitvision_food_diary', JSON.stringify(updated));
  } catch (lsErr) {
    console.warn('LocalStorage food diary sync warning:', lsErr);
  }

  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains(STORES.FOOD_DIARY)) {
      return foodItem;
    }
    const transaction = db.transaction([STORES.FOOD_DIARY], 'readwrite');
    const store = transaction.objectStore(STORES.FOOD_DIARY);

    return new Promise((resolve) => {
      const request = store.put(foodItem);
      request.onsuccess = () => resolve(foodItem);
      request.onerror = () => resolve(foodItem); // Fallback to localStorage entry
    });
  } catch (error) {
    console.warn('IndexedDB food diary save failed, fallback succeeded:', error);
    return foodItem;
  }
};

/**
 * Get food diary history (IndexedDB with LocalStorage fallback)
 */
export const getFoodDiary = async (limit = 50) => {
  try {
    const db = await initDB();
    if (db.objectStoreNames.contains(STORES.FOOD_DIARY)) {
      const transaction = db.transaction([STORES.FOOD_DIARY], 'readonly');
      const store = transaction.objectStore(STORES.FOOD_DIARY);

      const items = await new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });

      if (items && items.length > 0) {
        items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return items.slice(0, limit);
      }
    }
  } catch (error) {
    console.warn('IndexedDB food diary read failed, reading from localStorage:', error);
  }

  // Fallback to LocalStorage
  try {
    const local = JSON.parse(localStorage.getItem('fitvision_food_diary') || '[]');
    local.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return local.slice(0, limit);
  } catch (e) {
    return [];
  }
};

/**
 * Delete a food diary entry by ID
 */
export const deleteFoodEntry = async (id) => {
  // Delete from LocalStorage
  try {
    const local = JSON.parse(localStorage.getItem('fitvision_food_diary') || '[]');
    const filtered = local.filter(item => item.id !== id);
    localStorage.setItem('fitvision_food_diary', JSON.stringify(filtered));
  } catch (lsErr) {
    console.warn('LocalStorage food diary delete warning:', lsErr);
  }

  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains(STORES.FOOD_DIARY)) {
      return true;
    }
    const transaction = db.transaction([STORES.FOOD_DIARY], 'readwrite');
    const store = transaction.objectStore(STORES.FOOD_DIARY);

    return new Promise((resolve) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(true);
    });
  } catch (error) {
    console.warn('IndexedDB food diary delete failed, LocalStorage was updated:', error);
    return true;
  }
};

/**
 * Clear all data (for testing/reset)
 */
export const clearAllData = async () => {
  try {
    localStorage.removeItem('fitvision_food_diary');
    const db = await initDB();
    const storeNames = Object.values(STORES).filter(name => db.objectStoreNames.contains(name));
    const transaction = db.transaction(storeNames, 'readwrite');

    storeNames.forEach(storeName => {
      const store = transaction.objectStore(storeName);
      store.clear();
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('All data cleared');
        resolve();
      };
      transaction.onerror = () => reject(new Error('Failed to clear all data'));
    });
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

const storage = {
  saveYogaSession,
  getYogaHistory,
  saveGymWorkout,
  getGymWorkoutHistory,
  deleteGymWorkout,
  deleteYogaSession,
  clearAllWorkoutHistory,
  saveUserPreference,
  getUserPreference,
  savePostureMeasurement,
  getPostureMeasurementHistory,
  saveFoodEntry,
  getFoodDiary,
  deleteFoodEntry,
  clearAllData,
};

export default storage;


/**
 * Save multiple user preferences at once
 */
export const saveUserPreferences = async (prefs) => {
  try {
    for (const [key, value] of Object.entries(prefs)) {
      await saveUserPreference(key, value);
    }
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw error;
  }
};

/**
 * Get all user preferences
 */
export const getUserPreferences = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PREFERENCES], 'readonly');
      const store = transaction.objectStore(STORES.PREFERENCES);
      const request = store.getAll();

      request.onsuccess = () => {
        const prefs = {};
        request.result.forEach(item => {
          prefs[item.key] = item.value;
        });
        resolve(prefs);
      };
      request.onerror = () => reject(new Error('Failed to get preferences'));
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
};
