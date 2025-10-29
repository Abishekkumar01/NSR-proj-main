import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Plus, Upload, Search } from 'lucide-react';
import { Faculty } from '../types';
import { schools } from '../data/schools';
import { allBatches } from '../data/faculty';
import { optimizedFirebase } from '../lib/optimizedFirebase';
import { LocalStorageService } from '../lib/localStorage';
import * as XLSX from 'xlsx';

interface FacultyManagementProps {
  faculty: Faculty[];
  onAddFaculty: (data: Omit<Faculty, 'id' | 'createdAt'>) => Promise<void>;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    employeeId: '',
    email: '',
    phoneNo: '',
    department: '',
    school: ''
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered faculty based on selections
  const filteredFaculty = useMemo(() => {
    let filtered = faculty;

    if (selectedSchool) {
      filtered = filtered.filter(f => f.school === selectedSchool);
    }
    if (selectedDepartment) {
      filtered = filtered.filter(f => f.department === selectedDepartment);
    }
    if (selectedBatch) {
      filtered = filtered.filter(f => f.batches.includes(selectedBatch));
    }
    if (selectedSection) {
      filtered = filtered.filter(f => f.sections.includes(selectedSection));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(term) ||
        f.email.toLowerCase().includes(term) ||
        f.employeeId?.toLowerCase().includes(term) ||
        f.designation?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [faculty, selectedSchool, selectedDepartment, selectedBatch, selectedSection, searchTerm]);

  const departmentsForSelectedSchool = useMemo(() => {
    if (!selectedSchool) return [];
    const school = schools.find(s => s.name === selectedSchool);
    return school?.departments || [];
  }, [selectedSchool]);

  const handleAddFaculty = () => {
    setFormData({
      name: '',
      designation: '',
      employeeId: '',
      email: '',
      phoneNo: '',
      department: selectedDepartment || '',
      school: selectedSchool || ''
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    // Validate
    const newErrors: { [k: string]: string } = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\d{7,15}$/; // allow 7-15 digits
    const empIdPattern = /^[A-Za-z0-9_-]{2,}$/;

    if (!formData.name.trim()) newErrors.name = 'Faculty name is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.employeeId.trim() || !empIdPattern.test(formData.employeeId.trim())) newErrors.employeeId = 'Enter a valid Employee ID (letters/numbers/_-)';
    if (!formData.email.trim() || !emailPattern.test(formData.email.trim())) newErrors.email = 'Enter a valid email address';
    if (formData.phoneNo && !phonePattern.test(formData.phoneNo.trim())) newErrors.phoneNo = 'Phone must be 7-15 digits';
    if (!formData.school) newErrors.school = 'School is required';
    if (!formData.department) newErrors.department = 'Department is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const newFaculty = {
        ...formData,
        batches: [],
        sections: [],
        subjects: [],
        initialPassword: 'Temp@123',
        isActivated: false
      };

      console.log('Submitting faculty:', newFaculty);
      // Attempt parent handler in a race with a short timeout fallback so UI never hangs
      const runParent = onAddFaculty(newFaculty);
      const fallbackFaculty = {
        id: Math.random().toString(36).slice(2),
        ...newFaculty,
        createdAt: new Date()
      } as Faculty;
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2500));
      let parentFinished = false;
      try {
        await Promise.race([
          runParent.then(() => { parentFinished = true; }),
          timeout
        ]);
      } catch (err) {
        console.warn('Parent onAddFaculty rejected, will use fallback:', err);
      }
      if (!parentFinished) {
        console.warn('Parent onAddFaculty timed out; applying local fallback');
        try { LocalStorageService.addFaculty(fallbackFaculty); } catch {}
        try { await optimizedFirebase.saveData('faculty', fallbackFaculty, fallbackFaculty.id); } catch {}
      }

      console.log('Faculty added successfully');
      alert('Faculty added successfully!');
      setShowAddModal(false);
      setFormData({
        name: '',
        designation: '',
        employeeId: '',
        email: '',
        phoneNo: '',
        department: '',
        school: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error adding faculty:', error);
      alert('Error adding faculty. Please try again.');
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const readAsArrayBuffer = (): Promise<ArrayBuffer> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(selectedFile);
      });

      const data = await readAsArrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const mapRow = (r: any) => {
        // Support multiple header names
        const get = (keys: string[]) => {
          for (const k of keys) {
            const found = r[k] ?? r[k.toUpperCase()] ?? r[k.toLowerCase()];
            if (found !== undefined && String(found).trim() !== '') return String(found).trim();
          }
          return '';
        };
        const name = get(['Faculty Name', 'Name']);
        const email = get(['Email ID', 'Email', 'Email Address']);
        const designation = get(['Designation']);
        const employeeId = get(['Employee ID', 'Emp Id', 'EmpID']);
        const phoneNo = get(['Phone No', 'Phone', 'Mobile']);
        const department = get(['Department', 'Dept']);
        const school = get(['School']);
        return { name, email, designation, employeeId, phoneNo, department, school };
      };

      const facultyDataRaw = rows.map(mapRow);
      const facultyData = facultyDataRaw
        .filter(r => r.name && r.email && emailPattern.test(r.email))
        .map(r => ({
          name: r.name,
          email: r.email,
          school: r.school,
          department: r.department,
          designation: r.designation,
          employeeId: r.employeeId,
          phoneNo: r.phoneNo,
          batches: [],
          sections: [],
          subjects: [],
          initialPassword: 'faculty123',
          isActivated: false
        }));

      if (facultyData.length === 0) {
        alert('No valid rows found. Ensure headers match and emails are valid.');
        setUploading(false);
        return;
      }

      let successCount = 0;
      for (const f of facultyData) {
        try {
          const run = onAddFaculty(f);
          await Promise.race([
            run,
            new Promise(resolve => setTimeout(resolve, 2500))
          ]);
          successCount++;
        } catch (e) {
          // fallback local save
          const local = { id: Math.random().toString(36).slice(2), ...f, createdAt: new Date() } as Faculty;
          try { LocalStorageService.addFaculty(local); } catch {}
          try { await optimizedFirebase.saveData('faculty', local, local.id); } catch {}
          successCount++;
        }
      }

      alert(`Successfully imported ${successCount} of ${facultyData.length} rows.`);
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to process file. Please ensure it is a valid .xlsx, .xls, or .csv.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Management</h1>
          <p className="text-gray-600 mt-2">Manage faculty profiles and academic information</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleAddFaculty}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Faculty
          </button>
          <button
            onClick={handleUploadExcel}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Excel
          </button>
           <button
             onClick={handleRemoveDuplicates}
             className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
           >
             <Trash2 className="w-5 h-5" />
             Remove Duplicates
           </button>
           <button
             onClick={() => {
               if (confirm('This will clear all data and reinitialize. Continue?')) {
                 localStorage.clear();
                 window.location.reload();
               }
             }}
             className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
           >
             🔄 Reset Data
           </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <p className="text-gray-700">
          Total faculty loaded: {faculty.length} | Filtered: {filteredFaculty.length}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
            <select
              value={selectedSchool}
              onChange={(e) => { setSelectedSchool(e.target.value); setSelectedDepartment(''); setSelectedBatch(''); setSelectedSection(''); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select School</option>
              {schools.map(school => (
                <option key={school.id} value={school.name}>{school.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => { setSelectedDepartment(e.target.value); setSelectedBatch(''); setSelectedSection(''); }}
              disabled={!selectedSchool}
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
              value={selectedBatch}
              onChange={(e) => { setSelectedBatch(e.target.value); setSelectedSection(''); }}
              disabled={!selectedSchool}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">All Batches</option>
              {allBatches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedSchool}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">All Sections</option>
              {['A', 'B', 'C', 'D'].map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search faculty by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {(selectedSchool || selectedDepartment || selectedBatch || selectedSection || searchTerm) && (
            <button
              type="button"
              onClick={() => { setSelectedSchool(''); setSelectedDepartment(''); setSelectedBatch(''); setSelectedSection(''); setSearchTerm(''); }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="mt-3 text-sm text-gray-700">
          Showing faculty from: {selectedSchool || 'All Schools'}
          <span className="float-right">Faculty: {filteredFaculty.length}</span>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No faculty found
                  </td>
                </tr>
              ) : (
                 filteredFaculty.map((faculty) => (
                  <tr key={faculty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{filteredFaculty.indexOf(faculty) + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{faculty.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faculty.designation || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faculty.employeeId || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faculty.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faculty.phoneNo || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faculty.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faculty.school}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                         <button
                           onClick={() => alert('Edit Faculty functionality will be implemented')}
                           className="text-purple-600 hover:text-purple-900 p-1 rounded"
                           title="Edit faculty"
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this faculty member?')) {
                              onDeleteFaculty(faculty.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete faculty"
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

       {/* Upload Modal */}
       {showUploadModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Faculty Excel</h3>
             <p className="text-sm text-gray-600 mb-4">
               Upload a CSV file with columns: S.No, Faculty Name, Designation, Employee ID, Email ID, Phone No, Department, School
             </p>
             
             <div className="mb-4 p-3 bg-blue-50 rounded-lg">
               <p className="text-sm text-blue-800 mb-2">Need a sample file?</p>
               <a
                 href="/faculty_sample_data.csv"
                 download="faculty_sample_data.csv"
                 className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
               >
                 📥 Download Sample CSV File
               </a>
             </div>
             
             <input
               type="file"
               accept=".csv"
               onChange={handleFileSelect}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
             />
             <div className="flex gap-3">
              <button
                 onClick={() => setShowUploadModal(false)}
                 className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
               >
                 Cancel
               </button>
               <button
                onClick={handleFileUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
               >
                {uploading ? 'Uploading...' : (selectedFile ? `Upload ${selectedFile.name}` : 'Select File First')}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Add Faculty Modal */}
       {showAddModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Faculty</h3>
            {Object.keys(errors).length > 0 && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
                Please fix the highlighted fields before submitting.
              </div>
            )}
             <form onSubmit={handleFormSubmit} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name *</label>
                   <input
                     type="text"
                     value={formData.name}
                     onChange={(e) => handleFormChange('name', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Enter faculty name"
                     required
                   />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                   <select
                     value={formData.designation}
                     onChange={(e) => handleFormChange('designation', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   >
                     <option value="">Select Designation</option>
                     <option value="Professor">Professor</option>
                     <option value="Associate Professor">Associate Professor</option>
                     <option value="Assistant Professor">Assistant Professor</option>
                     <option value="Lecturer">Lecturer</option>
                   </select>
                  {errors.designation && <p className="mt-1 text-xs text-red-600">{errors.designation}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                   <input
                     type="text"
                     value={formData.employeeId}
                     onChange={(e) => handleFormChange('employeeId', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="e.g., EMP001"
                     required
                   />
                  {errors.employeeId && <p className="mt-1 text-xs text-red-600">{errors.employeeId}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Email ID *</label>
                   <input
                     type="email"
                     value={formData.email}
                     onChange={(e) => handleFormChange('email', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="faculty@univ.edu"
                     required
                   />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Phone No</label>
                   <input
                     type="tel"
                     value={formData.phoneNo}
                     onChange={(e) => handleFormChange('phoneNo', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="+91 9876543210"
                   />
                  {errors.phoneNo && <p className="mt-1 text-xs text-red-600">{errors.phoneNo}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                   <select
                     value={formData.department}
                     onChange={(e) => handleFormChange('department', e.target.value)}
                     disabled={!formData.school}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                     required
                   >
                     <option value="">{formData.school ? 'Select Department' : 'Select School first'}</option>
                     {formData.school && schools.find(s => s.name === formData.school)?.departments.map(dept => (
                       <option key={dept} value={dept}>{dept}</option>
                     ))}
                   </select>
                  {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department}</p>}
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
                   <select
                     value={formData.school}
                     onChange={(e) => {
                       handleFormChange('school', e.target.value);
                       handleFormChange('department', ''); // Reset department when school changes
                     }}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   >
                     <option value="">Select School</option>
                     {schools.map(school => (
                       <option key={school.id} value={school.name}>{school.name}</option>
                     ))}
                   </select>
                  {errors.school && <p className="mt-1 text-xs text-red-600">{errors.school}</p>}
                 </div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                 <button
                   type="button"
                   onClick={() => setShowAddModal(false)}
                   className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                 >
                  {isSubmitting ? 'Adding...' : 'Add Faculty'}
                 </button>
                 <button
                   type="button"
                   onClick={() => {
                     console.log('Test button clicked');
                     console.log('Current form data:', formData);
                     alert('Test button clicked - check console for form data');
                   }}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                 >
                   Test
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
}
