import React, { useState } from 'react';
import { BookOpen, Target, BarChart3, Users, GraduationCap, Award, HelpCircle, ChevronRight, ChevronDown } from 'lucide-react';

export function SystemGuide() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const sections = [
    {
      id: 'overview',
      title: 'System Overview',
      icon: <BookOpen className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            The Graduate Attribute (GA) Mapping System is designed to track and assess student performance 
            across different graduate attributes through various assessments and courses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Key Components</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Student Management</li>
                <li>• Faculty Management</li>
                <li>• Course Management</li>
                <li>• Assessment Management</li>
                <li>• GA Mapping</li>
                <li>• Reports & Analytics</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">User Roles</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• <strong>Admin:</strong> Full system access - manage all students, courses, assessments, faculty, and reports</li>
                <li>• <strong>Faculty:</strong> Limited to assigned students - view and manage only students assigned to them</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ga-mapping',
      title: 'GA Mapping Process',
      icon: <Target className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">What are Graduate Attributes?</h4>
            <p className="text-sm text-yellow-800">
              Graduate Attributes (GAs) are specific skills, knowledge, and competencies that students 
              should develop during their academic program. Examples include problem-solving, 
              communication, technical skills, etc.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">GA Mapping Steps:</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Create Assessment</p>
                  <p className="text-sm text-gray-600">Design assessment with specific learning objectives</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Map to GAs</p>
                  <p className="text-sm text-gray-600">Link assessment components to relevant graduate attributes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Set Weightage</p>
                  <p className="text-sm text-gray-600">Assign percentage weight to each GA in the assessment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <p className="font-medium">Evaluate Students</p>
                  <p className="text-sm text-gray-600">Grade students and record GA-specific scores</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      title: 'Understanding Reports',
      icon: <BarChart3 className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Overview Reports</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>School-wise Distribution:</strong> Student count by school</li>
                <li>• <strong>Department-wise Distribution:</strong> Student count by department</li>
                <li>• <strong>Performance Distribution:</strong> Advanced/Intermediate/Introductory levels</li>
                <li>• <strong>GA Performance:</strong> Average scores per graduate attribute</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Individual Reports</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• <strong>Student Performance:</strong> Individual student GA scores</li>
                <li>• <strong>Batch Comparison:</strong> Performance across batches</li>
                <li>• <strong>Semester Trends:</strong> Performance over time</li>
                <li>• <strong>Faculty Reports:</strong> Faculty-wise student performance</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Performance Levels</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2"></div>
                <p className="font-medium text-red-700">Introductory</p>
                <p className="text-gray-600">&lt; 60%</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                <p className="font-medium text-yellow-700">Intermediate</p>
                <p className="text-gray-600">60-79%</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="font-medium text-green-700">Advanced</p>
                <p className="text-gray-600">80%+</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'filtering',
      title: 'Filtering & Navigation',
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How to Filter Students</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>1. Select School:</strong> Choose from ASET, AIIT, ABS, etc.</p>
              <p><strong>2. Select Department:</strong> Choose specific department within school</p>
              <p><strong>3. Select Batch:</strong> Choose academic batch (e.g., 2021-25)</p>
              <p><strong>4. Select Section:</strong> Choose section (A, B, C, etc.)</p>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Adding Students</h4>
            <div className="space-y-2 text-sm text-green-800">
              <p><strong>For AIIT Students:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Select "AIIT" from School dropdown</li>
                <li>Choose "Information Communication Technologies" from Department</li>
                <li>Select appropriate batch and section</li>
                <li>Click "Add Student" button</li>
                <li>Fill in student details</li>
              </ol>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">System Detection</h4>
            <p className="text-sm text-yellow-800">
              The system automatically detects which school a student belongs to based on their department. 
              For example, "Computer Science & Engineering" belongs to ASET, while "Information Communication Technologies" belongs to AIIT.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <HelpCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2">Common Issues</h4>
            <div className="space-y-2 text-sm text-red-800">
              <p><strong>Issue:</strong> "Showing students from: ASET" but no students appear</p>
              <p><strong>Solution:</strong> Check if students have the correct department that matches ASET departments</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">Reports Showing 0 Students</h4>
            <div className="space-y-2 text-sm text-yellow-800">
              <p><strong>Possible Causes:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>No students uploaded for the selected school/department</li>
                <li>Filter settings are too restrictive</li>
                <li>Students don't have proper school assignment</li>
                <li>Data not loaded properly</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Performance Issues</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Overlapping Text in Charts:</strong> Fixed by increasing chart height and improving label positioning</p>
              <p><strong>Dropdown Not Working:</strong> Ensure school is selected first before other filters</p>
              <p><strong>Slow Loading:</strong> Large datasets may take time to load and process</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Guide</h1>
        <p className="text-gray-600">
          Comprehensive guide to understanding and using the GA Mapping System
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {section.icon}
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              </div>
              {expandedSections.has(section.id) ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.has(section.id) && (
              <div className="px-6 pb-6">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
