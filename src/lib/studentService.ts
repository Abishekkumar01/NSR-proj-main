import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { Student } from '../types';
import { getSchoolFromDepartment } from './schoolMapping';

const STUDENTS_COLLECTION = 'students';

export const studentService = {
  // Add a new student
  async addStudent(student: Omit<Student, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Auto-populate school based on department
      const school = getSchoolFromDepartment(student.department);
      const studentWithSchool = { ...student, school };
      
      const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), {
        ...studentWithSchool,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  },

  // Get all students
  async getStudents(): Promise<Student[]> {
    try {
      const q = query(collection(db, STUDENTS_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const students: Student[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const student = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Student;
        
        // Auto-populate school if not present
        if (!student.school && student.department) {
          student.school = getSchoolFromDepartment(student.department);
        }
        
        students.push(student);
      });
      
      return students;
    } catch (error) {
      console.error('Error getting students:', error);
      throw error;
    }
  },

  // Update a student
  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    try {
      const studentRef = doc(db, STUDENTS_COLLECTION, id);
      await updateDoc(studentRef, updates);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  // Delete a student
  async deleteStudent(id: string): Promise<void> {
    try {
      const studentRef = doc(db, STUDENTS_COLLECTION, id);
      await deleteDoc(studentRef);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  // Danger: Delete ALL students from Firebase
  async deleteAllStudents(): Promise<number> {
    try {
      let deleted = 0;
      const pageSize = 300; // delete in pages to avoid memory spikes

      // Keep deleting first N docs until collection is empty (no orderBy required)
      // This avoids failures when some docs lack the 'createdAt' field
      // and works regardless of field presence.
      // Caution: Each loop does a fresh query after deletions.
      while (true) {
        const snapshot = await getDocs(query(collection(db, STUDENTS_COLLECTION), limit(pageSize)));
        if (snapshot.empty) break;

        await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, STUDENTS_COLLECTION, d.id))));
        deleted += snapshot.docs.length;

        if (snapshot.size < pageSize) {
          // Check if any remain
          const check = await getDocs(query(collection(db, STUDENTS_COLLECTION), limit(1)));
          if (check.empty) break;
        }
      }

      return deleted;
    } catch (error) {
      console.error('Error deleting all students:', error);
      throw error;
    }
  },

  // Add multiple students (for Excel import)
  async addMultipleStudents(students: Omit<Student, 'id' | 'createdAt'>[]): Promise<string[]> {
    try {
      const batch = students.map(student => 
        addDoc(collection(db, STUDENTS_COLLECTION), {
          ...student,
          createdAt: new Date()
        })
      );
      
      const docRefs = await Promise.all(batch);
      return docRefs.map(ref => ref.id);
    } catch (error) {
      console.error('Error adding multiple students:', error);
      throw error;
    }
  }
};
