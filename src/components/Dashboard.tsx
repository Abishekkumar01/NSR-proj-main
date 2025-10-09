import React from 'react';
import { Users, Target, GraduationCap, TrendingUp } from 'lucide-react';
import { Student, Course, Assessment, StudentAssessment } from '../types';

interface DashboardProps {
  students: Student[];
  courses: Course[];
  assessments: Assessment[];
  studentAssessments?: StudentAssessment[];
  faculty?: any[];
  onPageChange?: (page: string) => void;
}

export function Dashboard({ students, courses, assessments, studentAssessments = [], faculty = [], onPageChange }: DashboardProps) {
  // Simple statistics
  const totalStudents = students.length;
  const totalCourses = courses.length;
  const totalAssessments = assessments.length;
  const totalFaculty = faculty.length;
  const totalStudentAssessments = studentAssessments.length;

  // Simple dashboard cards
  const dashboardCards = [
    {
      title: 'Total Students',
      value: totalStudents.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      description: 'Students in the system',
      onClick: () => onPageChange?.('students')
    },
    {
      title: 'Total Assessments',
      value: totalAssessments.toLocaleString(),
      icon: Target,
      color: 'bg-purple-500',
      description: 'Assessments created',
      onClick: () => onPageChange?.('assessments')
    },
    {
      title: 'Faculty Members',
      value: totalFaculty.toLocaleString(),
      icon: GraduationCap,
      color: 'bg-orange-500',
      description: 'Faculty in the system',
      onClick: () => onPageChange?.('faculty')
    },
    {
      title: 'Reports',
      value: 'View',
      icon: TrendingUp,
      color: 'bg-indigo-500',
      description: 'Analytics & Reports',
      onClick: () => onPageChange?.('reports')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">Overview of your academic management system</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={card.onClick}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                </div>
                <div className={`${card.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => onPageChange?.('students')}
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Manage Students</span>
          </button>
          <button
            onClick={() => onPageChange?.('assessments')}
            className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Target className="w-5 h-5 text-purple-600" />
            <span className="text-purple-800 font-medium">Manage Assessments</span>
          </button>
          <button
            onClick={() => onPageChange?.('ga-mapping')}
            className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <GraduationCap className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800 font-medium">Enter Marks</span>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">System Online</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Data Synced</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">All Services Running</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Auto-save Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}