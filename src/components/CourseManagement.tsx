import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, School } from 'lucide-react';
import { Course } from '../types';
import { schools, School as SchoolType } from '../data/schools';
import { LocalStorageService } from '../lib/localStorage';

interface CourseManagementProps {
  courses: Course[];
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  onUpdateCourse: (id: string, course: Partial<Course>) => void;
  onDeleteCourse: (id: string) => void;
}

export function CourseManagement({ courses, onAddCourse, onUpdateCourse, onDeleteCourse }: CourseManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  // Local schools list that can be extended by Admin (e.g., add Pharmacy)
  const [localSchools, setLocalSchools] = useState<SchoolType[]>(schools);
  const [showAddSchoolForm, setShowAddSchoolForm] = useState(false);
  const [newSchool, setNewSchool] = useState({
    shortName: '',
    fullName: '',
    departmentsText: ''
  });
  const [showEditSchoolModal, setShowEditSchoolModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
  const [editSchoolForm, setEditSchoolForm] = useState({
    shortName: '',
    fullName: '',
    departmentsText: ''
  });
  const [showDeleteSchoolModal, setShowDeleteSchoolModal] = useState(false);
  const [schoolIdPendingDelete, setSchoolIdPendingDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: '',
    batch: '',
    semester: 1,
    credits: 3,
    facultyId: '',
    facultyName: '',
    // PO mapping fields
    poOptions: [] as { poCode: string; poName: string }[],
    selectedPOs: [] as string[]
  });

  // CO management modal
  const [showCOCreateModal, setShowCOCreateModal] = useState(false);
  const [coOptions, setCoOptions] = useState<{ coCode: string; coName: string }[]>([]);
  const [newCO, setNewCO] = useState({ coCode: '', coName: '' });
  const [coDeptOverride, setCoDeptOverride] = useState('');
  const [editingCOIndex, setEditingCOIndex] = useState<number | null>(null);
  const [editCOForm, setEditCOForm] = useState<{ coCode: string; coName: string }>({ coCode: '', coName: '' });

  // Local PO option entry helpers (manual add)
  const [newPO, setNewPO] = useState({ poCode: '', poName: '' });
  // No selection dropdown state now
  const [showPOManagementModal, setShowPOManagementModal] = useState(false);
  const [poMgmtOptions, setPoMgmtOptions] = useState<{ poCode: string; poName: string }[]>([]);
  const [editingPOIndex, setEditingPOIndex] = useState<number | null>(null);
  const [editPOForm, setEditPOForm] = useState<{ poCode: string; poName: string }>({ poCode: '', poName: '' });

  // Batch options
  const [batchOptions, setBatchOptions] = useState<string[]>([]);
  const [newBatch, setNewBatch] = useState('');

  // Advanced filters (must be declared before effects that reference them)
  const [filterSchoolId, setFilterSchoolId] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCourses = LocalStorageService.getCourses();
    if (savedCourses.length > 0) {
      // Update parent component with saved data
      savedCourses.forEach(course => {
        if (!courses.find(c => c.id === course.id)) {
          onAddCourse(course);
        }
      });
    }
  }, []);

  // Whenever department changes while modal is active, load that department's batches
  useEffect(() => {
    if (showModal && formData.department) {
      const batches = LocalStorageService.getBatchOptions(formData.department) || [];
      setBatchOptions(batches);
    }
  }, [showModal, formData.department]);

  // Save to localStorage whenever courses change
  useEffect(() => {
    if (courses.length > 0) {
      LocalStorageService.saveCourses(courses);
    }
  }, [courses]);

  // Load global PO options for department when form opens or department changes
  useEffect(() => {
    if (showModal && formData.department) {
      const globalPOs = LocalStorageService.getPOOptions(formData.department) || [];
      if (globalPOs.length > 0) {
        setFormData(prev => ({ ...prev, poOptions: globalPOs }));
      }
    }
  }, [showModal, formData.department]);

  // Load PO options for selected filter department when opening management modal
  useEffect(() => {
    if (showPOManagementModal && filterDepartment) {
      const ops = LocalStorageService.getPOOptions(filterDepartment) || [];
      setPoMgmtOptions(ops);
    }
  }, [showPOManagementModal, filterDepartment]);

  // Keep selected POs consistent with available options
  useEffect(() => {
    if (formData.selectedPOs && formData.selectedPOs.length > 0) {
      const availableCodes = new Set(formData.poOptions.map(o => o.poCode));
      const pruned = formData.selectedPOs.filter(code => availableCodes.has(code));
      if (pruned.length !== formData.selectedPOs.length) {
        setFormData(prev => ({ ...prev, selectedPOs: pruned }));
      }
    }
  }, [formData.poOptions]);

  const departmentListForSelectedSchool = useMemo(() => {
    if (!filterSchoolId) return [] as string[];
    const school = schools.find(s => s.id === filterSchoolId);
    return school?.departments || [];
  }, [filterSchoolId]);

  const filteredCourses = useMemo(() => {
    let base: Course[] = courses;

    // If a school is selected, restrict departments to that school's departments
    if (filterSchoolId) {
      const school = schools.find(s => s.id === filterSchoolId);
      const allowedDepartments = school?.departments || [];
      base = base.filter(c => allowedDepartments.includes(c.department));
    } else {
      // If no school chosen for advanced filter, show nothing to match spec
      base = [] as Course[];
    }

    if (filterDepartment) {
      base = base.filter(c => c.department === filterDepartment);
    }

    // Keep existing search behavior
    return base.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.department.toLowerCase().includes(searchTerm.toLowerCase())
  );
  }, [courses, filterSchoolId, filterDepartment, searchTerm]);

  const handleSchoolSelect = (school: SchoolType) => {
    setSelectedSchool(school);
    setSelectedDepartment('');
    setShowSchoolModal(false);
  };

  const handleDepartmentSelect = (department: string) => {
    setSelectedDepartment(department);
    // when changing department, load that department's PO options
    const deptPOs = LocalStorageService.getPOOptions(department) || [];
    setFormData({ ...formData, department, poOptions: deptPOs });
    // load COs for department
    const deptCOs = LocalStorageService.getCOOptions(department) || [];
    setCoOptions(deptCOs);
    // load Batches for department
    const deptBatches = LocalStorageService.getBatchOptions(department) || [];
    setBatchOptions(deptBatches);
    setShowModal(true);
  };

  // When opening CO modal or changing department input, load that department's COs
  useEffect(() => {
    if (showCOCreateModal) {
      const dept = coDeptOverride || formData.department;
      if (dept) {
        const existing = LocalStorageService.getCOOptions(dept) || [];
        setCoOptions(existing);
      }
    }
  }, [showCOCreateModal, coDeptOverride, formData.department]);


  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const handleSaveNewSchool = (e: React.FormEvent) => {
    e.preventDefault();
    const short = newSchool.shortName.trim();
    const full = newSchool.fullName.trim();
    const departments = newSchool.departmentsText
      .split(/\n|,/)
      .map((d) => d.trim())
      .filter(Boolean);

    if (!short || !full || departments.length === 0) return;

    const id = slugify(short);
    const schoolObj: SchoolType = {
      id,
      name: short,
      fullName: full,
      departments
    };

    setLocalSchools((prev) => [...prev, schoolObj]);
    setShowAddSchoolForm(false);
    setNewSchool({ shortName: '', fullName: '', departmentsText: '' });
    // Immediately proceed to department selection for the new school
    setSelectedSchool(schoolObj);
  };

  const openEditSchool = (school: SchoolType) => {
    setEditingSchool(school);
    setEditSchoolForm({
      shortName: school.name,
      fullName: school.fullName,
      departmentsText: school.departments.join('\n')
    });
    setShowEditSchoolModal(true);
  };

  const handleUpdateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    const short = editSchoolForm.shortName.trim();
    const full = editSchoolForm.fullName.trim();
    const departments = editSchoolForm.departmentsText
      .split(/\n|,/)
      .map((d) => d.trim())
      .filter(Boolean);
    if (!short || !full || departments.length === 0) return;
    const updated: SchoolType = {
      id: editingSchool.id,
      name: short,
      fullName: full,
      departments
    };
    setLocalSchools((prev) => prev.map((s) => (s.id === editingSchool.id ? updated : s)));
    // If the selected school was edited, update reference
    if (selectedSchool && selectedSchool.id === editingSchool.id) {
      setSelectedSchool(updated);
      // If previously selected department no longer exists, clear it
      if (!updated.departments.includes(selectedDepartment)) {
        setSelectedDepartment('');
      }
    }
    setShowEditSchoolModal(false);
    setEditingSchool(null);
  };

  const requestDeleteSchool = (school: SchoolType) => {
    setSchoolIdPendingDelete(school.id);
    setShowDeleteSchoolModal(true);
  };

  const confirmDeleteSchool = () => {
    if (!schoolIdPendingDelete) return;
    const id = schoolIdPendingDelete;
    setLocalSchools((prev) => prev.filter((s) => s.id !== id));
    // Clear selections if they reference the deleted school
    if (selectedSchool && selectedSchool.id === id) {
      setSelectedSchool(null);
      setSelectedDepartment('');
      setFormData({ ...formData, department: '' });
    }
    setShowDeleteSchoolModal(false);
    setSchoolIdPendingDelete(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist course-specific CO options with the course
    const coursePayload = { ...formData, coOptions } as any;
    if (editingCourse) {
      onUpdateCourse(editingCourse.id, coursePayload);
    } else {
      onAddCourse(coursePayload);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      department: '',
      batch: '',
      semester: 1,
      credits: 3,
      facultyId: '',
      facultyName: '',
      poOptions: [],
      selectedPOs: []
    });
    setNewPO({ poCode: '', poName: '' });
    setNewCO({ coCode: '', coName: '' });
    setCoOptions([]);
    setEditingCourse(null);
    setShowModal(false);
    setSelectedSchool(null);
    setSelectedDepartment('');
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      department: course.department,
      batch: (course as any).batch || '',
      semester: course.semester,
      credits: course.credits,
      facultyId: course.facultyId,
      facultyName: course.facultyName,
      poOptions: course.poOptions || [],
      selectedPOs: course.selectedPOs || []
    });
    // Load course-specific COs if present; otherwise load department defaults
    if ((course as any).coOptions && (course as any).coOptions.length > 0) {
      setCoOptions((course as any).coOptions);
    } else if (course.department) {
      const deptCOs = LocalStorageService.getCOOptions(course.department) || [];
      setCoOptions(deptCOs);
    }
    // Load department batch options for editing
    if (course.department) {
      const deptBatches = LocalStorageService.getBatchOptions(course.department) || [];
      setBatchOptions(deptBatches);
    }
    // For editing, we don't need school selection, just open the modal directly
    setShowModal(true);
  };

  // PO option management
  const addPOOption = () => {
    const code = newPO.poCode.trim();
    const name = newPO.poName.trim();
    if (!code || !name) return;
    // Uniqueness by title (poName). Allow duplicate codes if title differs.
    if (formData.poOptions.find(o => o.poName.toLowerCase() === name.toLowerCase())) {
      setNewPO({ poCode: '', poName: '' });
      return;
    }
    const updated = [...formData.poOptions, { poCode: code, poName: name }];
    setFormData({ ...formData, poOptions: updated });
    // persist globally for this department
    if (formData.department) {
      LocalStorageService.savePOOptions(formData.department, updated);
    }
    setNewPO({ poCode: '', poName: '' });
  };

  const removePOOption = (poCode: string) => {
    const updatedOptions = formData.poOptions.filter(o => o.poCode !== poCode);
    const updatedSelected = formData.selectedPOs.filter(code => code !== poCode);
    setFormData({ ...formData, poOptions: updatedOptions, selectedPOs: updatedSelected });
    if (formData.department) {
      LocalStorageService.savePOOptions(formData.department, updatedOptions);
    }
  };

  // PO management outside course modal (by Department filter)
  const addPOMgmtOption = () => {
    if (!filterDepartment) return;
    const code = newPO.poCode.trim();
    const name = newPO.poName.trim();
    if (!code || !name) return;
    // Enforce uniqueness by title (poName)
    if (poMgmtOptions.find(o => o.poName.toLowerCase() === name.toLowerCase())) {
      setNewPO({ poCode: '', poName: '' });
      return;
    }
    const updated = [...poMgmtOptions, { poCode: code, poName: name }];
    setPoMgmtOptions(updated);
    LocalStorageService.savePOOptions(filterDepartment, updated);
    // If course form is for same department, reflect options there too
    if (formData.department === filterDepartment) {
      setFormData(prev => ({ ...prev, poOptions: updated, selectedPOs: prev.selectedPOs.filter(c => updated.some(u => u.poCode === c)) }));
    }
    setNewPO({ poCode: '', poName: '' });
  };

  const removePOMgmtOption = (poCode: string) => {
    if (!filterDepartment) return;
    const updated = poMgmtOptions.filter(o => o.poCode !== poCode);
    setPoMgmtOptions(updated);
    LocalStorageService.savePOOptions(filterDepartment, updated);
    if (formData.department === filterDepartment) {
      setFormData(prev => ({ ...prev, poOptions: updated, selectedPOs: prev.selectedPOs.filter(c => c !== poCode) }));
    }
  };

  const startEditPOMgmt = (index: number) => {
    setEditingPOIndex(index);
    setEditPOForm({ ...poMgmtOptions[index] });
  };

  const cancelEditPOMgmt = () => {
    setEditingPOIndex(null);
    setEditPOForm({ poCode: '', poName: '' });
  };

  const saveEditPOMgmt = () => {
    if (editingPOIndex === null || !filterDepartment) return;
    const code = editPOForm.poCode.trim();
    const name = editPOForm.poName.trim();
    if (!code || !name) return;
    // Enforce uniqueness by title, excluding the item being edited
    const duplicateTitle = poMgmtOptions.some((o, i) => i !== editingPOIndex && o.poName.toLowerCase() === name.toLowerCase());
    if (duplicateTitle) return;
    const updated = poMgmtOptions.map((o, i) => (i === editingPOIndex ? { poCode: code, poName: name } : o));
    setPoMgmtOptions(updated);
    LocalStorageService.savePOOptions(filterDepartment, updated);
    if (formData.department === filterDepartment) {
      setFormData(prev => ({ ...prev, poOptions: updated, selectedPOs: prev.selectedPOs.filter(c => updated.some(u => u.poCode === c)) }));
    }
    cancelEditPOMgmt();
  };

  // Removed selected PO feature

  // Reintroduced selected PO dropdown logic

  const [showPOMapping, setShowPOMapping] = useState(false);

  // CO create modal helpers
  const addCOOption = () => {
    const code = newCO.coCode.trim();
    if (!code) return;
    if (coOptions.find(o => o.coCode.toLowerCase() === code.toLowerCase())) {
      setNewCO({ coCode: '', coName: '' });
      return;
    }
    const updated = [...coOptions, { coCode: code, coName: newCO.coName.trim() }];
    setCoOptions(updated);
    if (formData.department) {
      LocalStorageService.saveCOOptions(formData.department, updated);
    }
    setNewCO({ coCode: '', coName: '' });
  };

  const removeCOOption = (coCode: string) => {
    const updated = coOptions.filter(o => o.coCode !== coCode);
    setCoOptions(updated);
    const dept = coDeptOverride || formData.department;
    if (dept) {
      LocalStorageService.saveCOOptions(dept, updated);
    }
  };

  const startEditCO = (index: number) => {
    setEditingCOIndex(index);
    setEditCOForm({ ...coOptions[index] });
  };

  const cancelEditCO = () => {
    setEditingCOIndex(null);
    setEditCOForm({ coCode: '', coName: '' });
  };

  const saveEditCO = () => {
    const dept = coDeptOverride || formData.department;
    if (editingCOIndex === null || !dept) return;
    const code = editCOForm.coCode.trim();
    const name = editCOForm.coName.trim();
    if (!code || !name) return;
    const updated = coOptions.map((o, i) => (i === editingCOIndex ? { coCode: code, coName: name } : o));
    setCoOptions(updated);
    LocalStorageService.saveCOOptions(dept, updated);
    cancelEditCO();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Course Management</h2>
          <p className="text-gray-600 mt-2">Manage academic courses and their details</p>
          {selectedSchool && selectedDepartment && (
            <div className="mt-2 text-sm text-blue-600">
              Selected: {selectedSchool.name} - {selectedDepartment}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSchoolModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Course
          </button>
        </div>
      </div>

      {/* Search and Advanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* School */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">School (required)</label>
            <select
              value={filterSchoolId}
              onChange={(e) => { setFilterSchoolId(e.target.value); setFilterDepartment(''); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select School</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name} - {s.fullName}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              disabled={!filterSchoolId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
            >
              <option value="">All Departments</option>
              {departmentListForSelectedSchool.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowPOManagementModal(true)}
                disabled={!filterDepartment}
                className={`px-3 py-2 rounded-lg text-sm border ${!filterDepartment ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed' : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'}`}
              >
                Manage POs
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="lg:col-span-4">
            <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
                placeholder="Search courses by code, name, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

          {/* Reset */}
          <div className="lg:col-span-4 flex justify-end">
            <button
              type="button"
              onClick={() => { setFilterSchoolId(''); setFilterDepartment(''); }}
              className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
        {!filterSchoolId && (
          <div className="mt-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
            Select a school to activate advanced filters and view results.
          </div>
        )}
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Course Code</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Course Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Batch</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Semester</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Credits</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Faculty</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">COs</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">POs</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No courses found</p>
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{course.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{course.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{course.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{(course as any).batch || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{course.semester}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{course.credits}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{course.facultyName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {Array.isArray((course as any).coOptions) && (course as any).coOptions.length > 0
                        ? `${(course as any).coOptions.length} COs created`
                        : 'None'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {Array.isArray((course as any).poOptions) && (course as any).poOptions.length > 0
                        ? `${(course as any).poOptions.length} POs created`
                        : 'None'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCourse(course.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl mx-4 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-4 space-y-6">
                {/* Top row: Course Code, Course Name, Department, Batch (add), Dropdown */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g., CSE101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g., Data Structures and Algorithms"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                      placeholder="Set from school/department selection"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                      <input
                        type="text"
                        value={newBatch}
                        onChange={(e) => setNewBatch(e.target.value)}
                        placeholder="e.g., 2022-2026"
                        className="min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white focus:border-transparent text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => { const v = newBatch.trim(); if (!v || !formData.department) return; if (!(batchOptions || []).includes(v)) { const updated = [...(batchOptions || []), v]; setBatchOptions(updated); LocalStorageService.saveBatchOptions(formData.department, updated); } setFormData({ ...formData, batch: v }); setNewBatch(''); }}
                        className="shrink-0 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Browse Batches</label>
                    <select
                      value={''}
                      onChange={() => { /* browse-only; no-op */ }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 text-sm"
                    >
                      <option value="" disabled>{(batchOptions || []).length === 0 ? 'No batches yet' : 'View batch list'}</option>
                      {(batchOptions || []).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(batchOptions || []).length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {(batchOptions || []).map((b) => (
                        <div key={b} className="flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded-full text-xs border border-gray-200">
                          <span>{b}</span>
                          <button type="button" className="ml-1" title="Delete batch" onClick={() => { if (!formData.department) return; const updated = (batchOptions || []).filter(x => x !== b); setBatchOptions(updated); LocalStorageService.saveBatchOptions(formData.department, updated); if (formData.batch === b) setFormData({ ...formData, batch: '' }); }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Second row: Semester, Credits, Faculty Name */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select
                      required
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="6"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
                    <input
                      type="text"
                      required
                      value={formData.facultyName}
                      onChange={(e) => setFormData({ ...formData, facultyName: e.target.value, facultyId: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g., Dr. John Smith"
                    />
                  </div>
                </div>

              {/* Inline CO creation inside Add Course */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700">Course Outcomes (CO) Options</label>
                    <span className="text-xs text-gray-600">{coOptions.length} COs</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="CO Code (e.g., CO1)"
                      value={newCO.coCode}
                      onChange={(e) => setNewCO({ ...newCO, coCode: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <input
                      type="text"
                      placeholder="CO Name/Title"
                      value={newCO.coName}
                      onChange={(e) => setNewCO({ ...newCO, coName: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = newCO.coCode.trim();
                        if (!code) return;
                        if (coOptions.find(o => o.coCode.toLowerCase() === code.toLowerCase())) { setNewCO({ coCode: '', coName: '' }); return; }
                        const updated = [...coOptions, { coCode: code, coName: newCO.coName.trim() }];
                        setCoOptions(updated);
                        if (formData.department) {
                          LocalStorageService.saveCOOptions(formData.department, updated);
                        }
                        setNewCO({ coCode: '', coName: '' });
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Add CO Option
                    </button>
                  </div>
                  {coOptions.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {coOptions.map((o, idx) => (
                        <div key={`${o.coCode}-${o.coName}-${idx}`} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border text-sm">
                          {editingCOIndex === idx ? (
                            <div className="flex flex-col w-full gap-2 md:flex-row md:items-center">
                              <input
                                type="text"
                                value={editCOForm.coCode}
                                onChange={(e) => setEditCOForm(prev => ({ ...prev, coCode: e.target.value }))}
                                className="px-2 py-1 border border-gray-300 rounded w-full md:w-40"
                                placeholder="CO Code"
                              />
                              <input
                                type="text"
                                value={editCOForm.coName}
                                onChange={(e) => setEditCOForm(prev => ({ ...prev, coName: e.target.value }))}
                                className="px-2 py-1 border border-gray-300 rounded flex-1"
                                placeholder="CO Title"
                              />
                              <div className="flex gap-2 md:ml-2">
                                <button type="button" onClick={saveEditCO} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                                <button type="button" onClick={cancelEditCO} className="px-3 py-1 bg-gray-100 text-gray-700 rounded">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900">{o.coCode}</span>
                                <span className="text-gray-600">- {o.coName || 'Untitled'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button type="button" title="Edit" onClick={() => startEditCO(idx)} className="text-blue-600 hover:text-blue-800 p-1 rounded">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button type="button" title="Delete" onClick={() => removeCOOption(o.coCode)} className="text-red-600 hover:text-red-800 p-1 rounded">×</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.department && coOptions.length === 0 && (
                    <div className="mt-2 text-xs text-gray-500">No COs yet for {formData.department}. Add above.</div>
                  )}
                </div>
              </div>

              {/* PO mapping removed from here; managed via external modal */}
              </div>
              <div className="p-4 border-t bg-white sticky bottom-0 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-base font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
                >
                  {editingCourse ? 'Update' : 'Add'} Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* School Selection Modal */}
      {showSchoolModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Course</h3>
              <p className="text-gray-600 text-sm mt-1">Choose a school to see available departments for adding a new course</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {showAddSchoolForm && (
                <div className="w-full text-left">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">New School Details</h4>
                  <form onSubmit={handleSaveNewSchool} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                      <input
                        type="text"
                        value={newSchool.shortName}
                        onChange={(e) => setNewSchool({ ...newSchool, shortName: e.target.value })}
                        placeholder="e.g., Pharmacy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={newSchool.fullName}
                        onChange={(e) => setNewSchool({ ...newSchool, fullName: e.target.value })}
                        placeholder="e.g., Amity Institute of Pharmacy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departments (comma or new line separated)</label>
                      <textarea
                        value={newSchool.departmentsText}
                        onChange={(e) => setNewSchool({ ...newSchool, departmentsText: e.target.value })}
                        placeholder={"e.g., Bachelor of Pharmacy (B.Pharm)\nMaster of Pharmacy (M.Pharm)"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[90px]"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowAddSchoolForm(false); setNewSchool({ shortName: '', fullName: '', departmentsText: '' }); }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save School
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Add New School Card */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-center"
                  onClick={() => setShowAddSchoolForm(true)}
                >
                  <div className="text-center">
                    <Plus className="w-6 h-6 text-blue-600 mx-auto" />
                    <div className="mt-2 font-semibold text-gray-900">Add New School</div>
                    <div className="text-xs text-gray-500">Create a new school and departments</div>
                  </div>
                </div>

                {localSchools.map((school) => (
                  <div
                    key={school.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <School className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">{school.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditSchool(school)}
                          className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded border border-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => requestDeleteSchool(school)}
                          className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{school.fullName}</p>
                    <div className="text-xs text-gray-500">
                      {school.departments.length} departments available
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => handleSchoolSelect(school)}
                        className="w-full text-center px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm"
                      >
                        Add Course
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowSchoolModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Selection Modal */}
      {selectedSchool && !selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Department</h3>
              <p className="text-gray-600 text-sm mt-1">
                Choose a department from {selectedSchool.name} - {selectedSchool.fullName}
              </p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                {selectedSchool.departments.map((department) => (
                  <button
                    key={department}
                    onClick={() => handleDepartmentSelect(department)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">{department}</span>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => {
                  setSelectedSchool(null);
                  setSelectedDepartment('');
                  setShowSchoolModal(true);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Schools
              </button>
              <button
                onClick={() => {
                  setSelectedSchool(null);
                  setSelectedDepartment('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Management Modal (outside, next to Department filter) */}
      {showPOManagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Manage Program Outcomes (POs)</h3>
              <p className="text-gray-600 text-sm mt-1">Department: {filterDepartment || 'Select a department'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="PO Code (e.g., PO1)"
                  value={newPO.poCode}
                  onChange={(e) => setNewPO({ ...newPO, poCode: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={!filterDepartment}
                />
                <input
                  type="text"
                  placeholder="PO Name/Title"
                  value={newPO.poName}
                  onChange={(e) => setNewPO({ ...newPO, poName: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={!filterDepartment}
                />
                <button
                  type="button"
                  onClick={addPOMgmtOption}
                  disabled={!filterDepartment}
                  className={`px-3 py-2 rounded-lg text-sm ${!filterDepartment ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  Add PO Option
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">PO options created for this department</label>
                <select
                  value={''}
                  onChange={() => {}}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="" disabled>{poMgmtOptions.length === 0 ? 'No POs yet' : 'Browse PO list'}</option>
                  {poMgmtOptions.map((o) => (
                    <option key={o.poCode} value={o.poCode}>
                      {o.poCode} {o.poName ? `- ${o.poName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {poMgmtOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Manage PO Options:</label>
                  <div className="space-y-2">
                    {poMgmtOptions.map((o, idx) => (
                      <div key={`${o.poCode}-${o.poName}-${idx}`} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border text-sm">
                        {editingPOIndex === idx ? (
                          <div className="flex flex-col w-full gap-2 md:flex-row md:items-center">
                            <input
                              type="text"
                              value={editPOForm.poCode}
                              onChange={(e) => setEditPOForm(prev => ({ ...prev, poCode: e.target.value }))}
                              className="px-2 py-1 border border-gray-300 rounded w-full md:w-40"
                              placeholder="PO Code"
                            />
                            <input
                              type="text"
                              value={editPOForm.poName}
                              onChange={(e) => setEditPOForm(prev => ({ ...prev, poName: e.target.value }))}
                              className="px-2 py-1 border border-gray-300 rounded flex-1"
                              placeholder="PO Title"
                            />
                            <div className="flex gap-2 md:ml-2">
                              <button type="button" onClick={saveEditPOMgmt} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                              <button type="button" onClick={cancelEditPOMgmt} className="px-3 py-1 bg-gray-100 text-gray-700 rounded">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">{o.poCode}</span>
                              <span className="text-gray-600">- {o.poName || 'Untitled'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" title="Edit" onClick={() => startEditPOMgmt(idx)} className="text-blue-600 hover:text-blue-800 p-1 rounded">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button type="button" title="Delete" onClick={() => removePOMgmtOption(o.poCode)} className="text-red-600 hover:text-red-800 p-1 rounded">×</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPOManagementModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit School Modal */}
      {showEditSchoolModal && editingSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit School</h3>
            </div>
            <form onSubmit={handleUpdateSchool} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                  <input
                    type="text"
                    value={editSchoolForm.shortName}
                    onChange={(e) => setEditSchoolForm({ ...editSchoolForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editSchoolForm.fullName}
                    onChange={(e) => setEditSchoolForm({ ...editSchoolForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departments</label>
                  <textarea
                    value={editSchoolForm.departmentsText}
                    onChange={(e) => setEditSchoolForm({ ...editSchoolForm, departmentsText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[90px]"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowEditSchoolModal(false); setEditingSchool(null); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create CO Mapping Modal */}
      {showCOCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create CO Mapping</h3>
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <input
                  type="text"
                  value={coDeptOverride || formData.department}
                  onChange={(e) => {
                    setCoDeptOverride(e.target.value);
                    const opts = LocalStorageService.getCOOptions(e.target.value) || [];
                    setCoOptions(opts);
                  }}
                  placeholder="Enter department to manage COs"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="CO Code (e.g., CO1)"
                  value={newCO.coCode}
                  onChange={(e) => setNewCO({ ...newCO, coCode: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  placeholder="CO Name/Title"
                  value={newCO.coName}
                  onChange={(e) => setNewCO({ ...newCO, coName: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const dept = coDeptOverride || formData.department;
                    if (!dept) return;
                    const code = newCO.coCode.trim();
                    if (!code) return;
                    if (coOptions.find(o => o.coCode.toLowerCase() === code.toLowerCase())) { setNewCO({ coCode: '', coName: '' }); return; }
                    const updated = [...coOptions, { coCode: code, coName: newCO.coName.trim() }];
                    setCoOptions(updated);
                    LocalStorageService.saveCOOptions(dept, updated);
                    setNewCO({ coCode: '', coName: '' });
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Add CO Option
                </button>
              </div>

              {/* Browse list */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CO options created for this department</label>
                <select
                  value={''}
                  onChange={() => {}}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="" disabled>{coOptions.length === 0 ? 'No COs yet' : 'Browse CO list'}</option>
                  {coOptions.map(o => (
                    <option key={o.coCode} value={o.coCode}>{o.coCode} {o.coName ? `- ${o.coName}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Manage */}
              {coOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Manage CO Options:</label>
                  <div className="flex flex-wrap gap-2">
                    {coOptions.map(o => (
                      <div key={o.coCode} className="flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded-full text-xs border border-gray-200">
                        <span>{o.coCode}</span>
                        <button type="button" className="ml-1" title="Delete option" onClick={() => removeCOOption(o.coCode)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCOCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete School Confirm */}
      {showDeleteSchoolModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete School</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">Are you sure you want to delete this school? This will not remove any existing courses but selection will be cleared.</p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowDeleteSchoolModal(false); setSchoolIdPendingDelete(null); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSchool}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}