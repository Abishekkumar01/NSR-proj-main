import { Course, Assessment, Faculty } from '../types';

// Local Storage Service to reduce Firebase quota usage
export class LocalStorageService {
  private static readonly KEYS = {
    COURSES: 'nsr_courses',
    ASSESSMENTS: 'nsr_assessments',
    FACULTY: 'nsr_faculty',
    STUDENT_ASSESSMENTS: 'nsr_student_assessments',
    PO_OPTIONS: 'nsr_po_options', // map of department -> [{poCode, poName}]
    CO_OPTIONS: 'nsr_co_options', // map of department -> [{coCode, coName}]
    BATCH_OPTIONS: 'nsr_batch_options_map' // map of department -> string[]
  };

  // Course Management
  static getCourses(): Course[] {
    try {
      const data = localStorage.getItem(this.KEYS.COURSES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading courses from localStorage:', error);
      return [];
    }
  }

  static saveCourses(courses: Course[]): void {
    try {
      localStorage.setItem(this.KEYS.COURSES, JSON.stringify(courses));
    } catch (error) {
      console.error('Error saving courses to localStorage:', error);
    }
  }

  static addCourse(course: Course): void {
    const courses = this.getCourses();
    courses.push(course);
    this.saveCourses(courses);
  }

  static updateCourse(id: string, updates: Partial<Course>): void {
    const courses = this.getCourses();
    const index = courses.findIndex(c => c.id === id);
    if (index !== -1) {
      courses[index] = { ...courses[index], ...updates };
      this.saveCourses(courses);
    }
  }

  static deleteCourse(id: string): void {
    const courses = this.getCourses();
    const filtered = courses.filter(c => c.id !== id);
    this.saveCourses(filtered);
  }

  // Assessment Management
  static getAssessments(): Assessment[] {
    try {
      const data = localStorage.getItem(this.KEYS.ASSESSMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading assessments from localStorage:', error);
      return [];
    }
  }

  static saveAssessments(assessments: Assessment[]): void {
    try {
      localStorage.setItem(this.KEYS.ASSESSMENTS, JSON.stringify(assessments));
    } catch (error) {
      console.error('Error saving assessments to localStorage:', error);
    }
  }

  static addAssessment(assessment: Assessment): void {
    const assessments = this.getAssessments();
    assessments.push(assessment);
    this.saveAssessments(assessments);
  }

  static updateAssessment(id: string, updates: Partial<Assessment>): void {
    const assessments = this.getAssessments();
    const index = assessments.findIndex(a => a.id === id);
    if (index !== -1) {
      assessments[index] = { ...assessments[index], ...updates };
      this.saveAssessments(assessments);
    }
  }

  static deleteAssessment(id: string): void {
    const assessments = this.getAssessments();
    const filtered = assessments.filter(a => a.id !== id);
    this.saveAssessments(filtered);
  }

  // Faculty Management
  static getFaculty(): Faculty[] {
    try {
      const data = localStorage.getItem(this.KEYS.FACULTY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading faculty from localStorage:', error);
      return [];
    }
  }

  static saveFaculty(faculty: Faculty[]): void {
    try {
      localStorage.setItem(this.KEYS.FACULTY, JSON.stringify(faculty));
    } catch (error) {
      console.error('Error saving faculty to localStorage:', error);
    }
  }

  static addFaculty(faculty: Faculty): void {
    const facultyList = this.getFaculty();
    facultyList.push(faculty);
    this.saveFaculty(facultyList);
  }

  static updateFaculty(id: string, updates: Partial<Faculty>): void {
    const facultyList = this.getFaculty();
    const index = facultyList.findIndex(f => f.id === id);
    if (index !== -1) {
      facultyList[index] = { ...facultyList[index], ...updates };
      this.saveFaculty(facultyList);
    }
  }

  static deleteFaculty(id: string): void {
    const facultyList = this.getFaculty();
    const filtered = facultyList.filter(f => f.id !== id);
    this.saveFaculty(filtered);
  }

  // Student Assessments
  static getStudentAssessments(): any[] {
    try {
      const data = localStorage.getItem(this.KEYS.STUDENT_ASSESSMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading student assessments from localStorage:', error);
      return [];
    }
  }

  static saveStudentAssessments(studentAssessments: any[]): void {
    try {
      localStorage.setItem(this.KEYS.STUDENT_ASSESSMENTS, JSON.stringify(studentAssessments));
    } catch (error) {
      console.error('Error saving student assessments to localStorage:', error);
    }
  }

  // Utility methods
  static clearAllData(): void {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  static exportData(): string {
    const data = {
      courses: this.getCourses(),
      assessments: this.getAssessments(),
      faculty: this.getFaculty(),
      studentAssessments: this.getStudentAssessments(),
      batchOptionsMap: this.getBatchOptionsMap(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.courses) this.saveCourses(data.courses);
      if (data.assessments) this.saveAssessments(data.assessments);
      if (data.faculty) this.saveFaculty(data.faculty);
      if (data.studentAssessments) this.saveStudentAssessments(data.studentAssessments);
      if (data.batchOptionsMap) this.saveBatchOptionsMap(data.batchOptionsMap);
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Get storage usage info
  static getStorageInfo(): { used: number; available: number; percentage: number } {
    let used = 0;
    Object.values(this.KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        used += new Blob([data]).size;
      }
    });

    // Estimate available space (localStorage is typically 5-10MB)
    const available = 5 * 1024 * 1024; // 5MB estimate
    const percentage = (used / available) * 100;

    return { used, available, percentage };
  }

  // PO Options (global, grouped by department)
  private static getPOOptionsMap(): Record<string, { poCode: string; poName: string }[]> {
    try {
      const data = localStorage.getItem(this.KEYS.PO_OPTIONS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error loading PO options map:', e);
      return {};
    }
  }

  private static savePOOptionsMap(map: Record<string, { poCode: string; poName: string }[]>): void {
    try {
      localStorage.setItem(this.KEYS.PO_OPTIONS, JSON.stringify(map));
    } catch (e) {
      console.error('Error saving PO options map:', e);
    }
  }

  static getPOOptions(department: string): { poCode: string; poName: string }[] {
    const map = this.getPOOptionsMap();
    return map[department] || [];
  }

  static savePOOptions(department: string, options: { poCode: string; poName: string }[]): void {
    const map = this.getPOOptionsMap();
    map[department] = options;
    this.savePOOptionsMap(map);
  }

  // CO Options (global, grouped by department)
  private static getCOOptionsMap(): Record<string, { coCode: string; coName: string }[]> {
    try {
      const data = localStorage.getItem(this.KEYS.CO_OPTIONS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error loading CO options map:', e);
      return {};
    }
  }

  private static saveCOOptionsMap(map: Record<string, { coCode: string; coName: string }[]>): void {
    try {
      localStorage.setItem(this.KEYS.CO_OPTIONS, JSON.stringify(map));
    } catch (e) {
      console.error('Error saving CO options map:', e);
    }
  }

  static getCOOptions(department: string): { coCode: string; coName: string }[] {
    const map = this.getCOOptionsMap();
    return map[department] || [];
  }

  static saveCOOptions(department: string, options: { coCode: string; coName: string }[]): void {
    const map = this.getCOOptionsMap();
    map[department] = options;
    this.saveCOOptionsMap(map);
  }

  // Batch options (grouped by department)
  private static getBatchOptionsMap(): Record<string, string[]> {
    try {
      const data = localStorage.getItem(this.KEYS.BATCH_OPTIONS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error loading batch options map:', e);
      return {};
    }
  }

  private static saveBatchOptionsMap(map: Record<string, string[]>): void {
    try {
      localStorage.setItem(this.KEYS.BATCH_OPTIONS, JSON.stringify(map));
    } catch (e) {
      console.error('Error saving batch options map:', e);
    }
  }

  static getBatchOptions(department: string): string[] {
    const map = this.getBatchOptionsMap();
    return map[department] || [];
  }

  static saveBatchOptions(department: string, options: string[]): void {
    const map = this.getBatchOptionsMap();
    map[department] = options;
    this.saveBatchOptionsMap(map);
  }
}
