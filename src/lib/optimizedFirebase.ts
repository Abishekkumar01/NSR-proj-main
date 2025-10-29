import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, deleteDoc, query, limit } from 'firebase/firestore';
import { LocalStorageService } from './localStorage';
// Use the single shared Firebase app/config to avoid environment mismatches
import { auth, db } from './firebase';

// Cache for reducing Firebase reads
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Optimized Firebase Service
export class OptimizedFirebaseService {
  private static instance: OptimizedFirebaseService;
  private currentUser: User | null = null;
  private lastSyncTime: number = 0;
  private syncInterval: number = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.schedulePeriodicSync();
      }
    });
  }

  static getInstance(): OptimizedFirebaseService {
    if (!OptimizedFirebaseService.instance) {
      OptimizedFirebaseService.instance = new OptimizedFirebaseService();
    }
    return OptimizedFirebaseService.instance;
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      await this.syncLocalDataToFirebase();
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.clearCache();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Cache management
  private setCache(key: string, data: any, ttl: number = CACHE_TTL): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): any | null {
    const cached = cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private clearCache(): void {
    cache.clear();
  }

  // Optimized data operations
  async getData(collectionName: string, useCache: boolean = true): Promise<any[]> {
    const cacheKey = `${collectionName}_${this.currentUser?.uid || 'anonymous'}`;
    
    // Try cache first
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log(`Using cached data for ${collectionName}`);
        return cached;
      }
    }

    try {
      // Check localStorage first (reduces Firebase reads)
      const localData = this.getLocalData(collectionName);
      if (localData.length > 0) {
        console.log(`Using local data for ${collectionName}`);
        this.setCache(cacheKey, localData);
        return localData;
      }

      // Fallback to Firebase only if no local data
      console.log(`Fetching from Firebase for ${collectionName}`);
      // Map collection names to Firebase collection names
      const firebaseCollectionName = collectionName === 'studentAssessments' ? 'student_assessments' : collectionName;
      const snapshot = await getDocs(collection(db, firebaseCollectionName));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Cache the result
      this.setCache(cacheKey, data);
      
      // Save to localStorage for future use
      this.saveLocalData(collectionName, data);
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      // Return local data as fallback
      return this.getLocalData(collectionName);
    }
  }

  async saveData(collectionName: string, data: any, id?: string): Promise<void> {
    try {
      // Save to localStorage immediately (fast)
      this.saveLocalDataItem(collectionName, data, id);
      
      // Invalidate cache
      const cacheKey = `${collectionName}_${this.currentUser?.uid || 'anonymous'}`;
      cache.delete(cacheKey);

      // Save to Firebase in background (async)
      if (this.currentUser) {
        this.saveToFirebaseAsync(collectionName, data, id);
      }
    } catch (error) {
      console.error(`Error saving ${collectionName}:`, error);
      throw error;
    }
  }

  private async saveToFirebaseAsync(collectionName: string, data: any, id?: string): Promise<void> {
    try {
      // Map collection names to Firebase collection names
      const firebaseCollectionName = collectionName === 'studentAssessments' ? 'student_assessments' : collectionName;
      const docRef = id ? doc(db, firebaseCollectionName, id) : doc(collection(db, firebaseCollectionName));
      await setDoc(docRef, data, { merge: true });
      console.log(`Saved to Firebase: ${firebaseCollectionName}`);
    } catch (error) {
      console.error(`Firebase save error for ${collectionName}:`, error);
    }
  }

  // Local storage integration
  private getLocalData(collectionName: string): any[] {
    switch (collectionName) {
      case 'courses':
        return LocalStorageService.getCourses();
      case 'assessments':
        return LocalStorageService.getAssessments();
      case 'faculty':
        return LocalStorageService.getFaculty();
      case 'students':
        return LocalStorageService.getStudents();
      case 'studentAssessments':
        return LocalStorageService.getStudentAssessments();
      default:
        return [];
    }
  }

  private saveLocalData(collectionName: string, data: any[]): void {
    switch (collectionName) {
      case 'courses':
        LocalStorageService.saveCourses(data);
        break;
      case 'assessments':
        LocalStorageService.saveAssessments(data);
        break;
      case 'faculty':
        LocalStorageService.saveFaculty(data);
        break;
      case 'students':
        LocalStorageService.saveStudents(data);
        break;
      case 'studentAssessments':
        LocalStorageService.saveStudentAssessments(data);
        break;
    }
  }

  private deleteLocalDataItem(collectionName: string, id: string): void {
    const existingData = this.getLocalData(collectionName);
    const filtered = existingData.filter(item => item.id !== id);
    this.saveLocalData(collectionName, filtered);
  }

  // Danger: Delete entire collection from Firebase (paged)
  private async deleteEntireCollection(collectionName: string, pageSize: number = 300): Promise<number> {
    const firebaseCollectionName = collectionName === 'studentAssessments' ? 'student_assessments' : collectionName;
    let deleted = 0;
    while (true) {
      const snapshot = await getDocs(query(collection(db, firebaseCollectionName), limit(pageSize)));
      if (snapshot.empty) break;
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, firebaseCollectionName, d.id))));
      deleted += snapshot.docs.length;
      if (snapshot.size < pageSize) {
        const check = await getDocs(query(collection(db, firebaseCollectionName), limit(1)));
        if (check.empty) break;
      }
    }
    return deleted;
  }

  // Clear all remote (Firebase) and local data
  async clearAllDataEverywhere(): Promise<void> {
    // Delete Firebase collections first
    const collections = ['students', 'faculty', 'courses', 'assessments', 'studentAssessments'];
    for (const c of collections) {
      try {
        await this.deleteEntireCollection(c);
      } catch (e) {
        console.error(`Failed clearing collection ${c}`, e);
      }
    }
    // Clear local storage and cache
    this.clearAllData();
  }

  // Clear only Firebase data (leave local storage intact)
  async clearAllFirebaseData(): Promise<void> {
    const collections = ['students', 'faculty', 'courses', 'assessments', 'studentAssessments'];
    for (const c of collections) {
      try {
        await this.deleteEntireCollection(c);
      } catch (e) {
        console.error(`Failed clearing collection ${c}`, e);
      }
    }
    // Invalidate cache so next load reflects emptiness
    this.clearCache();
  }

  private async deleteFromFirebaseAsync(collectionName: string, id: string): Promise<void> {
    try {
      const firebaseCollectionName = collectionName === 'studentAssessments' ? 'student_assessments' : collectionName;
      const docRef = doc(db, firebaseCollectionName, id);
      await deleteDoc(docRef);
      console.log(`Deleted from Firebase: ${firebaseCollectionName}/${id}`);
    } catch (error) {
      console.error(`Firebase delete error for ${collectionName}:`, error);
    }
  }

  async deleteData(collectionName: string, id: string): Promise<void> {
    try {
      // Delete from localStorage immediately
      this.deleteLocalDataItem(collectionName, id);
      // Invalidate cache
      this.clearCache();
      // Delete from Firebase in background
      if (this.currentUser) {
        await this.deleteFromFirebaseAsync(collectionName, id);
      }
    } catch (error) {
      console.error(`Error deleting ${collectionName}:`, error);
      throw error;
    }
  }

  private saveLocalDataItem(collectionName: string, data: any, id?: string): void {
    const existingData = this.getLocalData(collectionName);
    const newItem = { ...data, id: id || this.generateId() };
    
    const existingIndex = existingData.findIndex(item => item.id === newItem.id);
    if (existingIndex >= 0) {
      existingData[existingIndex] = newItem;
    } else {
      existingData.push(newItem);
    }
    
    this.saveLocalData(collectionName, existingData);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Periodic sync to Firebase
  private schedulePeriodicSync(): void {
    setInterval(() => {
      if (this.currentUser && Date.now() - this.lastSyncTime > this.syncInterval) {
        this.syncLocalDataToFirebase();
      }
    }, this.syncInterval);
  }

  private async syncLocalDataToFirebase(): Promise<void> {
    if (!this.currentUser) return;

    try {
      console.log('Syncing local data to Firebase...');
      
      // Sync all collections
      const collections = ['courses', 'assessments', 'faculty', 'studentAssessments'];
      
      for (const collectionName of collections) {
        const localData = this.getLocalData(collectionName);
        if (localData.length > 0) {
          // Batch save to Firebase
          for (const item of localData) {
            await this.saveToFirebaseAsync(collectionName, item, item.id);
          }
        }
      }
      
      this.lastSyncTime = Date.now();
      console.log('Sync completed');
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  // Batch operations for better performance
  async batchSave(operations: Array<{ collection: string; data: any; id?: string }>): Promise<void> {
    try {
      // Save all to localStorage first
      operations.forEach(op => {
        this.saveLocalDataItem(op.collection, op.data, op.id);
      });

      // Invalidate all caches
      this.clearCache();

      // Batch save to Firebase
      if (this.currentUser) {
        const promises = operations.map(op => 
          this.saveToFirebaseAsync(op.collection, op.data, op.id)
        );
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Batch save error:', error);
      throw error;
    }
  }

  // Data export/import
  async exportData(): Promise<string> {
    return LocalStorageService.exportData();
  }

  async importData(jsonData: string): Promise<boolean> {
    const success = LocalStorageService.importData(jsonData);
    if (success && this.currentUser) {
      // Sync imported data to Firebase
      await this.syncLocalDataToFirebase();
    }
    return success;
  }

  // Storage info
  getStorageInfo(): { used: number; available: number; percentage: number } {
    return LocalStorageService.getStorageInfo();
  }

  // Clear all data
  clearAllData(): void {
    LocalStorageService.clearAllData();
    this.clearCache();
  }
}

// Export singleton instance
export const optimizedFirebase = OptimizedFirebaseService.getInstance();
