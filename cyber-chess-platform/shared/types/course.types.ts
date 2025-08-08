// shared/types/course.types.ts
export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  instructorId: string;
  instructor?: User;
  difficulty: Difficulty;
  duration: number;
  price: number;
  status: CourseStatus;
  syllabus?: CourseSyllabus;
  requirements: string[];
  objectives: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseSyllabus {
  modules: Module[];
  totalDuration: number;
  totalLessons: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  materials?: LessonMaterial[];
  orderIndex: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonMaterial {
  type: 'document' | 'video' | 'link' | 'chess';
  title: string;
  url: string;
  description?: string;
}

export interface SecurityEvent {
  id: string;
  title: string;
  description: string;
  eventDate: Date;
  severity: Severity;
  category: string;
  podcastUrl?: string;
  articleUrl?: string;
  videoUrl?: string;
  tags: string[];
  impact?: string;
  mitigation?: string;
  references?: Reference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Reference {
  title: string;
  url: string;
  type: 'article' | 'paper' | 'video' | 'tool';
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  progress: number;
  certificate?: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  progress: number;
  lastAccess: Date;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}
