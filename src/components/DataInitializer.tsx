import React, { useState } from 'react';
import { Database, Users, BookOpen, ClipboardList, BarChart3 } from 'lucide-react';
import { initializeAllData } from '../data/initializeData';
import { DataSummary } from './DataSummary';

interface DataInitializerProps {
  onDataInitialized: (data: any) => void;
}

export function DataInitializer({ onDataInitialized }: DataInitializerProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [initializedData, setInitializedData] = useState<any>(null);

  const handleInitializeData = async () => {
    setIsInitializing(true);
    
    try {
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = initializeAllData();
      onDataInitialized(data);
      setInitializedData(data);
      setInitializationComplete(true);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  if (initializationComplete && initializedData) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Data Initialization Complete!</h3>
          <p className="text-green-700 mb-4">
            Successfully created comprehensive dataset with courses, students, assessments, and mappings.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="font-semibold">4 Faculty</div>
              <div className="text-gray-600">Members</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <BookOpen className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <div className="font-semibold">10 Courses</div>
              <div className="text-gray-600">BTech CSE</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <div className="font-semibold">120 Students</div>
              <div className="text-gray-600">4 Batches</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <ClipboardList className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <div className="font-semibold">40 Assessments</div>
              <div className="text-gray-600">Various Types</div>
            </div>
          </div>
        </div>
        
        {/* Data Summary Analysis */}
        <DataSummary
          students={initializedData.students}
          courses={initializedData.courses}
          assessments={initializedData.assessments}
          studentAssessments={initializedData.studentAssessments}
          faculty={initializedData.faculty}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Initialize Comprehensive Dataset</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          This will create a complete dataset for ASET BTech CSE program including:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto">
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Faculty & Courses</h3>
              <p className="text-sm text-gray-600">4 faculty members teaching 10 CSE courses (DSA, OS, DBMS, etc.)</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <BookOpen className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Course Outcomes</h3>
              <p className="text-sm text-gray-600">4-5 COs per course with detailed learning objectives</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <ClipboardList className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Program Outcomes</h3>
              <p className="text-sm text-gray-600">4-5 POs per course mapped to engineering competencies</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <BarChart3 className="w-5 h-5 text-orange-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">GA Mappings</h3>
              <p className="text-sm text-gray-600">3 Graduate Attributes mapped to each course</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 text-indigo-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Student Data</h3>
              <p className="text-sm text-gray-600">120 students across 4 batches (2022-2026)</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <ClipboardList className="w-5 h-5 text-red-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Assessments</h3>
              <p className="text-sm text-gray-600">Quiz, Assignment, Mid-term, End-term with marks</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleInitializeData}
          disabled={isInitializing}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
            isInitializing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isInitializing ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Initializing Data...</span>
            </div>
          ) : (
            'Initialize Complete Dataset'
          )}
        </button>
        
        {isInitializing && (
          <div className="mt-4 text-sm text-gray-600">
            <p>Creating courses, students, assessments, and mappings...</p>
            <p className="text-xs mt-1">This may take a few moments</p>
          </div>
        )}
      </div>
    </div>
  );
}
