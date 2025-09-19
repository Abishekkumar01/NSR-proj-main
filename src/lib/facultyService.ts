import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { Faculty } from '../types';

const FACULTY_COLLECTION = 'faculty';

export const facultyService = {
  // Get all faculty
  async getFaculty(): Promise<Faculty[]> {
    try {
      const facultyRef = collection(db, FACULTY_COLLECTION);
      const q = query(facultyRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Faculty[];
    } catch (error) {
      console.error('Error getting faculty:', error);
      throw error;
    }
  },

  // Get faculty by school and department
  async getFacultyBySchoolAndDepartment(school: string, department: string): Promise<Faculty[]> {
    try {
      const facultyRef = collection(db, FACULTY_COLLECTION);
      const q = query(
        facultyRef, 
        where('school', '==', school),
        where('department', '==', department),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Faculty[];
    } catch (error) {
      console.error('Error getting faculty by school and department:', error);
      throw error;
    }
  },

  // Get faculty by email (for login verification)
  async getFacultyByEmail(email: string): Promise<Faculty | null> {
    try {
      const facultyRef = collection(db, FACULTY_COLLECTION);
      const q = query(facultyRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Faculty;
    } catch (error) {
      console.error('Error getting faculty by email:', error);
      throw error;
    }
  },

  // Add new faculty
  async addFaculty(data: Omit<Faculty, 'id' | 'createdAt'>): Promise<string> {
    try {
      const facultyRef = collection(db, FACULTY_COLLECTION);
      const docRef = await addDoc(facultyRef, {
        ...data,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding faculty:', error);
      throw error;
    }
  },

  // Update faculty
  async updateFaculty(id: string, data: Partial<Faculty>): Promise<void> {
    try {
      const facultyRef = doc(db, FACULTY_COLLECTION, id);
      await updateDoc(facultyRef, data);
    } catch (error) {
      console.error('Error updating faculty:', error);
      throw error;
    }
  },

  // Delete faculty
  async deleteFaculty(id: string): Promise<void> {
    try {
      const facultyRef = doc(db, FACULTY_COLLECTION, id);
      await deleteDoc(facultyRef);
    } catch (error) {
      console.error('Error deleting faculty:', error);
      throw error;
    }
  }
};
