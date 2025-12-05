export type ExamType = 'JEE' | 'NEET' | 'Boards' | 'Foundation' | '9-10' | '11-12';
export type BatchStatus = 'ongoing' | 'upcoming' | 'completed';
export type UserRole = 'student' | 'admin';
export type VideoType = 'live' | 'recorded';

export interface Batch {
  id: string;
  name: string;
  description: string;
  targetExam: ExamType;
  thumbnailUrl: string;
  startDate: string;
  status: BatchStatus;
  tags: string[];
  visibility: 'public' | 'private';
  lectureIds: string[];
  studentIds: string[];
}

export interface Lecture {
  id: string;
  batchId: string;
  title: string;
  subject: string;
  teacherName: string;
  dateTime: string;
  durationMinutes: number;
  videoType: VideoType;
  videoUrl: string;
  notesUrl?: string;
  dppUrl?: string;
  specialModuleUrl?: string;
  thumbnailUrl: string;
  topicTags: string[];
  isLocked: boolean;
}

export interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  topic: string;
  teacher: string;
  lectureId?: string;
}

export interface Timetable {
  id: string;
  batchId: string;
  weekRange: string;
  entries: TimetableEntry[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enrolledBatchIds: string[];
  avatarUrl?: string;
}
