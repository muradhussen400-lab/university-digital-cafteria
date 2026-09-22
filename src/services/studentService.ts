// Mock student service

export interface Student {
  id: string;
  name: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastScan?: string;
}

const mockStudents: Student[] = [
  { id: 'STU001', name: 'Abebe Kebede', department: 'Computer Science', status: 'ACTIVE', lastScan: 'Today, 12:45 PM' },
  { id: 'STU002', name: 'Sara Ahmed', department: 'Engineering', status: 'ACTIVE', lastScan: 'Today, 12:15 PM' },
  { id: 'STU003', name: 'John Doe', department: 'Business', status: 'INACTIVE', lastScan: 'Yesterday, 19:30 PM' },
  { id: 'STU004', name: 'Almaz Tadesse', department: 'Medicine', status: 'ACTIVE', lastScan: 'Today, 08:10 AM' },
  { id: 'STU005', name: 'Kebede Alemu', department: 'Computer Science', status: 'SUSPENDED', lastScan: '2 days ago' },
];

export const studentService = {
  getAllStudents: async (): Promise<Student[]> => {
    // Simulate network delay
    return new Promise(resolve => setTimeout(() => resolve(mockStudents), 300));
  },
  
  getStudentById: async (id: string): Promise<Student | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(mockStudents.find(s => s.id === id)), 300));
  }
};
