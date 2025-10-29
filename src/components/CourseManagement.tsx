import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, School, Upload, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { Course, Faculty, Student } from '../types';
import { schools, School as SchoolType } from '../data/schools';
import { LocalStorageService } from '../lib/localStorage';
import * as XLSX from 'xlsx';

interface CourseManagementProps {
  courses: Course[];
  faculty: Faculty[];
  students: Student[];
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  onUpdateCourse: (id: string, course: Partial<Course>) => void;
  onDeleteCourse: (id: string) => void;
}

export function CourseManagement({ courses, faculty, students, onAddCourse, onUpdateCourse, onDeleteCourse }: CourseManagementProps) {
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
  const [coSearch, setCoSearch] = useState('');
  const filteredCOs = useMemo(() => {
    const q = coSearch.trim().toLowerCase();
    if (!q) return coOptions;
    return coOptions.filter(o =>
      o.coCode.toLowerCase().includes(q) || (o.coName || '').toLowerCase().includes(q)
    );
  }, [coOptions, coSearch]);
  const [facultySearch, setFacultySearch] = useState('');

  // Local PO option entry helpers (manual add)
  const [newPO, setNewPO] = useState({ poCode: '', poName: '' });
  // No selection dropdown state now
  const [showPOManagementModal, setShowPOManagementModal] = useState(false);
  const [poMgmtOptions, setPoMgmtOptions] = useState<{ poCode: string; poName: string }[]>([]);
  const [editingPOIndex, setEditingPOIndex] = useState<number | null>(null);
  const [editPOForm, setEditPOForm] = useState<{ poCode: string; poName: string }>({ poCode: '', poName: '' });
  const [poSearch, setPoSearch] = useState('');

  // Batch options (synced with Student Management via LocalStorageService)
  const [batchOptions, setBatchOptions] = useState<string[]>([]);

  // Advanced filters (must be declared before effects that reference them)
  const [filterSchoolId, setFilterSchoolId] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterBatch, setFilterBatch] = useState<string>('');
  const [filterSemester, setFilterSemester] = useState<string>('');

  // Excel import modal state (for bulk course upload)
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  
  // Clear all courses modal state
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  
  // Remove duplicates modal state
  const [showRemoveDuplicatesModal, setShowRemoveDuplicatesModal] = useState(false);
  const [duplicateCourses, setDuplicateCourses] = useState<Course[]>([]);

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
      let batches = LocalStorageService.getBatchOptions(formData.department) || [];
      // Fallback: derive from existing students if none stored yet
      if ((!batches || batches.length === 0) && students && students.length > 0) {
        batches = Array.from(new Set(
          students
            .filter(s => s.department === formData.department && s.batch)
            .map(s => s.batch)
        )).sort();
      }
      setBatchOptions(batches);
    }
  }, [showModal, formData.department, students]);

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
      // De-duplicate by poCode (case-insensitive)
      const unique: { [k: string]: { poCode: string; poName: string } } = {};
      ops.forEach(o => {
        const key = (o.poCode || '').trim().toLowerCase();
        if (key && !unique[key]) unique[key] = o;
      });
      setPoMgmtOptions(Object.values(unique));
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

  // Clear faculty selection when department changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, facultyId: '', facultyName: '' }));
  }, [formData.department]);

  const departmentListForSelectedSchool = useMemo(() => {
    if (!filterSchoolId) return [] as string[];
    const school = schools.find(s => s.id === filterSchoolId);
    return school?.departments || [];
  }, [filterSchoolId]);

  // Faculty dropdown: show all faculty, with same-department faculty sorted first
  const availableFaculty = useMemo(() => {
    const all = Array.isArray(faculty) ? [...faculty] : [];
    const dept = formData.department;
    if (!dept) return all;
    return all.sort((a, b) => {
      const aMatch = a.department === dept ? 0 : 1;
      const bMatch = b.department === dept ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [faculty, formData.department]);

  const filteredFaculty = useMemo(() => {
    const q = facultySearch.trim().toLowerCase();
    if (!q) return availableFaculty;
    return availableFaculty.filter(f =>
      (f.name || '').toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q)
    );
  }, [availableFaculty, facultySearch]);

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

    if (filterBatch) {
      base = base.filter(c => (c as any).batch === filterBatch);
    }

    if (filterSemester) {
      base = base.filter(c => String(c.semester) === String(filterSemester));
    }

    // Keep existing search behavior
    return base.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.department.toLowerCase().includes(searchTerm.toLowerCase())
  );
  }, [courses, filterSchoolId, filterDepartment, filterBatch, filterSemester, searchTerm]);

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
    // For new course creation, start with NO pre-filled COs
    setCoOptions([]);
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

  // Excel helpers
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setExcelFile(file);
    setExcelData([]);
    setUploadStatus('idle');
    setUploadMessage('');
  };

  const resolveFaculty = (value: string) => {
    const q = String(value || '').toLowerCase().trim();
    if (!q) return null;
    return (faculty || []).find(f => (f.name || '').toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q)) || null;
  };

  const normalizeDepartment = (value: string) => String(value || '').trim();
  const normalizeBatch = (value: string) => {
    const v = String(value || '').trim();
    if (!v) return '';
    const fullYears = v.match(/\b(20\d{2})\D+(20\d{2})\b/);
    if (fullYears) {
      const start = fullYears[1];
      const endYY = fullYears[2].slice(2);
      return `${start}-${endYY}`;
    }
    const canonical = v.match(/^20\d{2}-\d{2}$/);
    if (canonical) return v;
    const short = v.match(/^(\d{2})\s*[-–to]+\s*(\d{2})$/i);
    if (short) {
      return `20${short[1]}-${short[2]}`;
    }
    return v;
  };

  const processExcelFile = () => {
    if (!excelFile) return;
    setUploadStatus('processing');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames;
        const collected: any[] = [];
        let totalRows = 0;

        sheetNames.forEach((name) => {
          const sheet = workbook.Sheets[name];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          totalRows += rows.length + 1; // incl header approx
          rows.forEach((r, idx) => {
            const code = String(r['Course Code'] || r['Code'] || '').trim();
            const name = String(r['Course Name'] || r['Name'] || '').trim();
            const department = normalizeDepartment(r['Department']);
            const batch = normalizeBatch(r['Batch'] || r['Select batch']);
            const semesterRaw = r['Semester'];
            const creditsRaw = r['Credits'];
            const facultyLookup = String(r['Faculty Name'] || r['Faculty'] || r['Faculty Email'] || '').trim();

            const semester = parseInt(String(semesterRaw).trim(), 10);
            const credits = parseInt(String(creditsRaw).trim(), 10);
            const fac = resolveFaculty(facultyLookup);

            const errors: string[] = [];
            if (!code) errors.push('Course Code');
            if (!name) errors.push('Course Name');
            if (!department) errors.push('Department');
            if (!batch) errors.push('Batch');
            if (!(semester >= 1 && semester <= 8)) errors.push('Semester(1-8)');
            if (!(credits >= 1 && credits <= 6)) errors.push('Credits(1-6)');
            // Make faculty optional during import; if not found, keep provided text in facultyName

            if (errors.length === 0) {
              collected.push({
                code,
                name,
                department,
                batch,
                semester,
                credits,
                facultyId: fac?.id,
                facultyName: fac?.name || facultyLookup || '',
                poOptions: [],
                selectedPOs: [],
                coOptions: []
              });
            }
          });
        });

        setExcelData(collected);
        setUploadStatus('success');
        setUploadMessage(`Parsed ${collected.length} valid course(s) from ${sheetNames.length} sheet(s). Rows without strict faculty match were kept with provided faculty text.`);
      } catch (err) {
        setUploadStatus('error');
        setUploadMessage('Failed to parse Excel. Verify columns and data.');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(excelFile);
  };

  const importCourses = async () => {
    if (excelData.length === 0) return;
    try {
      setUploadStatus('processing');
      setUploadMessage('Importing courses...');
      for (const c of excelData) {
        await onAddCourse(c);
      }
      setUploadStatus('success');
      setUploadMessage(`Successfully imported ${excelData.length} courses.`);
      setTimeout(() => {
        setShowExcelModal(false);
        setExcelData([]);
        setExcelFile(null);
        setUploadStatus('idle');
        setUploadMessage('');
      }, 1500);
    } catch (e) {
      setUploadStatus('error');
      setUploadMessage('Failed to import some courses. See console.');
      console.error(e);
    }
  };

  const downloadCourseTemplate = () => {
    const templateData = [
      {
        'Course Code': 'CSE101',
        'Course Name': 'Data Structures and Algorithms',
        'Department': 'Computer Science and Engineering',
        'Batch': '2023-27',
        'Semester': 3,
        'Credits': 4,
        'Faculty Name': 'Dr. Abc (or email)'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, 'course_template.xlsx');
  };

  const handleClearAllCourses = () => {
    // Delete all courses one by one
    courses.forEach(course => {
      onDeleteCourse(course.id);
    });
    setShowClearAllModal(false);
  };

  const findDuplicateCourses = () => {
    const seen = new Set<string>();
    const duplicates: Course[] = [];
    
    courses.forEach(course => {
      const key = `${course.code}|${course.name}`.toLowerCase();
      if (seen.has(key)) {
        duplicates.push(course);
      } else {
        seen.add(key);
      }
    });
    
    setDuplicateCourses(duplicates);
    setShowRemoveDuplicatesModal(true);
  };

  const removeDuplicateCourses = () => {
    duplicateCourses.forEach(course => {
      onDeleteCourse(course.id);
    });
    setShowRemoveDuplicatesModal(false);
    setDuplicateCourses([]);
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
    // Load course-specific COs if present; otherwise start with empty
    if ((course as any).coOptions && (course as any).coOptions.length > 0) {
      setCoOptions((course as any).coOptions);
    } else {
      setCoOptions([]);
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
    // Enforce uniqueness by code OR title
    const dup = poMgmtOptions.find(o => o.poCode.toLowerCase() === code.toLowerCase() || o.poName.toLowerCase() === name.toLowerCase());
    if (dup) {
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
    // Enforce uniqueness by code or title, excluding the item being edited
    const duplicate = poMgmtOptions.some((o, i) => i !== editingPOIndex && (o.poName.toLowerCase() === name.toLowerCase() || o.poCode.toLowerCase() === code.toLowerCase()));
    if (duplicate) return;
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
            onClick={() => setShowExcelModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Excel
          </button>
          <button
            onClick={findDuplicateCourses}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            Remove Duplicates
          </button>
          <button
            onClick={() => setShowClearAllModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Clear All Courses
          </button>
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
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
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

          {/* Batch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              disabled={!filterSchoolId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
            >
              <option value="">All Batches</option>
              {Array.from(new Set(courses
                .filter(c => !filterDepartment || c.department === filterDepartment)
                .map(c => (c as any).batch)))
                .filter(Boolean)
                .sort()
                .map(b => (
                  <option key={b as string} value={b as string}>{b as string}</option>
                ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              disabled={!filterSchoolId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
            >
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => (
                <option key={s} value={String(s)}>{s}</option>
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
          <div className="lg:col-span-5 flex justify-end">
            <button
              type="button"
              onClick={() => { setFilterSchoolId(''); setFilterDepartment(''); setFilterBatch(''); }}
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

      {/* Course Count Display */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total courses loaded: <span className="font-semibold text-gray-900">{courses.length}</span> | 
            Filtered: <span className="font-semibold text-gray-900">{filteredCourses.length}</span> | 
            Total credits (filtered): <span className="font-semibold text-gray-900">{filteredCourses.reduce((sum, c) => sum + (c.credits || 0), 0)}</span>
          </div>
          {filteredCourses.length !== courses.length && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Filters active
            </div>
          )}
        </div>
      </div>

      {/* Excel Upload Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Upload Courses from Excel</h3>
              </div>
              <button onClick={() => setShowExcelModal(false)} className="text-gray-600 hover:text-gray-800">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600">
                Expected columns: <strong>Course Code</strong>, <strong>Course Name</strong>, <strong>Department</strong>, <strong>Batch</strong>, <strong>Semester</strong>, <strong>Credits</strong>, <strong>Faculty Name</strong> (or email). CO mapping is excluded.
              </div>
              <div className="flex items-center gap-3">
                <input type="file" accept=".xlsx,.xls" onChange={handleExcelFileChange} />
                <button onClick={downloadCourseTemplate} className="px-3 py-2 text-sm bg-gray-100 rounded border">Download Template</button>
                <button onClick={processExcelFile} disabled={!excelFile} className={`px-3 py-2 text-sm rounded ${excelFile ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-100 text-gray-400'}`}>Process File</button>
              </div>
              {uploadMessage && (
                <div className={`text-sm ${uploadStatus === 'error' ? 'text-red-600' : uploadStatus === 'processing' ? 'text-blue-600' : 'text-green-700'}`}>{uploadMessage}</div>
              )}
              {excelData.length > 0 && (
                <div className="text-sm text-gray-700">Ready to import <strong>{excelData.length}</strong> course(s).</div>
              )}
            </div>
            <div className="p-6 border-t bg-white flex justify-end gap-3">
              <button onClick={() => setShowExcelModal(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
              <button onClick={importCourses} disabled={excelData.length === 0} className={`px-4 py-2 rounded ${excelData.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>Import Courses</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Courses Confirmation Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Clear All Courses</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete all {courses.length} courses? This action cannot be undone.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This will permanently remove all course data including COs, POs, and faculty assignments.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllCourses}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete All Courses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Duplicates Confirmation Modal */}
      {showRemoveDuplicatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Remove Duplicate Courses</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Found <strong>{duplicateCourses.length}</strong> duplicate courses based on Course Code + Course Name combination.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-700">
                  <strong>Note:</strong> Duplicates are identified by matching Course Code and Course Name. The first occurrence will be kept, duplicates will be removed.
                </p>
              </div>
              {duplicateCourses.length > 0 && (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700">
                      <div>Course Code</div>
                      <div>Course Name</div>
                      <div>Department</div>
                    </div>
                  </div>
                  {duplicateCourses.map((course, index) => (
                    <div key={course.id} className="px-4 py-2 border-b border-gray-100 last:border-b-0">
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-900">
                        <div className="font-medium">{course.code}</div>
                        <div>{course.name}</div>
                        <div>{course.department}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowRemoveDuplicatesModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={removeDuplicateCourses}
                disabled={duplicateCourses.length === 0}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  duplicateCourses.length === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                Remove {duplicateCourses.length} Duplicates
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-6">
                {/* Top row: Course Code, Course Name, Department, Batch */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                    <select
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 text-sm"
                    >
                      <option value="">{(batchOptions || []).length === 0 ? 'No batches (create in Student Management)' : 'Select batch'}</option>
                      {(batchOptions || []).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Batches are managed in Student Management.</p>
                  </div>
                </div>


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
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={facultySearch}
                        onChange={(e) => setFacultySearch(e.target.value)}
                        placeholder="Search name or email (e.g., jain)"
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={!formData.department}
                      />
                      <select
                        required
                        value={formData.facultyId}
                        onChange={(e) => {
                          const selectedFaculty = filteredFaculty.find(f => f.id === e.target.value);
                          setFormData({ 
                            ...formData, 
                            facultyId: e.target.value,
                            facultyName: selectedFaculty?.name || ''
                          });
                        }}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={!formData.department || filteredFaculty.length === 0}
                      >
                        <option value="">
                          {!formData.department 
                            ? "Select department first" 
                            : filteredFaculty.length === 0 
                              ? "No matching faculty" 
                              : "Select faculty member"
                          }
                        </option>
                        {filteredFaculty.map(faculty => (
                          <option key={faculty.id} value={faculty.id}>
                            {faculty.name} ({faculty.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.department && availableFaculty.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        No faculty members found for {formData.department}. 
                        <br />
                        Add faculty members in Faculty Management first.
                      </p>
                    )}
                  </div>
                </div>

              {/* Inline CO creation inside Add Course - compact, scrollable */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700">Course Outcomes (CO) Options</label>
                    <span className="text-xs text-gray-600">{coOptions.length} COs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={coSearch}
                      onChange={(e) => setCoSearch(e.target.value)}
                      placeholder="Search COs"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
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
                  {filteredCOs.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {filteredCOs.map((o, idx) => (
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
                  {formData.department && filteredCOs.length === 0 && (
                    <div className="mt-2 text-xs text-gray-500">No COs yet for {formData.department}. Add above.</div>
                  )}
                </div>
              </div>

              {/* PO mapping removed from here; managed via external modal */}
              </div>
              <div className="p-4 border-t bg-white flex justify-end gap-3">
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

              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-gray-600">POs created for this program</label>
                <input
                  type="text"
                  value={poSearch}
                  onChange={(e) => setPoSearch(e.target.value)}
                  placeholder="Search PO code or title"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {poMgmtOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Manage PO Options:</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {poMgmtOptions
                      .filter(o => {
                        const q = poSearch.trim().toLowerCase();
                        if (!q) return true;
                        return o.poCode.toLowerCase().includes(q) || (o.poName || '').toLowerCase().includes(q);
                      })
                      .map((o, idx) => (
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