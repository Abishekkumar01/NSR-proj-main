import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, ClipboardList, Award } from 'lucide-react';
import { Assessment, Course, GAMapping } from '../types';
import { graduateAttributes } from '../data/graduateAttributes';
import { LocalStorageService } from '../lib/localStorage';

interface AssessmentManagementProps {
  assessments: Assessment[];
  courses: Course[];
  onAddAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => void;
  onUpdateAssessment: (id: string, assessment: Partial<Assessment>) => void;
  onDeleteAssessment: (id: string) => void;
}

export function AssessmentManagement({ 
  assessments, 
  courses, 
  onAddAssessment, 
  onUpdateAssessment, 
  onDeleteAssessment 
}: AssessmentManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '',
    assessments: [{
      type: 'Assignment' as Assessment['type'],
      maxMarks: 100,
      weightage: 100,
      gaMapping: [] as GAMapping[]
    }]
  });

  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [newCustomType, setNewCustomType] = useState('');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedAssessments = LocalStorageService.getAssessments();
    if (savedAssessments.length > 0) {
      // Update parent component with saved data
      savedAssessments.forEach(assessment => {
        if (!assessments.find(a => a.id === assessment.id)) {
          onAddAssessment(assessment);
        }
      });
    }
  }, []);

  // Save to localStorage whenever assessments change
  useEffect(() => {
    if (assessments.length > 0) {
      LocalStorageService.saveAssessments(assessments);
    }
  }, [assessments]);

  const assessmentTypes: Assessment['type'][] = ['Assignment', 'Quiz', 'Mid-Term', 'End-Term', 'Project', 'Lab', 'Presentation', 'Viva', 'Class Test', 'Practical', 'Seminar', 'Workshop'];
  const allAssessmentTypes = [...assessmentTypes, ...customTypes];

  const filteredAssessments = assessments.filter(assessment =>
    assessment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAssessment) {
      // For editing, we'll handle single assessment updates
      const assessmentData = formData.assessments[0];
      onUpdateAssessment(editingAssessment.id, {
        courseId: formData.courseId,
        courseName: formData.courseName,
        ...assessmentData
      });
    } else {
      // For new assessments, create multiple assessments for the same course
      formData.assessments.forEach(assessmentData => {
        onAddAssessment({
          courseId: formData.courseId,
          courseName: formData.courseName,
          name: assessmentData.type, // Use type as name
          ...assessmentData
        });
      });
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      courseName: '',
      assessments: [{
        type: 'Assignment',
        maxMarks: 100,
        weightage: 100,
        gaMapping: []
      }]
    });
    setEditingAssessment(null);
    setShowModal(false);
    setNewCustomType('');
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      courseId: assessment.courseId,
      courseName: assessment.courseName,
      assessments: [{
        type: assessment.type,
        maxMarks: assessment.maxMarks,
        weightage: assessment.weightage,
        gaMapping: assessment.gaMapping
      }]
    });
    setShowModal(true);
  };

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setFormData({
        ...formData,
        courseId,
        courseName: course.name
      });
    }
  };

  const addAssessmentType = () => {
    setFormData({
      ...formData,
      assessments: [...formData.assessments, {
        type: 'Assignment',
        maxMarks: 100,
        weightage: 100,
        gaMapping: []
      }]
    });
  };

  const addCustomType = () => {
    if (newCustomType.trim() && !customTypes.includes(newCustomType.trim()) && !assessmentTypes.includes(newCustomType.trim() as Assessment['type'])) {
      setCustomTypes([...customTypes, newCustomType.trim()]);
      setNewCustomType('');
    }
  };

  const removeCustomType = (typeToRemove: string) => {
    setCustomTypes(customTypes.filter(type => type !== typeToRemove));
    // Also remove this type from any assessments that are using it
    const updatedAssessments = formData.assessments.map(assessment => 
      assessment.type === typeToRemove ? { ...assessment, type: 'Assignment' } : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  const removeAssessmentType = (index: number) => {
    if (formData.assessments.length > 1) {
      setFormData({
        ...formData,
        assessments: formData.assessments.filter((_, i) => i !== index)
      });
    }
  };

  const updateAssessmentType = (index: number, field: string, value: any) => {
    const updatedAssessments = formData.assessments.map((assessment, i) => 
      i === index ? { ...assessment, [field]: value } : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  const addGAMapping = (assessmentIndex: number) => {
    const newMapping: GAMapping = {
      gaId: '',
      gaCode: '',
      gaName: '',
      weightage: 0,
      targetLevel: 'Introductory'
    };
    const updatedAssessments = formData.assessments.map((assessment, i) => 
      i === assessmentIndex 
        ? { ...assessment, gaMapping: [...assessment.gaMapping, newMapping] }
        : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  const updateGAMapping = (assessmentIndex: number, mappingIndex: number, mapping: Partial<GAMapping>) => {
    const updatedAssessments = formData.assessments.map((assessment, i) => 
      i === assessmentIndex 
        ? {
            ...assessment,
            gaMapping: assessment.gaMapping.map((ga, j) => 
              j === mappingIndex ? { ...ga, ...mapping } : ga
            )
          }
        : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  const removeGAMapping = (assessmentIndex: number, mappingIndex: number) => {
    const updatedAssessments = formData.assessments.map((assessment, i) => 
      i === assessmentIndex 
        ? {
            ...assessment,
            gaMapping: assessment.gaMapping.filter((_, j) => j !== mappingIndex)
          }
        : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  const handleGASelect = (assessmentIndex: number, mappingIndex: number, gaId: string) => {
    const ga = graduateAttributes.find(g => g.id === gaId);
    if (ga) {
      updateGAMapping(assessmentIndex, mappingIndex, {
        gaId,
        gaCode: ga.code,
        gaName: ga.name
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Assessment Management</h2>
          <p className="text-gray-600 mt-2">Create and manage course assessments with GA mappings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Assessment
        </button>
      </div>

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

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssessments.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No assessments found</p>
          </div>
        ) : (
          filteredAssessments.map((assessment) => (
            <div key={assessment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{assessment.type}</h3>
                  <p className="text-sm text-gray-600">{assessment.courseName}</p>
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {assessment.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(assessment)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteAssessment(assessment.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Marks:</span>
                  <span className="font-medium">{assessment.maxMarks}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Weightage:</span>
                  <span className="font-medium">{assessment.weightage}%</span>
                </div>
              </div>

              {assessment.gaMapping.length > 0 && (
                <div>
                  <div className="flex items-center mb-2">
                    <Award className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm font-medium text-gray-700">GA Mappings</span>
                  </div>
                  <div className="space-y-1">
                    {assessment.gaMapping.map((ga, index) => (
                      <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                        <span className="font-medium text-gray-700">{ga.gaCode}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">{ga.weightage}%</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ga.targetLevel === 'Advanced' ? 'bg-green-100 text-green-800' :
                            ga.targetLevel === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {ga.targetLevel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAssessment ? 'Edit Assessment' : 'Add New Assessment'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multiple Assessment Types */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Assessment Types</label>
                  {!editingAssessment && (
                    <button
                      type="button"
                      onClick={addAssessmentType}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Assessment Type
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {formData.assessments.map((assessment, assessmentIndex) => (
                    <div key={assessmentIndex} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          Assessment Type {assessmentIndex + 1}
                        </h4>
                        {!editingAssessment && formData.assessments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAssessmentType(assessmentIndex)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
                          <select
                            required
                            value={assessment.type}
                            onChange={(e) => updateAssessmentType(assessmentIndex, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            {allAssessmentTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Add Custom Type</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={newCustomType}
                              onChange={(e) => setNewCustomType(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Enter custom type"
                            />
                            <button
                              type="button"
                              onClick={addCustomType}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Add
                            </button>
                          </div>
                          
                          {/* Custom Types List */}
                          {customTypes.length > 0 && (
                            <div className="mt-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Custom Types:</label>
                              <div className="flex flex-wrap gap-1">
                                {customTypes.map((customType) => (
                                  <div key={customType} className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                                    <span>{customType}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeCustomType(customType)}
                                      className="text-orange-600 hover:text-orange-800 ml-1"
                                      title="Remove custom type"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={assessment.maxMarks}
                            onChange={(e) => updateAssessmentType(assessmentIndex, 'maxMarks', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Weightage (%)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="100"
                            value={assessment.weightage}
                            onChange={(e) => updateAssessmentType(assessmentIndex, 'weightage', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>

                      {/* GA Mappings for this assessment type */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">Graduate Attributes Mapping</label>
                          <button
                            type="button"
                            onClick={() => addGAMapping(assessmentIndex)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            + Add GA Mapping
                          </button>
                        </div>

                        <div className="space-y-3">
                          {assessment.gaMapping.map((mapping, mappingIndex) => (
                            <div key={mappingIndex} className="bg-white p-3 rounded-lg border">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Graduate Attribute</label>
                                  <select
                                    required
                                    value={mapping.gaId}
                                    onChange={(e) => handleGASelect(assessmentIndex, mappingIndex, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  >
                                    <option value="">Select GA</option>
                                    {graduateAttributes.map((ga) => (
                                      <option key={ga.id} value={ga.id}>
                                        {ga.code} - {ga.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Weightage (%)</label>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    max="100"
                                    value={mapping.weightage}
                                    onChange={(e) => updateGAMapping(assessmentIndex, mappingIndex, { weightage: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Target Level</label>
                                  <select
                                    required
                                    value={mapping.targetLevel}
                                    onChange={(e) => updateGAMapping(assessmentIndex, mappingIndex, { targetLevel: e.target.value as 'Introductory' | 'Intermediate' | 'Advanced' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  >
                                    <option value="Introductory">Introductory</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                  </select>
                                </div>
                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    onClick={() => removeGAMapping(assessmentIndex, mappingIndex)}
                                    className="text-red-600 hover:text-red-800 p-2 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAssessment ? 'Update' : 'Create'} Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}