import { schools } from '../data/schools';

/**
 * Maps a department to its corresponding school
 * @param department - The department name
 * @returns The school name or null if not found
 */
export function getSchoolFromDepartment(department: string): string | null {
  for (const school of schools) {
    if (school.departments.includes(department)) {
      return school.name;
    }
  }
  return null;
}

/**
 * Gets all departments for a specific school
 * @param schoolName - The school name
 * @returns Array of department names
 */
export function getDepartmentsForSchool(schoolName: string): string[] {
  const school = schools.find(s => s.name === schoolName);
  return school?.departments || [];
}

/**
 * Gets all schools that have students
 * @param students - Array of students
 * @returns Array of school names
 */
export function getSchoolsWithStudents(students: any[]): string[] {
  const schoolNames = new Set<string>();
  
  students.forEach(student => {
    if (student.school) {
      schoolNames.add(student.school);
    } else if (student.department) {
      const school = getSchoolFromDepartment(student.department);
      if (school) {
        schoolNames.add(school);
      }
    }
  });
  
  return Array.from(schoolNames);
}

/**
 * Auto-populates school field for students based on their department
 * @param students - Array of students
 * @returns Updated students with school field populated
 */
export function populateSchoolForStudents(students: any[]): any[] {
  return students.map(student => {
    if (!student.school && student.department) {
      const school = getSchoolFromDepartment(student.department);
      return { ...student, school };
    }
    return student;
  });
}
