import React, { useState, useMemo, useEffect } from 'react';
import { Edit2, Trash2, Plus, X, Upload, Search } from 'lucide-react';
import { Faculty } from '../types';
import { schools } from '../data/schools';
import { departmentSubjects, allBatches } from '../data/faculty';

interface FacultyManagementProps {
  faculty: Faculty[];
  onAddFaculty: (data: Omit<Faculty, 'id' | 'createdAt'>) => void;
  onUpdateFaculty: (id: string, data: Partial<Faculty>) => void;
  onDeleteFaculty: (id: string) => void;
}

export function FacultyManagement({ 
  faculty, 
  onAddFaculty, 
  onUpdateFaculty, 
  onDeleteFaculty 
}: FacultyManagementProps) {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  // Manage available batches list (admin can add/remove)
  const [availableBatchesState, setAvailableBatchesState] = useState<string[]>(allBatches);
  // Manage available subjects list (per department) with add/delete
  const [availableSubjectsState, setAvailableSubjectsState] = useState<string[]>([]);

  useEffect(() => {
    // Reset available subjects whenever department changes
    if (selectedDepartment) {
      const base = (departmentSubjects[selectedDepartment] || []).slice();
      setAvailableSubjectsState(base);
      // Also ensure selected subjects not in base remain selected but appear in chips
      setFormData(prev => ({ ...prev, subjects: prev.subjects.filter(s => base.includes(s)) }));
    } else {
      setAvailableSubjectsState([]);
      setFormData(prev => ({ ...prev, subjects: [] }));
    }
  }, [selectedDepartment]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    department: '',
    batches: [] as string[],
    sections: [] as string[],
    subjects: [] as string[],
    initialPassword: '',
    batchSections: {} as { [batch: string]: string[] },
    batchSemesters: {} as { [batch: string]: number[] },
    batchSubjects: {} as { [batch: string]: string[] }
  });
  const [newBatch, setNewBatch] = useState('');
  const [newSubject, setNewSubject] = useState('');

  // Available departments based on selected school
  const availableDepartments = useMemo(() => {
    if (!selectedSchool) return [];
    const school = schools.find(s => s.name === selectedSchool);
    return school?.departments || [];
  }, [selectedSchool]);

  // Available subjects based on selected department
  const availableSubjects = useMemo(() => {
    if (!selectedDepartment) return [];
    return departmentSubjects[selectedDepartment] || [];
  }, [selectedDepartment]);

  // Filtered faculty based on selections - FIXED filtering logic
  const filteredFaculty = useMemo(() => {
    let filtered = faculty;
    
    console.log('All faculty:', faculty);
    console.log('Selected school:', selectedSchool);
    console.log('Selected department:', selectedDepartment);

    if (selectedSchool) {
      filtered = filtered.filter(f => {
        const facultySchool = f.school?.trim() || '';
        const filterSchool = selectedSchool.trim();
        return facultySchool === filterSchool;
      });
      console.log('After school filter:', filtered);
    }

    if (selectedDepartment) {
      filtered = filtered.filter(f => {
        const facultyDept = f.department?.trim() || '';
        const filterDept = selectedDepartment.trim();
        return facultyDept === filterDept;
      });
      console.log('After department filter:', filtered);
    }

    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log('Final filtered faculty:', filtered);
    return filtered;
  }, [faculty, selectedSchool, selectedDepartment, searchTerm]);

  const getSubjectsForFaculty = (f: Faculty): string[] => {
    const batchSubjectsMap = (f as any).batchSubjects as { [batch: string]: string[] } | undefined;
    if (batchSubjectsMap && typeof batchSubjectsMap === 'object') {
      const merged = Array.from(new Set(Object.values(batchSubjectsMap).flat())) as string[];
      if (merged.length > 0) return merged;
    }
    return f.subjects || [];
  };

  const handleSchoolChange = (school: string) => {
    setSelectedSchool(school);
    setSelectedDepartment(''); // Reset department when school changes
  };

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
  };

  const handleAddFaculty = () => {
    if (!selectedSchool || !selectedDepartment) {
      alert('Please select both school and department first');
      return;
    }

    // FIXED: Ensure form data has correct school and department values
    setFormData({
      name: '',
      email: '',
      school: selectedSchool, // Use the exact selected school value
      department: selectedDepartment, // Use the exact selected department value
      batches: [],
      sections: [],
      subjects: [],
      initialPassword: '',
      batchSections: {},
      batchSemesters: {},
      batchSubjects: {}
    });
    setShowAddModal(true);
  };

  const handleUploadExcel = () => {
    setShowUploadModal(true);
  };

  const handleRemoveDuplicates = () => {
    const duplicates = findDuplicateFaculty();
    if (duplicates.length === 0) {
      alert('No duplicate faculty found!');
      return;
    }
    
    if (confirm(`Found ${duplicates.length} duplicate faculty. Remove them?`)) {
      duplicates.forEach(duplicate => {
        onDeleteFaculty(duplicate.id);
      });
      alert(`Removed ${duplicates.length} duplicate faculty!`);
    }
  };

  const findDuplicateFaculty = () => {
    const seen = new Set();
    const duplicates: Faculty[] = [];
    
    faculty.forEach(f => {
      const key = `${f.email.toLowerCase()}-${f.name.toLowerCase()}`;
      if (seen.has(key)) {
        duplicates.push(f);
      } else {
        seen.add(key);
      }
    });
    
    return duplicates;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const lines = data.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Expected headers: s.no, faculty name, designation, employee id, email id, phone no, department, school
        const expectedHeaders = ['s.no', 'faculty name', 'designation', 'employee id', 'email id', 'phone no', 'department', 'school'];
        
        if (!expectedHeaders.every(h => headers.includes(h))) {
          alert('Invalid Excel format. Please ensure columns are: S.No, Faculty Name, Designation, Employee ID, Email ID, Phone No, Department, School');
          return;
        }

        const facultyData = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          return {
            name: values[1] || '',
            email: values[4] || '',
            school: values[7] || '',
            department: values[6] || '',
            designation: values[2] || '',
            employeeId: values[3] || '',
            phoneNo: values[5] || '',
            batches: [],
            sections: [],
            subjects: [],
            initialPassword: 'faculty123',
            isActivated: false
          };
        }).filter(f => f.name && f.email);

        facultyData.forEach(f => {
          onAddFaculty(f);
        });

        alert(`Successfully imported ${facultyData.length} faculty members!`);
        setShowUploadModal(false);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Error parsing Excel file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleEditFaculty = (faculty: Faculty) => {
    setFormData({
      name: faculty.name,
      email: faculty.email,
      school: faculty.school,
      department: faculty.department,
      batches: [...faculty.batches],
      sections: [...faculty.sections],
      subjects: [...faculty.subjects],
      initialPassword: faculty.initialPassword || '',
      batchSections: faculty.batchSections || {},
      batchSemesters: faculty.batchSemesters || {},
      batchSubjects: faculty.batchSubjects || {}
    });
    setEditingFaculty(faculty);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Compute derived selections from per-batch mappings
    const derivedBatches = Object.keys(formData.batchSections || {});
    const finalBatches = derivedBatches.length ? derivedBatches : formData.batches;
    const finalSections = Array.from(new Set(Object.values(formData.batchSections || {}).flat()));
    const finalSemesters = Array.from(new Set(Object.values(formData.batchSemesters || {}).flat()));
    const finalSubjects = Array.from(new Set(Object.values(formData.batchSubjects || {}).flat()));

    if (finalBatches.length === 0 || finalSections.length === 0 || finalSubjects.length === 0) {
      alert('Please select at least one batch, section, and subject');
      return;
    }

    // FIXED: Ensure school and department are properly set with current filter values
    const payload = {
      ...formData,
      school: formData.school || selectedSchool, // Fallback to current filter
      department: formData.department || selectedDepartment, // Fallback to current filter
      // Persist derived fields explicitly
      batches: finalBatches,
      sections: finalSections,
      subjects: finalSubjects,
      batchSemesters: formData.batchSemesters || {},
      batchSubjects: formData.batchSubjects || {},
      batchSections: formData.batchSections || {}
    };
    
    try {
      if (editingFaculty) {
        await onUpdateFaculty(editingFaculty.id, payload);
      } else {
        await onAddFaculty(payload);
      }
      handleCloseModal();
      // FIXED: Don't reset filters after successful submission
      // Keep selectedSchool and selectedDepartment as they are
    } catch (error) {
      console.error('Error saving faculty:', error);
      alert('Error saving faculty. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingFaculty(null);
    // FIXED: Reset form but preserve school/department from current filters
    setFormData({
      name: '',
      email: '',
      school: selectedSchool, // Keep current filter values
      department: selectedDepartment, // Keep current filter values
      batches: [],
      sections: [],
      subjects: [],
      initialPassword: '',
      batchSections: {},
      batchSemesters: {},
      batchSubjects: {}
    });
  };

  const handleBatchToggle = (batch: string) => {
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.includes(batch)
        ? prev.batches.filter(b => b !== batch)
        : [...prev.batches, batch]
    }));
  };

  const handleSectionToggle = (section: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  const handleSubjectToggle = (subject: string, batch?: string) => {
    if (batch) {
      setFormData(prev => {
        const current = prev.batchSubjects?.[batch] || [];
        const next = current.includes(subject)
          ? current.filter(s => s !== subject)
          : [...current, subject];
        return { ...prev, batchSubjects: { ...(prev.batchSubjects || {}), [batch]: next } };
      });
    } else {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
    }
  };

  const addCustomBatch = () => {
    const batch = newBatch.trim();
    if (!batch) return;
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.includes(batch) ? prev.batches : [...prev.batches, batch],
      batchSections: prev.batchSections[batch] ? prev.batchSections : { ...prev.batchSections, [batch]: [] }
    }));
    setNewBatch('');
  };

  const toggleBatchSection = (batch: string, section: string) => {
    setFormData(prev => {
      const current = prev.batchSections[batch] || [];
      const next = current.includes(section)
        ? current.filter(s => s !== section)
        : [...current, section];
      return { ...prev, batchSections: { ...prev.batchSections, [batch]: next } };
    });
  };

  const toggleBatchSemester = (batch: string, sem: number) => {
    setFormData(prev => {
      const current = prev.batchSemesters[batch] || [];
      const next = current.includes(sem)
        ? current.filter(s => s !== sem)
        : [...current, sem].sort((a,b)=>a-b);
      return { ...prev, batchSemesters: { ...prev.batchSemesters, [batch]: next } };
    });
  };

  const getSemestersForBatch = (batch: string): number[] => {
    // Batch formats like "2016-18" or "2020-2025"
    const parts = batch.split('-');
    if (parts.length !== 2) return Array.from({ length: 8 }, (_, i) => i + 1);
    const start = parseInt(parts[0], 10);
    if (isNaN(start)) return Array.from({ length: 8 }, (_, i) => i + 1);
    const endPart = parts[1];
    let end: number;
    if (endPart.length === 2) {
      const century = Math.floor(start / 100) * 100;
      end = century + parseInt(endPart, 10);
    } else {
      end = parseInt(endPart, 10);
    }
    if (isNaN(end) || end <= start) return Array.from({ length: 8 }, (_, i) => i + 1);
    const years = end - start;
    const semCount = Math.max(1, Math.min(10, years * 2));
    return Array.from({ length: semCount }, (_, i) => i + 1);
  };

  const addCustomSubject = () => {
    const s = newSubject.trim();
    if (!s) return;
    // Add to the available list (so it appears with other subjects) and keep selection unchecked by default
    setAvailableSubjectsState(prev => (prev.includes(s) ? prev : [...prev, s]));
    setNewSubject('');
  };

  const deleteSubjectFromDepartment = (subject: string) => {
    setAvailableSubjectsState(prev => prev.filter(s => s !== subject));
    setFormData(prev => {
      const currentMap = prev.batchSubjects || {};
      const updatedMap: { [batch: string]: string[] } = {};
      Object.keys(currentMap).forEach(batch => {
        updatedMap[batch] = (currentMap[batch] || []).filter(s => s !== subject);
      });
      return {
        ...prev,
        batchSubjects: updatedMap,
        subjects: (prev.subjects || []).filter(s => s !== subject)
      };
    });
  };

  const handleDeleteFaculty = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await onDeleteFaculty(id);
      } catch (error) {
        console.error('Error deleting faculty:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Faculty Management</h1>
        <p className="text-gray-600">Manage faculty assignments and course allocations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School *
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => handleSchoolChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select School</option>
              {schools.map(school => (
                <option key={school.id} value={school.name}>
                  {school.name} - {school.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department *
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              disabled={!selectedSchool}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select Department</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddFaculty}
              disabled={!selectedSchool || !selectedDepartment}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Faculty
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search faculty by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Faculty Table */}
      {selectedSchool && selectedDepartment ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Faculty in {selectedSchool} - {selectedDepartment}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredFaculty.length} faculty member(s) found
            </p>
          </div>

          {filteredFaculty.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faculty Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sections
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFaculty.map((faculty) => (
                    <tr key={faculty.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {faculty.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {faculty.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {faculty.batches.map(batch => (
                            <span key={batch} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {batch}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {faculty.sections.map(section => (
                            <span key={section} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {section}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {getSubjectsForFaculty(faculty).map(subject => (
                            <span key={subject} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditFaculty(faculty)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFaculty(faculty.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No faculty found for the selected criteria.</p>
              <p className="text-gray-400 text-sm mt-1">Try adding a faculty member using the "Add Faculty" button above.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            Please select a school and department to view faculty members.
          </p>
        </div>
      )}

      {/* Add/Edit Faculty Modal */}
      {(showAddModal || editingFaculty) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingFaculty ? 'Edit Faculty' : 'Add Faculty'}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {editingFaculty ? 'Update faculty information and assignments' : 'Add a new faculty member with course assignments'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                aria-label="Close"
                className="text-gray-500 hover:text-gray-700 rounded p-1 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Password (set by Admin)</label>
                  <input
                    type="text"
                    value={formData.initialPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, initialPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Temp@123"
                  />
                  <p className="text-xs text-gray-500 mt-1">Faculty must register with this password; they can change it later.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    readOnly
                  />
                </div>
              </div>

              {/* Batches Selection with per-batch sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batches *
                </label>
                <div className="mb-2 flex gap-2">
                  <input
                    type="text"
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    placeholder="Add custom batch (e.g., 2026-30)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={addCustomBatch} className="px-3 py-2 bg-gray-100 rounded-md border border-gray-200 hover:bg-gray-200">Add</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {availableBatchesState.map(batch => (
                    <div key={batch} className="flex items-center justify-between gap-2">
                      <label className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                          checked={formData.batches.includes(batch) || !!formData.batchSections[batch]}
                          onChange={() => {
                            const key = batch.trim();
                            if (formData.batches.includes(key) || formData.batchSections[key]) {
                              setFormData(prev => {
                                const { [key]: _omitS, ...restS } = prev.batchSections;
                                const { [key]: _omitSem, ...restSem } = prev.batchSemesters || {};
                                const { [key]: _omitSub, ...restSub } = prev.batchSubjects || {};
                                return {
                                  ...prev,
                                  batches: prev.batches.filter(b => b !== key),
                                  batchSections: restS,
                                  batchSemesters: restSem,
                                  batchSubjects: restSub
                                };
                              });
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                batches: [...prev.batches, key],
                                batchSections: { ...prev.batchSections, [key]: [] },
                                batchSemesters: { ...(prev.batchSemesters || {}), [key]: [] },
                                batchSubjects: { ...(prev.batchSubjects || {}), [key]: [] }
                              }));
                            }
                          }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{batch}</span>
                    </label>
                      <button
                        type="button"
                        onClick={() => setAvailableBatchesState(prev => prev.filter(b => b !== batch))}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200"
                        aria-label={`Delete ${batch}`}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                {/* Removed bulk remove by year range as requested */}
                {Object.keys(formData.batchSections).length > 0 && (
                  <div className="mt-3 space-y-3">
                    {Object.keys(formData.batchSections).map(batch => (
                      <div key={batch} className="border border-gray-200 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-800">Sections for {batch}</div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => {
                                const key = batch.trim();
                                const { [key]: _omitS, ...restS } = prev.batchSections;
                                const { [key]: _omitSem, ...restSem } = prev.batchSemesters || {};
                                const { [key]: _omitSub, ...restSub } = prev.batchSubjects || {};
                                return {
                                  ...prev,
                                  batches: prev.batches.filter(b => b !== key),
                                  batchSections: restS,
                                  batchSemesters: restSem,
                                  batchSubjects: restSub
                                };
                              });
                            }}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200"
                          >
                            Remove batch
                          </button>
              </div>
                        <div className="flex flex-wrap gap-4">
                          {['A','B','C','D','E','F'].map(sec => (
                            <label key={sec} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={(formData.batchSections[batch] || []).includes(sec)}
                                onChange={() => toggleBatchSection(batch, sec)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Section {sec}</span>
                </label>
                          ))}
                        </div>
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-700 mb-1">Semesters</div>
                          <div className="flex flex-wrap gap-3">
                            {getSemestersForBatch(batch).map(sem => (
                              <label key={sem} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                                  checked={(formData.batchSemesters[batch] || []).includes(sem)}
                                  onChange={() => toggleBatchSemester(batch, sem)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                                <span className="text-sm text-gray-700">Sem {sem}</span>
                    </label>
                  ))}
                </div>
              </div>
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-700 mb-1">Subjects for {batch}</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                            {availableSubjectsState.map(subject => (
                              <div key={subject} className="flex items-center justify-between gap-2">
                                <label className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                                    checked={(formData.batchSubjects?.[batch] || []).includes(subject)}
                                    onChange={() => handleSubjectToggle(subject, batch)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{subject}</span>
                    </label>
                                <button
                                  type="button"
                                  onClick={() => deleteSubjectFromDepartment(subject)}
                                  className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200"
                                  aria-label={`Delete ${subject}`}
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(formData.batches.length > 0 || Object.keys(formData.batchSections).length > 0) && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-800 mb-2">Selected Batches</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set([...
                        formData.batches,
                        ...Object.keys(formData.batchSections)
                      ])).map(batch => (
                        <span key={batch} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {batch}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => {
                                const key = batch.trim();
                                const { [key]: _omitS, ...restS } = prev.batchSections;
                                const { [key]: _omitSem, ...restSem } = prev.batchSemesters || {};
                                const { [key]: _omitSub, ...restSub } = prev.batchSubjects || {};
                                return {
                                  ...prev,
                                  batches: prev.batches.filter(b => b !== key),
                                  batchSections: restS,
                                  batchSemesters: restSem,
                                  batchSubjects: restSub
                                };
                              });
                            }}
                            className="text-blue-800 hover:text-blue-900"
                            aria-label={`Remove ${batch}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary of selections */}
                {(Object.keys(formData.batchSections).length > 0 || Object.keys(formData.batchSemesters).length > 0 || Object.keys(formData.batchSubjects || {}).length > 0) && (
                  <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">Selected Assignments</div>
                    <div className="space-y-3">
                      {Array.from(new Set([
                        ...Object.keys(formData.batchSections || {}),
                        ...Object.keys(formData.batchSemesters || {}),
                        ...Object.keys(formData.batchSubjects || {})
                      ])).map((batch) => (
                        <div key={batch} className="text-sm">
                          <div className="font-medium text-gray-800">{batch}</div>
                          <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <div className="text-gray-600">Semesters</div>
                              <div className="text-gray-900">
                                {(formData.batchSemesters[batch] || []).length > 0 ? (formData.batchSemesters[batch] || []).join(', ') : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600">Sections</div>
                              <div className="text-gray-900">
                                {(formData.batchSections[batch] || []).length > 0 ? (formData.batchSections[batch] || []).join(', ') : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600">Subjects</div>
                              <div className="text-gray-900">
                                {(formData.batchSubjects?.[batch] || []).length > 0 ? (formData.batchSubjects?.[batch] || []).join(', ') : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Removed global Sections block; sections are per-batch only */}

              {/* Subjects selection moved into each batch panel. Only add custom subjects here. */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Custom Subject</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Add custom subject"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={addCustomSubject} className="px-3 py-2 bg-gray-100 rounded-md border border-gray-200 hover:bg-gray-200">Add</button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {editingFaculty ? 'Update Faculty' : 'Add Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}