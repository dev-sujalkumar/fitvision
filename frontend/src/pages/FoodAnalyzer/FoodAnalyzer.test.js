import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FoodAnalyzer from './FoodAnalyzer';

// Mock voiceCoach and storage
jest.mock('../../utils/voiceCoach', () => ({
  speakInstruction: jest.fn(),
  soundEffects: {
    playRepSuccess: jest.fn(),
    playFormMilestone: jest.fn(),
    playFanfare: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  saveFoodEntry: jest.fn().mockResolvedValue(true),
  getFoodDiary: jest.fn().mockResolvedValue([
    {
      id: 'meal_1',
      name: 'Sample High Protein Bowl',
      mealType: 'Lunch',
      calories: 520,
      protein: 42,
      carbs: 48,
      fat: 12,
      timestamp: Date.now(),
    },
  ]),
  deleteFoodEntry: jest.fn().mockResolvedValue(true),
}));

describe('FoodAnalyzer Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders header and primary tabs', async () => {
    await act(async () => {
      render(<FoodAnalyzer />);
    });
    expect(screen.getByText(/Food Vision & Nutrition Studio/i)).toBeInTheDocument();
    expect(screen.getByText(/Spatial Plate Scanner & Diagnostics/i)).toBeInTheDocument();
    expect(screen.getByText(/UEC-256 Food & Density Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/Clinical Meal Diary & Hydration/i)).toBeInTheDocument();
  });

  test('switches tabs smoothly to UEC-256 Food Database and searches', async () => {
    await act(async () => {
      render(<FoodAnalyzer />);
    });
    const dbTab = screen.getByText(/UEC-256 Food & Density Matrix/i);
    fireEvent.click(dbTab);

    const searchInput = screen.getByPlaceholderText(/Search 256 food items/i);
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'rice' } });
    expect(searchInput.value).toBe('rice');
  });

  test('switches to Clinical Meal Diary tab and displays hydration telemetry', async () => {
    await act(async () => {
      render(<FoodAnalyzer />);
    });
    const diaryTab = screen.getByText(/Clinical Meal Diary & Hydration/i);
    fireEvent.click(diaryTab);

    expect(screen.getByText(/Athletic Hydration Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText(/\+250ml \(Cup\)/i)).toBeInTheDocument();
  });

  test('opens and closes AI Engine configuration modal', async () => {
    await act(async () => {
      render(<FoodAnalyzer />);
    });
    const settingsBtn = screen.getByLabelText(/Settings/i);
    fireEvent.click(settingsBtn);

    expect(screen.getByText(/AI Vision Engine Configuration/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/AIzaSy.../i)).toBeInTheDocument();

    const closeBtn = screen.getByLabelText(/Close Settings/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/AI Vision Engine Configuration/i)).not.toBeInTheDocument();
  });

  test('starts in a clean empty state with upload dropzone and no default meal loaded', async () => {
    await act(async () => {
      render(<FoodAnalyzer />);
    });
    expect(screen.getByText(/Upload Your Meal Photo/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Photo from Device/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Live Webcam/i)).toBeInTheDocument();
    expect(screen.getByText(/101 Food Classes/i)).toBeInTheDocument();
    // Default meal pizza heading should NOT be in the document
    expect(screen.queryByRole('heading', { name: /Artisan Stone-Baked Pizza/i })).not.toBeInTheDocument();
  });

  test('loading a sample plate transitions to active workspace with Change Photo button and clears back to empty', async () => {
    await act(async () => {
      render(<FoodAnalyzer />);
    });

    // Find and click the demo pizza pill by text
    const pizzaDemoBtn = screen.getByText('Artisan Stone-Baked Pizza');
    expect(pizzaDemoBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(pizzaDemoBtn);
    });

    // Should now be in active workspace with analyzed dish
    expect(screen.getByRole('heading', { name: /Artisan Stone-Baked Pizza/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Change Photo/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Portion Weight Calibration/i)).toBeInTheDocument();

    // Clicking Clear button should reset back to empty hero canvas
    const clearBtn = screen.getByRole('button', { name: /Clear/i });
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    expect(screen.getByText(/Upload Your Meal Photo/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Artisan Stone-Baked Pizza/i })).not.toBeInTheDocument();
  });
});
