import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Batch, Lecture, Timetable, User } from '@/types';
import { mockBatches, mockLectures, mockTimetables, mockUsers } from '@/data/mockData';

interface DataContextType {
  batches: Batch[];
  lectures: Lecture[];
  timetables: Timetable[];
  users: User[];
  // Batch CRUD
  addBatch: (batch: Batch) => void;
  updateBatch: (batch: Batch) => void;
  deleteBatch: (id: string) => void;
  // Lecture CRUD
  addLecture: (lecture: Lecture) => void;
  updateLecture: (lecture: Lecture) => void;
  deleteLecture: (id: string) => void;
  // Timetable CRUD
  addTimetable: (timetable: Timetable) => void;
  updateTimetable: (timetable: Timetable) => void;
  deleteTimetable: (id: string) => void;
  // User CRUD
  updateUser: (user: User) => void;
  enrollUser: (userId: string, batchId: string) => void;
  unenrollUser: (userId: string, batchId: string) => void;
  // Helpers
  getBatchById: (id: string) => Batch | undefined;
  getLecturesByBatchId: (batchId: string) => Lecture[];
  getTimetableByBatchId: (batchId: string) => Timetable | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [batches, setBatches] = useState<Batch[]>(mockBatches);
  const [lectures, setLectures] = useState<Lecture[]>(mockLectures);
  const [timetables, setTimetables] = useState<Timetable[]>(mockTimetables);
  const [users, setUsers] = useState<User[]>(mockUsers);

  // Batch CRUD
  const addBatch = (batch: Batch) => setBatches(prev => [...prev, batch]);
  const updateBatch = (batch: Batch) => setBatches(prev => prev.map(b => b.id === batch.id ? batch : b));
  const deleteBatch = (id: string) => {
    setBatches(prev => prev.filter(b => b.id !== id));
    setLectures(prev => prev.filter(l => l.batchId !== id));
    setTimetables(prev => prev.filter(t => t.batchId !== id));
  };

  // Lecture CRUD
  const addLecture = (lecture: Lecture) => {
    setLectures(prev => [...prev, lecture]);
    setBatches(prev => prev.map(b => 
      b.id === lecture.batchId 
        ? { ...b, lectureIds: [...b.lectureIds, lecture.id] }
        : b
    ));
  };
  const updateLecture = (lecture: Lecture) => setLectures(prev => prev.map(l => l.id === lecture.id ? lecture : l));
  const deleteLecture = (id: string) => {
    const lecture = lectures.find(l => l.id === id);
    if (lecture) {
      setLectures(prev => prev.filter(l => l.id !== id));
      setBatches(prev => prev.map(b => 
        b.id === lecture.batchId 
          ? { ...b, lectureIds: b.lectureIds.filter(lid => lid !== id) }
          : b
      ));
    }
  };

  // Timetable CRUD
  const addTimetable = (timetable: Timetable) => setTimetables(prev => [...prev, timetable]);
  const updateTimetable = (timetable: Timetable) => setTimetables(prev => prev.map(t => t.id === timetable.id ? timetable : t));
  const deleteTimetable = (id: string) => setTimetables(prev => prev.filter(t => t.id !== id));

  // User CRUD
  const updateUser = (user: User) => setUsers(prev => prev.map(u => u.id === user.id ? user : u));
  const enrollUser = (userId: string, batchId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, enrolledBatchIds: [...u.enrolledBatchIds, batchId] }
        : u
    ));
    setBatches(prev => prev.map(b => 
      b.id === batchId 
        ? { ...b, studentIds: [...b.studentIds, userId] }
        : b
    ));
  };
  const unenrollUser = (userId: string, batchId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, enrolledBatchIds: u.enrolledBatchIds.filter(id => id !== batchId) }
        : u
    ));
    setBatches(prev => prev.map(b => 
      b.id === batchId 
        ? { ...b, studentIds: b.studentIds.filter(id => id !== userId) }
        : b
    ));
  };

  // Helpers
  const getBatchById = (id: string) => batches.find(b => b.id === id);
  const getLecturesByBatchId = (batchId: string) => lectures.filter(l => l.batchId === batchId);
  const getTimetableByBatchId = (batchId: string) => timetables.find(t => t.batchId === batchId);

  return (
    <DataContext.Provider
      value={{
        batches,
        lectures,
        timetables,
        users,
        addBatch,
        updateBatch,
        deleteBatch,
        addLecture,
        updateLecture,
        deleteLecture,
        addTimetable,
        updateTimetable,
        deleteTimetable,
        updateUser,
        enrollUser,
        unenrollUser,
        getBatchById,
        getLecturesByBatchId,
        getTimetableByBatchId,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
