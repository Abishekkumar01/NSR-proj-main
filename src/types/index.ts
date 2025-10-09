// Core data types for the GA Mapping System

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  school?: string; // Auto-populated based on department
  batch: string;
  semester: number;
  enrollmentNumber?: string;
  section?: string;
  mobile?: string;
  createdAt: Date;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  school?: string; // Auto-populated based on department
  batch?: string;
  semester: number;
  credits: number;
  facultyId: string;
  facultyName: string;
  // Course-level Program Outcomes catalog and selection
  poOptions?: { poCode: string; poName: string }[];
  selectedPOs?: string[]; // array of poCode selected for this course
  // Course-level Course Outcomes catalog
  coOptions?: { coCode: string; coName: string }[];
}

export interface GraduateAttribute {
  id: string;
  code: string;
  name: string;
  description: string;
  proficiencyLevels: ProficiencyLevel[];
}

export interface ProficiencyLevel {
  id: string;
  level: 'Introductory' | 'Intermediate' | 'Advanced';
  description: string;
  scoreRange: {
    min: number;
    max: number;
  };
}

export interface Assessment {
  id: string;
  courseId: string;
  courseName: string;
  school?: string; // Auto-populated based on course
  department?: string; // Auto-populated based on course
  name: string;
  type: 'Assignment' | 'Quiz' | 'Mid-Term' | 'End-Term' | 'Project' | 'Lab' | 'Presentation';
  maxMarks: number;
  weightage: number;
  gaMapping: GAMapping[];
  // Optional mappings for CO and PO
  coMapping?: COMapping[];
  poMapping?: POMapping[];
  createdAt: Date;
}

export interface GAMapping {
  gaId: string;
  gaCode: string;
  gaName: string;
  weightage: number; // Percentage of this GA in the assessment
  targetLevel: 'Introductory' | 'Intermediate' | 'Advanced';
}

// Course Outcome mapping (manual entries)
export interface COMapping {
  coCode: string; // e.g., CO1, CO2
  coName: string; // short description/title
  weightage: number; // Percentage of this CO in the assessment
}

// Program Outcome mapping (manual entries)
export interface POMapping {
  poCode: string; // e.g., PO1, PO2
  poName: string; // short description/title
  weightage: number; // Percentage of this PO in the assessment
}

export interface StudentAssessment {
  id: string;
  studentId: string;
  assessmentId: string;
  marksObtained: number;
  maxMarks: number;
  gaScores: GAScore[];
  submittedAt: Date;
  evaluatedBy: string;
}

export interface GAScore {
  gaId: string;
  gaCode: string;
  score: number;
  level: 'Introductory' | 'Intermediate' | 'Advanced';
  weightage: number;
}

export interface GAReport {
  studentId: string;
  studentName: string;
  rollNumber: string;
  gaScores: {
    [gaCode: string]: {
      totalScore: number;
      averageScore: number;
      level: 'Introductory' | 'Intermediate' | 'Advanced';
      assessmentCount: number;
    };
  };
  overallGAPerformance: number;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  school: string;
  department: string;
  batches: string[];
  sections: string[];
  subjects: string[];
  createdAt: Date;
  // Admin-provided primary password used for first-time registration
  initialPassword?: string;
  // Indicates whether the faculty has completed account activation/registration
  isActivated?: boolean;
  // Mapping of batch to selected sections for that batch (e.g., { '2022-26': ['A','B'] })
  batchSections?: { [batch: string]: string[] };
  // Mapping of batch to selected semesters (1-8) for that batch
  batchSemesters?: { [batch: string]: number[] };
  // Mapping of batch to selected subjects for that batch
  batchSubjects?: { [batch: string]: string[] };
}

export interface FacultyAssignment {
  id: string;
  facultyId: string;
  batch: string;
  section: string;
  semester: number;
  subject: string;
  school: string;
  department: string;
}