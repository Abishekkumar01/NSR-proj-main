import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Plus, Upload, Search } from 'lucide-react';
import { Faculty } from '../types';
import { schools } from '../data/schools';
import { allBatches } from '../data/faculty';

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
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.designation.trim() || !formData.employeeId.trim()) {
      console.log('Validation failed: missing required fields');
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.school || !formData.department) {
      console.log('Validation failed: missing school or department');
      alert('Please select both school and department');
      return;
    }

    try {
      const newFaculty = {
        ...formData,
        batches: [],
        sections: [],
        subjects: [],
        initialPassword: 'Temp@123',
        isActivated: false
      };

      console.log('Submitting faculty:', newFaculty);
      await onAddFaculty(newFaculty);
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
    } catch (error) {
      console.error('Error adding faculty:', error);
      alert('Error adding faculty. Please try again.');
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a CSV file first');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
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

        const facultyData = lines.slice(1).map((line) => {
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

        if (facultyData.length === 0) {
          alert('No valid faculty data found in the file');
          return;
        }

        // Add faculty one by one and wait for each to complete
        let successCount = 0;
        console.log('Starting to add faculty data:', facultyData);
        for (const faculty of facultyData) {
          try {
            console.log('Adding faculty:', faculty.name);
            await onAddFaculty(faculty);
            successCount++;
            console.log('Successfully added faculty:', faculty.name);
          } catch (error) {
            console.error('Error adding faculty:', faculty.name, error);
          }
        }

        alert(`Successfully imported ${successCount} out of ${facultyData.length} faculty members!`);
        setShowUploadModal(false);
        setSelectedFile(null);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Error parsing Excel file. Please check the format.');
      }
    };
    reader.readAsText(selectedFile);
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
                 disabled={!selectedFile}
                 className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
               >
                 {selectedFile ? `Upload ${selectedFile.name}` : 'Select File First'}
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
                   onClick={(e) => {
                     console.log('Submit button clicked');
                     console.log('Form data at click:', formData);
                   }}
                   className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                 >
                   Add Faculty
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
