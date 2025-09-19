import React from 'react';
import { BarChart3, Users, BookOpen, TrendingUp, Award, Target } from 'lucide-react';
import { Student, Course, Assessment } from '../types';

interface DashboardProps {
  students: Student[];
  courses: Course[];
  assessments: Assessment[];
}

export function Dashboard({ students, courses, assessments }: DashboardProps) {
  const stats = [
    {
      title: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Active Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Assessments',
      value: assessments.length,
      icon: BarChart3,
      color: 'bg-purple-500',
      change: '+25%'
    },
    {
      title: 'GA Coverage',
      value: '87%',
      icon: Target,
      color: 'bg-orange-500',
      change: '+5%'
    }
  ];

  const recentActivity = [
    { id: 1, action: 'New assessment created', course: 'Data Structures', time: '2 hours ago' },
    { id: 2, action: 'GA mapping updated', course: 'Computer Networks', time: '4 hours ago' },
    { id: 3, action: 'Student marks entered', course: 'Database Systems', time: '6 hours ago' },
    { id: 4, action: 'Course created', course: 'Machine Learning', time: '1 day ago' }
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
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{stat.change}</span>
                  </div>
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
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.course}</p>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GA Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">GA Progress</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {['GA1', 'GA2', 'GA3', 'GA4'].map((ga, index) => {
                const progress = [92, 78, 85, 94][index];
                return (
                  <div key={ga} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{ga}</span>
                      <span className="text-sm text-gray-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center text-green-600">
                <Award className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Overall: 87% Coverage</span>
              </div>
            </div>
          </div>
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