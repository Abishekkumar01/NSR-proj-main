import React, { useState, useMemo } from 'react';
import { Search, GraduationCap, Trophy, Target, Users, Filter } from 'lucide-react';
import { Student, Assessment, StudentAssessment, GAScore } from '../types';
import { schools } from '../data/schools';
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
  const [filterSchoolId, setFilterSchoolId] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterBatch, setFilterBatch] = useState<string>('');
  const [filterSection, setFilterSection] = useState<string>('');

  const filteredAssessments = useMemo(() => {
    let list = assessments;
    if (filterSchoolId) {
      const s = schools.find(x => x.id === filterSchoolId);
      if (s) list = list.filter(a => a.school === s.name);
    }
    if (filterDepartment) list = list.filter(a => a.department === filterDepartment);
    return list.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.courseName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [assessments, filterSchoolId, filterDepartment, searchTerm]);

  const departmentsForSelectedSchool = useMemo(() => {
    if (!filterSchoolId) return [] as string[];
    const s = schools.find(x => x.id === filterSchoolId);
    return s?.departments || [];
  }, [filterSchoolId]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (filterSchoolId) {
      const s = schools.find(x => x.id === filterSchoolId);
      if (s) list = list.filter(st => (st.school || '') === s.name);
    }
    if (filterDepartment) list = list.filter(st => st.department === filterDepartment);
    if (filterBatch) list = list.filter(st => st.batch === filterBatch);
    if (filterSection) list = list.filter(st => (st.section || '') === filterSection);
    return list;
  }, [students, filterSchoolId, filterDepartment, filterBatch, filterSection]);

  const batchesForSelection = useMemo(() => {
    const setBatches = new Set<string>();
    filteredStudents.forEach(st => { if (st.batch) setBatches.add(st.batch); });
    return Array.from(setBatches).sort();
  }, [filteredStudents]);

  const sectionsForSelection = useMemo(() => {
    const setSections = new Set<string>();
    filteredStudents.forEach(st => { if (st.section) setSections.add(st.section); });
    return Array.from(setSections).sort();
  }, [filteredStudents]);

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
          <h2 className="text-3xl font-bold text-gray-900">Mapping</h2>
        <p className="text-gray-600 mt-2">Enter assessment marks and track GA, CO & PO performance</p>
      </div>

      {!showMarkEntry ? (
        <>
          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
                <select
                  value={filterSchoolId}
                  onChange={(e) => { setFilterSchoolId(e.target.value); setFilterDepartment(''); setFilterBatch(''); setFilterSection(''); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select School</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => { setFilterDepartment(e.target.value); setFilterBatch(''); setFilterSection(''); }}
                  disabled={!filterSchoolId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">All Departments</option>
                  {departmentsForSelectedSchool.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <select
                  value={filterBatch}
                  onChange={(e) => { setFilterBatch(e.target.value); setFilterSection(''); }}
                  disabled={!filterSchoolId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">All Batches</option>
                  {batchesForSelection.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  disabled={!filterSchoolId || sectionsForSelection.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">All Sections</option>
                  {sectionsForSelection.map(sec => (
                    <option key={sec} value={sec as string}>{sec}</option>
                  ))}
                </select>
              </div>
            </div>
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
              {(filterSchoolId || filterDepartment || filterBatch || filterSection || searchTerm) && (
                <button
                  type="button"
                  onClick={() => { setFilterSchoolId(''); setFilterDepartment(''); setFilterBatch(''); setFilterSection(''); setSearchTerm(''); }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Assessment Selection - Grouped by Course */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssessments.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No assessments available for marking</p>
              </div>
            ) : (
              (() => {
                // Group assessments by course
                const assessmentsByCourse = filteredAssessments.reduce<Record<string, Assessment[]>>((grouped, assessment) => {
                  if (!grouped[assessment.courseId]) {
                    grouped[assessment.courseId] = [];
                  }
                  grouped[assessment.courseId].push(assessment);
                  return grouped;
                }, {});

                return Object.entries(assessmentsByCourse).map(([courseId, courseAssessments]) => {
                  const courseName = courseAssessments[0]?.courseName || '';
                  
                  return (
                    <div key={courseId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 text-lg">{courseName}</h3>
                        <p className="text-sm text-gray-600">Assessments</p>
                      </div>

                      <div className="space-y-4">
                        {courseAssessments.map((assessment) => {
                          const total = filteredStudents.length;
                          const completedCount = studentAssessments.filter(sa => sa.assessmentId === assessment.id && filteredStudents.some(st => st.id === sa.studentId)).length;
                          const completionRate = total > 0 ? (completedCount / total) * 100 : 0;
                          
                          return (
                            <div
                              key={assessment.id}
                              className="border rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                              onClick={() => handleAssessmentSelect(assessment)}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                      {assessment.type}
                                    </span>
                                    <span className="text-xs text-gray-500">Max: {assessment.maxMarks}</span>
                                    <span className="text-xs text-gray-500">GA Mappings: {assessment.gaMapping.length}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">
                                      {completedCount}/{total} completed
                                    </div>
                                    <div className="w-20 bg-gray-200 rounded-full h-1">
                                      <div
                                        className="bg-green-600 h-1 rounded-full transition-all duration-300"
                                        style={{ width: `${completionRate}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center text-blue-600 font-medium text-sm">
                                    <Target className="w-4 h-4 mr-1" />
                                    Enter Marks
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </>
      ) : (
        /* Marks Entry Interface */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-screen">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Enter Marks: {selectedAssessment?.name}</h3>
                <p className="text-gray-600 text-lg mt-2">{selectedAssessment?.courseName} • Max Marks: {selectedAssessment?.maxMarks}</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowMarkEntry(false);
                    setSelectedAssessment(null);
                    setMarksData({});
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitMarks}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                >
                  Submit Marks
                </button>
              </div>
            </div>
          </div>

          {/* GA Mapping Info */}
          {selectedAssessment && selectedAssessment.gaMapping.length > 0 && (
              <div className="p-8 bg-blue-50 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-6 text-xl">Mapping</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedAssessment.gaMapping.map((mapping, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-blue-900 text-lg">{mapping.gaCode}</span>
                      <span className="text-lg text-blue-700 font-medium">{mapping.weightage}%</span>
                    </div>
                    <p className="text-blue-600 mb-3 text-base">{mapping.gaName}</p>
                    <span className={`inline-block px-3 py-2 text-sm rounded-full font-medium ${
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
          <div className="p-8">
            <h4 className="font-semibold text-gray-900 mb-6 text-xl">Student Marks Entry</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-900">Roll Number</th>
                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-900">Student Name</th>
                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-900">Marks Obtained</th>
                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-900">Percentage</th>
                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No students found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const marks = marksData[student.id] || 0;
                      const percentage = selectedAssessment ? (marks / selectedAssessment.maxMarks) * 100 : 0;
                      const existingAssessment = studentAssessments.find(
                        sa => sa.studentId === student.id && sa.assessmentId === selectedAssessment?.id
                      );
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-base font-medium text-gray-900">{student.rollNumber}</td>
                          <td className="px-6 py-4 text-base text-gray-900">{student.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min="0"
                                max={selectedAssessment?.maxMarks || 100}
                                value={marks}
                                onChange={(e) => setMarksData({
                                  ...marksData,
                                  [student.id]: parseFloat(e.target.value) || 0
                                })}
                                className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                placeholder="0"
                              />
                              <span className="text-gray-500 text-lg">/ {selectedAssessment?.maxMarks}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-base">
                            <span className={`font-semibold text-lg ${
                              percentage >= 80 ? 'text-green-600' :
                              percentage >= 60 ? 'text-yellow-600' :
                              percentage > 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {marks > 0 ? `${percentage.toFixed(1)}%` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-base">
                            {existingAssessment ? (
                              <span className="inline-flex items-center px-4 py-2 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                                <Trophy className="w-4 h-4 mr-2" />
                                Evaluated
                              </span>
                            ) : marks > 0 ? (
                              <span className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                                Pending Save
                              </span>
                            ) : (
                              <span className="text-gray-500 text-lg">Not entered</span>
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