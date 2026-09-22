export type Role = 'student' | 'admin' | 'cafeteria';

export interface User {
  id: string;
  name: string;
  role: Role;
  studentId?: string; // For students
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface MealSession {
  id: string;
  name: string; // 'Breakfast' | 'Lunch' | 'Dinner'
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  status: 'OPEN' | 'CLOSED' | 'UPCOMING';
  todayUsage?: number;
}

export interface MealClaim {
  id: string;
  mealSessionId: string;
  studentId: string;
  scannedAt: string;
  status: 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'EXPIRED' | 'CLOSED' | 'ERROR';
}

export interface ScanAttempt {
  id: string;
  time: string;
  studentId: string;
  meal: string;
  result: 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'EXPIRED' | 'CLOSED' | 'ERROR';
  location?: string;
  device?: string;
}

export interface SecurityAlert {
  id: string;
  severity: 'WARNING' | 'DANGER' | 'INFO';
  time: string;
  studentId?: string;
  meal?: string;
  reason: string;
  status: 'UNRESOLVED' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface DashboardStats {
  totalStudents: number;
  todaySuccessfulMeals: number;
  todayDuplicateAttempts: number;
  activeMealSession: string | null;
  systemStatus: 'ONLINE' | 'OFFLINE';
}
