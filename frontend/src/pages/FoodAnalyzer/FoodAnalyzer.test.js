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
});
