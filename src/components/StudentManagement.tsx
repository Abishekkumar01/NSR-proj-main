import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Users, School, Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Student, Faculty } from '../types';
import { schools, School as SchoolType } from '../data/schools';
import { getSchoolFromDepartment } from '../lib/schoolMapping';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

interface StudentManagementProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  faculty?: Faculty[];
}

export function StudentManagement({ students, onAddStudent, onUpdateStudent, onDeleteStudent, faculty = [] }: StudentManagementProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  // Advanced filters (for admin only)
  const [filterSchoolId, setFilterSchoolId] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterBatch, setFilterBatch] = useState<string>('');
  const [filterSection, setFilterSection] = useState<string>('');
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    email: '',
    department: '',
    batch: '',
    semester: 1,
    enrollmentNumber: '',
    section: ''
  });

  const batches = ['2021-25', '2022-26', '2023-27', '2024-28'];

  // Faculty-based filtering for faculty users
  const facultyFilteredStudents = useMemo(() => {
    if (user?.role === 'admin' || !faculty.length) {
      return students;
    }

    // Find the current faculty member
    const currentFaculty = faculty.find(f => f.email === user?.email);
    if (!currentFaculty) {
      return [];
    }

    // Filter students based on faculty assignments
    return students.filter(student => {
      // Check if student matches faculty's school and department
      const schoolMatch = student.department && 
        schools.find(s => s.name === currentFaculty.school)?.departments.includes(student.department);
      
      if (!schoolMatch) return false;

      // Check if student's batch is assigned to this faculty (using new batchSections structure)
      const batchSections = currentFaculty.batchSections || {};
      const assignedBatches = Object.keys(batchSections);
      const batchMatch = assignedBatches.includes(student.batch);
      
      if (!batchMatch) return false;

      // Check if student's section is assigned to this faculty for this specific batch
      const sectionsForBatch = batchSections[student.batch] || [];
      const sectionMatch = student.section && sectionsForBatch.includes(student.section);
      
      return sectionMatch;
    });
  }, [students, faculty, user]);

  // Advanced filter application (for admin only)
  const departmentListForSelectedSchool = useMemo(() => {
    if (!filterSchoolId) return [] as string[];
    const school = schools.find(s => s.id === filterSchoolId);
    return school?.departments || [];
  }, [filterSchoolId]);

  const filteredStudents = useMemo(() => {
    // For faculty users, show their assigned students directly
    if (user?.role === 'faculty') {
      return facultyFilteredStudents.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // For admin users, use the advanced filtering
    if (!filterSchoolId) {
      return [] as Student[];
    }

    const selectedSchool = schools.find(s => s.id === filterSchoolId);
    const departmentsInSchool = selectedSchool?.departments || [];

    const byAdvanced = students.filter((student) => {
      // School filter: check if student's school matches or if department belongs to school
      const studentSchool = student.school || getSchoolFromDepartment(student.department);
      const schoolMatch = studentSchool === selectedSchool?.name;
      if (!schoolMatch) return false;

      // Department filter (optional)
      if (filterDepartment && student.department !== filterDepartment) return false;

      // Batch filter (optional)
      if (filterBatch && student.batch !== filterBatch) return false;

      // Section filter (optional)
      if (filterSection && (student.section || '') !== filterSection) return false;

      return true;
    });

    // Apply existing name/roll/department search without disrupting behavior
    return byAdvanced.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [facultyFilteredStudents, students, user, filterSchoolId, filterDepartment, filterBatch, filterSection, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await onUpdateStudent(editingStudent.id, formData);
      } else {
        await onAddStudent(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving student:', error);
      // You could add error state here to show user feedback
    }
  };

  const resetForm = () => {
    setFormData({
      rollNumber: '',
      name: '',
      email: '',
      department: '',
      batch: '',
      semester: 1,
      enrollmentNumber: '',
      section: ''
    });
    setEditingStudent(null);
    setShowModal(false);
    setSelectedSchool(null);
    setSelectedDepartment('');
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email,
      department: student.department,
      batch: student.batch,
      semester: student.semester,
      enrollmentNumber: student.enrollmentNumber || '',
      section: student.section || ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    
    try {
      await onDeleteStudent(studentToDelete.id);
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  // View-only school selection (like Course, but no edit/delete/add)
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


  // Excel upload functions
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  const processExcelFile = () => {
    if (!excelFile) return;

    setUploadStatus('processing');
    setUploadMessage('Processing Excel file...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate required columns
        const requiredColumns = ['Roll Number', 'Name', 'Email', 'Enrollment No.', 'Section', 'Department', 'Batch', 'Semester'];
        const firstRow = jsonData[0] as any;
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          setUploadStatus('error');
          setUploadMessage(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        // Process and validate data
        const processedData = jsonData.map((row: any, index: number) => {
          const student = {
            rollNumber: String(row['Roll Number'] || '').trim(),
            name: String(row['Name'] || '').trim(),
            email: String(row['Email'] || '').trim(),
            enrollmentNumber: String(row['Enrollment No.'] || '').trim(),
            section: String(row['Section'] || '').trim(),
            department: String(row['Department'] || '').trim(),
            batch: String(row['Batch'] || '').trim(),
            semester: parseInt(String(row['Semester'] || '1')) || 1,
            rowIndex: index + 2 // +2 because Excel is 1-indexed and we skip header
          };

          // Validate required fields
          const errors = [];
          if (!student.rollNumber) errors.push('Roll Number');
          if (!student.name) errors.push('Name');
          if (!student.email) errors.push('Email');
          if (!student.enrollmentNumber) errors.push('Enrollment No.');
          if (!student.section) errors.push('Section');
          if (!student.department) errors.push('Department');
          if (!student.batch) errors.push('Batch');

          return { ...student, errors };
        });

        const validData = processedData.filter(item => item.errors.length === 0);
        const invalidData = processedData.filter(item => item.errors.length > 0);

        if (invalidData.length > 0) {
          setUploadStatus('error');
          setUploadMessage(`Found ${invalidData.length} rows with missing data. Please check rows: ${invalidData.map(item => item.rowIndex).join(', ')}`);
          return;
        }

        setExcelData(validData);
        setUploadStatus('success');
        setUploadMessage(`Successfully processed ${validData.length} student records. Ready to import.`);
      } catch (error) {
        setUploadStatus('error');
        setUploadMessage('Error processing Excel file. Please check the file format.');
        console.error('Excel processing error:', error);
      }
    };

    reader.readAsArrayBuffer(excelFile);
  };

  const importStudents = async () => {
    if (excelData.length === 0) return;

    try {
      setUploadStatus('processing');
      setUploadMessage('Importing students to database...');

      // Import all students one by one to Firebase
      for (const studentData of excelData) {
        const { rowIndex, errors, ...student } = studentData;
        await onAddStudent(student);
      }

      setUploadStatus('success');
      setUploadMessage(`Successfully imported ${excelData.length} students to database!`);
      setExcelData([]);
      setExcelFile(null);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowExcelModal(false);
        setUploadStatus('idle');
        setUploadMessage('');
      }, 2000);
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Error importing students. Please try again.');
      console.error('Import error:', error);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Roll Number': 'A2451451345431',
        'Name': 'John Doe',
        'Email': 'john.doe@example.com',
        'Enrollment No.': 'A20405222156',
        'Section': 'A',
        'Department': 'Computer Science & Engineering',
        'Batch': '2022-26',
        'Semester': 8
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_template.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Student Management</h2>
          <p className="text-gray-600 mt-2">Manage student profiles and academic information</p>
          <div className="mt-2 text-sm text-gray-600">
            Total students loaded: {students.length} | Filtered: {filteredStudents.length}
          </div>
          {selectedSchool && selectedDepartment && (
            <div className="mt-2 text-sm text-blue-600">
              Selected: {selectedSchool.name} - {selectedDepartment}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSchoolModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </button>
          <button
            onClick={() => setShowExcelModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Excel
          </button>
        </div>
      </div>

      {/* Faculty Assignment Display */}
      {user?.role === 'faculty' && faculty.length > 0 && (() => {
        const currentFaculty = faculty.find(f => f.email === user?.email);
        if (!currentFaculty) return null;

        const batchSections = currentFaculty.batchSections || {};
        const assignedBatches = Object.keys(batchSections);

        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Assigned Students
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-blue-800 mb-1">School & Department</div>
                <div className="text-sm text-blue-700">{currentFaculty.school} - {currentFaculty.department}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-800 mb-1">Assigned Batches</div>
                <div className="text-sm text-blue-700">
                  {assignedBatches.length > 0 ? assignedBatches.join(', ') : 'None assigned'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-800 mb-1">Total Students</div>
                <div className="text-sm text-blue-700">{facultyFilteredStudents.length} students</div>
              </div>
            </div>
            {assignedBatches.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-blue-800 mb-2">Batch-wise Sections:</div>
                <div className="flex flex-wrap gap-2">
                  {assignedBatches.map(batch => (
                    <div key={batch} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {batch}: {batchSections[batch]?.join(', ') || 'No sections'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Admin Filters */}
          {user?.role === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* School Filter (Required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
                <select
                  value={filterSchoolId}
                  onChange={(e) => {
                    setFilterSchoolId(e.target.value);
                    setFilterDepartment('');
                    setFilterBatch('');
                    setFilterSection('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Select School</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>

              {/* Department Filter (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => {
                    setFilterDepartment(e.target.value);
                    setFilterBatch('');
                    setFilterSection('');
                  }}
                  disabled={!filterSchoolId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">All Departments</option>
                  {departmentListForSelectedSchool.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Batch Filter (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <select
                  value={filterBatch}
                  onChange={(e) => {
                    setFilterBatch(e.target.value);
                    setFilterSection('');
                  }}
                  disabled={!filterSchoolId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">All Batches</option>
                  {batches.map((batch) => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>

              {/* Section Filter (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  disabled={!filterSchoolId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">All Sections</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name, roll number, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Clear Filters */}
            {(searchTerm || (user?.role === 'admin' && (filterSchoolId || filterDepartment || filterBatch || filterSection))) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  if (user?.role === 'admin') {
                    setFilterSchoolId('');
                    setFilterDepartment('');
                    setFilterBatch('');
                    setFilterSection('');
                  }
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filter Information Display */}
          {user?.role === 'admin' && filterSchoolId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>Showing students from:</strong> {schools.find(s => s.id === filterSchoolId)?.name}
                {filterDepartment && ` - ${filterDepartment}`}
                {filterBatch && ` - Batch ${filterBatch}`}
                {filterSection && ` - Section ${filterSection}`}
                {searchTerm && ` (searching: "${searchTerm}")`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Roll Number</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Enrollment No.</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Section</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Batch</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Semester</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No students found</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.rollNumber}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.enrollmentNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.section || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.batch}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.semester}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(student)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Number</label>
                  <input
                    type="text"
                    required
                    value={formData.enrollmentNumber}
                    onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., A20405222156"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., A, B, C"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <select
                    required
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select Batch</option>
                    {batches.map((batch) => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>Sem {sem}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                    placeholder="Set by school selection"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set by school and department selection</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  {editingStudent ? 'Update' : 'Add'} Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* School Selection Modal (view-only) */}
      {showSchoolModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Student</h3>
                <p className="text-gray-600 text-sm mt-1">Choose a school to see available departments for adding a new student</p>
              </div>
              <button
                onClick={() => setShowSchoolModal(false)}
                aria-label="Close"
                className="text-gray-500 hover:text-gray-700 rounded p-1 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schools.map((school) => (
                  <div
                    key={school.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleSchoolSelect(school)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <School className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">{school.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{school.fullName}</p>
                    <div className="text-xs text-gray-500">
                      {school.departments.length} departments available
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

      {/* Excel Upload Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Excel File</h3>
              <p className="text-gray-600 text-sm mt-1">Upload an Excel file with student data to import multiple records at once</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Download Template</h4>
                </div>
                <p className="text-blue-700 text-sm mb-3">
                  Download the Excel template with the correct format and column headers.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Excel File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: .xlsx, .xls
                </p>
              </div>

              {/* Required Columns Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Required Columns:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>• Roll Number</div>
                  <div>• Name</div>
                  <div>• Email</div>
                  <div>• Enrollment No.</div>
                  <div>• Section</div>
                  <div>• Department</div>
                  <div>• Batch</div>
                  <div>• Semester</div>
                </div>
              </div>

              {/* Status Messages */}
              {uploadMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  uploadStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                  uploadStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  uploadStatus === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  {uploadMessage}
                </div>
              )}

              {/* Preview Data */}
              {excelData.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Preview ({excelData.length} records)</h4>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 py-1 text-left">Roll No.</th>
                          <th className="px-2 py-1 text-left">Name</th>
                          <th className="px-2 py-1 text-left">Email</th>
                          <th className="px-2 py-1 text-left">Section</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 5).map((student, index) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="px-2 py-1">{student.rollNumber}</td>
                            <td className="px-2 py-1">{student.name}</td>
                            <td className="px-2 py-1">{student.email}</td>
                            <td className="px-2 py-1">{student.section}</td>
                          </tr>
                        ))}
                        {excelData.length > 5 && (
                          <tr>
                            <td colSpan={4} className="px-2 py-1 text-center text-gray-500">
                              ... and {excelData.length - 5} more records
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowExcelModal(false);
                    setExcelFile(null);
                    setExcelData([]);
                    setUploadStatus('idle');
                    setUploadMessage('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                {excelFile && uploadStatus !== 'success' && (
                  <button
                    onClick={processExcelFile}
                    disabled={uploadStatus === 'processing'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadStatus === 'processing' ? 'Processing...' : 'Process File'}
                  </button>
                )}
                {excelData.length > 0 && uploadStatus === 'success' && (
                  <button
                    onClick={importStudents}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Import {excelData.length} Students
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Student</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{studentToDelete.name}</strong> ({studentToDelete.rollNumber})? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setStudentToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}