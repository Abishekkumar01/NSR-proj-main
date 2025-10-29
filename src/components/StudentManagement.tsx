import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users, School, Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Student, Faculty } from '../types';
import { schools, School as SchoolType } from '../data/schools';
import { getSchoolFromDepartment } from '../lib/schoolMapping';
import { LocalStorageService } from '../lib/localStorage';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

interface StudentManagementProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  faculty?: Faculty[];
  semesterMode?: boolean;
}

export function StudentManagement({ students, onAddStudent, onUpdateStudent, onDeleteStudent, faculty = [], semesterMode = false }: StudentManagementProps) {
  const { user } = useAuth();
  // Normalize batch strings to the canonical "YYYY-YY" format for consistent display and storage
  const normalizeBatchDisplay = (value: string): string => {
    const v = String(value || '').trim();
    if (!v) return '';
    // Matches formats like 2023 - 2027 -> 2023-27
    const fullYears = v.match(/\b(20\d{2})\D+(20\d{2})\b/);
    if (fullYears) {
      const start = fullYears[1];
      const endYY = fullYears[2].slice(2);
      return `${start}-${endYY}`;
    }
    // Already in YYYY-YY
    const canonical = v.match(/^20\d{2}-\d{2}$/);
    if (canonical) return v;
    // Short form like 22-26 -> 2022-26 for display
    const short = v.match(/^(\d{2})\s*[-–to]+\s*(\d{2})$/i);
    if (short) {
      return `20${short[1]}-${short[2]}`;
    }
    return v;
  };
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
  const [importDefaults, setImportDefaults] = useState({
    department: '',
    batch: '',
    section: '',
    semester: 1
  });
  const [skippedRows, setSkippedRows] = useState<any[]>([]);
  const [showSkipped, setShowSkipped] = useState(false);
  const [duplicateRows, setDuplicateRows] = useState<any[]>([]);
  const [filterSemester, setFilterSemester] = useState<number | ''>(semesterMode ? 1 : '');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
  const [showOutsideModal, setShowOutsideModal] = useState(false);
  const [isBulkCopying, setIsBulkCopying] = useState(false);
  const [bulkCopyMessage, setBulkCopyMessage] = useState('');
  const [copyTargetSemester, setCopyTargetSemester] = useState<number>(2);
  const [sortKey, setSortKey] = useState<'name' | 'enrollmentNumber' | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
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
    section: '',
    mobile: ''
  });

  // Batch management state
  const [batchOptions, setBatchOptions] = useState<string[]>([]);
  const [newBatch, setNewBatch] = useState('');
  const [newBatchEnd, setNewBatchEnd] = useState('');

  // Load batch options when department changes
  useEffect(() => {
    if (formData.department) {
      const batches = LocalStorageService.getBatchOptions(formData.department) || [];
      setBatchOptions(batches);
    }
  }, [formData.department]);

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

  // Populate Batch options for Admin filters based on current selection and loaded students
  useEffect(() => {
    if (user?.role !== 'admin') return;
    if (!filterSchoolId) {
      setBatchOptions([]);
      return;
    }
    const school = schools.find(s => s.id === filterSchoolId);
    const schoolName = school?.name;
    const allowedDepartments = new Set((school?.departments || []));

    const eligible = students.filter(s => {
      const inSchool = (s.school === schoolName) || (s.department && allowedDepartments.has(s.department));
      if (!inSchool) return false;
      if (filterDepartment && s.department !== filterDepartment) return false;
      return !!s.batch;
    });

    const batches = Array.from(new Set(eligible.map(s => normalizeBatchDisplay(s.batch)))).sort();
    setBatchOptions(batches);
  }, [user, filterSchoolId, filterDepartment, students]);

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

      // Semester filter (optional)
      if (filterSemester && Number(student.semester) !== Number(filterSemester)) return false;

      return true;
    });

    // Apply existing name/roll/department search without disrupting behavior
    return byAdvanced.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [facultyFilteredStudents, students, user, filterSchoolId, filterDepartment, filterBatch, filterSection, filterSemester, searchTerm]);

  const displayStudents = useMemo(() => {
    if (!sortKey) return filteredStudents;
    const list = [...filteredStudents];
    const compare = (a: any, b: any): number => {
      if (sortKey === 'name') {
        const na = String(a.name || '').toLowerCase();
        const nb = String(b.name || '').toLowerCase();
        return na.localeCompare(nb);
      }
      const ea = parseInt(String(a.enrollmentNumber || '').replace(/\D+/g, ''), 10) || 0;
      const eb = parseInt(String(b.enrollmentNumber || '').replace(/\D+/g, ''), 10) || 0;
      return ea - eb;
    };
    list.sort(compare);
    if (sortDir === 'desc') list.reverse();
    return list;
  }, [filteredStudents, sortKey, sortDir]);

  const toggleSort = (key: 'name' | 'enrollmentNumber') => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    }
  };

  const copyCurrentStudentsToOtherSemesters = async () => {
    if (!semesterMode) return;
    if (!filterBatch) {
      setBulkCopyMessage('Select a batch first.');
      return;
    }
    const currentSem = Number(filterSemester || 1);
    const targets = [1,2,3,4,5,6,7,8].filter(s => s !== currentSem);
    const list = filteredStudents;
    if (list.length === 0) {
      setBulkCopyMessage('No students in the current filter to copy.');
      return;
    }
    setIsBulkCopying(true);
    try {
      let created = 0;
      for (const targetSem of targets) {
        for (const s of list) {
          const exists = students.some(x => (x.enrollmentNumber || '').toLowerCase() === (s.enrollmentNumber || '').toLowerCase() && x.batch === filterBatch && Number(x.semester) === Number(targetSem));
          if (exists) continue;
          const payload = {
            rollNumber: s.rollNumber,
            name: s.name,
            email: s.email || '',
            department: s.department,
            school: s.school,
            batch: filterBatch,
            semester: targetSem,
            enrollmentNumber: s.enrollmentNumber,
            section: s.section,
            mobile: (s as any).mobile
          } as Omit<Student, 'id' | 'createdAt'>;
          await onAddStudent(payload);
          created++;
        }
      }
      setBulkCopyMessage(`Copied ${list.length} students to ${targets.length} semesters. Created ${created} records.`);
    } catch (e) {
      console.error(e);
      setBulkCopyMessage('Failed to copy students.');
    } finally {
      setIsBulkCopying(false);
    }
  };

  const copyCurrentStudentsToSemester = async (targetSem: number) => {
    if (!semesterMode) return;
    if (!filterBatch || !filterSemester) {
      setBulkCopyMessage('Select batch and source semester first.');
      return;
    }
    if (Number(filterSemester) === Number(targetSem)) {
      setBulkCopyMessage('Source and target semesters are the same.');
      return;
    }
    const list = filteredStudents;
    if (list.length === 0) {
      setBulkCopyMessage('No students in the current filter to copy.');
      return;
    }
    setIsBulkCopying(true);
    try {
      let created = 0;
      for (const s of list) {
        const exists = students.some(x => (x.enrollmentNumber || '').toLowerCase() === (s.enrollmentNumber || '').toLowerCase() && x.batch === filterBatch && Number(x.semester) === Number(targetSem));
        if (exists) continue;
        const payload = {
          rollNumber: s.rollNumber,
          name: s.name,
          email: s.email || '',
          department: s.department,
          school: s.school,
          batch: filterBatch,
          semester: targetSem,
          enrollmentNumber: s.enrollmentNumber,
          section: s.section,
          mobile: (s as any).mobile
        } as Omit<Student, 'id' | 'createdAt'>;
        await onAddStudent(payload);
        created++;
      }
      setBulkCopyMessage(`Copied ${list.length} students from Sem ${String(filterSemester)} to Sem ${targetSem}. Created ${created} records.`);
    } catch (e) {
      console.error(e);
      setBulkCopyMessage('Failed to copy students.');
    } finally {
      setIsBulkCopying(false);
    }
  };

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
      section: '',
      mobile: ''
    });
    setEditingStudent(null);
    setShowModal(false);
    setSelectedSchool(null);
    setSelectedDepartment('');
    setNewBatch('');
    setNewBatchEnd('');
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
      section: student.section || '',
      mobile: (student as any).mobile || ''
    });
    
    // Load batch options for the student's department
    if (student.department) {
      const batches = LocalStorageService.getBatchOptions(student.department) || [];
      setBatchOptions(batches);
    }
    
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
        const sheetNames = workbook.SheetNames || [];

        const allProcessed: any[] = [];
        const allInvalid: any[] = [];
        const allDuplicates: any[] = [];
        const perSheetStats: { name: string; ok: number; skipped: number; totalRowsInclHeader: number }[] = [];

        const normalizeBatch = (value: string): string => {
          const v = String(value || '').trim();
          if (!v) return '';
          const years = v.match(/(20\d{2})\D+(20\d{2})/);
          if (years) {
            const start = years[1];
            const end = years[2].slice(2);
            return `${start}-${end}`;
          }
          const short = v.match(/\b(\d{2})\s*[-–to]+\s*(\d{2})\b/i);
          if (short) {
            return `20${short[1]}-20${short[2]}`.replace(/^(20\d{2})-(20(\d{2}))$/, (_m, s, _e, ee) => `${s}-${ee}`);
          }
          const single = v.match(/\b(20\d{2})\b/);
          if (single) {
            const start = single[1];
            const endYY = String((parseInt(start, 10) + 4)).slice(2);
            return `${start}-${endYY}`;
          }
          return v;
        };

        const parseBatchFromSheetName = (name: string): string => {
          // e.g., "Batch 2022-2026", "Batch 2023-2027"
          const m = name.match(/batch\s*(.*)$/i);
          if (!m) return '';
          return normalizeBatch(m[1]);
        };

        const processOneSheet = (sheetName: string) => {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) return;

          // Read as 2D array to robustly detect header row
          const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, raw: false }) as any[];
          const totalRowsInclHeader = rows.length; // includes header row

          // Helper to normalize header text
          const norm = (v: any) => String(v || '').trim().replace(/\s+/g, ' ').toLowerCase();

        // Known header aliases
        const headerAliases: { [key: string]: string[] } = {
          enrollment: ['enrollment no.', 'enrolment no.', 'enrollment number', 'enrolment number', 'enrollment', 'enrolment', 'univ roll no.', 'university roll no.', 'univ roll no', 'university roll no', 'urn', 'enroll no', 'enroll number'],
          name: ['name', 'student name', 'full name', 'candidate name', "student's name", 'name of student'],
          department: ['department', 'dept', 'program', 'programme', 'branch', 'course'],
          batch: ['batch', 'batch year', 'session', 'batch (from-to)', 'batch (start-end)'],
          section: ['section', 'sec'],
          email: ['email', 'email id', 'e-mail'],
          mobile: ['mobile', 'mobile no.', 'mobile no', 'phone', 'phone number', 'contact', 'contact no.']
        };

          const allAliases = new Map<string, string>();
          Object.entries(headerAliases).forEach(([key, aliases]) => {
            aliases.forEach(a => allAliases.set(norm(a), key));
          });

        // Find header row: the row that matches at least 2 known headers (more tolerant)
          let headerRowIndex = -1;
          let colToField = new Map<number, string>();
          const maxScan = Math.min(rows.length, 20);
          for (let r = 0; r < maxScan; r++) {
            const row = Array.isArray(rows[r]) ? rows[r] : [];
            const tempMap = new Map<number, string>();
            let matches = 0;
            row.forEach((cell: any, idx: number) => {
              const key = allAliases.get(norm(cell));
              if (key && !Array.from(tempMap.values()).includes(key)) {
                tempMap.set(idx, key);
                matches++;
              }
            });
            if (matches >= 2) {
              headerRowIndex = r;
              colToField = tempMap;
              break;
            }
          }

        // Fuzzy fallback: if still not found, try to infer header from first non-empty row
          if (headerRowIndex === -1) {
            for (let r = 0; r < Math.min(rows.length, 10); r++) {
              const row = Array.isArray(rows[r]) ? rows[r] : [];
              if (!row || row.every((c: any) => !String(c || '').trim())) continue;
              const temp = new Map<number, string>();
              row.forEach((cell: any, idx: number) => {
                const text = norm(cell);
                if (!text) return;
                const mapByKeyword = (
                  text.includes('enrol') || text.includes('univ roll') || text.includes('urn')
                ) ? 'enrollment'
                  : text.includes('name') ? 'name'
                  : (text.includes('dept') || text.includes('program') || text.includes('programme') || text.includes('branch') || text.includes('course')) ? 'department'
                  : text.includes('batch') || text.includes('session') ? 'batch'
                  : text.includes('section') || text === 'sec' ? 'section'
                  : text.includes('email') ? 'email'
                  : (text.includes('mobile') || text.includes('phone') || text.includes('contact')) ? 'mobile'
                  : '';
                if (mapByKeyword && !Array.from(temp.values()).includes(mapByKeyword)) {
                  temp.set(idx, mapByKeyword);
                }
              });
              if (temp.size >= 2) {
                headerRowIndex = r;
                colToField = temp;
                break;
              }
            }
          }

          if (headerRowIndex === -1) {
            throw new Error('Could not detect header row. Please include recognizable headers (e.g., Name, Enrollment No., Department, Batch).');
          }

        // Build processed data from rows after header
          const bodyRows = rows.slice(headerRowIndex + 1);

        // Helpers
          const getField = (row: any[], field: string): string => {
            for (const [colIdx, mappedField] of colToField.entries()) {
              if (mappedField === field) {
                return String(row[colIdx] ?? '').trim();
              }
            }
            return '';
          };

        const normalizeEnrollment = (value: string): string => String(value || '').trim();

          const sheetBatchDefault = parseBatchFromSheetName(sheetName) || importDefaults.batch;

          const processedData = bodyRows
          .map((row: any[], idx: number) => {
            const enrollmentNumber = normalizeEnrollment(getField(row, 'enrollment'));
            const firstName = getField(row, 'first name');
            const lastName = getField(row, 'last name');
            const nameFromSplit = [firstName, lastName].filter(Boolean).join(' ').trim();
            const name = getField(row, 'name') || nameFromSplit;
            const departmentRaw = getField(row, 'department');
            const batchRaw = getField(row, 'batch');
              const batch = normalizeBatch(batchRaw) || sheetBatchDefault;
            const mobile = getField(row, 'mobile');
            const email = getField(row, 'email');
            const section = getField(row, 'section');

              const fallbackDepartment = departmentRaw || importDefaults.department || 'Computer Science & Engineering';
              const student = {
              rollNumber: String(idx + 1),
              name,
              email: email || '',
              enrollmentNumber,
              section: section || importDefaults.section || '-',
              department: fallbackDepartment,
                batch: batch,
              semester: Number(importDefaults.semester || 1),
              mobile,
                rowIndex: headerRowIndex + 2 + idx
            };

            const errors: string[] = [];
            if (!student.name) errors.push('Name');
            if (!student.enrollmentNumber) errors.push('Enrollment No.');
            // Do not block import on missing department; we auto-filled a sensible default
            if (!student.batch) errors.push('Batch');
              return { ...student, errors, __sheet: sheetName };
            })
          // Drop empty rows (no name and no enrollment)
            .filter((r: any) => r.name || r.enrollmentNumber);

        // Deduplicate by enrollment number
          const seen = new Set<string>();
          const localDuplicates: any[] = [];
          const deduped = processedData.filter(item => {
            const key = (item.enrollmentNumber || '').toLowerCase();
            if (!key) return false;
            if (seen.has(key)) { localDuplicates.push(item); return false; }
            seen.add(key);
            return item.errors.length === 0;
          });
          const invalidData = processedData.filter(item => item.errors.length > 0 || !item.enrollmentNumber);

          allProcessed.push(...deduped);
          allInvalid.push(...invalidData);
          perSheetStats.push({ name: sheetName, ok: deduped.length, skipped: invalidData.length + localDuplicates.length, totalRowsInclHeader });
          allDuplicates.push(...localDuplicates.map((d: any) => ({ ...d, reason: 'Duplicate within sheet' })));
        };

        // Process every sheet in the workbook
        sheetNames.forEach(name => processOneSheet(name));

        // Global dedupe across sheets by enrollment number
        const globalSeen = new Set<string>();
        const finalData = allProcessed.filter(item => {
          const key = (item.enrollmentNumber || '').toLowerCase();
          if (!key) return false;
          if (globalSeen.has(key)) { allDuplicates.push({ ...item, reason: 'Duplicate across sheets' }); return false; }
          globalSeen.add(key);
          return true;
        });

        setExcelData(finalData);
        setUploadStatus('success');
        const totalSkipped = allInvalid.length + allDuplicates.length;
        const overallRowsInclHeader = perSheetStats.reduce((sum, s) => sum + s.totalRowsInclHeader, 0);
        const per = perSheetStats.map(s => `${s.name}: ${s.ok} ok, ${s.skipped} skipped, ${s.totalRowsInclHeader} rows incl. header`).join(' | ');
        const defaultsUsed = (importDefaults.department || importDefaults.batch || importDefaults.section) ? ' Defaults applied to missing fields.' : '';
        if (finalData.length === 0 && totalSkipped > 0) {
          const sample = allInvalid.slice(0, 3).map((x: any) => `Row ${x.rowIndex}: missing ${x.errors.join(', ')}`).join('; ');
          setUploadMessage(`Processed 0 students across ${sheetNames.length} sheets. Skipped ${totalSkipped}. ${per}. Total rows incl. headers: ${overallRowsInclHeader}. Examples: ${sample}${allInvalid.length > 3 ? ' ...' : ''}${defaultsUsed}`);
        } else {
          setUploadMessage(`Processed ${finalData.length} students across ${sheetNames.length} sheets. Skipped ${totalSkipped}. ${per}. Total rows incl. headers: ${overallRowsInclHeader}.${defaultsUsed}`);
        }
        setSkippedRows(allInvalid);
        setDuplicateRows(allDuplicates);
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
            Total students loaded: {new Set(students.map(s => s.rollNumber)).size} | Filtered: {new Set(filteredStudents.map(s => s.rollNumber)).size}
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
          {user?.role === 'admin' && (
            <button
              onClick={async () => {
                if (isRemovingDuplicates) return;
                // Build duplicates by composite key: name + enrollment + batch (all non-empty)
                const normalize = (v: any) => String(v || '').trim().replace(/\s+/g, ' ').toLowerCase();
                const seen = new Set<string>();
                const duplicates: Student[] = [];
                students.forEach((s) => {
                  const name = normalize(s.name);
                  const enr = normalize(s.enrollmentNumber);
                  const batch = normalize((s as any).batch || s.batch);
                  if (!name || !enr || !batch) return; // require all 3 present
                  const key = `${name}__${enr}__${batch}`;
                  if (seen.has(key)) duplicates.push(s);
                  else seen.add(key);
                });

                if (duplicates.length === 0) {
                  window.alert('No duplicate students found where Name, Enrollment No., and Batch all match.');
                  return;
                }
                const confirm = window.confirm(`This will delete ${duplicates.length} duplicate entries (matching Name + Enrollment No. + Batch), keeping the first occurrence. Proceed?`);
                if (!confirm) return;

                setIsRemovingDuplicates(true);
                let deleted = 0;
                let failed = 0;
                for (const dup of duplicates) {
                  try {
                    await onDeleteStudent(dup.id);
                    deleted++;
                  } catch (e) {
                    failed++;
                  }
                }
                setIsRemovingDuplicates(false);
                window.alert(`Deleted ${deleted} duplicate entries.${failed ? ` ${failed} failed.` : ''}`);
              }}
              disabled={isRemovingDuplicates}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isRemovingDuplicates ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
              title="Remove duplicate students by Enrollment No."
            >
              <Trash2 className="w-5 h-5" />
              {isRemovingDuplicates ? 'Removing...' : 'Remove Duplicates'}
            </button>
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  {batchOptions.map((batch) => (
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

              {/* Semester Filter (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={String(filterSemester)}
                  onChange={(e) => setFilterSemester(e.target.value ? Number(e.target.value) : '')}
                  disabled={!filterSchoolId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={`sem-${s}`} value={s}>{`Sem ${s}`}</option>
                  ))}
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

          {/* Filter Information Display with dynamic counts */}
          {user?.role === 'admin' && filterSchoolId && (() => {
            const schoolObj = schools.find(s => s.id === filterSchoolId);
            const schoolName = schoolObj?.name || '';
            const inSchool = students.filter(s => (s.school || getSchoolFromDepartment(s.department)) === schoolName);
            const outsideSchool = students.filter(s => (s.school || getSchoolFromDepartment(s.department)) !== schoolName);
            const uniq = (arr: Student[]) => new Set(arr.map(s => s.rollNumber)).size;
            const countSchool = uniq(inSchool as any);
            const countDepartment = filterDepartment ? uniq(inSchool.filter(s => s.department === filterDepartment) as any) : 0;
            const baseForBatch = filterDepartment ? inSchool.filter(s => s.department === filterDepartment) : inSchool;
            const countBatch = filterBatch ? uniq(baseForBatch.filter(s => s.batch === filterBatch) as any) : 0;
            const baseForSection = filterBatch ? baseForBatch.filter(s => s.batch === filterBatch) : baseForBatch;
            const countSection = filterSection ? uniq(baseForSection.filter(s => (s.section || '-') === filterSection) as any) : 0;
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800 flex items-center justify-between gap-2">
                  <div>
                    <strong>Showing students from:</strong> {schoolName}
                    {filterDepartment && ` - ${filterDepartment}`}
                    {filterBatch && ` - Batch ${filterBatch}`}
                    {filterSection && ` - Section ${filterSection}`}
                    {searchTerm && ` (searching: "${searchTerm}")`}
                  </div>
                  <div className="shrink-0 flex items-center gap-3 text-xs">
                    <span>School: {countSchool}</span>
                    {filterDepartment && <span>| Dept: {countDepartment}</span>}
                    {filterBatch && <span>| Batch: {countBatch}</span>}
                    {filterSection && <span>| Section: {countSection}</span>}
                    {outsideSchool.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowOutsideModal(true)}
                        className="ml-3 px-2 py-1 rounded border border-blue-300 text-blue-800 bg-white hover:bg-blue-50"
                        title="View students that don't belong to this school"
                      >
                        {outsideSchool.length} outside
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {semesterMode && filterBatch && filterSemester && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Copy these {filteredStudents.length} students in batch <strong>{filterBatch}</strong> from Sem {String(filterSemester)}.
                </div>
                <button
                  type="button"
                  onClick={copyCurrentStudentsToOtherSemesters}
                  disabled={isBulkCopying || filteredStudents.length === 0}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isBulkCopying ? 'Copying...' : 'Copy to all other semesters'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700">Copy to semester</label>
                <select
                  value={String(copyTargetSemester)}
                  onChange={(e) => setCopyTargetSemester(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {[1,2,3,4,5,6,7,8].filter(s => Number(s) !== Number(filterSemester)).map(s => (
                    <option key={`copysem-${s}`} value={s}>{`Sem ${s}`}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => copyCurrentStudentsToSemester(copyTargetSemester)}
                  disabled={isBulkCopying || filteredStudents.length === 0}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isBulkCopying ? 'Copying...' : `Copy to Sem ${copyTargetSemester}`}
                </button>
              </div>
            </div>
          )}
          {bulkCopyMessage && (
            <div className="mt-2 text-xs text-blue-700">{bulkCopyMessage}</div>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  <button type="button" onClick={() => toggleSort('name')} className="flex items-center gap-1">
                    <span>Name</span>
                    {sortKey === 'name' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  <button type="button" onClick={() => toggleSort('enrollmentNumber')} className="flex items-center gap-1">
                    <span>Enrollment No.</span>
                    {sortKey === 'enrollmentNumber' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Section</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mobile</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Batch</th>
                {semesterMode && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Semester</th>
                )}
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No students found</p>
                  </td>
                </tr>
              ) : (
                displayStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{(student.email && student.email.trim()) ? student.email : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.enrollmentNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.section || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{(student as any).mobile || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{normalizeBatchDisplay(student.batch)}</td>
                    {semesterMode && (
                      <td className="px-6 py-4 text-sm text-gray-900">{student.semester}</td>
                    )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 15) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., 9876543210"
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
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-white focus-within:border-transparent">
                      <input
                        type="text"
                        value={newBatch}
                        onChange={(e) => {
                          // Only allow numbers and limit to 2 digits
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          setNewBatch(value);
                        }}
                        placeholder="22"
                        className="w-8 px-2 py-2 text-center border-0 focus:ring-0 focus:outline-none text-sm"
                        maxLength={2}
                      />
                      <span className="text-gray-500 text-sm">-</span>
                      <input
                        type="text"
                        value={newBatchEnd}
                        onChange={(e) => {
                          // Only allow numbers and limit to 2 digits
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          setNewBatchEnd(value);
                        }}
                        placeholder="26"
                        className="w-8 px-2 py-2 text-center border-0 focus:ring-0 focus:outline-none text-sm"
                        maxLength={2}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newBatch || !newBatchEnd || !formData.department) return;
                        const formattedBatch = `20${newBatch}-${newBatchEnd}`;
                        if (!(batchOptions || []).includes(formattedBatch)) {
                          const updated = [...(batchOptions || []), formattedBatch];
                          setBatchOptions(updated);
                          LocalStorageService.saveBatchOptions(formData.department, updated);
                        }
                        setFormData({ ...formData, batch: formattedBatch });
                        setNewBatch('');
                        setNewBatchEnd('');
                      }}
                      className="shrink-0 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format: YYYY-YY (e.g., 2022-26)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Browse Batches</label>
                  <select
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 text-sm"
                  >
                    <option value="">{(batchOptions || []).length === 0 ? 'No batches yet' : 'Select a batch'}</option>
                    {(batchOptions || []).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {(batchOptions || []).length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {(batchOptions || []).map((b) => (
                        <div key={b} className="flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded-full text-xs border border-gray-200">
                          <span>{b}</span>
                          <button 
                            type="button" 
                            className="ml-1" 
                            title="Delete batch" 
                            onClick={() => {
                              if (!formData.department) return;
                              const updated = (batchOptions || []).filter(x => x !== b);
                              setBatchOptions(updated);
                              LocalStorageService.saveBatchOptions(formData.department, updated);
                              if (formData.batch === b) setFormData({ ...formData, batch: '' });
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
              {/* Optional defaults to fill missing columns */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Optional Defaults (applied when a column is missing)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department (default)</label>
                    <input
                      type="text"
                      value={importDefaults.department}
                      onChange={(e) => setImportDefaults({ ...importDefaults, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g., Computer Science & Engineering"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch (default)</label>
                    <input
                      type="text"
                      value={importDefaults.batch}
                      onChange={(e) => setImportDefaults({ ...importDefaults, batch: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g., 2022-26"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section (default)</label>
                    <input
                      type="text"
                      value={importDefaults.section}
                      onChange={(e) => setImportDefaults({ ...importDefaults, section: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g., A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester (default)</label>
                    <select
                      value={importDefaults.semester}
                      onChange={(e) => setImportDefaults({ ...importDefaults, semester: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {[1,2,3,4,5,6,7,8].map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                </div>
              </div>
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

              {/* Skipped rows report */}
              {skippedRows.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-yellow-900">Skipped Rows Report ({skippedRows.length})</h4>
                    <button
                      onClick={() => setShowSkipped((v) => !v)}
                      className="text-xs px-2 py-1 rounded border border-yellow-300 text-yellow-800 bg-white hover:bg-yellow-50"
                    >
                      {showSkipped ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showSkipped && (
                    <div className="mt-3 max-h-40 overflow-y-auto text-xs">
                      <table className="w-full">
                        <thead className="bg-yellow-100">
                          <tr>
                            <th className="px-2 py-1 text-left">Sheet</th>
                            <th className="px-2 py-1 text-left">Row</th>
                            <th className="px-2 py-1 text-left">Enrollment</th>
                            <th className="px-2 py-1 text-left">Name</th>
                            <th className="px-2 py-1 text-left">Missing</th>
                          </tr>
                        </thead>
                        <tbody>
                          {skippedRows.map((r: any, idx: number) => (
                            <tr key={idx} className="border-b border-yellow-200">
                              <td className="px-2 py-1">{r.__sheet}</td>
                              <td className="px-2 py-1">{r.rowIndex}</td>
                              <td className="px-2 py-1">{r.enrollmentNumber || '-'}</td>
                              <td className="px-2 py-1">{r.name || '-'}</td>
                              <td className="px-2 py-1">{r.errors?.join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Duplicates report */}
              {duplicateRows.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-red-900">Duplicate Entries ({duplicateRows.length})</h4>
                    <button
                      onClick={() => setShowDuplicates((v) => !v)}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-800 bg-white hover:bg-red-50"
                    >
                      {showDuplicates ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showDuplicates && (
                    <div className="mt-3 max-h-40 overflow-y-auto text-xs">
                      <table className="w-full">
                        <thead className="bg-red-100">
                          <tr>
                            <th className="px-2 py-1 text-left">Sheet</th>
                            <th className="px-2 py-1 text-left">Row</th>
                            <th className="px-2 py-1 text-left">Enrollment</th>
                            <th className="px-2 py-1 text-left">Name</th>
                            <th className="px-2 py-1 text-left">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {duplicateRows.map((r: any, idx: number) => (
                            <tr key={idx} className="border-b border-red-200">
                              <td className="px-2 py-1">{r.__sheet}</td>
                              <td className="px-2 py-1">{r.rowIndex}</td>
                              <td className="px-2 py-1">{r.enrollmentNumber || '-'}</td>
                              <td className="px-2 py-1">{r.name || '-'}</td>
                              <td className="px-2 py-1">{r.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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

      {/* Outside School Modal */}
      {showOutsideModal && filterSchoolId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Students outside selected school</h3>
              <button onClick={() => setShowOutsideModal(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[65vh] text-sm">
              {(() => {
                const schoolObj = schools.find(s => s.id === filterSchoolId);
                const schoolName = schoolObj?.name || '';
                const outside = students.filter(s => (s.school || getSchoolFromDepartment(s.department)) !== schoolName);
                if (outside.length === 0) return <div className="text-gray-600">None found.</div>;
                return (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Enrollment</th>
                        <th className="px-3 py-2 text-left">Department</th>
                        <th className="px-3 py-2 text-left">School (derived)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outside.map((s, i) => (
                        <tr key={s.id || i} className="border-b">
                          <td className="px-3 py-2">{s.name}</td>
                          <td className="px-3 py-2">{s.enrollmentNumber || '-'}</td>
                          <td className="px-3 py-2">{s.department || '-'}</td>
                          <td className="px-3 py-2">{s.school || getSchoolFromDepartment(s.department) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => setShowOutsideModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}