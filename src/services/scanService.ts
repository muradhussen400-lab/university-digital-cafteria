// Mock scan service

export interface ScanRecord {
  id: string;
  student: string;
  studentId: string;
  meal: string;
  time: string;
  date?: string;
  status: 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'EXPIRED' | 'CLOSED';
}

const mockScans: ScanRecord[] = [
  { id: 'SCN-101', student: 'Abebe Kebede', studentId: 'STU001', meal: 'Lunch', time: '12:45:32 PM', date: 'Today', status: 'SUCCESS' },
  { id: 'SCN-102', student: 'Unknown', studentId: 'N/A', meal: 'Lunch', time: '12:44:10 PM', date: 'Today', status: 'INVALID' },
  { id: 'SCN-103', student: 'Sara Ahmed', studentId: 'STU002', meal: 'Lunch', time: '12:40:05 PM', date: 'Today', status: 'SUCCESS' },
  { id: 'SCN-104', student: 'Sara Ahmed', studentId: 'STU002', meal: 'Lunch', time: '12:41:20 PM', date: 'Today', status: 'DUPLICATE' },
];

export const scanService = {
  getRecentScans: async (): Promise<ScanRecord[]> => {
    return new Promise(resolve => setTimeout(() => resolve(mockScans), 300));
  },
  
  getStudentHistory: async (studentId: string): Promise<ScanRecord[]> => {
    return new Promise(resolve => setTimeout(() => {
      resolve(mockScans.filter(s => s.studentId === studentId));
    }, 300));
  }
};
