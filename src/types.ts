export interface Student {
  id: string;
  name: string;
  seatNumber?: string;
}

export interface DrawRecord {
  id: string;
  student: Student;
  timestamp: number;
}

export interface StudentGroup {
  id: string;
  name: string;
  color: string;
  accentColor: string;
  members: Student[];
}

export type ActiveTab = 'picker' | 'groups' | 'roster';
