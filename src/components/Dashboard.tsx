import React, { useMemo } from 'react';
import { BarChart3, Users, BookOpen, TrendingUp, Award, Target, School, Calendar } from 'lucide-react';
import { Student, Course, Assessment, StudentAssessment } from '../types';
import { getSchoolFromDepartment } from '../lib/schoolMapping';
import { schools } from '../data/schools';

interface DashboardProps {
  students: Student[];
  courses: Course[];
  assessments: Assessment[];
  studentAssessments?: StudentAssessment[];
  faculty?: any[];
}

export function Dashboard({ students, courses, assessments, studentAssessments = [], faculty = [] }: DashboardProps) {
  // Calculate dynamic statistics
  const stats = useMemo(() => {
    // Ensure we have valid data arrays
    const safeStudents = Array.isArray(students) ? students : [];
    const safeCourses = Array.isArray(courses) ? courses : [];
    const safeAssessments = Array.isArray(assessments) ? assessments : [];
    const safeFaculty = Array.isArray(faculty) ? faculty : [];
    // Calculate school distribution
    const schoolStats = schools.map(school => {
      const schoolStudents = safeStudents.filter(s => {
        const studentSchool = s.school || getSchoolFromDepartment(s.department);
        return studentSchool === school.name;
      });
      return { name: school.name, count: schoolStudents.length };
    });

    const totalStudents = safeStudents.length;
    const totalCourses = safeCourses.length;
    const totalAssessments = safeAssessments.length;
    const totalFaculty = safeFaculty.length;

    // Calculate GA coverage based on assessments with GA mappings
    const assessmentsWithGA = safeAssessments.filter(a => a.gaMapping && a.gaMapping.length > 0);
    const gaCoverage = totalAssessments > 0 ? Math.round((assessmentsWithGA.length / totalAssessments) * 100) : 0;

    // Calculate recent activity (last 7 days)
    const recentAssessments = safeAssessments
      .filter(a => {
        if (!a.createdAt) return false;
        const createdAt = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const daysDiff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      })
      .sort((a, b) => {
        const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 4);

    return {
      totalStudents,
      totalCourses,
      totalAssessments,
      totalFaculty,
      gaCoverage,
      schoolStats,
      recentAssessments
    };
  }, [students, courses, assessments, faculty]);

  // Generate recent activity from actual data
  const recentActivity = useMemo(() => {
    return stats.recentAssessments.map((assessment, index) => {
      const course = courses.find(c => c.id === assessment.courseId);
      const createdAt = assessment.createdAt instanceof Date ? assessment.createdAt : new Date(assessment.createdAt);
      const daysAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
      
      return {
        id: assessment.id,
        action: 'Assessment created',
        course: course?.name || 'Unknown Course',
        time: timeText,
        type: assessment.type
      };
    });
  }, [stats.recentAssessments, courses]);

  // Calculate GA progress from actual data
  const gaProgress = useMemo(() => {
    const safeAssessments = Array.isArray(assessments) ? assessments : [];
    const gaStats = ['GA1', 'GA2', 'GA3', 'GA4', 'GA5', 'GA6'].map(gaCode => {
      const gaAssessments = safeAssessments.filter(a => 
        a.gaMapping && a.gaMapping.some(ga => ga.gaCode === gaCode)
      );
      const progress = safeAssessments.length > 0 ? Math.round((gaAssessments.length / safeAssessments.length) * 100) : 0;
      return { code: gaCode, progress, count: gaAssessments.length };
    });

    const overallCoverage = gaStats.length > 0 
      ? Math.round(gaStats.reduce((sum, ga) => sum + ga.progress, 0) / gaStats.length)
      : 0;

    return { gaStats, overallCoverage };
  }, [assessments]);

  const dashboardStats = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Registered students'
    },
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-green-500',
      description: 'Available courses'
    },
    {
      title: 'Assessments',
      value: stats.totalAssessments,
      icon: BarChart3,
      color: 'bg-purple-500',
      description: 'Total assessments'
    },
    {
      title: 'GA Coverage',
      value: `${stats.gaCoverage}%`,
      icon: Target,
      color: 'bg-orange-500',
      description: 'Assessments with GA mapping'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">Overview of your Graduate Attributes mapping progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.course} ({activity.type})</p>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Create assessments to see activity here</p>
              </div>
            )}
          </div>
        </div>

        {/* GA Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">GA Progress</h3>
          </div>
          <div className="p-6">
            {gaProgress.gaStats.length > 0 ? (
              <div className="space-y-4">
                {gaProgress.gaStats.map((ga) => (
                  <div key={ga.code} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{ga.code}</span>
                      <span className="text-sm text-gray-600">{ga.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${ga.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">{ga.count} assessments</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No GA mappings found</p>
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center text-green-600">
                <Award className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Overall: {gaProgress.overallCoverage}% Coverage</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* School Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">School Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.schoolStats.map((school, index) => (
            <div key={school.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-blue-500' : 
                  index === 1 ? 'bg-green-500' : 
                  index === 2 ? 'bg-purple-500' : 
                  index === 3 ? 'bg-orange-500' : 
                  'bg-gray-500'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900">{school.name}</p>
                  <p className="text-sm text-gray-600">{school.count} students</p>
                </div>
              </div>
              <School className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Add Students</h4>
            <p className="text-sm text-gray-600">Import or add new students to the system</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
            <BookOpen className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Create Course</h4>
            <p className="text-sm text-gray-600">Set up a new course with GA mappings</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Enter Marks</h4>
            <p className="text-sm text-gray-600">Record assessment scores and GA mappings</p>
          </button>
        </div>
      </div>
    </div>
  );
}