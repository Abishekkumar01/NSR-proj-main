import React from 'react';
import { 
  Users, BookOpen, ClipboardList, Award, TrendingUp, BarChart3, 
  GraduationCap, Target, CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { Student, Assessment, StudentAssessment, Course, Faculty } from '../types';

interface DataSummaryProps {
  students: Student[];
  courses: Course[];
  assessments: Assessment[];
  studentAssessments: StudentAssessment[];
  faculty: Faculty[];
}

export function DataSummary({ students, courses, assessments, studentAssessments, faculty }: DataSummaryProps) {
  // Calculate comprehensive statistics
  const stats = {
    totalStudents: students.length,
    totalCourses: courses.length,
    totalAssessments: assessments.length,
    totalStudentAssessments: studentAssessments.length,
    totalFaculty: faculty.length,
    
    // Batch distribution
    batchDistribution: students.reduce((acc, student) => {
      acc[student.batch] = (acc[student.batch] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    // Department distribution
    departmentDistribution: students.reduce((acc, student) => {
      acc[student.department] = (acc[student.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    // Assessment type distribution
    assessmentTypeDistribution: assessments.reduce((acc, assessment) => {
      acc[assessment.type] = (acc[assessment.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    // Average performance
    averagePerformance: studentAssessments.length > 0 
      ? studentAssessments.reduce((sum, sa) => sum + (sa.marksObtained / sa.maxMarks) * 100, 0) / studentAssessments.length
      : 0,
    
    // Performance distribution
    performanceDistribution: {
      excellent: studentAssessments.filter(sa => (sa.marksObtained / sa.maxMarks) * 100 >= 90).length,
      good: studentAssessments.filter(sa => {
        const percentage = (sa.marksObtained / sa.maxMarks) * 100;
        return percentage >= 80 && percentage < 90;
      }).length,
      average: studentAssessments.filter(sa => {
        const percentage = (sa.marksObtained / sa.maxMarks) * 100;
        return percentage >= 70 && percentage < 80;
      }).length,
      belowAverage: studentAssessments.filter(sa => {
        const percentage = (sa.marksObtained / sa.maxMarks) * 100;
        return percentage >= 60 && percentage < 70;
      }).length,
      poor: studentAssessments.filter(sa => (sa.marksObtained / sa.maxMarks) * 100 < 60).length,
    },
    
    // CO and PO coverage
    coCoverage: assessments.reduce((acc, assessment) => {
      assessment.coMapping?.forEach(co => {
        acc[co.coCode] = (acc[co.coCode] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
    
    poCoverage: assessments.reduce((acc, assessment) => {
      assessment.poMapping?.forEach(po => {
        acc[po.poCode] = (acc[po.poCode] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
    
    // GA coverage
    gaCoverage: assessments.reduce((acc, assessment) => {
      assessment.gaMapping.forEach(ga => {
        acc[ga.gaCode] = (acc[ga.gaCode] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
  };

  const StatCard = ({ title, value, icon: Icon, color = "blue", subtitle }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color?: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          color === 'blue' ? 'bg-blue-100' :
          color === 'green' ? 'bg-green-100' :
          color === 'purple' ? 'bg-purple-100' :
          color === 'orange' ? 'bg-orange-100' :
          'bg-gray-100'
        }`}>
          <Icon className={`w-6 h-6 ${
            color === 'blue' ? 'text-blue-600' :
            color === 'green' ? 'text-green-600' :
            color === 'purple' ? 'text-purple-600' :
            color === 'orange' ? 'text-orange-600' :
            'text-gray-600'
          }`} />
        </div>
      </div>
    </div>
  );

  const DistributionCard = ({ title, data, icon: Icon, color = "blue" }: {
    title: string;
    data: Record<string, number>;
    icon: React.ComponentType<any>;
    color?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${
          color === 'blue' ? 'text-blue-600' :
          color === 'green' ? 'text-green-600' :
          color === 'purple' ? 'text-purple-600' :
          color === 'orange' ? 'text-orange-600' :
          'text-gray-600'
        }`} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{key}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">ASET BTech CSE Program Analysis</h2>
        <p className="text-gray-600">Comprehensive dataset analysis and performance insights</p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="blue"
          subtitle="Across 4 batches (2022-2026)"
        />
        <StatCard
          title="Courses Offered"
          value={stats.totalCourses}
          icon={BookOpen}
          color="green"
          subtitle="Core CSE subjects"
        />
        <StatCard
          title="Total Assessments"
          value={stats.totalAssessments}
          icon={ClipboardList}
          color="purple"
          subtitle="Quiz, Assignment, Mid-term, End-term"
        />
        <StatCard
          title="Faculty Members"
          value={stats.totalFaculty}
          icon={GraduationCap}
          color="orange"
          subtitle="Teaching staff"
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard
          title="Average Performance"
          value={`${stats.averagePerformance.toFixed(1)}%`}
          icon={TrendingUp}
          color="green"
          subtitle="Overall student performance"
        />
        <StatCard
          title="Student Assessments"
          value={stats.totalStudentAssessments}
          icon={Target}
          color="blue"
          subtitle="Individual assessment records"
        />
      </div>

      {/* Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DistributionCard
          title="Batch Distribution"
          data={stats.batchDistribution}
          icon={Users}
          color="blue"
        />
        <DistributionCard
          title="Assessment Types"
          data={stats.assessmentTypeDistribution}
          icon={ClipboardList}
          color="purple"
        />
        <DistributionCard
          title="Course Outcomes Coverage"
          data={stats.coCoverage}
          icon={Award}
          color="green"
        />
      </div>

      {/* Performance Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Student Performance Distribution</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.performanceDistribution.excellent}</div>
            <div className="text-sm text-green-700">Excellent (90%+)</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.performanceDistribution.good}</div>
            <div className="text-sm text-blue-700">Good (80-89%)</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.performanceDistribution.average}</div>
            <div className="text-sm text-yellow-700">Average (70-79%)</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.performanceDistribution.belowAverage}</div>
            <div className="text-sm text-orange-700">Below Avg (60-69%)</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.performanceDistribution.poor}</div>
            <div className="text-sm text-red-700">Poor (&lt;60%)</div>
          </div>
        </div>
      </div>

      {/* Mapping Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionCard
          title="Program Outcomes Coverage"
          data={stats.poCoverage}
          icon={Target}
          color="orange"
        />
        <DistributionCard
          title="Graduate Attributes Coverage"
          data={stats.gaCoverage}
          icon={Award}
          color="purple"
        />
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Key Insights & Analysis</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Comprehensive Coverage</h4>
                <p className="text-sm text-gray-600">
                  All 10 core CSE courses are mapped with COs, POs, and GAs, ensuring complete curriculum alignment.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Balanced Assessment Strategy</h4>
                <p className="text-sm text-gray-600">
                  Multiple assessment types (Quiz, Assignment, Mid-term, End-term) provide comprehensive evaluation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Faculty Distribution</h4>
                <p className="text-sm text-gray-600">
                  {stats.totalFaculty} faculty members effectively manage {stats.totalStudents} students across 4 batches.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Performance Monitoring</h4>
                <p className="text-sm text-gray-600">
                  {stats.totalStudentAssessments} individual assessment records enable detailed performance tracking.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Outcome Mapping</h4>
                <p className="text-sm text-gray-600">
                  Strong coverage of Course Outcomes ({Object.keys(stats.coCoverage).length} COs) and Program Outcomes ({Object.keys(stats.poCoverage).length} POs).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Graduate Attributes</h4>
                <p className="text-sm text-gray-600">
                  {Object.keys(stats.gaCoverage).length} Graduate Attributes mapped across assessments for comprehensive skill development.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Course Portfolio</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <div key={course.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{course.code}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {course.semester} Sem
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{course.name}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{course.facultyName}</span>
                <span>{course.credits} Credits</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {course.coOptions?.length || 0} COs
                </span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {course.poOptions?.length || 0} POs
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
