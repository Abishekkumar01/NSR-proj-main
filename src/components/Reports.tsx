import React, { useState, useMemo } from 'react';
import { 
  Search, Download, BarChart3, TrendingUp, Award, Target, Users, BookOpen, 
  GraduationCap, Building, Calendar, UserCheck, Filter, Eye, EyeOff 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { Student, Assessment, StudentAssessment, GAReport, Course, Faculty } from '../types';
import { graduateAttributes } from '../data/graduateAttributes';
import { schools } from '../data/schools';
import { getSchoolFromDepartment } from '../lib/schoolMapping';

interface ReportsProps {
  students: Student[];
  assessments: Assessment[];
  studentAssessments: StudentAssessment[];
  courses: Course[];
  faculty: Faculty[];
}

interface FilterState {
  school: string;
  department: string;
  batch: string;
  section?: string;
  faculty: string;
  student: string;
  semesters: number[];
  studentSemesters: number[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export function Reports({ students, assessments, studentAssessments, courses, faculty }: ReportsProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'individual'>('overview');
  const [activeSection, setActiveSection] = useState<'student' | 'course' | 'assessment' | 'ga' | 'co' | 'po' | 'faculty'>('student');
  const [filters, setFilters] = useState<FilterState>({
    school: '',
    department: '',
    batch: '',
    section: '',
    faculty: '',
    student: '',
    semesters: [],
    studentSemesters: []
  });

  // Get filtered data based on current filters
  const filteredData = useMemo(() => {
    let filteredStudents = students;
    let filteredAssessments = assessments;
    let filteredCourses = courses;
    let filteredFaculty = faculty;

    // Apply school filter
    if (filters.school) {
      const selectedSchool = schools.find(s => s.id === filters.school);
      if (selectedSchool) {
        filteredStudents = students.filter(s => {
          const studentSchool = s.school || getSchoolFromDepartment(s.department);
          return studentSchool === selectedSchool.name;
        });
        filteredCourses = courses.filter(c => {
          const courseSchool = c.school || getSchoolFromDepartment(c.department);
          return courseSchool === selectedSchool.name;
        });
        filteredFaculty = faculty.filter(f => f.school === selectedSchool.name);
      }
    }

    // Apply department filter
    if (filters.department) {
      filteredStudents = filteredStudents.filter(s => s.department === filters.department);
      filteredCourses = filteredCourses.filter(c => c.department === filters.department);
      filteredFaculty = filteredFaculty.filter(f => f.department === filters.department);
    }

    // Filter assessments based on filtered courses
    filteredAssessments = assessments.filter(a => {
      const assessmentSchool = a.school || getSchoolFromDepartment(a.department || '');
      const assessmentDepartment = a.department;
      
      // Check if assessment matches school filter
      if (filters.school) {
        const selectedSchool = schools.find(s => s.id === filters.school);
        if (selectedSchool && assessmentSchool !== selectedSchool.name) {
          return false;
        }
      }
      
      // Check if assessment matches department filter
      if (filters.department && assessmentDepartment !== filters.department) {
        return false;
      }
      
      // Check if assessment's course is in filtered courses
      return filteredCourses.some(c => c.id === a.courseId);
    });

    // Apply batch filter
    if (filters.batch) {
      filteredStudents = filteredStudents.filter(s => s.batch === filters.batch);
      // Filter courses by batch if present on courses
      filteredCourses = filteredCourses.filter(c => !c.batch || c.batch === filters.batch);
    }

    // Apply faculty filter
    if (filters.faculty) {
      filteredStudents = filteredStudents.filter(s => s.advisorId === filters.faculty);
      filteredCourses = filteredCourses.filter(c => c.facultyId === filters.faculty);
    }

    // Apply student filter
    if (filters.student) {
      filteredStudents = filteredStudents.filter(s => s.id === filters.student);
    }

    // Apply section filter (after batch to narrow set)
    if (filters.section) {
      filteredStudents = filteredStudents.filter(s => (s.section || '') === filters.section);
    }

    return {
      students: filteredStudents,
      assessments: filteredAssessments,
      courses: filteredCourses,
      faculty: filteredFaculty
    };
  }, [students, assessments, courses, faculty, filters]);

  // Calculate GA reports
  const gaReports = useMemo(() => {
    return filteredData.students.map(student => {
      // Restrict student GA scores to assessments included in current filters
      const allowedAssessmentIds = new Set(filteredData.assessments.map(a => a.id));
      const studentAssessmentsForStudent = studentAssessments.filter(sa => sa.studentId === student.id && allowedAssessmentIds.has(sa.assessmentId));
      
      const gaScores: GAReport['gaScores'] = {};
      
      graduateAttributes.forEach(ga => {
        gaScores[ga.code] = {
          totalScore: 0,
          averageScore: 0,
          level: 'Introductory',
          assessmentCount: 0
        };
      });

      // Compute GA scores from student marks and assessment GA weightages (ignore stored GA scores)
      studentAssessmentsForStudent.forEach(sa => {
        const assessment = filteredData.assessments.find(a => a.id === sa.assessmentId);
        if (!assessment) return;
        const percent = sa.maxMarks > 0 ? (sa.marksObtained / sa.maxMarks) * 100 : 0;
        (assessment.gaMapping || []).forEach(gam => {
          const gaData = gaScores[gam.gaCode];
          if (!gaData) return;
          const gaScore = percent * (gam.weightage / 100);
          gaData.totalScore += gaScore;
          gaData.assessmentCount += 1;
        });
      });

      Object.keys(gaScores).forEach(gaCode => {
        const gaData = gaScores[gaCode];
        if (gaData.assessmentCount > 0) {
          gaData.averageScore = gaData.totalScore / gaData.assessmentCount;
          
          if (gaData.averageScore >= 80) {
            gaData.level = 'Advanced';
          } else if (gaData.averageScore >= 60) {
            gaData.level = 'Intermediate';
          } else {
            gaData.level = 'Introductory';
          }
        }
      });

      const validScores = Object.values(gaScores).filter(ga => ga.assessmentCount > 0);
      const overallGAPerformance = validScores.length > 0 
        ? validScores.reduce((sum, ga) => sum + ga.averageScore, 0) / validScores.length
        : 0;

      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        gaScores,
        overallGAPerformance
      };
    });
  }, [filteredData.students, filteredData.assessments, studentAssessments]);

  // Chart data generators
  const getSchoolData = () => {
    const schoolStats = schools.map(school => {
      const schoolStudents = students.filter(s => {
        const studentSchool = s.school || getSchoolFromDepartment(s.department);
        return studentSchool === school.name;
      });
      const schoolCourses = courses.filter(c => {
        const courseSchool = c.school || getSchoolFromDepartment(c.department);
        return courseSchool === school.name;
      });
      const schoolFaculty = faculty.filter(f => f.school === school.name);
      
      return {
        name: school.name,
        students: schoolStudents.length,
        courses: schoolCourses.length,
        faculty: schoolFaculty.length,
        assessments: assessments.filter(a => {
          const assessmentSchool = a.school || getSchoolFromDepartment(a.department || '');
          return assessmentSchool === school.name || schoolCourses.some(c => c.id === a.courseId);
        }).length
      };
    });

    return schoolStats;
  };

  const getDepartmentData = () => {
    if (!filters.school) return [];
    
    const selectedSchool = schools.find(s => s.id === filters.school);
    if (!selectedSchool) return [];

    return selectedSchool.departments.map(dept => {
      const deptStudents = filteredData.students.filter(s => s.department === dept);
      const deptCourses = filteredData.courses.filter(c => c.department === dept);
      const deptFaculty = filteredData.faculty.filter(f => f.department === dept);
      
      return {
        name: dept,
        students: deptStudents.length,
        courses: deptCourses.length,
        faculty: deptFaculty.length,
        assessments: assessments.filter(a => 
          deptCourses.some(c => c.id === a.courseId)
        ).length
      };
    });
  };

  const getBatchData = () => {
    const batches = [...new Set(filteredData.students.map(s => s.batch))].sort();
    
    return batches.map(batch => {
      const batchStudents = filteredData.students.filter(s => s.batch === batch);
      const batchGAPerformance = gaReports
        .filter(r => batchStudents.some(s => s.id === r.studentId))
        .reduce((sum, r) => sum + r.overallGAPerformance, 0) / batchStudents.length || 0;
      
      return {
        name: `Batch ${batch}`,
        students: batchStudents.length,
        performance: batchGAPerformance
      };
    });
  };

  const getSemesterComparisonData = () => {
    if (filters.semesters.length === 0) return [];
    
    return filters.semesters.map(semester => {
      // Calculate real performance based on student assessments
      const semesterStudents = filteredData.students.filter(s => s.semester === semester);
      const semesterGAPerformance = gaReports
        .filter(r => semesterStudents.some(s => s.id === r.studentId))
        .reduce((sum, r) => sum + r.overallGAPerformance, 0) / semesterStudents.length || 0;
      
      return {
        name: `Sem ${semester}`,
        performance: semesterGAPerformance,
        students: semesterStudents.length
      };
    });
  };

  const getStudentPerformanceData = () => {
    if (filters.studentSemesters.length === 0 || !filters.student) return [];
    
    const selectedStudent = filteredData.students.find(s => s.id === filters.student);
    if (!selectedStudent) return [];
    
    return filters.studentSemesters.map(semester => {
      // Get real student performance data
      const studentReport = gaReports.find(r => r.studentId === filters.student);
      if (!studentReport) return { name: `Sem ${semester}`, performance: 0, ga1: 0, ga2: 0, ga3: 0 };
      
      // Get specific GA scores
      const ga1Score = studentReport.gaScores['GA1']?.averageScore || 0;
      const ga2Score = studentReport.gaScores['GA2']?.averageScore || 0;
      const ga3Score = studentReport.gaScores['GA3']?.averageScore || 0;
      
      return {
        name: `Sem ${semester}`,
        performance: studentReport.overallGAPerformance,
        ga1: ga1Score,
        ga2: ga2Score,
        ga3: ga3Score
      };
    });
  };

  const getFacultyData = () => {
    return filteredData.faculty.map(f => {
      const facultyStudents = filteredData.students.filter(s => s.advisorId === f.id);
      const facultyCourses = filteredData.courses.filter(c => c.facultyId === f.id);
      
      return {
        name: f.name,
        students: facultyStudents.length,
        courses: facultyCourses.length,
        assessments: assessments.filter(a => 
          facultyCourses.some(c => c.id === a.courseId)
        ).length
      };
    });
  };

  // Fallback using assessment GA mappings (when there are no student GA scores yet)
  const getGAMappingDistributionData = () => {
    const map: Record<string, { name: string; totalWeight: number; count: number }> = {};
    filteredData.assessments.forEach(a => {
      a.gaMapping.forEach(g => {
        const key = g.gaCode;
        if (!map[key]) map[key] = { name: key, totalWeight: 0, count: 0 };
        map[key].totalWeight += g.weightage;
        map[key].count += 1;
      });
    });
    return Object.values(map).map(e => ({ name: e.name, value: e.count > 0 ? e.totalWeight / e.count : 0, count: e.count }));
  };

  const getGADistributionData = () => {
    // Use only GAs that exist either in scores within cohort or in assessment mappings within cohort
    const mapping = getGAMappingDistributionData();
    const avgWeightByGA = mapping.reduce((acc, m) => {
      acc[m.name] = m.value || 0; // average GA weightage across filtered assessments
      return acc;
    }, {} as Record<string, number>);

    const mappingGAs = new Set(mapping.map(m => m.name));

    // Calculate average GA score (0-100 scaled by GA weightage already) for cohort
    const scoreBasedRaw = graduateAttributes.map(ga => {
      const scores = gaReports
        .map(report => report.gaScores[ga.code]?.averageScore || 0)
        .filter(score => score > 0);
      const averageScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

      // Normalize by average GA weightage to show % achievement
      const avgWeight = avgWeightByGA[ga.code] || 0;
      const normalizedPercent = avgWeight > 0 ? (averageScore / avgWeight) * 100 : 0;

      return { name: ga.code, value: normalizedPercent, count: scores.length, avgWeight };
    });

    const scoreBased = scoreBasedRaw.filter(s => s.count > 0);
    if (scoreBased.length > 0) return scoreBased;
    // If no scores, show only GAs present in current assessments
    return mapping.filter(g => mappingGAs.has(g.name));
  };

  const getAssessmentTypeData = () => {
    const typeStats = assessments.reduce((acc, assessment) => {
      acc[assessment.type] = (acc[assessment.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeStats).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };

  // CO distribution with actual performance scores based on student marks
  const getCOScoreDistributionData = () => {
    const coPerformanceMap: Record<string, { name: string; totalScore: number; count: number; totalWeight: number }> = {};
    
    // Initialize COs from assessments
    filteredData.assessments.forEach(a => {
      (a.coMapping || []).forEach(co => {
        if (!coPerformanceMap[co.coCode]) {
          coPerformanceMap[co.coCode] = { name: co.coCode, totalScore: 0, count: 0, totalWeight: 0 };
        }
        coPerformanceMap[co.coCode].totalWeight += co.weightage;
      });
    });

    // Calculate performance scores from student assessments
    studentAssessments.forEach(sa => {
      const assessment = filteredData.assessments.find(a => a.id === sa.assessmentId);
      if (!assessment || !assessment.coMapping) return;

      const studentPercentage = (sa.marksObtained / sa.maxMarks) * 100;
      
      assessment.coMapping.forEach(co => {
        if (coPerformanceMap[co.coCode]) {
          const coScore = (studentPercentage * co.weightage) / 100;
          coPerformanceMap[co.coCode].totalScore += coScore;
          coPerformanceMap[co.coCode].count += 1;
        }
      });
    });

    return Object.values(coPerformanceMap).map(co => ({
      name: co.name,
      value: co.count > 0 ? co.totalScore / co.count : 0,
      count: co.count,
      averageWeight: co.totalWeight / filteredData.assessments.filter(a => a.coMapping?.some(c => c.coCode === co.name)).length || 0
    }));
  };

  // PO distribution with actual performance scores based on student marks
  const getPOScoreDistributionData = () => {
    const poPerformanceMap: Record<string, { name: string; totalScore: number; count: number; totalWeight: number }> = {};
    
    // Initialize POs from assessments
    filteredData.assessments.forEach(a => {
      (a.poMapping || []).forEach(po => {
        if (!poPerformanceMap[po.poCode]) {
          poPerformanceMap[po.poCode] = { name: po.poCode, totalScore: 0, count: 0, totalWeight: 0 };
        }
        poPerformanceMap[po.poCode].totalWeight += po.weightage;
      });
    });

    // Calculate performance scores from student assessments
    studentAssessments.forEach(sa => {
      const assessment = filteredData.assessments.find(a => a.id === sa.assessmentId);
      if (!assessment || !assessment.poMapping) return;

      const studentPercentage = (sa.marksObtained / sa.maxMarks) * 100;
      
      assessment.poMapping.forEach(po => {
        if (poPerformanceMap[po.poCode]) {
          const poScore = (studentPercentage * po.weightage) / 100;
          poPerformanceMap[po.poCode].totalScore += poScore;
          poPerformanceMap[po.poCode].count += 1;
        }
      });
    });

    return Object.values(poPerformanceMap).map(po => ({
      name: po.name,
      value: po.count > 0 ? po.totalScore / po.count : 0,
      count: po.count,
      averageWeight: po.totalWeight / filteredData.assessments.filter(a => a.poMapping?.some(p => p.poCode === po.name)).length || 0
    }));
  };

  // Export functions
  const exportCSV = () => {
    let csvContent = '';
    
    switch (activeSection) {
      case 'student':
        csvContent = 'Roll Number,Student Name,School,Department,Batch,Overall GA Performance\n';
        gaReports.forEach(report => {
          const student = filteredData.students.find(s => s.id === report.studentId);
          if (student) {
            csvContent += `${report.rollNumber},${report.studentName},${student.school},${student.department},${student.batch},${report.overallGAPerformance.toFixed(2)}\n`;
          }
        });
        break;
      case 'course':
        csvContent = 'Course Code,Course Name,School,Department,Faculty,Assessments\n';
        filteredData.courses.forEach(course => {
          const courseFaculty = filteredData.faculty.find(f => f.id === course.facultyId);
          const courseAssessments = assessments.filter(a => a.courseId === course.id);
          csvContent += `${course.code},${course.name},${course.school},${course.department},${courseFaculty?.name || 'N/A'},${courseAssessments.length}\n`;
        });
        break;
      case 'assessment':
        csvContent = 'Assessment Name,Course,Type,Max Marks,Weightage\n';
        assessments.forEach(assessment => {
          const course = courses.find(c => c.id === assessment.courseId);
          csvContent += `${assessment.name},${course?.name || 'N/A'},${assessment.type},${assessment.maxMarks},${assessment.weightage}\n`;
        });
        break;
      case 'ga':
        csvContent = 'GA Code,GA Name,Average Score,Student Count\n';
        getGADistributionData().forEach(ga => {
          csvContent += `${ga.name},${graduateAttributes.find(g => g.code === ga.name)?.name || 'N/A'},${ga.value.toFixed(2)},${ga.count}\n`;
        });
        break;
        case 'co':
          csvContent = 'CO Code,Average Performance Score,Student Count,Average Weightage\n';
          getCOScoreDistributionData().forEach(co => {
            csvContent += `${co.name},${co.value.toFixed(2)},${co.count},${co.averageWeight.toFixed(2)}\n`;
          });
          break;
        case 'po':
          csvContent = 'PO Code,Average Performance Score,Student Count,Average Weightage\n';
          getPOScoreDistributionData().forEach(po => {
            csvContent += `${po.name},${po.value.toFixed(2)},${po.count},${po.averageWeight.toFixed(2)}\n`;
          });
          break;
      case 'faculty':
        csvContent = 'Faculty Name,School,Department,Students,Courses,Assessments\n';
        getFacultyData().forEach(f => {
          csvContent += `${f.name},${filteredData.faculty.find(fac => fac.name === f.name)?.school || 'N/A'},${filteredData.faculty.find(fac => fac.name === f.name)?.department || 'N/A'},${f.students},${f.courses},${f.assessments}\n`;
        });
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeSection}_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset dependent filters
      ...(key === 'school' && { department: '', batch: '', section: '', faculty: '', student: '' }),
      ...(key === 'department' && { batch: '', section: '', faculty: '', student: '' }),
      ...(key === 'batch' && { section: '', faculty: '', student: '' }),
      ...(key === 'section' && { student: '' }),
      ...(key === 'faculty' && { student: '' })
    }));
  };

  const toggleSemester = (semester: number, type: 'semesters' | 'studentSemesters') => {
    setFilters(prev => {
      const currentSemesters = prev[type];
      const maxSemesters = type === 'semesters' ? 3 : 10;
      
      if (currentSemesters.includes(semester)) {
        return {
          ...prev,
          [type]: currentSemesters.filter(s => s !== semester)
        };
      } else if (currentSemesters.length < maxSemesters) {
        return {
          ...prev,
          [type]: [...currentSemesters, semester].sort()
        };
      }
      return prev;
    });
  };

  const renderOverviewCharts = () => {
    // Require School, Department, and Batch for assessment-driven sections (assessment, ga, co, po)
    const needsStrictFilters = ['assessment', 'ga', 'co', 'po'].includes(activeSection);
    const haveStrictFilters = Boolean(filters.school && filters.department && filters.batch);
    if (needsStrictFilters && !haveStrictFilters) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select School, Department and Batch to view these charts</p>
        </div>
      );
    }
    switch (activeSection) {
      case 'student':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">School-wise Student Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSchoolData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#0088FE" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance Distribution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Advanced (80%+)', value: gaReports.filter(r => r.overallGAPerformance >= 80).length },
                      { name: 'Intermediate (60-79%)', value: gaReports.filter(r => r.overallGAPerformance >= 60 && r.overallGAPerformance < 80).length },
                      { name: 'Introductory (<60%)', value: gaReports.filter(r => r.overallGAPerformance < 60).length }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => percent > 0 ? `${name}\n${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'course':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">School-wise Course Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSchoolData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="courses" fill="#00C49F" name="Courses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Course Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getDepartmentData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="courses" fill="#FFBB28" name="Courses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'assessment':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getAssessmentTypeData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getAssessmentTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">School-wise Assessment Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSchoolData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="assessments" fill="#FF8042" name="Assessments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'ga':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GA Performance Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getGADistributionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${Number(value).toFixed(2)}%`, 'Average Achievement %']}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#8884D8" name="Average Achievement %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GA Coverage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getGADistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getGADistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'co':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CO Performance Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getCOScoreDistributionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}%`, 
                      'Average Performance Score'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#00C49F" name="Average Performance Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CO Student Coverage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getCOScoreDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count} students`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getCOScoreDistributionData().map((entry, index) => (
                      <Cell key={`cell-co-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} students`, 
                      'Student Count'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'po':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">PO Performance Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getPOScoreDistributionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}%`, 
                      'Average Performance Score'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#FFBB28" name="Average Performance Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">PO Student Coverage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getPOScoreDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count} students`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getPOScoreDistributionData().map((entry, index) => (
                      <Cell key={`cell-po-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} students`, 
                      'Student Count'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'faculty':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Workload Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getFacultyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#0088FE" name="Students" />
                  <Bar dataKey="courses" fill="#00C49F" name="Courses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Assessment Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getFacultyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="assessments" fill="#FFBB28" name="Assessments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getSelectedStudentGABarData = () => {
    if (!filters.student) return [] as { name: string; value: number }[];
    const report = gaReports.find(r => r.studentId === filters.student);
    if (!report) return [];
    return Object.entries(report.gaScores)
      .filter(([_code, data]) => data.assessmentCount > 0)
      .map(([code, data]) => ({ name: code, value: data.averageScore }));
  };

  const renderIndividualCharts = () => {
    if (!filters.school) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please select a school to view individual reports</p>
        </div>
      );
    }

    // Progressive refinement: charts update as Department/Batch/Student are set via filteredData

    switch (activeSection) {
      case 'student':
        return (
          <div className="space-y-6">
            {filters.semesters.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch-wise Semester Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getSemesterComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="performance" stroke="#0088FE" name="Performance %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Student Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getDepartmentData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#00C49F" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {filters.student && filters.studentSemesters.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Student Performance Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getStudentPerformanceData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="performance" stackId="1" stroke="#0088FE" fill="#0088FE" name="Overall" />
                    <Area type="monotone" dataKey="ga1" stackId="2" stroke="#00C49F" fill="#00C49F" name="GA1" />
                    <Area type="monotone" dataKey="ga2" stackId="3" stroke="#FFBB28" fill="#FFBB28" name="GA2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );

      case 'ga':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GA Performance (Current Selection)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getGADistributionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${Number(value).toFixed(2)}%`, 'Average Achievement %']}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#8884D8" name="Average Achievement %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {filters.student && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Student GA Breakdown</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={getSelectedStudentGABarData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#00C49F" name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );

      case 'co':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CO Weightage & Coverage (Current Selection)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={getCODistributionData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#00C49F" name="Avg Weightage %" />
                  </BarChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={getCODistributionData()} dataKey="count" cx="50%" cy="50%" outerRadius={90} label={({ name, count }) => `${name}: ${count}` }>
                      {getCODistributionData().map((entry, index) => (
                        <Cell key={`co-ind-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'po':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">PO Weightage & Coverage (Current Selection)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={getPODistributionData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#FFBB28" name="Avg Weightage %" />
                  </BarChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={getPODistributionData()} dataKey="count" cx="50%" cy="50%" outerRadius={90} label={({ name, count }) => `${name}: ${count}` }>
                      {getPODistributionData().map((entry, index) => (
                        <Cell key={`po-ind-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Individual charts will be displayed based on your filter selections</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600 mt-2">Comprehensive university data analysis and insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <Eye className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'individual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              Individual
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap border-b border-gray-200">
          {[
            { key: 'student', label: 'Student', icon: Users },
            { key: 'course', label: 'Course', icon: BookOpen },
            { key: 'assessment', label: 'Assessment', icon: Target },
            { key: 'ga', label: 'GA Mapping', icon: Award },
            { key: 'co', label: 'CO Mapping', icon: TrendingUp },
            { key: 'po', label: 'PO Mapping', icon: BarChart3 },
            { key: 'faculty', label: 'Faculty', icon: GraduationCap }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeSection === key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* School Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
            <select
              value={filters.school}
              onChange={(e) => updateFilter('school', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select School</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => updateFilter('department', e.target.value)}
              disabled={!filters.school}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">All Departments</option>
              {filters.school && schools.find(s => s.id === filters.school)?.departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
            <select
              value={filters.batch}
              onChange={(e) => updateFilter('batch', e.target.value)}
              disabled={!filters.school}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">All Batches</option>
              {[...new Set(filteredData.students.map(s => s.batch))].sort().map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={filters.section}
              onChange={(e) => updateFilter('section', e.target.value)}
              disabled={!filters.batch}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">All Sections</option>
              {[...new Set(filteredData.students.map(s => s.section).filter(Boolean))].sort().map(sec => (
                <option key={sec as string} value={sec as string}>{sec as string}</option>
              ))}
            </select>
          </div>

          {/* Faculty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
            <select
              value={filters.faculty}
              onChange={(e) => updateFilter('faculty', e.target.value)}
              disabled={!filters.school}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">All Faculty</option>
              {filteredData.faculty.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Student Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={filters.student}
              onChange={(e) => updateFilter('student', e.target.value)}
              disabled={!filters.school}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">All Students</option>
              {filteredData.students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Current Filter Results:</span>
          </div>
          <div className="text-sm text-blue-800">
            <span className="font-medium">{filteredData.students.length}</span> students, 
            <span className="font-medium"> {filteredData.courses.length}</span> courses, 
            <span className="font-medium"> {filteredData.faculty.length}</span> faculty members
            {filters.school && (
              <span> from <span className="font-medium">{schools.find(s => s.id === filters.school)?.name}</span></span>
            )}
            {filters.department && (
              <span> in <span className="font-medium">{filters.department}</span></span>
            )}
            {filters.batch && (
              <span> batch <span className="font-medium">{filters.batch}</span></span>
            )}
          </div>
        </div>

        {/* Semester Selection */}
        {viewMode === 'individual' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch Semester Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Semesters (Max 3)</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(semester => (
                  <button
                    key={semester}
                    onClick={() => toggleSemester(semester, 'semesters')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.semesters.includes(semester)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Sem {semester}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Student Semester Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Semesters (Max 10)</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(semester => (
                  <button
                    key={semester}
                    onClick={() => toggleSemester(semester, 'studentSemesters')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.studentSemesters.includes(semester)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Sem {semester}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {viewMode === 'overview' ? renderOverviewCharts() : renderIndividualCharts()}
      </div>
    </div>
  );
}