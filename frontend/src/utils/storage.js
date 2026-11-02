/**
 * IndexedDB Storage Utility for FitVision AI
 * Handles persistent storage of yoga sessions, gym workouts, and user data
 */

const DB_NAME = 'FitVisionAI';
const DB_VERSION = 1;

// Object store names
const STORES = {
  YOGA_SESSIONS: 'yogaSessions',
  GYM_WORKOUTS: 'gymWorkouts',
  USER_PREFERENCES: 'userPreferences',
  FOOD_DIARY: 'foodDiary',
  POSTURE_MEASUREMENTS: 'postureMeasurements',
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
        const prefsStore = db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'key' });
      }

      // Create food diary store
      if (!db.objectStoreNames.contains(STORES.FOOD_DIARY)) {
        const foodStore = db.createObjectStore(STORES.FOOD_DIARY, { keyPath: 'id', autoIncrement: true });
        foodStore.createIndex('date', 'date', { unique: false });
      }

      // Create posture measurements store
      if (!db.objectStoreNames.contains(STORES.POSTURE_MEASUREMENTS)) {
        const postureStore = db.createObjectStore(STORES.POSTURE_MEASUREMENTS, { keyPath: 'id', autoIncrement: true });
        postureStore.createIndex('timestamp', 'timestamp', { unique: false });
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
      pose: session.pose,
      duration: session.duration,
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
    const transaction = db.transaction([STORES.YOGA_SESSIONS], 'readonly');
    const store = transaction.objectStore(STORES.YOGA_SESSIONS);
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const sessions = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          sessions.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(sessions);
        }
      };
      request.onerror = () => reject(new Error('Failed to retrieve yoga history'));
    });
  } catch (error) {
    console.error('Error retrieving yoga history:', error);
    throw error;
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
      exercise: workout.exercise,
      reps: workout.reps || 0,
      sets: workout.sets || 0,
      duration: workout.duration || 0,
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
    const transaction = db.transaction([STORES.GYM_WORKOUTS], 'readonly');
    const store = transaction.objectStore(STORES.GYM_WORKOUTS);
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const workouts = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          if (!exercise || cursor.value.exercise === exercise) {
            workouts.push(cursor.value);
            count++;
          }
          cursor.continue();
        } else {
          resolve(workouts);
        }
      };
      request.onerror = () => reject(new Error('Failed to retrieve gym workout history'));
    });
  } catch (error) {
    console.error('Error retrieving gym workout history:', error);
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
 * Save food entry
 */
export const saveFoodEntry = async (entry) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.FOOD_DIARY], 'readwrite');
    const store = transaction.objectStore(STORES.FOOD_DIARY);

    const foodData = {
      name: entry.name,
      calories: entry.calories || 0,
      protein: entry.protein || 0,
      carbs: entry.carbs || 0,
      fat: entry.fat || 0,
      fiber: entry.fiber || 0,
      sugars: entry.sugars || 0,
      sodiumMg: entry.sodiumMg || 0,
      potassiumMg: entry.potassiumMg || 0,
      calciumMg: entry.calciumMg || 0,
      ironMg: entry.ironMg || 0,
      magnesiumMg: entry.magnesiumMg || 0,
      zincMg: entry.zincMg || 0,
      folateMcg: entry.folateMcg || 0,
      vitaminCMg: entry.vitaminCMg || 0,
      vitaminAMcg: entry.vitaminAMcg || 0,
      vitaminDMcg: entry.vitaminDMcg || 0,
      vitaminB12Mcg: entry.vitaminB12Mcg || 0,
      cholesterolMg: entry.cholesterolMg || 0,
      items: entry.items || [],
      estimateSource: entry.estimateSource || 'manual',
      date: entry.date || new Date().toISOString().split('T')[0],
      mealType: entry.mealType || 'other', // breakfast, lunch, dinner, snack, other
      timestamp: entry.timestamp || new Date().getTime(),
    };

    return new Promise((resolve, reject) => {
      const request = store.add(foodData);
      request.onsuccess = () => {
        console.log('Food entry saved with ID:', request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(new Error('Failed to save food entry'));
    });
  } catch (error) {
    console.error('Error saving food entry:', error);
    throw error;
  }
};

/**
 * Get food diary for a specific date
 */
export const getFoodDiary = async (date = null) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.FOOD_DIARY], 'readonly');
    const store = transaction.objectStore(STORES.FOOD_DIARY);
    const index = store.index('date');

    const targetDate = date || new Date().toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
      const request = index.getAll(targetDate);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => reject(new Error('Failed to retrieve food diary'));
    });
  } catch (error) {
    console.error('Error retrieving food diary:', error);
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
 * Clear all data (for testing/reset)
 */
export const clearAllData = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction(
      [
        STORES.YOGA_SESSIONS,
        STORES.GYM_WORKOUTS,
        STORES.USER_PREFERENCES,
        STORES.FOOD_DIARY,
        STORES.POSTURE_MEASUREMENTS,
      ],
      'readwrite'
    );

    Object.values(STORES).forEach(storeName => {
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

export default {
  saveYogaSession,
  getYogaHistory,
  saveGymWorkout,
  getGymWorkoutHistory,
  saveUserPreference,
  getUserPreference,
  saveFoodEntry,
  getFoodDiary,
  savePostureMeasurement,
  getPostureMeasurementHistory,
  clearAllData,
};


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
