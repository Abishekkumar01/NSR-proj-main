import React, { useState, useMemo } from 'react';
import { 
  Download, BarChart3, TrendingUp, Award, Target, Users, BookOpen, 
  GraduationCap, Filter, Eye, EyeOff 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { Student, Assessment, StudentAssessment, GAReport, Course, Faculty, COPOMapping } from '../types';
import { graduateAttributes } from '../data/graduateAttributes';
import { schools } from '../data/schools';
import { getSchoolFromDepartment } from '../lib/schoolMapping';
import { LocalStorageService } from '../lib/localStorage';

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
  const [activeSection, setActiveSection] = useState<'student' | 'course' | 'assessment' | 'ga' | 'co' | 'po' | 'co-po' | 'faculty'>('student');
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

  // CO-PO Mapping state
  const [coPoMappings, setCoPoMappings] = useState<COPOMapping[]>([]);
  const [showCoPoMappingModal, setShowCoPoMappingModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<COPOMapping | null>(null);
  const [coPoFormData, setCoPoFormData] = useState({
    coCode: '',
    poCode: '',
    percentage: 0
  });

  // Load CO-PO mappings on component mount
  React.useEffect(() => {
    const mappings = LocalStorageService.getCOPOMappings();
    setCoPoMappings(mappings);
  }, []);

  // Derive number of semesters from selected batch (e.g., 2023-27 => 4 years => 8 semesters)
  const getProgramSemesters = (): number[] => {
    const batch = filters.batch || '';
    const m = batch.match(/^(20\d{2})-(\d{2})$/);
    if (m) {
      const startYear = parseInt(m[1], 10);
      const endYear = 2000 + parseInt(m[2], 10);
      const years = Math.max(1, Math.min(5, endYear - startYear));
      const sems = years * 2; // 2 semesters per year
      return Array.from({ length: sems }, (_v, i) => i + 1);
    }
    // Fallback when batch not selected: allow up to 10 semesters
    return Array.from({ length: 10 }, (_v, i) => i + 1);
  };

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

    // Apply semester filter to students (affects dropdowns and charts)
    if (filters.semesters && filters.semesters.length > 0) {
      const allowed = new Set(filters.semesters);
      filteredStudents = filteredStudents.filter(s => allowed.has(s.semester));
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
    // Apply current non-school filters to base students; include semester selection
    const baseStudents = students.filter(s => {
      if (filters.department && s.department !== filters.department) return false;
      if (filters.batch && s.batch !== filters.batch) return false;
      if (filters.section && (s.section || '') !== filters.section) return false;
      if (filters.student && s.id !== filters.student) return false;
      if (filters.semesters.length > 0 && !filters.semesters.includes(s.semester)) return false;
      return true;
    });

    const schoolStats = schools.map(school => {
      const schoolStudents = baseStudents.filter(s => {
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
      const facultyCourses = filteredData.courses.filter(c => c.facultyId === f.id);
      
      return {
        name: f.name,
        students: 0, // Students are not directly linked to faculty in current data model
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

  // CO distribution with actual performance scores based on student marks
  const getCODistributionData = () => {
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
  const getPODistributionData = () => {
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
          getCODistributionData().forEach(co => {
            csvContent += `${co.name},${co.value.toFixed(2)},${co.count},${co.averageWeight.toFixed(2)}\n`;
          });
          break;
        case 'po':
          csvContent = 'PO Code,Average Performance Score,Student Count,Average Weightage\n';
          getPODistributionData().forEach(po => {
            csvContent += `${po.name},${po.value.toFixed(2)},${po.count},${po.averageWeight.toFixed(2)}\n`;
          });
          break;
        case 'co-po':
          csvContent = 'CO Code,PO Code,Percentage\n';
          coPoMappings.forEach(mapping => {
            csvContent += `${mapping.coCode},${mapping.poCode},${mapping.percentage}\n`;
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
      ...(key === 'batch' && { section: '', faculty: '', student: '', semesters: [] }),
      ...(key === 'section' && { student: '' }),
      ...(key === 'faculty' && { student: '' })
    }));
  };

  // CO-PO Mapping functions
  const handleAddCoPoMapping = () => {
    setEditingMapping(null);
    setCoPoFormData({ coCode: '', poCode: '', percentage: 0 });
    setShowCoPoMappingModal(true);
  };

  const handleEditCoPoMapping = (mapping: COPOMapping) => {
    setEditingMapping(mapping);
    setCoPoFormData({
      coCode: mapping.coCode,
      poCode: mapping.poCode,
      percentage: mapping.percentage
    });
    setShowCoPoMappingModal(true);
  };

  const handleSaveCoPoMapping = () => {
    if (!coPoFormData.coCode || !coPoFormData.poCode || coPoFormData.percentage < 0 || coPoFormData.percentage > 100) {
      return;
    }

    const newMapping: COPOMapping = {
      id: editingMapping?.id || Date.now().toString(),
      coCode: coPoFormData.coCode,
      poCode: coPoFormData.poCode,
      percentage: coPoFormData.percentage,
      createdAt: editingMapping?.createdAt || new Date()
    };

    if (editingMapping) {
      LocalStorageService.updateCOPOMapping(editingMapping.id, newMapping);
    } else {
      LocalStorageService.addCOPOMapping(newMapping);
    }

    // Refresh mappings
    const updatedMappings = LocalStorageService.getCOPOMappings();
    setCoPoMappings(updatedMappings);
    setShowCoPoMappingModal(false);
    setCoPoFormData({ coCode: '', poCode: '', percentage: 0 });
  };

  const handleDeleteCoPoMapping = (id: string) => {
    LocalStorageService.deleteCOPOMapping(id);
    const updatedMappings = LocalStorageService.getCOPOMappings();
    setCoPoMappings(updatedMappings);
  };

  // Get available COs and POs from assessments
  const getAvailableCOs = () => {
    const coSet = new Set<string>();
    filteredData.assessments.forEach(assessment => {
      assessment.coMapping?.forEach(co => coSet.add(co.coCode));
    });
    return Array.from(coSet).sort();
  };

  const getAvailablePOs = () => {
    const poSet = new Set<string>();
    filteredData.assessments.forEach(assessment => {
      assessment.poMapping?.forEach(po => poSet.add(po.poCode));
    });
    return Array.from(poSet).sort();
  };

  // Generate CO-PO mapping matrix data
  const getCoPoMappingData = () => {
    const coList = getAvailableCOs();
    const poList = getAvailablePOs();
    
    return coList.map(coCode => {
      const coData: any = { coCode };
      poList.forEach(poCode => {
        const mapping = coPoMappings.find(m => m.coCode === coCode && m.poCode === poCode);
        coData[poCode] = mapping ? mapping.percentage : 0;
      });
      return coData;
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
            {getSchoolData().some(d => d.students > 0) && (
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
            )}
            
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
                    label={({ name, percent }: any) => percent > 0 ? `${name}\n${(percent * 100).toFixed(0)}%` : ''}
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
            {filters.semesters.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Semester-wise Performance (Selected Semesters)</h3>
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
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                <BarChart data={getCODistributionData()}>
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
                    data={getCODistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count} students`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getCODistributionData().map((entry, index) => (
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
                <BarChart data={getPODistributionData()}>
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
                    data={getPODistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count} students`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getPODistributionData().map((entry, index) => (
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

      case 'co-po':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">CO-PO Mapping Matrix</h3>
                <button
                  onClick={handleAddCoPoMapping}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Add Mapping
                </button>
              </div>
              
              {getCoPoMappingData().length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">CO</th>
                        {getAvailablePOs().map(po => (
                          <th key={po} className="border border-gray-300 px-4 py-2 text-center font-medium text-gray-700">{po}</th>
                        ))}
                        <th className="border border-gray-300 px-4 py-2 text-center font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCoPoMappingData().map((row, index) => (
                        <tr key={row.coCode}>
                          <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">{row.coCode}</td>
                          {getAvailablePOs().map(po => (
                            <td key={po} className="border border-gray-300 px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded text-sm ${
                                row[po] > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {row[po]}%
                              </span>
                            </td>
                          ))}
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <div className="flex gap-2 justify-center">
                              {coPoMappings.filter(m => m.coCode === row.coCode).map(mapping => (
                                <button
                                  key={mapping.id}
                                  onClick={() => handleEditCoPoMapping(mapping)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Edit
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No CO-PO mappings defined yet. Click "Add Mapping" to create mappings.</p>
                </div>
              )}
            </div>

            {coPoMappings.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">CO-PO Mapping Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coPoMappings.map(mapping => (
                    <div key={mapping.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-gray-900">{mapping.coCode}</span>
                          <span className="text-gray-500 mx-2">→</span>
                          <span className="font-medium text-gray-900">{mapping.poCode}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCoPoMapping(mapping.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{mapping.percentage}%</span> mapping
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            { key: 'co-po', label: 'CO - PO Mapping', icon: BarChart3 },
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
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

          {/* Semesters (Overview) - Dropdown based on batch length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semesters (Overview)</label>
            <select
              multiple
              value={filters.semesters.map(String)}
              onChange={(e) => {
                const raw = Array.from(e.target.selectedOptions).map(o => o.value);
                if (raw.includes('none')) {
                  setFilters(prev => ({ ...prev, semesters: [] }));
                } else {
                  const selectedValues = raw.map(v => parseInt(v));
                  setFilters(prev => ({ ...prev, semesters: selectedValues }));
                }
              }}
              disabled={!filters.batch}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              size={Math.min(6, getProgramSemesters().length)}
            >
              <option value="none">None (clear)</option>
              {getProgramSemesters().map(sem => (
                <option key={`sem-opt-${sem}`} value={sem}>{`Sem ${sem}`}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple semesters</p>
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
            {/* Batch Semester Selection - Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Semesters</label>
              <select
                multiple
                value={filters.semesters.map(String)}
                onChange={(e) => {
                  const raw = Array.from(e.target.selectedOptions).map(o => o.value);
                  if (raw.includes('none')) {
                    setFilters(prev => ({ ...prev, semesters: [] }));
                  } else {
                    const selectedValues = raw.map(v => parseInt(v));
                    setFilters(prev => ({ ...prev, semesters: selectedValues }));
                  }
                }}
                disabled={!filters.batch}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                size={Math.min(6, getProgramSemesters().length)}
              >
                <option value="none">None (clear)</option>
                {getProgramSemesters().map(sem => (
                  <option key={`sem-ind-opt-${sem}`} value={sem}>{`Sem ${sem}`}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple semesters</p>
            </div>

            {/* Individual Student Semester Selection - Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Semesters</label>
              <select
                multiple
                value={filters.studentSemesters.map(String)}
                onChange={(e) => {
                  const raw = Array.from(e.target.selectedOptions).map(o => o.value);
                  if (raw.includes('none')) {
                    setFilters(prev => ({ ...prev, studentSemesters: [] }));
                  } else {
                    const selectedValues = raw.map(v => parseInt(v));
                    setFilters(prev => ({ ...prev, studentSemesters: selectedValues }));
                  }
                }}
                disabled={!filters.student}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:bg-gray-100"
                size={Math.min(6, getProgramSemesters().length)}
              >
                <option value="none">None (clear)</option>
                {getProgramSemesters().map(sem => (
                  <option key={`stu-sem-opt-${sem}`} value={sem}>{`Sem ${sem}`}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple semesters</p>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {viewMode === 'overview' ? renderOverviewCharts() : renderIndividualCharts()}
      </div>

      {/* CO-PO Mapping Modal */}
      {showCoPoMappingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingMapping ? 'Edit CO-PO Mapping' : 'Add CO-PO Mapping'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CO Code</label>
                <select
                  value={coPoFormData.coCode}
                  onChange={(e) => setCoPoFormData({ ...coPoFormData, coCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select CO</option>
                  {getAvailableCOs().map(co => (
                    <option key={co} value={co}>{co}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Code</label>
                <select
                  value={coPoFormData.poCode}
                  onChange={(e) => setCoPoFormData({ ...coPoFormData, poCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select PO</option>
                  {getAvailablePOs().map(po => (
                    <option key={po} value={po}>{po}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={coPoFormData.percentage}
                  onChange={(e) => setCoPoFormData({ ...coPoFormData, percentage: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0-100"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveCoPoMapping}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingMapping ? 'Update' : 'Add'} Mapping
              </button>
              <button
                onClick={() => {
                  setShowCoPoMappingModal(false);
                  setCoPoFormData({ coCode: '', poCode: '', percentage: 0 });
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}