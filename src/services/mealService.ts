// Mock meal service

export interface MealSession {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'CLOSED' | 'UPCOMING';
  servedCount?: number;
  totalExpected?: number;
}

const mockMeals: MealSession[] = [
  { id: '1', name: 'Breakfast', startTime: '06:00', endTime: '09:00', status: 'CLOSED', servedCount: 342, totalExpected: 1500 },
  { id: '2', name: 'Lunch', startTime: '12:00', endTime: '15:00', status: 'ACTIVE', servedCount: 854, totalExpected: 1500 },
  { id: '3', name: 'Dinner', startTime: '18:00', endTime: '20:00', status: 'UPCOMING', servedCount: 0, totalExpected: 1500 },
];

export const mealService = {
  getDailyMeals: async (): Promise<MealSession[]> => {
    return new Promise(resolve => setTimeout(() => resolve(mockMeals), 300));
  },

  getCurrentMeal: async (): Promise<MealSession | null> => {
    return new Promise(resolve => setTimeout(() => {
      const active = mockMeals.find(m => m.status === 'ACTIVE');
      resolve(active || null);
    }, 300));
  }
};
