export enum AppView {
  LOGIN = 'LOGIN',
  ONBOARDING_PHASE_1 = 'ONBOARDING_PHASE_1',
  ONBOARDING_PHASE_2 = 'ONBOARDING_PHASE_2',
  DASHBOARD = 'DASHBOARD',
}

export enum MealType {
  BREAKFAST = '早餐',
  LUNCH = '午餐',
  DINNER = '晚餐',
  SNACK = '加餐'
}

export interface UserProfile {
  // Phase 1: Long term
  name: string;
  gender: 'female' | 'male';
  height: number; // cm
  weight: number; // kg
  age: number;
  periodStatus?: 'regular' | 'irregular' | 'none'; // Basic period info
  periodLastDate?: string;
  dietaryRestrictions?: string;
  
  // Phase 2: Short term / Current Status
  recentAppetite: 'good' | 'normal' | 'poor' | 'cravings';
  sleepQuality: 'good' | 'fair' | 'poor';
  energyLevel: 'high' | 'normal' | 'low';
  healthStatus: string; // e.g., "Recovering from cold"
  goal: 'maintain' | 'lose_weight' | 'gain_muscle' | 'health';
}

export interface NutritionData {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  tags: string[]; // e.g., "High Protein", "Sweet", "Soup"
  healthScore: number; // 0-100
  feedback: string; // Short AI feedback
  suggestion?: string; // Improvement suggestion
}

export interface MealEntry {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  type: MealType;
  description: string; // User input
  nutrition?: NutritionData; // AI Analyzed data
  isRecommended: boolean; // Was this an AI recommendation?
  imageBase64?: string;
}

export interface DayLog {
  date: string;
  mood: 'happy' | 'calm' | 'tired' | 'sad' | 'anxious' | 'excited';
  weight?: number; // Daily weight tracking
  waterIntake?: number; // cups
  meals: MealEntry[];
}

export interface AppState {
  view: AppView;
  user: UserProfile | null;
  logs: Record<string, DayLog>; // Keyed by YYYY-MM-DD
  currentDate: string; // YYYY-MM-DD
}

export interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
}