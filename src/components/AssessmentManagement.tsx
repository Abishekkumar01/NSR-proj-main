import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, ClipboardList, Award } from 'lucide-react';
import { Assessment, Course, GAMapping, COMapping, POMapping, Student } from '../types';
import { schools } from '../data/schools';
import { graduateAttributes } from '../data/graduateAttributes';
import { LocalStorageService } from '../lib/localStorage';

interface AssessmentManagementProps {
  assessments: Assessment[];
  courses: Course[];
  onAddAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => void;
  onUpdateAssessment: (id: string, assessment: Partial<Assessment>) => void;
  onDeleteAssessment: (id: string) => void;
  students?: Student[];
}

// Helper functions for varied weightages
function getVariedCOWeightage(courseId: string, coIndex: number, totalCOs: number, assessmentType: string): number {
  const seed = courseId.charCodeAt(courseId.length - 1) + coIndex + assessmentType.charCodeAt(0);
  const random = (seed * 9301 + 49297) % 233280 / 233280;
  
  const baseWeightage = {
    'Quiz': 15,
    'Assignment': 18,
    'Mid-Term': 20,
    'End-Term': 22
  }[assessmentType] || 20;
  
  const variation = (random - 0.5) * 10;
  const weightage = baseWeightage + variation;
  
  return Math.max(10, Math.min(30, Math.floor(weightage)));
}

function getVariedPOWeightage(courseId: string, poIndex: number, assessmentType: string): number {
  const seed = courseId.charCodeAt(courseId.length - 1) + poIndex + assessmentType.charCodeAt(0);
  const random = (seed * 9301 + 49297) % 233280 / 233280;
  
  const baseWeightage = {
    'Quiz': 6,
    'Assignment': 7,
    'Mid-Term': 8,
    'End-Term': 9
  }[assessmentType] || 7;
  
  const variation = (random - 0.5) * 4;
  const weightage = baseWeightage + variation;
  
  return Math.max(4, Math.min(12, Math.floor(weightage)));
}

export function AssessmentManagement({ 
  assessments, 
  courses, 
  onAddAssessment, 
  onUpdateAssessment, 
  onDeleteAssessment,
  students = []
}: AssessmentManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSchoolId, setFilterSchoolId] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterBatch, setFilterBatch] = useState<string>('');
  const [filterSection, setFilterSection] = useState<string>('');
  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '',
    assessments: [{
      type: 'Assignment' as Assessment['type'],
      maxMarks: 100,
      weightage: 100,
      gaMapping: [] as GAMapping[],
      coMapping: [] as COMapping[],
      poMapping: [] as POMapping[]
    }]
  });

  // Custom assessment types removed to align with strict type union

  // Default to GA mapping; picker removed
  const [mappingMode] = useState<'GA' | 'CO' | 'PO'>('GA');

  // CO options synced from Course Management per department
  const [coOptions, setCoOptions] = useState<{ coCode: string; coName: string }[]>([]);
  const [poOptions, setPoOptions] = useState<{ poCode: string; poName: string }[]>([]);

  // End-Term CO grid state per assessment index
  // marks: nullable numbers; coSelections: array of selected CO codes per box
  const [endTermCO, setEndTermCO] = useState<Record<number, { marks: (number | null)[]; coSelections: string[][] }>>({});
  const [openCOSelectorIndex, setOpenCOSelectorIndex] = useState<Record<number, number | null>>({});
  // End term helper visibility removed

  const ensureEndTermGrid = (assessmentIndex: number) => {
    setEndTermCO((prev) => {
      if (prev[assessmentIndex]) return prev;
      
      // Initialize with proper marks distribution and random empty boxes
      // Structure: 5 questions of 5 marks each (attempt 4, 1 optional) + 3 questions of 9 marks each (attempt 2, 1 optional) + 1 compulsory 12 mark question = 50 total attempted
      const marksDistribution = [5, 5, 5, 5, 5, 9, 9, 9, 12];
      const marks = Array(9).fill(null);
      const coSelections = Array(9).fill(0).map(() => []);
      
      // Randomly leave one box empty from first 5 (5-mark questions) - attempt 4, 1 optional
      const emptyBox5 = Math.floor(Math.random() * 5);
      marks[emptyBox5] = null;
      
      // Randomly leave one box empty from next 3 (9-mark questions) - attempt 2, 1 optional
      const emptyBox9 = 5 + Math.floor(Math.random() * 3);
      marks[emptyBox9] = null;
      
      // Question 9 (12 marks) is compulsory, so leave it as is
      
      // Auto-assign COs to the boxes
      if (coOptions.length > 0) {
        const availableCOs = [...coOptions];
        const shuffledCOs = availableCOs.sort(() => Math.random() - 0.5);
        
        // Assign COs to each box (except empty ones)
        for (let i = 0; i < 9; i++) {
          if (marks[i] !== null) {
            const coIndex = i % shuffledCOs.length;
            coSelections[i] = [shuffledCOs[coIndex].coCode];
          }
        }
      }
      
      return { ...prev, [assessmentIndex]: { marks, coSelections } };
    });
  };

  // PO mapping removed from assessment level

  const removeCOOption = (codeToRemove: string) => {
    setCoOptions(coOptions.filter(o => o.coCode !== codeToRemove));
    // Clear any mappings that referenced this CO
    const updated = formData.assessments.map(a => ({
      ...a,
      coMapping: a.coMapping.filter(m => m.coCode !== codeToRemove)
    }));
    setFormData({ ...formData, assessments: updated });
  };

  // PO options/mapping removed

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedAssessments = LocalStorageService.getAssessments();
    if (savedAssessments.length > 0) {
      // Fix existing End-Term assessments with wrong maxMarks
      const fixedAssessments = savedAssessments.map(assessment => {
        if (assessment.type === 'End-Term' && assessment.maxMarks === 100) {
          return { ...assessment, maxMarks: 50 };
        }
        return assessment;
      });
      
      // Update parent component with saved data
      fixedAssessments.forEach(assessment => {
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

  const assessmentTypes: Assessment['type'][] = ['Assignment', 'Quiz', 'Mid-Term', 'End-Term', 'Project', 'Lab', 'Presentation'];
  const allAssessmentTypes = [...assessmentTypes];

  // Derived option lists
  const departmentsForSelectedSchool = React.useMemo(() => {
    if (!filterSchoolId) return [] as string[];
    const s = schools.find(x => x.id === filterSchoolId);
    return s?.departments || [];
  }, [filterSchoolId]);

  const batchesForSelection = React.useMemo(() => {
    // From courses matching selected school/department
    const bySchool = filterSchoolId
      ? courses.filter(c => {
          const s = schools.find(x => x.id === filterSchoolId);
          return s ? (s.name === (c.school || '')) : false;
        })
      : [] as Course[];
    const byDept = filterDepartment
      ? bySchool.filter(c => c.department === filterDepartment)
      : bySchool;
    return Array.from(new Set(byDept.map(c => c.batch).filter(Boolean))) as string[];
  }, [filterSchoolId, filterDepartment, courses]);

  const sectionsForSelection = React.useMemo(() => {
    if (!filterSchoolId) return [] as string[];
    // Sections from students under selected school/department/batch
    let list = students;
    const s = schools.find(x => x.id === filterSchoolId);
    if (s) {
      list = list.filter(st => (st.school || '') === s.name);
    }
    if (filterDepartment) list = list.filter(st => st.department === filterDepartment);
    if (filterBatch) list = list.filter(st => st.batch === filterBatch);
    return Array.from(new Set(list.map(st => st.section).filter(Boolean))) as string[];
  }, [students, filterSchoolId, filterDepartment, filterBatch]);

  // Apply filters to assessments, then search
  const filteredAssessments = assessments
    .filter(a => {
      if (filterSchoolId) {
        const s = schools.find(x => x.id === filterSchoolId);
        if (s && a.school !== s.name) return false;
      }
      if (filterDepartment && a.department !== filterDepartment) return false;
      if (filterBatch) {
        const course = courses.find(c => c.id === a.courseId);
        if ((course?.batch || '') !== filterBatch) return false;
      }
      // Section filter is not strictly linked to assessments; skip filtering by section
      return true;
    })
    .filter(assessment =>
      assessment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.courseName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Group filtered assessments by course to render a single card per course
  const assessmentsByCourse = filteredAssessments.reduce<Record<string, Assessment[]>>((grouped, assessment) => {
    if (!grouped[assessment.courseId]) {
      grouped[assessment.courseId] = [];
    }
    grouped[assessment.courseId].push(assessment);
    return grouped;
  }, {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAssessment) {
      // For editing, we'll handle single assessment updates
      const assessmentData = formData.assessments[0];
      const updateData: any = {
        courseId: formData.courseId,
        courseName: formData.courseName,
        ...assessmentData
      };
      
      // Include End-Term CO marks if it's an End-Term assessment
      if (assessmentData.type === 'End-Term' && endTermCO[0]) {
        updateData.endTermCOMarks = {
          marks: endTermCO[0].marks,
          coSelections: endTermCO[0].coSelections
        };
      }
      
      onUpdateAssessment(editingAssessment.id, updateData);
    } else {
      // For new assessments, create multiple assessments for the same course
      formData.assessments.forEach((assessmentData, index) => {
        const addData: any = {
          courseId: formData.courseId,
          courseName: formData.courseName,
          name: assessmentData.type, // Use type as name
          ...assessmentData
        };
        
        // Include End-Term CO marks if it's an End-Term assessment
        if (assessmentData.type === 'End-Term' && endTermCO[index]) {
          addData.endTermCOMarks = {
            marks: endTermCO[index].marks,
            coSelections: endTermCO[index].coSelections
          };
        }
        
        onAddAssessment(addData);
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
        gaMapping: [],
        coMapping: [],
        poMapping: []
      }]
    });
    setEditingAssessment(null);
    setShowModal(false);
    // picker removed
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
        gaMapping: assessment.gaMapping || [],
        coMapping: assessment.coMapping || [],
        poMapping: assessment.poMapping || [],
        
      }]
    });
    // Load CO/PO options for the course's department so the selects are populated while editing
    const course = courses.find(c => c.id === assessment.courseId);
    const department = assessment.department || course?.department || '';
    if (department) {
      const deptCOs = LocalStorageService.getCOOptions(department) || [];
      setCoOptions(deptCOs);
      const deptPOs = LocalStorageService.getPOOptions(department) || [];
      setPoOptions(deptPOs);
    } else {
      setCoOptions([]);
      setPoOptions([]);
    }
    // Initialize End-Term grid when editing End-Term
    if (assessment.type === 'End-Term') {
      ensureEndTermGrid(0);
      // Load existing End-Term CO marks if available
      if (assessment.endTermCOMarks) {
        setEndTermCO(prev => ({
          ...prev,
          [0]: {
            marks: assessment.endTermCOMarks!.marks,
            coSelections: assessment.endTermCOMarks!.coSelections
          }
        }));
      }
    }
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
      if (course.department) {
        const deptCOs = LocalStorageService.getCOOptions(course.department) || [];
        setCoOptions(deptCOs);
        const deptPOs = LocalStorageService.getPOOptions(course.department) || [];
        setPoOptions(deptPOs);
        
        // Auto-populate all COs and POs for the first assessment
        const updatedAssessments = formData.assessments.map((assessment, index) => {
          if (index === 0) {
            // Auto-populate all COs with varied weightage
            const coMappings: COMapping[] = deptCOs.map((co, coIndex) => ({
              coCode: co.coCode,
              coName: co.coName,
              weightage: getVariedCOWeightage(courseId, coIndex, deptCOs.length, assessment.type)
            }));
            
            // Auto-populate all POs with varied low weightage (4-12% each)
            const poMappings: POMapping[] = deptPOs.map((po, poIndex) => ({
              poCode: po.poCode,
              poName: po.poName,
              weightage: getVariedPOWeightage(courseId, poIndex, assessment.type)
            }));
            
            return {
              ...assessment,
              coMapping: coMappings,
              poMapping: poMappings
            };
          }
          return assessment;
        });
        
        setFormData({
          ...formData,
          courseId,
          courseName: course.name,
          assessments: updatedAssessments
        });
      }
    }
  };

  // Load CO and PO options when modal opens and course is selected
  useEffect(() => {
    if (showModal && formData.courseId) {
      const course = courses.find(c => c.id === formData.courseId);
      if (course && course.department) {
        const deptCOs = LocalStorageService.getCOOptions(course.department) || [];
        setCoOptions(deptCOs);
        const deptPOs = LocalStorageService.getPOOptions(course.department) || [];
        setPoOptions(deptPOs);
        
        // Auto-populate COs and POs if they're empty
        const updatedAssessments = formData.assessments.map((assessment, index) => {
          if (assessment.coMapping.length === 0 && assessment.poMapping.length === 0) {
            // Auto-populate all COs with varied weightage
            const coMappings: COMapping[] = deptCOs.map((co, coIndex) => ({
              coCode: co.coCode,
              coName: co.coName,
              weightage: getVariedCOWeightage(formData.courseId, coIndex, deptCOs.length, assessment.type)
            }));
            
            // Auto-populate all POs with varied low weightage (4-12% each)
            const poMappings: POMapping[] = deptPOs.map((po, poIndex) => ({
              poCode: po.poCode,
              poName: po.poName,
              weightage: getVariedPOWeightage(formData.courseId, poIndex, assessment.type)
            }));
            
            return {
              ...assessment,
              coMapping: coMappings,
              poMapping: poMappings
            };
          }
          return assessment;
        });
        
        setFormData(prev => ({
          ...prev,
          assessments: updatedAssessments
        }));
      }
    }
  }, [showModal, formData.courseId, courses]);

  const addAssessmentType = () => {
    setFormData({
      ...formData,
      assessments: [...formData.assessments, {
        type: 'Assignment',
        maxMarks: 100,
        weightage: 100,
        gaMapping: [],
        coMapping: [],
        poMapping: []
      }]
    });
  };

  // Custom type add/remove removed

  const removeAssessmentType = (index: number) => {
    if (formData.assessments.length > 1) {
      setFormData({
        ...formData,
        assessments: formData.assessments.filter((_, i) => i !== index)
      });
    }
  };

  const updateAssessmentType = (index: number, field: string, value: any) => {
    const updatedAssessments = formData.assessments.map((assessment, i) => {
      if (i === index) {
        const updatedAssessment = { ...assessment, [field]: value };
        // Auto-set maxMarks to 50 for End-Term assessments (students attempt 7 out of 9 questions)
        if (field === 'type' && value === 'End-Term') {
          updatedAssessment.maxMarks = 50;
        }
        return updatedAssessment;
      }
      return assessment;
    });
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

  // CO mapping helpers
  const addCOMapping = (assessmentIndex: number) => {
    const newMapping: COMapping = {
      coCode: '',
      coName: '',
      weightage: 0
    };
    const updatedAssessments = formData.assessments.map((assessment, i) => 
      i === assessmentIndex 
        ? { ...assessment, coMapping: [...assessment.coMapping, newMapping] }
        : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  const updateCOMapping = (assessmentIndex: number, mappingIndex: number, mapping: Partial<COMapping>) => {
    const updatedAssessments = formData.assessments.map((assessment, i) => 
      i === assessmentIndex 
        ? {
            ...assessment,
            coMapping: assessment.coMapping.map((co, j) => 
              j === mappingIndex ? { ...co, ...mapping } : co
            )
          }
        : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  const removeCOMapping = (assessmentIndex: number, mappingIndex: number) => {
    const updatedAssessments = formData.assessments.map((assessment, i) => 
      i === assessmentIndex 
        ? {
            ...assessment,
            coMapping: assessment.coMapping.filter((_, j) => j !== mappingIndex)
          }
        : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  // PO mapping helpers
  const addPOMapping = (assessmentIndex: number) => {
    const newMapping: POMapping = { poCode: '', poName: '', weightage: 0 };
    const updatedAssessments = formData.assessments.map((assessment, i) =>
      i === assessmentIndex
        ? { ...assessment, poMapping: [...(assessment.poMapping || []), newMapping] }
        : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  const updatePOMapping = (assessmentIndex: number, mappingIndex: number, mapping: Partial<POMapping>) => {
    const updatedAssessments = formData.assessments.map((assessment, i) =>
      i === assessmentIndex
        ? {
            ...assessment,
            poMapping: (assessment.poMapping || []).map((po, j) => (j === mappingIndex ? { ...po, ...mapping } : po))
          }
        : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  const removePOMapping = (assessmentIndex: number, mappingIndex: number) => {
    const updatedAssessments = formData.assessments.map((assessment, i) =>
      i === assessmentIndex
        ? { ...assessment, poMapping: (assessment.poMapping || []).filter((_, j) => j !== mappingIndex) }
        : assessment
    );
    setFormData({ ...formData, assessments: updatedAssessments });
  };

  // PO mapping removed

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
          <p className="text-gray-600 mt-2">Create and manage course assessments with mappings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Assessment
        </button>
      </div>

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

      {/* Assessments grouped by Course */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.keys(assessmentsByCourse).length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No assessments found</p>
          </div>
        ) : (
          Object.entries(assessmentsByCourse).map(([courseId, courseAssessments]) => {
            const courseName = courseAssessments[0]?.courseName || '';
            return (
              <div key={courseId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">{courseName}</h3>
                  <p className="text-sm text-gray-600">Assessments</p>
                </div>

                <div className="space-y-4">
                  {courseAssessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {assessment.type}
                            </span>
                            <span className="text-xs text-gray-500">Max: {assessment.maxMarks}</span>
                            <span className="text-xs text-gray-500">Weightage: {assessment.weightage}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(assessment)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Edit assessment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteAssessment(assessment.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Delete assessment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {assessment.gaMapping.length > 0 && (
                        <div className="mt-3">
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

                      {(assessment.coMapping && assessment.coMapping.length > 0) && (
                        <div className="mt-3">
                          <div className="flex items-center mb-2">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] mr-1">CO</span>
                            <span className="text-sm font-medium text-gray-700">CO Mappings</span>
                          </div>
                          <div className="space-y-1">
                            {assessment.coMapping.map((co, index) => (
                              <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                <span className="font-medium text-gray-700">{co.coCode}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">{co.weightage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(assessment.poMapping && assessment.poMapping.length > 0) && (
                        <div className="mt-3">
                          <div className="flex items-center mb-2">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] mr-1">PO</span>
                            <span className="text-sm font-medium text-gray-700">PO Mappings</span>
                          </div>
                          <div className="space-y-1">
                            {assessment.poMapping.map((po, index) => (
                              <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                <span className="font-medium text-gray-700">{po.poCode}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">{po.weightage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mapping type selector removed */}

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
              {/* Context */}
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
                        <div></div>
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

                      {/* Mapping Section (GA / CO / PO) */}
                      {/* Enclosing container for GA+CO sections */}
                      <div>
                      {mappingMode === 'GA' && (
                        <div onLoad={() => { if (assessment.type === 'End-Term') ensureEndTermGrid(assessmentIndex); }}>
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
                      )}

                      {/* CO Mapping (End-Term only UI) */}
                      <div>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Course Outcomes Mapping</label>
                              {coOptions.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">
                                  No COs available. Create COs in Course Management first.
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => addCOMapping(assessmentIndex)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              + Add CO Mapping
                            </button>
                          </div>

                          {/* End-Term single-row grid (only visible when End-Term) */}

                          {assessment.type === 'End-Term' && (
                            <div className="bg-white p-3 rounded-lg border mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">End-Term CO Marks</label>
                              <div className="grid grid-cols-10 gap-2">
                                {Array.from({ length: 10 }).map((_, i) => {
                                  if (i === 9) {
                                    // Total marks box - show 50 as maxMarks (students attempt 7 out of 9 questions)
                                    const totalMarks = endTermCO[assessmentIndex]?.marks.slice(0, 9).reduce((sum, mark) => sum + (mark || 0), 0) || 0;
                                    return (
                                      <div key={i} className="relative">
                                        <div className="w-full h-10 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                                          Total: {totalMarks}/50
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  const maxByBox = [5,5,5,5,5,9,9,9,12][i];
                                  const current = endTermCO[assessmentIndex]?.marks[i] ?? null;
                                  const isOpen = openCOSelectorIndex[assessmentIndex] === i;
                                  return (
                                    <div key={i} className="relative">
                                      <input
                                        type="number"
                                        min="0"
                                        max={maxByBox}
                                        value={current === null ? '' : current}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? null : Math.max(0, Math.min(maxByBox, parseInt(e.target.value)));
                                          setEndTermCO(prev => {
                                            const grid = prev[assessmentIndex] || { marks: Array(9).fill(null), coSelections: Array(9).fill(0).map(() => []) };
                                            const marks = [...grid.marks];
                                            marks[i] = isNaN(val as any) ? null : (val as number | null);
                                            return { ...prev, [assessmentIndex]: { ...grid, marks } };
                                          });
                                        }}
                                        placeholder={`${maxByBox}`}
                                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-center"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setOpenCOSelectorIndex(prev => ({ ...prev, [assessmentIndex]: isOpen ? null : i }))}
                                        className="mt-1 w-full text-[11px] px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                                      >
                                        + CO
                                      </button>
                                      {isOpen && (
                                        <div className="absolute z-10 mt-1 w-40 max-h-40 overflow-auto bg-white border border-gray-200 rounded shadow">
                                          <div className="p-2 space-y-1">
                                            {coOptions.length === 0 && (
                                              <div className="text-xs text-gray-500">No COs found. Create COs in Course Management first.</div>
                                            )}
                                            {coOptions.map(o => {
                                              const selectedList = endTermCO[assessmentIndex]?.coSelections[i] || [];
                                              const checked = selectedList.includes(o.coCode);
                                              return (
                                                <label key={o.coCode} className="flex items-center gap-2 text-xs cursor-pointer">
                                                  <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                      setEndTermCO(prev => {
                                                        const grid = prev[assessmentIndex] || { marks: Array(9).fill(null), coSelections: Array(9).fill(0).map(() => []) };
                                                        const coSelections = grid.coSelections.map(arr => [...arr]);
                                                        const list = new Set(coSelections[i] || []);
                                                        if (e.target.checked) list.add(o.coCode); else list.delete(o.coCode);
                                                        coSelections[i] = Array.from(list);
                                                        return { ...prev, [assessmentIndex]: { ...grid, coSelections } };
                                                      });
                                                    }}
                                                  />
                                                  <span>{o.coCode}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 text-sm text-gray-700">
                                Total entered: {
                                  (() => {
                                    const marks = endTermCO[assessmentIndex]?.marks || [];
                                    let sum = 0;
                                    for (const v of marks) sum += typeof v === 'number' ? v : 0;
                                    return `${sum}`;
                                  })()
                                }
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            {assessment.coMapping.map((mapping, mappingIndex) => (
                              <div key={mappingIndex} className="bg-white p-3 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Select CO</label>
                                    <select
                                      value={mapping.coCode}
                                      onChange={(e) => {
                                        const selected = coOptions.find(o => o.coCode === e.target.value);
                                        updateCOMapping(assessmentIndex, mappingIndex, { coCode: selected?.coCode || '', coName: selected?.coName || '' });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                      <option value="">
                                        {coOptions.length === 0 
                                          ? "No COs available - Create in Course Management" 
                                          : "Select CO"
                                        }
                                      </option>
                                      {coOptions.map((o) => (
                                        <option key={o.coCode} value={o.coCode}>{o.coCode} - {o.coName}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Weightage (%)</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={mapping.weightage}
                                      onChange={(e) => updateCOMapping(assessmentIndex, mappingIndex, { weightage: parseInt(e.target.value) })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <button
                                      type="button"
                                      onClick={() => removeCOMapping(assessmentIndex, mappingIndex)}
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

                        {/* PO Mapping */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Program Outcomes Mapping</label>
                              {poOptions.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">
                                  No POs available. Create POs in Course Management first.
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => addPOMapping(assessmentIndex)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              + Add PO Mapping
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(assessment.poMapping || []).map((mapping, mappingIndex) => (
                              <div key={mappingIndex} className="bg-white p-3 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Select PO</label>
                                    <select
                                      value={mapping.poCode}
                                      onChange={(e) => {
                                        const selected = poOptions.find(o => o.poCode === e.target.value);
                                        updatePOMapping(assessmentIndex, mappingIndex, { poCode: selected?.poCode || '', poName: selected?.poName || '' });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                      <option value="">
                                        {poOptions.length === 0 
                                          ? "No POs available - Create in Course Management" 
                                          : "Select PO"
                                        }
                                      </option>
                                      {poOptions.map((o) => (
                                        <option key={o.poCode} value={o.poCode}>{o.poCode} - {o.poName}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Weightage (%)</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={mapping.weightage}
                                      onChange={(e) => updatePOMapping(assessmentIndex, mappingIndex, { weightage: parseInt(e.target.value) })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <button
                                      type="button"
                                      onClick={() => removePOMapping(assessmentIndex, mappingIndex)}
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