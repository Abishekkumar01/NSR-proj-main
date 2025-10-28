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
import { DataInitializer } from './components/DataInitializer';
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
  const [showDataInitializer, setShowDataInitializer] = useState(false);

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

      // Fallback to localStorage if Firebase data is empty
      const finalFacultyData = facultyData && facultyData.length > 0 ? facultyData : LocalStorageService.getFaculty();
      const finalStudentsData = studentsData && studentsData.length > 0 ? studentsData : LocalStorageService.getStudents();
      const finalCoursesData = coursesData && coursesData.length > 0 ? coursesData : LocalStorageService.getCourses();
      const finalAssessmentsData = assessmentsData && assessmentsData.length > 0 ? assessmentsData : LocalStorageService.getAssessments();
      const finalStudentAssessmentsData = studentAssessmentsData && studentAssessmentsData.length > 0 ? studentAssessmentsData : LocalStorageService.getStudentAssessments();

      // Auto-populate school fields for existing data
      const studentsWithSchool = finalStudentsData.map(student => ({
        ...student,
        school: student.school || getSchoolFromDepartment(student.department)
      }));
      
      const coursesWithSchool = finalCoursesData.map(course => ({
        ...course,
        school: course.school || getSchoolFromDepartment(course.department)
      }));
      
      const assessmentsWithSchool = finalAssessmentsData.map(assessment => {
        const course = coursesWithSchool.find(c => c.id === assessment.courseId);
        return {
          ...assessment,
          school: assessment.school || course?.school || getSchoolFromDepartment(course?.department || ''),
          department: assessment.department || course?.department
        };
      });

      setStudents(studentsWithSchool);
      setFaculty(finalFacultyData);
      setCourses(coursesWithSchool);
      setAssessments(assessmentsWithSchool);
      setStudentAssessments(finalStudentAssessmentsData);
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
      console.log('Adding faculty:', data);
      const newFaculty: Faculty = {
        id: generateId(),
        ...data,
        createdAt: new Date()
      };
      
      console.log('Generated faculty:', newFaculty);
      
      // Save to both Firebase and local storage
      await facultyService.addFaculty(data);
      await optimizedFirebase.saveData('faculty', newFaculty, newFaculty.id);
      
      // Update local state immediately
      setFaculty(prev => {
        const updated = [...prev, newFaculty];
        console.log('Updated faculty list:', updated);
        return updated;
      });
      
      console.log('Faculty added successfully');
    } catch (error) {
      console.error('Error adding faculty:', error);
      throw error;
    }
  };

  const handleUpdateFaculty = async (id: string, data: Partial<Faculty>) => {
    try {
      // Update in both Firebase and local storage
      await facultyService.updateFaculty(id, data);
      await optimizedFirebase.saveData('faculty', data, id);
      
      // Update local state immediately
      setFaculty(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
    } catch (error) {
      console.error('Error updating faculty:', error);
      throw error;
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    try {
      // Delete from both Firebase and local storage
      await facultyService.deleteFaculty(id);
      await optimizedFirebase.deleteData('faculty', id);
      
      // Update local state immediately
      setFaculty(prev => prev.filter(f => f.id !== id));
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
    // Remove course
    setCourses(prev => prev.filter(c => c.id !== id));
    await optimizedFirebase.deleteData('courses', id);
    // Cascade: delete assessments of this course and their student assessments
    const relatedAssessments = assessments.filter(a => a.courseId === id);
    for (const a of relatedAssessments) {
      await handleDeleteAssessment(a.id);
    }
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
    await optimizedFirebase.deleteData('assessments', id);
    // Cascade: delete student assessments for this assessment
    const remaining = studentAssessments.filter(sa => sa.assessmentId !== id);
    setStudentAssessments(remaining);
    // Persist student assessments after deletion
    await optimizedFirebase.saveData('studentAssessments', {} as any); // trigger cache invalidation
  };

  // StudentAssessment handlers with persistence
  const handleAddStudentAssessment = async (data: Omit<StudentAssessment, 'id'>) => {
    const newSA: StudentAssessment = { id: generateId(), ...data };
    
    // Update local state
    setStudentAssessments(prev => {
      // ensure one record per student+assessment
      const withoutExisting = prev.filter(sa => !(sa.studentId === newSA.studentId && sa.assessmentId === newSA.assessmentId));
      return [...withoutExisting, newSA];
    });
    
    // Persist to Firebase/localStorage
    try {
      await optimizedFirebase.saveData('studentAssessments', newSA, newSA.id);
      console.log('Student assessment saved successfully');
    } catch (error) {
      console.error('Error saving student assessment:', error);
    }
  };
  
  const handleUpdateStudentAssessment = async (id: string, data: Partial<StudentAssessment>) => {
    // Update local state
    setStudentAssessments(prev => prev.map(sa => (sa.id === id ? { ...sa, ...data } : sa)));
    
    // Persist to Firebase/localStorage
    try {
      await optimizedFirebase.saveData('studentAssessments', data, id);
      console.log('Student assessment updated successfully');
    } catch (error) {
      console.error('Error updating student assessment:', error);
    }
  };

  // Handle data initialization
  const handleDataInitialized = (data: any) => {
    setFaculty(data.faculty);
    setCourses(data.courses);
    setStudents(data.students);
    setAssessments(data.assessments);
    setStudentAssessments(data.studentAssessments);
    setShowDataInitializer(false);
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
        return <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} onPageChange={setCurrentPage} />;
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
            faculty={faculty}
            students={students}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        ) : (
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} onPageChange={setCurrentPage} />
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
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} onPageChange={setCurrentPage} />
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
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} onPageChange={setCurrentPage} />
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
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} onPageChange={setCurrentPage} />
        );
      case 'data-management':
        return user.role === 'admin' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Data Management</h2>
                <p className="text-gray-600 mt-2">Initialize comprehensive dataset for ASET BTech CSE program</p>
              </div>
              <button
                onClick={() => setShowDataInitializer(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Initialize Dataset
              </button>
            </div>
            {showDataInitializer ? (
              <DataInitializer onDataInitialized={handleDataInitialized} />
            ) : (
              <DataManagement />
            )}
          </div>
        ) : (
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} onPageChange={setCurrentPage} />
        );
      case 'profile':
        return user.role === 'faculty' ? (
          <FacultyProfile />
        ) : (
          <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} onPageChange={setCurrentPage} />
        );
      case 'guide':
        return <SystemGuide />;
      default:
        return <Dashboard students={students} courses={courses} assessments={assessments} studentAssessments={studentAssessments} faculty={faculty} onPageChange={setCurrentPage} />;
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