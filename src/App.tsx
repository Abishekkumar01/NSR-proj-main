import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/Auth/AuthPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { CourseManagement } from './components/CourseManagement';
import { AssessmentManagement } from './components/AssessmentManagement';
import { FacultyManagement } from './components/FacultyManagement';
import { FacultyProfile } from './components/FacultyProfile';
import { GAMapping } from './components/GAMapping';
import { Reports } from './components/Reports';
import { StudentRecommendations } from './components/StudentRecommendations';
import { DataManagement } from './components/DataManagement';
import { SystemGuide } from './components/SystemGuide';
import { Student, Course, Assessment, StudentAssessment, Faculty } from './types';
import { studentService } from './lib/studentService';
import { facultyService } from './lib/facultyService';
import { optimizedFirebase } from './lib/optimizedFirebase';
import { getSchoolFromDepartment } from './lib/schoolMapping';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user, loading } = useAuth();

  // Firebase-connected data
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [studentAssessments, setStudentAssessments] = useState<StudentAssessment[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  const generateId = () => Math.random().toString(36).slice(2);

  // Load data using optimized Firebase service
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setStudentsLoading(true);
      
      // Load all data using optimized service
      const [studentsData, facultyData, coursesData, assessmentsData, studentAssessmentsData] = await Promise.all([
        optimizedFirebase.getData('students'),
        optimizedFirebase.getData('faculty'),
        optimizedFirebase.getData('courses'),
        optimizedFirebase.getData('assessments'),
        optimizedFirebase.getData('studentAssessments')
      ]);

      // Auto-populate school fields for existing data
      const studentsWithSchool = studentsData.map(student => ({
        ...student,
        school: student.school || getSchoolFromDepartment(student.department)
      }));
      
      const coursesWithSchool = coursesData.map(course => ({
        ...course,
        school: course.school || getSchoolFromDepartment(course.department)
      }));
      
      const assessmentsWithSchool = assessmentsData.map(assessment => {
        const course = coursesWithSchool.find(c => c.id === assessment.courseId);
        return {
          ...assessment,
          school: assessment.school || course?.school || getSchoolFromDepartment(course?.department || ''),
          department: assessment.department || course?.department
        };
      });

      setStudents(studentsWithSchool);
      setFaculty(facultyData);
      setCourses(coursesWithSchool);
      setAssessments(assessmentsWithSchool);
      setStudentAssessments(studentAssessmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setStudentsLoading(true);
      const studentsData = await studentService.getStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadFaculty = async () => {
    try {
      // Admin can load all faculty; faculty must only load their own doc (rules-compatible)
      if (user?.role === 'admin') {
        const facultyData = await facultyService.getFaculty();
        setFaculty(facultyData);
      } else if (user?.email) {
        const me = await facultyService.getFacultyByEmail(user.email);
        setFaculty(me ? [me] : []);
      } else {
        setFaculty([]);
      }
    } catch (error) {
      console.error('Error loading faculty:', error);
      setFaculty([]);
    }
  };

  // Student handlers with Firebase integration
  const handleAddStudent = async (data: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      await studentService.addStudent(data);
      await loadStudents(); // Reload to get the latest data
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  const handleUpdateStudent = async (id: string, data: Partial<Student>) => {
    try {
      await studentService.updateStudent(id, data);
      await loadStudents(); // Reload to get the latest data
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await studentService.deleteStudent(id);
      await loadStudents(); // Reload to get the latest data
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };

  // Faculty handlers with Firebase integration
  const handleAddFaculty = async (data: Omit<Faculty, 'id' | 'createdAt'>) => {
    try {
      await facultyService.addFaculty(data);
      await loadFaculty(); // Reload to get the latest data
    } catch (error) {
      console.error('Error adding faculty:', error);
      throw error;
    }
  };

  const handleUpdateFaculty = async (id: string, data: Partial<Faculty>) => {
    try {
      await facultyService.updateFaculty(id, data);
      await loadFaculty(); // Reload to get the latest data
    } catch (error) {
      console.error('Error updating faculty:', error);
      throw error;
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    try {
      await facultyService.deleteFaculty(id);
      await loadFaculty(); // Reload to get the latest data
    } catch (error) {
      console.error('Error deleting faculty:', error);
      throw error;
    }
  };

  // Course handlers with optimized Firebase
  const handleAddCourse = async (data: Omit<Course, 'id'>) => {
    // Auto-populate school based on department
    const school = getSchoolFromDepartment(data.department);
    const newCourse: Course = { id: generateId(), ...data, school };
    setCourses(prev => [...prev, newCourse]);
    await optimizedFirebase.saveData('courses', newCourse, newCourse.id);
  };
  const handleUpdateCourse = async (id: string, data: Partial<Course>) => {
    setCourses(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
    await optimizedFirebase.saveData('courses', data, id);
  };
  const handleDeleteCourse = async (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    // Data will be filtered out locally, Firebase sync will handle the rest
  };

  // Assessment handlers with optimized Firebase
  const handleAddAssessment = async (data: Omit<Assessment, 'id' | 'createdAt'>) => {
    // Find the course to get school and department
    const course = courses.find(c => c.id === data.courseId);
    const school = course?.school || getSchoolFromDepartment(course?.department || '');
    const department = course?.department;
    
    const newAssessment: Assessment = { 
      id: generateId(), 
      createdAt: new Date(), 
      ...data,
      school,
      department
    };
    setAssessments(prev => [...prev, newAssessment]);
    await optimizedFirebase.saveData('assessments', newAssessment, newAssessment.id);
  };
  const handleUpdateAssessment = async (id: string, data: Partial<Assessment>) => {
    setAssessments(prev => prev.map(a => (a.id === id ? { ...a, ...data } : a)));
    await optimizedFirebase.saveData('assessments', data, id);
  };
  const handleDeleteAssessment = async (id: string) => {
    setAssessments(prev => prev.filter(a => a.id !== id));
    setStudentAssessments(prev => prev.filter(sa => sa.assessmentId !== id));
    // Data will be filtered out locally, Firebase sync will handle the rest
  };

  // StudentAssessment handlers
  const handleAddStudentAssessment = (data: Omit<StudentAssessment, 'id'>) => {
    const newSA: StudentAssessment = { id: generateId(), ...data };
    setStudentAssessments(prev => {
      // ensure one record per student+assessment
      const withoutExisting = prev.filter(sa => !(sa.studentId === newSA.studentId && sa.assessmentId === newSA.assessmentId));
      return [...withoutExisting, newSA];
    });
  };
  const handleUpdateStudentAssessment = (id: string, data: Partial<StudentAssessment>) => {
    setStudentAssessments(prev => prev.map(sa => (sa.id === id ? { ...sa, ...data } : sa)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Render current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} />;
      case 'students':
        return (
          <StudentManagement
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            faculty={faculty}
          />
        );
      case 'courses':
        return user.role === 'admin' ? (
          <CourseManagement
            courses={courses}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        ) : (
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} />
        );
      case 'assessments':
        return user.role === 'admin' ? (
          <AssessmentManagement
            assessments={assessments}
            courses={courses}
            onAddAssessment={handleAddAssessment}
            onUpdateAssessment={handleUpdateAssessment}
            onDeleteAssessment={handleDeleteAssessment}
          />
        ) : (
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} />
        );
      case 'ga-mapping':
        return (
          <GAMapping
            students={students}
            assessments={assessments}
            studentAssessments={studentAssessments}
            onAddStudentAssessment={handleAddStudentAssessment}
            onUpdateStudentAssessment={handleUpdateStudentAssessment}
          />
        );
      case 'faculty':
        return user.role === 'admin' ? (
          <FacultyManagement
            faculty={faculty}
            onAddFaculty={handleAddFaculty}
            onUpdateFaculty={handleUpdateFaculty}
            onDeleteFaculty={handleDeleteFaculty}
          />
        ) : (
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} />
        );
      case 'reports':
        return user.role === 'admin' ? (
          <Reports
            students={students}
            assessments={assessments}
            studentAssessments={studentAssessments}
            courses={courses}
            faculty={faculty}
          />
        ) : (
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} />
        );
      case 'data-management':
        return user.role === 'admin' ? (
          <DataManagement />
        ) : (
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} />
        );
      case 'profile':
        return user.role === 'faculty' ? (
          <FacultyProfile />
        ) : (
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} />
        );
      case 'guide':
        return <SystemGuide />;
      default:
        return <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
    >
      {renderCurrentPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;