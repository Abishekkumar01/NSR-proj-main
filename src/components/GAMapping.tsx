import React, { useState } from 'react';
import { Search, GraduationCap, Trophy, Target, Users } from 'lucide-react';
import { Student, Assessment, StudentAssessment, GAScore } from '../types';
import { graduateAttributes } from '../data/graduateAttributes';

interface GAMappingProps {
  students: Student[];
  assessments: Assessment[];
  studentAssessments: StudentAssessment[];
  onAddStudentAssessment: (assessment: Omit<StudentAssessment, 'id'>) => void;
  onUpdateStudentAssessment: (id: string, assessment: Partial<StudentAssessment>) => void;
}

export function GAMapping({ 
  students, 
  assessments, 
  studentAssessments, 
  onAddStudentAssessment,
  onUpdateStudentAssessment 
}: GAMappingProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showMarkEntry, setShowMarkEntry] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [marksData, setMarksData] = useState<{[studentId: string]: number}>({});

  const filteredAssessments = assessments.filter(assessment =>
    assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssessmentSelect = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowMarkEntry(true);
    
    // Initialize marks data with existing marks
    const initialMarks: {[studentId: string]: number} = {};
    students.forEach(student => {
      const existingAssessment = studentAssessments.find(
        sa => sa.studentId === student.id && sa.assessmentId === assessment.id
      );
      initialMarks[student.id] = existingAssessment?.marksObtained || 0;
    });
    setMarksData(initialMarks);
  };

  const calculateGAScore = (marks: number, maxMarks: number, gaMapping: Assessment['gaMapping']) => {
    const percentage = (marks / maxMarks) * 100;
    
    return gaMapping.map(mapping => {
      const gaScore = (percentage * mapping.weightage) / 100;
      const ga = graduateAttributes.find(g => g.id === mapping.gaId);
      
      let level: 'Introductory' | 'Intermediate' | 'Advanced' = 'Introductory';
      if (ga) {
        const proficiency = ga.proficiencyLevels.find(p => 
          gaScore >= p.scoreRange.min && gaScore <= p.scoreRange.max
        );
        if (proficiency) {
          level = proficiency.level;
        }
      }

      return {
        gaId: mapping.gaId,
        gaCode: mapping.gaCode,
        score: gaScore,
        level,
        weightage: mapping.weightage
      };
    });
  };

  const handleSubmitMarks = () => {
    if (!selectedAssessment) return;

    Object.entries(marksData).forEach(([studentId, marks]) => {
      if (marks > 0) {
        const gaScores = calculateGAScore(marks, selectedAssessment.maxMarks, selectedAssessment.gaMapping);
        
        const existingAssessment = studentAssessments.find(
          sa => sa.studentId === studentId && sa.assessmentId === selectedAssessment.id
        );

        const assessmentData: Omit<StudentAssessment, 'id'> = {
          studentId,
          assessmentId: selectedAssessment.id,
          marksObtained: marks,
          maxMarks: selectedAssessment.maxMarks,
          gaScores,
          submittedAt: new Date(),
          evaluatedBy: 'Current Faculty'
        };

        if (existingAssessment) {
          onUpdateStudentAssessment(existingAssessment.id, assessmentData);
        } else {
          onAddStudentAssessment(assessmentData);
        }
      }
    });

    setShowMarkEntry(false);
    setSelectedAssessment(null);
    setMarksData({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Graduate Attributes Mapping</h2>
        <p className="text-gray-600 mt-2">Enter assessment marks and track GA performance</p>
      </div>

      {!showMarkEntry ? (
        <>
          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Assessment Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssessments.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No assessments available for marking</p>
              </div>
            ) : (
              filteredAssessments.map((assessment) => {
                const completedCount = studentAssessments.filter(sa => sa.assessmentId === assessment.id).length;
                const completionRate = students.length > 0 ? (completedCount / students.length) * 100 : 0;
                
                return (
                  <div
                    key={assessment.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                    onClick={() => handleAssessmentSelect(assessment)}
                  >
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg">{assessment.name}</h3>
                      <p className="text-sm text-gray-600">{assessment.courseName}</p>
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {assessment.type}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Max Marks:</span>
                        <span className="font-medium">{assessment.maxMarks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">GA Mappings:</span>
                        <span className="font-medium">{assessment.gaMapping.length}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Completion:</span>
                        <span className="font-medium">{completedCount}/{students.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center text-blue-600 font-medium">
                      <Target className="w-4 h-4 mr-2" />
                      Enter Marks
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Marks Entry Interface */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Enter Marks: {selectedAssessment?.name}</h3>
                <p className="text-gray-600">{selectedAssessment?.courseName} • Max Marks: {selectedAssessment?.maxMarks}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMarkEntry(false);
                    setSelectedAssessment(null);
                    setMarksData({});
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitMarks}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Marks
                </button>
              </div>
            </div>
          </div>

          {/* GA Mapping Info */}
          {selectedAssessment && selectedAssessment.gaMapping.length > 0 && (
            <div className="p-6 bg-blue-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Graduate Attributes Mapping</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedAssessment.gaMapping.map((mapping, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-blue-900">{mapping.gaCode}</span>
                      <span className="text-sm text-blue-700">{mapping.weightage}%</span>
                    </div>
                    <p className="text-sm text-blue-600 mb-1">{mapping.gaName}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      mapping.targetLevel === 'Advanced' ? 'bg-green-100 text-green-800' :
                      mapping.targetLevel === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      Target: {mapping.targetLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Students Marks Entry */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Roll Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Marks Obtained</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Percentage</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No students found</p>
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => {
                      const marks = marksData[student.id] || 0;
                      const percentage = selectedAssessment ? (marks / selectedAssessment.maxMarks) * 100 : 0;
                      const existingAssessment = studentAssessments.find(
                        sa => sa.studentId === student.id && sa.assessmentId === selectedAssessment?.id
                      );
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.rollNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max={selectedAssessment?.maxMarks || 100}
                              value={marks}
                              onChange={(e) => setMarksData({
                                ...marksData,
                                [student.id]: parseFloat(e.target.value) || 0
                              })}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0"
                            />
                            <span className="text-gray-500 ml-2">/ {selectedAssessment?.maxMarks}</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`font-medium ${
                              percentage >= 80 ? 'text-green-600' :
                              percentage >= 60 ? 'text-yellow-600' :
                              percentage > 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {marks > 0 ? `${percentage.toFixed(1)}%` : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {existingAssessment ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                <Trophy className="w-3 h-3 mr-1" />
                                Evaluated
                              </span>
                            ) : marks > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                Pending Save
                              </span>
                            ) : (
                              <span className="text-gray-500">Not entered</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}