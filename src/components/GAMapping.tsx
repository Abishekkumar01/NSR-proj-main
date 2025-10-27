import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, GraduationCap, Trophy, Target, Users, Filter } from 'lucide-react';
import { Student, Assessment, StudentAssessment, GAScore } from '../types';
import { schools } from '../data/schools';
import { graduateAttributes } from '../data/graduateAttributes';
import { LocalStorageService } from '../lib/localStorage';

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
  const [questionMarks, setQuestionMarks] = useState<{[studentId: string]: number[]}>({});
  const [filterSchoolId, setFilterSchoolId] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterBatch, setFilterBatch] = useState<string>('');
  const [filterSection, setFilterSection] = useState<string>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const filteredAssessments = useMemo(() => {
    let list = assessments;
    if (filterSchoolId) {
      const s = schools.find(x => x.id === filterSchoolId);
      if (s) list = list.filter(a => a.school === s.name);
    }
    if (filterDepartment) list = list.filter(a => a.department === filterDepartment);
    if (filterBatch) {
      // Filter by batch using course batch metadata via assessment's courseName not available here; rely on student batch filter to decide availability
      // Keep assessments but progress/completion counts will reflect filtered students.
    }
    return list.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.courseName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [assessments, filterSchoolId, filterDepartment, filterBatch, searchTerm]);

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

  // Auto-save marks to localStorage with debouncing
  const autoSaveMarks = useCallback((assessmentId: string, marks: {[studentId: string]: number}, qMarks: {[studentId: string]: number[]}) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    setIsAutoSaving(true);
    
    const timeout = setTimeout(() => {
      try {
        const key = `unsaved_marks_${assessmentId}`;
        const questionKey = `unsaved_marks_${assessmentId}_questions`;
        localStorage.setItem(key, JSON.stringify(marks));
        localStorage.setItem(questionKey, JSON.stringify(qMarks));
        console.log('Auto-saved marks to localStorage');
        setIsAutoSaving(false);
      } catch (error) {
        console.error('Error auto-saving marks:', error);
        setIsAutoSaving(false);
      }
    }, 2000); // 2 second delay
    
    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout]);

  // Load unsaved marks from localStorage
  const loadUnsavedMarks = useCallback((assessmentId: string): {[studentId: string]: number} => {
    try {
      const key = `unsaved_marks_${assessmentId}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading unsaved marks:', error);
      return {};
    }
  }, []);

  // Clear unsaved marks from localStorage
  const clearUnsavedMarks = useCallback((assessmentId: string) => {
    try {
      const key = `unsaved_marks_${assessmentId}`;
      const questionKey = `unsaved_marks_${assessmentId}_questions`;
      localStorage.removeItem(key);
      localStorage.removeItem(questionKey);
    } catch (error) {
      console.error('Error clearing unsaved marks:', error);
    }
  }, []);

  // Question mark distribution
  const questionMaxMarks = [5, 5, 5, 5, 5, 9, 9, 9, 12];
  const totalMaxMarks = questionMaxMarks.reduce((sum, marks) => sum + marks, 0);

  const handleAssessmentSelect = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowMarkEntry(true);
    
    // Initialize marks data with existing marks AND unsaved marks
    const initialMarks: {[studentId: string]: number} = {};
    const initialQuestionMarks: {[studentId: string]: number[]} = {};
    
    // First load existing saved marks
    students.forEach(student => {
      const existingAssessment = studentAssessments.find(
        sa => sa.studentId === student.id && sa.assessmentId === assessment.id
      );
      if (existingAssessment && existingAssessment.marksObtained > 0) {
        initialMarks[student.id] = existingAssessment.marksObtained;
        // Initialize question marks as zeros
        initialQuestionMarks[student.id] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      }
    });
    
    // Then load unsaved marks from localStorage (this will override saved marks if any)
    const unsavedMarks = loadUnsavedMarks(assessment.id);
    const unsavedQuestionMarks = loadUnsavedMarks(`${assessment.id}_questions`);
    Object.assign(initialMarks, unsavedMarks);
    Object.assign(initialQuestionMarks, unsavedQuestionMarks);
    
    setMarksData(initialMarks);
    setQuestionMarks(initialQuestionMarks);
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

  const handleSubmitMarks = async () => {
    if (!selectedAssessment || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Process all marks and save them
      const savePromises = Object.entries(marksData).map(async ([studentId, marks]) => {
        if (marks && marks > 0) {
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
            return onUpdateStudentAssessment(existingAssessment.id, assessmentData);
          } else {
            return onAddStudentAssessment(assessmentData);
          }
        }
      });

      // Wait for all saves to complete
      await Promise.all(savePromises.filter(Boolean));

      // Clear unsaved marks from localStorage after successful submission
      if (selectedAssessment) {
        clearUnsavedMarks(selectedAssessment.id);
      }

      setShowMarkEntry(false);
      setSelectedAssessment(null);
      setMarksData({});
      setQuestionMarks({});
      
      console.log('All marks saved successfully!');
    } catch (error) {
      console.error('Error saving marks:', error);
      // Still clear the form even if there's an error
      setShowMarkEntry(false);
      setSelectedAssessment(null);
      setMarksData({});
      setQuestionMarks({});
    } finally {
      setIsSubmitting(false);
    }
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
                                    <span className="text-xs text-gray-500">GA: {assessment.gaMapping.length}</span>
                                    <span className="text-xs text-gray-500">CO: {assessment.coMapping?.length || 0}</span>
                                    <span className="text-xs text-gray-500">PO: {assessment.poMapping?.length || 0}</span>
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
                {isAutoSaving && (
                  <p className="text-blue-600 text-sm mt-1 flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Auto-saving...
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    // Clear unsaved marks from localStorage when canceling
                    if (selectedAssessment) {
                      clearUnsavedMarks(selectedAssessment.id);
                    }
                    setShowMarkEntry(false);
                    setSelectedAssessment(null);
                    setMarksData({});
                    setQuestionMarks({});
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitMarks}
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-lg transition-colors text-lg font-medium flex items-center gap-2 ${
                    isSubmitting 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isSubmitting ? 'Saving...' : 'Submit Marks'}
                </button>
              </div>
            </div>
          </div>

          {/* All Mappings Info */}
          {selectedAssessment && (
            <div className="p-8 bg-gray-50 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-6 text-xl">Mapping</h4>
              
              {/* GA Mappings */}
              {selectedAssessment.gaMapping && selectedAssessment.gaMapping.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Trophy className="w-5 h-5 text-orange-600 mr-2" />
                    <h5 className="text-lg font-semibold text-gray-800">GA Mappings</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedAssessment.gaMapping.map((mapping, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-orange-900">{mapping.gaCode}</span>
                          <span className="text-orange-700 font-medium">{mapping.weightage}%</span>
                        </div>
                        <p className="text-orange-600 mb-2 text-sm">{mapping.gaName}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                          mapping.targetLevel === 'Advanced' ? 'bg-green-100 text-green-800' :
                          mapping.targetLevel === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {mapping.targetLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CO Mappings */}
              {selectedAssessment.coMapping && selectedAssessment.coMapping.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Target className="w-5 h-5 text-blue-600 mr-2" />
                    <h5 className="text-lg font-semibold text-gray-800">CO Mappings</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedAssessment.coMapping.map((mapping, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-900">{mapping.coCode}</span>
                          <span className="text-blue-700 font-medium">{mapping.weightage}%</span>
                        </div>
                        <p className="text-blue-600 text-sm">{mapping.coName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PO Mappings */}
              {selectedAssessment.poMapping && selectedAssessment.poMapping.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <GraduationCap className="w-5 h-5 text-purple-600 mr-2" />
                    <h5 className="text-lg font-semibold text-gray-800">PO Mappings</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedAssessment.poMapping.map((mapping, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-purple-900">{mapping.poCode}</span>
                          <span className="text-purple-700 font-medium">{mapping.weightage}%</span>
                        </div>
                        <p className="text-purple-600 text-sm">{mapping.poName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No mappings message */}
              {(!selectedAssessment.gaMapping || selectedAssessment.gaMapping.length === 0) &&
               (!selectedAssessment.coMapping || selectedAssessment.coMapping.length === 0) &&
               (!selectedAssessment.poMapping || selectedAssessment.poMapping.length === 0) && (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No mappings configured for this assessment</p>
                  <p className="text-sm text-gray-400 mt-1">Configure GA, CO, and PO mappings in Assessment Management</p>
                </div>
              )}
            </div>
          )}

          {/* Students Marks Entry */}
          <div className="p-8">
            <h4 className="font-semibold text-gray-900 mb-6 text-xl">Student Marks Entry</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="px-3 py-4 text-left text-base font-semibold text-gray-900 sticky left-0 bg-white z-10">Roll Number</th>
                    <th className="px-3 py-4 text-left text-base font-semibold text-gray-900 sticky left-16 bg-white z-10">Student Name</th>
                    <th className="px-2 py-4 text-center text-sm font-semibold text-gray-900 min-w-16">Q1<br />(5)</th>
                    <th className="px-2 py-4 text-center text-sm font-semibold text-gray-900 min-w-16">Q2<br />(5)</th>
                    <th className="px-2 py-4 text-center text-sm font-semibold text-gray-900 min-w-16">Q3<br />(5)</th>
                    <th className="px-2 py-4 text-center text-sm font-semibold text-gray-900 min-w-16">Q4<br />(5)</th>
                    <th className="px-2 py-4 text-center text-sm font-semibold text-gray-900 min-w-16">Q5<br />(5)</th>
                    <th className="px-2 py-4 text-center text-sm font-semibold text-gray-900 min-w-16">Q6<br />(9)</th>
                    <th className="px-2 py-4 text-center text-sm font-semibold text-gray-900 min-w-16">Q7<br />(9)</th>
                    <th className="px-2 py-4 text-center text-sm font-semibold text-gray-900 min-w-16">Q8<br />(9)</th>
                    <th className="px-2 py-4 text-center text-sm font-semibold text-gray-900 min-w-16">Q9<br />(12)</th>
                    <th className="px-3 py-4 text-center text-base font-semibold text-gray-900 bg-blue-50">Total</th>
                    <th className="px-3 py-4 text-center text-base font-semibold text-gray-900">Percentage</th>
                    <th className="px-3 py-4 text-center text-base font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-6 py-16 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No students found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const studentQmarks = questionMarks[student.id] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
                      const total = studentQmarks.reduce((sum, mark) => sum + (mark || 0), 0);
                      const percentage = selectedAssessment && total ? (total / totalMaxMarks) * 100 : 0;
                      const existingAssessment = studentAssessments.find(
                        sa => sa.studentId === student.id && sa.assessmentId === selectedAssessment?.id
                      );
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-4 text-base font-medium text-gray-900 sticky left-0 bg-white">{student.rollNumber}</td>
                          <td className="px-3 py-4 text-base text-gray-900 sticky left-16 bg-white">{student.name}</td>
                          {questionMaxMarks.map((maxMark, index) => (
                            <td key={index} className="px-2 py-3">
                              <input
                                type="number"
                                min="0"
                                max={maxMark}
                                value={studentQmarks[index] || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const newMarks = [...studentQmarks];
                                  newMarks[index] = value === '' ? 0 : Math.min(parseFloat(value) || 0, maxMark);
                                  
                                  const newQuestionMarks = { ...questionMarks, [student.id]: newMarks };
                                  const newTotal = newMarks.reduce((sum, mark) => sum + (mark || 0), 0);
                                  const newMarksData = { ...marksData, [student.id]: newTotal };
                                  
                                  setQuestionMarks(newQuestionMarks);
                                  setMarksData(newMarksData);
                                  
                                  // Auto-save to localStorage
                                  if (selectedAssessment) {
                                    autoSaveMarks(selectedAssessment.id, newMarksData, newQuestionMarks);
                                  }
                                }}
                                className="w-14 px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-sm"
                              />
                            </td>
                          ))}
                          <td className="px-3 py-4 text-center bg-blue-50">
                            <span className="font-bold text-lg text-blue-900">{total}/{totalMaxMarks}</span>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span className={`font-semibold text-lg ${
                              percentage >= 80 ? 'text-green-600' :
                              percentage >= 60 ? 'text-yellow-600' :
                              percentage > 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {total && total > 0 ? `${percentage.toFixed(1)}%` : '-'}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-center">
                            {existingAssessment ? (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                <Trophy className="w-3 h-3 mr-1" />
                                Evaluated
                              </span>
                            ) : total && total > 0 ? (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                Pending Save
                              </span>
                            ) : (
                              <span className="text-gray-500 text-sm">Not entered</span>
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