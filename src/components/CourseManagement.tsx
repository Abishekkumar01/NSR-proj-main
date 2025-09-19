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
    semester: 1,
    credits: 3,
    facultyId: '',
    facultyName: ''
  });

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

  // Save to localStorage whenever courses change
  useEffect(() => {
    if (courses.length > 0) {
      LocalStorageService.saveCourses(courses);
    }
  }, [courses]);

  // Advanced filters
  const [filterSchoolId, setFilterSchoolId] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');

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
    setFormData({ ...formData, department });
    setShowModal(true);
  };


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
    if (editingCourse) {
      onUpdateCourse(editingCourse.id, formData);
    } else {
      onAddCourse(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      department: '',
      semester: 1,
      credits: 3,
      facultyId: '',
      facultyName: ''
    });
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
      semester: course.semester,
      credits: course.credits,
      facultyId: course.facultyId,
      facultyName: course.facultyName
    });
    // For editing, we don't need school selection, just open the modal directly
    setShowModal(true);
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Semester</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Credits</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Faculty</th>
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
                    <td className="px-6 py-4 text-sm text-gray-900">{course.semester}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{course.credits}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{course.facultyName}</td>
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
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Data Structures and Algorithms"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  placeholder="Department will be set based on school selection"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Department is automatically set based on your school and department selection
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
                <input
                  type="text"
                  required
                  value={formData.facultyName}
                  onChange={(e) => setFormData({ ...formData, facultyName: e.target.value, facultyId: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Dr. John Smith"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
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