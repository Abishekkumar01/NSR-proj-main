import { Course, Faculty, Student, Assessment, StudentAssessment, GAMapping, COMapping, POMapping, GAScore } from '../types';
import { LocalStorageService } from '../lib/localStorage';

// Faculty data for ASET CSE department
export const facultyData: Faculty[] = [
  {
    id: 'faculty-001',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@amity.edu',
    school: 'ASET',
    department: 'Computer Science & Engineering',
    batches: ['2022-26', '2023-27', '2024-28', '2025-29'],
    sections: ['A', 'B', 'C'],
    subjects: ['Data Structures and Algorithms', 'Operating Systems', 'Database Management Systems'],
    createdAt: new Date('2022-01-01'),
    isActivated: true,
    batchSections: {
      '2022-26': ['A', 'B'],
      '2023-27': ['A', 'B'],
      '2024-28': ['A', 'B'],
      '2025-29': ['A', 'B']
    },
    batchSemesters: {
      '2022-26': [3, 4, 5, 6],
      '2023-27': [1, 2, 3, 4],
      '2024-28': [1, 2],
      '2025-29': [1]
    }
  },
  {
    id: 'faculty-002',
    name: 'Prof. Priya Sharma',
    email: 'priya.sharma@amity.edu',
    school: 'ASET',
    department: 'Computer Science & Engineering',
    batches: ['2022-26', '2023-27', '2024-28', '2025-29'],
    sections: ['A', 'B', 'C'],
    subjects: ['Computer Networks', 'Software Engineering', 'Machine Learning'],
    createdAt: new Date('2022-01-01'),
    isActivated: true,
    batchSections: {
      '2022-26': ['A', 'B'],
      '2023-27': ['A', 'B'],
      '2024-28': ['A', 'B'],
      '2025-29': ['A', 'B']
    },
    batchSemesters: {
      '2022-26': [3, 4, 5, 6],
      '2023-27': [1, 2, 3, 4],
      '2024-28': [1, 2],
      '2025-29': [1]
    }
  },
  {
    id: 'faculty-003',
    name: 'Dr. Amit Singh',
    email: 'amit.singh@amity.edu',
    school: 'ASET',
    department: 'Computer Science & Engineering',
    batches: ['2022-26', '2023-27', '2024-28', '2025-29'],
    sections: ['A', 'B', 'C'],
    subjects: ['Computer Graphics', 'Web Development', 'Mobile App Development'],
    createdAt: new Date('2022-01-01'),
    isActivated: true,
    batchSections: {
      '2022-26': ['A', 'B'],
      '2023-27': ['A', 'B'],
      '2024-28': ['A', 'B'],
      '2025-29': ['A', 'B']
    },
    batchSemesters: {
      '2022-26': [3, 4, 5, 6],
      '2023-27': [1, 2, 3, 4],
      '2024-28': [1, 2],
      '2025-29': [1]
    }
  },
  {
    id: 'faculty-004',
    name: 'Dr. Neha Gupta',
    email: 'neha.gupta@amity.edu',
    school: 'ASET',
    department: 'Computer Science & Engineering',
    batches: ['2022-26', '2023-27', '2024-28', '2025-29'],
    sections: ['A', 'B', 'C'],
    subjects: ['Artificial Intelligence', 'Data Science', 'Cloud Computing'],
    createdAt: new Date('2022-01-01'),
    isActivated: true,
    batchSections: {
      '2022-26': ['A', 'B'],
      '2023-27': ['A', 'B'],
      '2024-28': ['A', 'B'],
      '2025-29': ['A', 'B']
    },
    batchSemesters: {
      '2022-26': [3, 4, 5, 6],
      '2023-27': [1, 2, 3, 4],
      '2024-28': [1, 2],
      '2025-29': [1]
    }
  }
];

// Course data for BTech CSE
export const courseData: Course[] = [
  {
    id: 'course-001',
    code: 'CSE201',
    name: 'Data Structures and Algorithms',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2023-27',
    semester: 3,
    credits: 4,
    facultyId: 'faculty-001',
    facultyName: 'Dr. Rajesh Kumar',
    coOptions: [
      { coCode: 'CO1', coName: 'Analyze time and space complexity of algorithms' },
      { coCode: 'CO2', coName: 'Implement various data structures using programming languages' },
      { coCode: 'CO3', coName: 'Design efficient algorithms for problem solving' },
      { coCode: 'CO4', coName: 'Apply appropriate data structures for specific applications' },
      { coCode: 'CO5', coName: 'Evaluate and compare different algorithmic approaches' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-002',
    code: 'CSE301',
    name: 'Operating Systems',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2023-27',
    semester: 5,
    credits: 4,
    facultyId: 'faculty-001',
    facultyName: 'Dr. Rajesh Kumar',
    coOptions: [
      { coCode: 'CO1', coName: 'Understand operating system concepts and components' },
      { coCode: 'CO2', coName: 'Analyze process management and scheduling algorithms' },
      { coCode: 'CO3', coName: 'Implement memory management techniques' },
      { coCode: 'CO4', coName: 'Design file system structures and operations' },
      { coCode: 'CO5', coName: 'Apply synchronization mechanisms in concurrent programming' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-003',
    code: 'CSE401',
    name: 'Database Management Systems',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2023-27',
    semester: 4,
    credits: 4,
    facultyId: 'faculty-001',
    facultyName: 'Dr. Rajesh Kumar',
    coOptions: [
      { coCode: 'CO1', coName: 'Design and implement relational database schemas' },
      { coCode: 'CO2', coName: 'Write complex SQL queries for data manipulation' },
      { coCode: 'CO3', coName: 'Apply normalization techniques to eliminate redundancy' },
      { coCode: 'CO4', coName: 'Implement database transactions and concurrency control' },
      { coCode: 'CO5', coName: 'Design and optimize database performance' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  // --- Comprehensive 2022-26 batch coverage (one core course each semester) ---
  {
    id: 'course-011',
    code: 'CSE101',
    name: 'Programming Fundamentals',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 1,
    credits: 4,
    facultyId: 'faculty-001',
    facultyName: 'Dr. Rajesh Kumar',
    coOptions: [
      { coCode: 'CO1', coName: 'Understand basics of programming and syntax' },
      { coCode: 'CO2', coName: 'Apply control structures and functions' },
      { coCode: 'CO3', coName: 'Manipulate arrays and strings' },
      { coCode: 'CO4', coName: 'Design modular programs' },
      { coCode: 'CO5', coName: 'Debug and test programs effectively' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-012',
    code: 'CSE151',
    name: 'Discrete Mathematics',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 2,
    credits: 4,
    facultyId: 'faculty-002',
    facultyName: 'Prof. Priya Sharma',
    coOptions: [
      { coCode: 'CO1', coName: 'Apply logic and proofs' },
      { coCode: 'CO2', coName: 'Use sets, relations, functions' },
      { coCode: 'CO3', coName: 'Analyze combinatorics and counting' },
      { coCode: 'CO4', coName: 'Work with graphs and trees' },
      { coCode: 'CO5', coName: 'Model problems discretely' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-013',
    code: 'CSE201',
    name: 'Data Structures and Algorithms',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 3,
    credits: 4,
    facultyId: 'faculty-001',
    facultyName: 'Dr. Rajesh Kumar',
    coOptions: [
      { coCode: 'CO1', coName: 'Analyze time and space complexity of algorithms' },
      { coCode: 'CO2', coName: 'Implement various data structures using programming languages' },
      { coCode: 'CO3', coName: 'Design efficient algorithms for problem solving' },
      { coCode: 'CO4', coName: 'Apply appropriate data structures for specific applications' },
      { coCode: 'CO5', coName: 'Evaluate and compare different algorithmic approaches' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-014',
    code: 'CSE401',
    name: 'Database Management Systems',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 4,
    credits: 4,
    facultyId: 'faculty-001',
    facultyName: 'Dr. Rajesh Kumar',
    coOptions: [
      { coCode: 'CO1', coName: 'Design and implement relational database schemas' },
      { coCode: 'CO2', coName: 'Write complex SQL queries for data manipulation' },
      { coCode: 'CO3', coName: 'Apply normalization techniques to eliminate redundancy' },
      { coCode: 'CO4', coName: 'Implement database transactions and concurrency control' },
      { coCode: 'CO5', coName: 'Design and optimize database performance' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-015',
    code: 'CSE301',
    name: 'Operating Systems',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 5,
    credits: 4,
    facultyId: 'faculty-001',
    facultyName: 'Dr. Rajesh Kumar',
    coOptions: [
      { coCode: 'CO1', coName: 'Understand operating system concepts and components' },
      { coCode: 'CO2', coName: 'Analyze process management and scheduling algorithms' },
      { coCode: 'CO3', coName: 'Implement memory management techniques' },
      { coCode: 'CO4', coName: 'Design file system structures and operations' },
      { coCode: 'CO5', coName: 'Apply synchronization mechanisms in concurrent programming' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-004',
    code: 'CSE501',
    name: 'Computer Networks',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 6,
    credits: 4,
    facultyId: 'faculty-002',
    facultyName: 'Prof. Priya Sharma',
    coOptions: [
      { coCode: 'CO1', coName: 'Understand network protocols and architectures' },
      { coCode: 'CO2', coName: 'Implement network programming concepts' },
      { coCode: 'CO3', coName: 'Analyze network performance and security issues' },
      { coCode: 'CO4', coName: 'Design network topologies and configurations' },
      { coCode: 'CO5', coName: 'Apply network troubleshooting techniques' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-016',
    code: 'CSE601',
    name: 'Software Engineering',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 7,
    credits: 4,
    facultyId: 'faculty-002',
    facultyName: 'Prof. Priya Sharma',
    coOptions: [
      { coCode: 'CO1', coName: 'Apply software development lifecycle methodologies' },
      { coCode: 'CO2', coName: 'Design software architecture and components' },
      { coCode: 'CO3', coName: 'Implement software testing and quality assurance' },
      { coCode: 'CO4', coName: 'Manage software projects and teams' },
      { coCode: 'CO5', coName: 'Apply software maintenance and evolution practices' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-017',
    code: 'CSE1101',
    name: 'Artificial Intelligence',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 8,
    credits: 4,
    facultyId: 'faculty-004',
    facultyName: 'Dr. Neha Gupta',
    coOptions: [
      { coCode: 'CO1', coName: 'Understand AI algorithms and problem-solving techniques' },
      { coCode: 'CO2', coName: 'Implement search algorithms and optimization methods' },
      { coCode: 'CO3', coName: 'Apply knowledge representation and reasoning systems' },
      { coCode: 'CO4', coName: 'Design intelligent agents and expert systems' },
      { coCode: 'CO5', coName: 'Evaluate AI system performance and limitations' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-005',
    code: 'CSE601',
    name: 'Software Engineering',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2024-28',
    semester: 7,
    credits: 4,
    facultyId: 'faculty-002',
    facultyName: 'Prof. Priya Sharma',
    coOptions: [
      { coCode: 'CO1', coName: 'Apply software development lifecycle methodologies' },
      { coCode: 'CO2', coName: 'Design software architecture and components' },
      { coCode: 'CO3', coName: 'Implement software testing and quality assurance' },
      { coCode: 'CO4', coName: 'Manage software projects and teams' },
      { coCode: 'CO5', coName: 'Apply software maintenance and evolution practices' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-006',
    code: 'CSE701',
    name: 'Machine Learning',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2025-29',
    semester: 8,
    credits: 4,
    facultyId: 'faculty-002',
    facultyName: 'Prof. Priya Sharma',
    coOptions: [
      { coCode: 'CO1', coName: 'Understand machine learning algorithms and techniques' },
      { coCode: 'CO2', coName: 'Implement supervised and unsupervised learning models' },
      { coCode: 'CO3', coName: 'Apply deep learning frameworks and tools' },
      { coCode: 'CO4', coName: 'Evaluate model performance and accuracy' },
      { coCode: 'CO5', coName: 'Design end-to-end machine learning pipelines' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-007',
    code: 'CSE801',
    name: 'Computer Graphics',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2023-27',
    semester: 6,
    credits: 3,
    facultyId: 'faculty-003',
    facultyName: 'Dr. Amit Singh',
    coOptions: [
      { coCode: 'CO1', coName: 'Understand computer graphics algorithms and techniques' },
      { coCode: 'CO2', coName: 'Implement 2D and 3D transformations' },
      { coCode: 'CO3', coName: 'Apply rendering and shading techniques' },
      { coCode: 'CO4', coName: 'Design interactive graphics applications' },
      { coCode: 'CO5', coName: 'Implement animation and visualization systems' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-008',
    code: 'CSE901',
    name: 'Web Development',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2023-27',
    semester: 5,
    credits: 3,
    facultyId: 'faculty-003',
    facultyName: 'Dr. Amit Singh',
    coOptions: [
      { coCode: 'CO1', coName: 'Develop responsive web applications using modern frameworks' },
      { coCode: 'CO2', coName: 'Implement client-side and server-side technologies' },
      { coCode: 'CO3', coName: 'Apply web security and authentication mechanisms' },
      { coCode: 'CO4', coName: 'Design RESTful APIs and web services' },
      { coCode: 'CO5', coName: 'Deploy and maintain web applications in cloud environments' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-009',
    code: 'CSE1001',
    name: 'Mobile App Development',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2023-27',
    semester: 7,
    credits: 3,
    facultyId: 'faculty-003',
    facultyName: 'Dr. Amit Singh',
    coOptions: [
      { coCode: 'CO1', coName: 'Develop native mobile applications for iOS and Android' },
      { coCode: 'CO2', coName: 'Implement cross-platform mobile solutions' },
      { coCode: 'CO3', coName: 'Apply mobile UI/UX design principles' },
      { coCode: 'CO4', coName: 'Integrate mobile apps with backend services' },
      { coCode: 'CO5', coName: 'Deploy and publish mobile applications to app stores' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-010',
    code: 'CSE1101',
    name: 'Artificial Intelligence',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2023-27',
    semester: 8,
    credits: 4,
    facultyId: 'faculty-004',
    facultyName: 'Dr. Neha Gupta',
    coOptions: [
      { coCode: 'CO1', coName: 'Understand AI algorithms and problem-solving techniques' },
      { coCode: 'CO2', coName: 'Implement search algorithms and optimization methods' },
      { coCode: 'CO3', coName: 'Apply knowledge representation and reasoning systems' },
      { coCode: 'CO4', coName: 'Design intelligent agents and expert systems' },
      { coCode: 'CO5', coName: 'Evaluate AI system performance and limitations' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  }
  ,
  // ========= Added curriculum-aligned subjects for batch 2022-26 by semester =========
  // Semester 1
  {
    id: 'course-100',
    code: 'MTH101',
    name: 'Applied Mathematics – I',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 1,
    credits: 4,
    facultyId: 'faculty-004',
    facultyName: 'Dr. Neha Gupta',
    coOptions: [
      { coCode: 'CO1', coName: 'Apply differential calculus to problems' },
      { coCode: 'CO2', coName: 'Use matrices and determinants' },
      { coCode: 'CO3', coName: 'Analyze sequences and series' },
      { coCode: 'CO4', coName: 'Solve first order ODEs' },
      { coCode: 'CO5', coName: 'Model physical systems' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-101',
    code: 'PHY101',
    name: 'Applied Physics – I (Fields & Waves)',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 1,
    credits: 3,
    facultyId: 'faculty-003',
    facultyName: 'Dr. Amit Singh',
    coOptions: [
      { coCode: 'CO1', coName: 'Explain EM waves and fields' },
      { coCode: 'CO2', coName: 'Apply optics to instruments' },
      { coCode: 'CO3', coName: 'Relate material properties to fields' },
      { coCode: 'CO4', coName: 'Carry out basic physics experiments' },
      { coCode: 'CO5', coName: 'Correlate physics with engineering' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-102',
    code: 'MEC101',
    name: 'Engineering Mechanics',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 1,
    credits: 3,
    facultyId: 'faculty-002',
    facultyName: 'Prof. Priya Sharma',
    coOptions: [
      { coCode: 'CO1', coName: 'Resolve forces and moments' },
      { coCode: 'CO2', coName: 'Analyze equilibrium and friction' },
      { coCode: 'CO3', coName: 'Apply kinematics/kinetics' },
      { coCode: 'CO4', coName: 'Evaluate loaded structures' },
      { coCode: 'CO5', coName: 'Use mechanics in design' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-103',
    code: 'CSE103',
    name: 'Introduction to Computers & Programming in C',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 1,
    credits: 4,
    facultyId: 'faculty-001',
    facultyName: 'Dr. Rajesh Kumar',
    coOptions: [
      { coCode: 'CO1', coName: 'Use C syntax, data types and operators' },
      { coCode: 'CO2', coName: 'Apply control structures and functions' },
      { coCode: 'CO3', coName: 'Manipulate arrays, pointers, strings' },
      { coCode: 'CO4', coName: 'Use files and structures' },
      { coCode: 'CO5', coName: 'Develop modular programs' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-104',
    code: 'EEE101',
    name: 'Basic Electrical Engineering',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 1,
    credits: 3,
    facultyId: 'faculty-004',
    facultyName: 'Dr. Neha Gupta',
    coOptions: [
      { coCode: 'CO1', coName: 'Explain DC/AC circuit fundamentals' },
      { coCode: 'CO2', coName: 'Analyze single phase systems' },
      { coCode: 'CO3', coName: 'Understand machines basics' },
      { coCode: 'CO4', coName: 'Perform measurements' },
      { coCode: 'CO5', coName: 'Apply safety and standards' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-105',
    code: 'PHY111',
    name: 'Applied Physics Lab',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 1,
    credits: 1,
    facultyId: 'faculty-003',
    facultyName: 'Dr. Amit Singh',
    coOptions: [
      { coCode: 'CO1', coName: 'Conduct optics and EM experiments' },
      { coCode: 'CO2', coName: 'Interpret lab data' },
      { coCode: 'CO3', coName: 'Prepare lab reports' },
      { coCode: 'CO4', coName: 'Follow lab safety' },
      { coCode: 'CO5', coName: 'Relate theory and practice' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-106',
    code: 'ENG111',
    name: 'Engineering Graphics / Workshop Practice',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 1,
    credits: 2,
    facultyId: 'faculty-002',
    facultyName: 'Prof. Priya Sharma',
    coOptions: [
      { coCode: 'CO1', coName: 'Create engineering drawings' },
      { coCode: 'CO2', coName: 'Use CAD tools' },
      { coCode: 'CO3', coName: 'Operate workshop tools safely' },
      { coCode: 'CO4', coName: 'Fabricate basic joints' },
      { coCode: 'CO5', coName: 'Interpret blueprints' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-107',
    code: 'HUM101',
    name: 'Behavioural Science – I (Human Values & Ethics)',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 1,
    credits: 2,
    facultyId: 'faculty-004',
    facultyName: 'Dr. Neha Gupta',
    coOptions: [
      { coCode: 'CO1', coName: 'Demonstrate ethical decision making' },
      { coCode: 'CO2', coName: 'Practice professional conduct' },
      { coCode: 'CO3', coName: 'Work effectively in teams' },
      { coCode: 'CO4', coName: 'Communicate responsibly' },
      { coCode: 'CO5', coName: 'Reflect on personal values' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  // Semester 2 (representative selection)
  {
    id: 'course-108',
    code: 'MTH151',
    name: 'Applied Mathematics – II',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 2,
    credits: 4,
    facultyId: 'faculty-004',
    facultyName: 'Dr. Neha Gupta',
    coOptions: [
      { coCode: 'CO1', coName: 'Solve higher order ODEs' },
      { coCode: 'CO2', coName: 'Use Laplace/Fourier transforms' },
      { coCode: 'CO3', coName: 'Apply vector calculus' },
      { coCode: 'CO4', coName: 'Model engineering systems' },
      { coCode: 'CO5', coName: 'Analyze probability basics' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-109',
    code: 'PHY151',
    name: 'Applied Physics – II (Modern Physics)',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 2,
    credits: 3,
    facultyId: 'faculty-003',
    facultyName: 'Dr. Amit Singh',
    coOptions: [
      { coCode: 'CO1', coName: 'Explain quantum/semiconductor basics' },
      { coCode: 'CO2', coName: 'Understand lasers and fiber optics' },
      { coCode: 'CO3', coName: 'Apply modern physics to devices' },
      { coCode: 'CO4', coName: 'Conduct experiments safely' },
      { coCode: 'CO5', coName: 'Relate phenomena to engineering' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-110',
    code: 'CSE151',
    name: 'Data Structures using C',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 2,
    credits: 4,
    facultyId: 'faculty-001',
    facultyName: 'Dr. Rajesh Kumar',
    coOptions: [
      { coCode: 'CO1', coName: 'Implement linear data structures' },
      { coCode: 'CO2', coName: 'Use trees and graphs' },
      { coCode: 'CO3', coName: 'Analyze complexity' },
      { coCode: 'CO4', coName: 'Use sorting/searching' },
      { coCode: 'CO5', coName: 'Choose appropriate structures' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  },
  {
    id: 'course-111',
    code: 'CHM151',
    name: 'Applied Chemistry',
    department: 'Computer Science & Engineering',
    school: 'ASET',
    batch: '2022-26',
    semester: 2,
    credits: 3,
    facultyId: 'faculty-002',
    facultyName: 'Prof. Priya Sharma',
    coOptions: [
      { coCode: 'CO1', coName: 'Explain bonding and structure' },
      { coCode: 'CO2', coName: 'Apply thermodynamics' },
      { coCode: 'CO3', coName: 'Understand materials/polymers' },
      { coCode: 'CO4', coName: 'Use analytical techniques' },
      { coCode: 'CO5', coName: 'Relate chemistry to engineering' }
    ],
    poOptions: [
      { poCode: 'PO1', poName: 'Engineering Knowledge' },
      { poCode: 'PO2', poName: 'Problem Analysis' },
      { poCode: 'PO3', poName: 'Design/Development of Solutions' },
      { poCode: 'PO4', poName: 'Conduct Investigations' },
      { poCode: 'PO5', poName: 'Modern Tool Usage' }
    ]
  }
];

// Generate student data for all batches
export function generateStudentData(): Student[] {
  const students: Student[] = [];
  const batches = ['2022-26', '2023-27', '2024-28', '2025-29'];
  const sections = ['A', 'B'];
  const names = [
    'Aarav Sharma', 'Aditi Patel', 'Akash Kumar', 'Ananya Singh', 'Arjun Gupta',
    'Bhavya Reddy', 'Chirag Joshi', 'Deepika Verma', 'Esha Agarwal', 'Gaurav Malhotra',
    'Harshita Singh', 'Ishaan Kumar', 'Jaya Sharma', 'Karan Patel', 'Kritika Gupta',
    'Lakshya Singh', 'Manisha Reddy', 'Nikhil Kumar', 'Pooja Sharma', 'Rahul Verma',
    'Sakshi Patel', 'Tanvi Gupta', 'Uday Singh', 'Varsha Kumar', 'Yash Agarwal',
    'Zara Khan', 'Abhishek Singh', 'Bhumika Patel', 'Chetan Kumar', 'Divya Sharma'
  ];

  // Generate a consistent set of 30 students per batch and replicate across semesters 1..8
  let globalId = 1;
  batches.forEach((batch, batchIndex) => {
    const baseStudents: { name: string; baseRoll: string; section: string }[] = [];
    // Create 15 per section = 30 base students
    sections.forEach((section) => {
      for (let i = 1; i <= 15; i++) {
        const nameIndex = (globalId - 1) % names.length;
        const baseRoll = `CSE${batch.substring(0, 4)}${section}${i.toString().padStart(3, '0')}`;
        baseStudents.push({ name: names[nameIndex], baseRoll, section });
        globalId++;
      }
    });

    // Replicate the same 30 students to all 8 semesters of the batch
    for (let semester = 1; semester <= 8; semester++) {
      baseStudents.forEach((base, idx) => {
        const idSuffix = `${batch.replace(/[^0-9]/g, '')}-${semester}-${idx + 1}`;
        students.push({
          id: `student-${idSuffix}`,
          // Keep roll stable with optional semester suffix to avoid collisions in some views
          rollNumber: `${base.baseRoll}`,
          name: base.name,
          email: `${base.name.toLowerCase().replace(' ', '.')}@amity.edu`,
          department: 'Computer Science & Engineering',
          school: 'ASET',
          batch: batch,
          semester: semester,
          section: base.section,
          mobile: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          createdAt: new Date(`202${2 + batchIndex}-07-01`)
        });
      });
    }
  });

  return students;
}

// Helper functions to generate varied weightages and levels
function getVariedGAWeightage(assessmentType: string, gaCode: string, courseId: string, assessmentIndex: number): number {
  // Create a seed based on course, assessment type, and GA for consistent but varied results
  const seed = courseId.charCodeAt(courseId.length - 1) + assessmentType.charCodeAt(0) + gaCode.charCodeAt(2) + assessmentIndex;
  const random = (seed * 9301 + 49297) % 233280 / 233280;
  
  // Different weightage ranges based on assessment type and GA
  const baseWeightages = {
    'Quiz': { 'GA1': [30, 45], 'GA2': [25, 40], 'GA3': [20, 35] },
    'Assignment': { 'GA1': [25, 40], 'GA2': [30, 45], 'GA3': [25, 40] },
    'Mid-Term': { 'GA1': [35, 50], 'GA2': [25, 40], 'GA3': [20, 35] },
    'End-Term': { 'GA1': [30, 45], 'GA2': [35, 50], 'GA3': [20, 35] }
  };
  
  const range = baseWeightages[assessmentType as keyof typeof baseWeightages]?.[gaCode as keyof typeof baseWeightages['Quiz']] || [25, 40];
  return Math.floor(range[0] + random * (range[1] - range[0]));
}

function getVariedGALevel(assessmentType: string, gaCode: string, courseId: string): 'Introductory' | 'Intermediate' | 'Advanced' {
  const seed = courseId.charCodeAt(courseId.length - 1) + assessmentType.charCodeAt(0) + gaCode.charCodeAt(2);
  const random = (seed * 9301 + 49297) % 233280 / 233280;
  
  // Different level distributions based on assessment type
  const levelDistributions = {
    'Quiz': ['Introductory', 'Introductory', 'Intermediate', 'Intermediate'],
    'Assignment': ['Intermediate', 'Intermediate', 'Advanced', 'Advanced'],
    'Mid-Term': ['Intermediate', 'Advanced', 'Advanced', 'Advanced'],
    'End-Term': ['Advanced', 'Advanced', 'Advanced', 'Advanced']
  };
  
  const levels = levelDistributions[assessmentType as keyof typeof levelDistributions] || ['Intermediate'];
  return levels[Math.floor(random * levels.length)] as 'Introductory' | 'Intermediate' | 'Advanced';
}

function getVariedCOWeightage(courseId: string, coIndex: number, totalCOs: number, assessmentType: string): number {
  const seed = courseId.charCodeAt(courseId.length - 1) + coIndex + assessmentType.charCodeAt(0);
  const random = (seed * 9301 + 49297) % 233280 / 233280;
  
  // Base weightage varies by assessment type
  const baseWeightage = {
    'Quiz': 15,
    'Assignment': 18,
    'Mid-Term': 20,
    'End-Term': 22
  }[assessmentType] || 20;
  
  // Add variation (±5%)
  const variation = (random - 0.5) * 10;
  const weightage = baseWeightage + variation;
  
  return Math.max(10, Math.min(30, Math.floor(weightage))); // Clamp between 10-30%
}

function getVariedPOWeightage(courseId: string, poIndex: number, assessmentType: string): number {
  const seed = courseId.charCodeAt(courseId.length - 1) + poIndex + assessmentType.charCodeAt(0);
  const random = (seed * 9301 + 49297) % 233280 / 233280;
  
  // PO weightages should be lower (5-10% range)
  const baseWeightage = {
    'Quiz': 6,
    'Assignment': 7,
    'Mid-Term': 8,
    'End-Term': 9
  }[assessmentType] || 7;
  
  // Add variation (±2%)
  const variation = (random - 0.5) * 4;
  const weightage = baseWeightage + variation;
  
  return Math.max(4, Math.min(12, Math.floor(weightage))); // Clamp between 4-12%
}

// Generate assessment data
export function generateAssessmentData(): Assessment[] {
  const assessments: Assessment[] = [];
  let assessmentId = 1;

  courseData.forEach(course => {
    // Create different types of assessments for each course
    const assessmentTypes = [
      { type: 'Quiz' as const, maxMarks: 20, weightage: 10 },
      { type: 'Assignment' as const, maxMarks: 50, weightage: 15 },
      { type: 'Mid-Term' as const, maxMarks: 100, weightage: 30 },
      { type: 'End-Term' as const, maxMarks: 50, weightage: 45 }
    ];

    assessmentTypes.forEach((assessmentType, assessmentIndex) => {
      // Generate varied GA mappings based on assessment type and course
      const gaMappings: GAMapping[] = [
        {
          gaId: 'ga1',
          gaCode: 'GA1',
          gaName: 'Engineering Knowledge',
          weightage: getVariedGAWeightage(assessmentType.type, 'GA1', course.id, assessmentIndex),
          targetLevel: getVariedGALevel(assessmentType.type, 'GA1', course.id)
        },
        {
          gaId: 'ga2',
          gaCode: 'GA2',
          gaName: 'Problem Analysis',
          weightage: getVariedGAWeightage(assessmentType.type, 'GA2', course.id, assessmentIndex),
          targetLevel: getVariedGALevel(assessmentType.type, 'GA2', course.id)
        },
        {
          gaId: 'ga3',
          gaCode: 'GA3',
          gaName: 'Design/Development of Solutions',
          weightage: getVariedGAWeightage(assessmentType.type, 'GA3', course.id, assessmentIndex),
          targetLevel: getVariedGALevel(assessmentType.type, 'GA3', course.id)
        }
      ];

      // Generate CO mappings - use ALL COs with varied weightages
      const coMappings: COMapping[] = course.coOptions?.map((co, index) => ({
        coCode: co.coCode,
        coName: co.coName,
        weightage: getVariedCOWeightage(course.id, index, course.coOptions?.length || 1, assessmentType.type)
      })) || [];

      // Generate PO mappings - PO weightages should be much lower (4-12% each) with variation
      const poMappings: POMapping[] = course.poOptions?.map((po, index) => ({
        poCode: po.poCode,
        poName: po.poName,
        weightage: getVariedPOWeightage(course.id, index, assessmentType.type)
      })) || [];

      // Add End-Term CO marks structure for End-Term assessments
      let endTermCOMarks = undefined;
      if (assessmentType.type === 'End-Term') {
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
        if (course.coOptions && course.coOptions.length > 0) {
          const availableCOs = [...course.coOptions];
          const shuffledCOs = availableCOs.sort(() => Math.random() - 0.5);
          
          // Assign COs to each box (except empty ones)
          for (let i = 0; i < 9; i++) {
            if (marks[i] !== null) {
              const coIndex = i % shuffledCOs.length;
              coSelections[i] = [shuffledCOs[coIndex].coCode];
            }
          }
        }
        
        endTermCOMarks = { marks, coSelections };
      }

      assessments.push({
        id: `assessment-${assessmentId.toString().padStart(3, '0')}`,
        courseId: course.id,
        courseName: course.name,
        school: course.school,
        department: course.department,
        name: `${course.name} - ${assessmentType.type}`,
        type: assessmentType.type,
        maxMarks: assessmentType.maxMarks,
        weightage: assessmentType.weightage,
        gaMapping: gaMappings,
        coMapping: coMappings,
        poMapping: poMappings,
        endTermCOMarks: endTermCOMarks,
        createdAt: new Date()
      });

      assessmentId++;
    });
  });

  return assessments;
}

// Generate student assessment data with marks
export function generateStudentAssessmentData(students: Student[], assessments: Assessment[]): StudentAssessment[] {
  const studentAssessments: StudentAssessment[] = [];
  let studentAssessmentId = 1;

  assessments.forEach(assessment => {
    // Get the course to determine which students should take this assessment
    const course = courseData.find(c => c.id === assessment.courseId);
    if (!course) return;
    
    // Get students for the course's batch (all students in the same batch as the course)
    const courseStudents = students.filter(student => student.batch === course.batch);

    courseStudents.forEach(student => {
      // Generate random marks based on assessment type
      let marksObtained: number;
      const maxMarks = assessment.maxMarks;

      switch (assessment.type) {
        case 'Quiz':
          marksObtained = Math.floor(Math.random() * (maxMarks * 0.8)) + Math.floor(maxMarks * 0.2);
          break;
        case 'Assignment':
          marksObtained = Math.floor(Math.random() * (maxMarks * 0.7)) + Math.floor(maxMarks * 0.3);
          break;
        case 'Mid-Term':
          marksObtained = Math.floor(Math.random() * (maxMarks * 0.6)) + Math.floor(maxMarks * 0.4);
          break;
        case 'End-Term':
          // For End-Term, students attempt 7 out of 9 questions to make ~50 marks
          // Generate marks between 35-50 (70-100% of maxMarks which is 50)
          marksObtained = Math.floor(Math.random() * (50 - 35 + 1)) + 35;
          break;
        default:
          marksObtained = Math.floor(Math.random() * maxMarks);
      }

      // Generate GA scores based on assessment's GA mappings
      const gaScores: GAScore[] = assessment.gaMapping.map(gaMapping => {
        const baseScore = Math.floor(marksObtained * (gaMapping.weightage / 100));
        const variation = Math.floor(Math.random() * 10) - 5; // ±5 points variation
        const finalScore = Math.max(0, Math.min(100, baseScore + variation));
        
        return {
          gaId: gaMapping.gaId,
          gaCode: gaMapping.gaCode,
          score: finalScore,
          level: gaMapping.targetLevel,
          weightage: gaMapping.weightage
        };
      });

      studentAssessments.push({
        id: `student-assessment-${studentAssessmentId.toString().padStart(3, '0')}`,
        studentId: student.id,
        assessmentId: assessment.id,
        marksObtained: marksObtained,
        maxMarks: maxMarks,
        gaScores: gaScores,
        submittedAt: new Date(),
        evaluatedBy: assessment.courseId.split('-')[0]?.includes('faculty') ? 'faculty-001' : 'faculty-001'
      });

      studentAssessmentId++;
    });
  });

  return studentAssessments;
}

// Initialize all data
export function initializeAllData() {
  console.log('Initializing comprehensive dataset...');
  
  // Generate data
  const students = generateStudentData();
  const assessments = generateAssessmentData();
  const studentAssessments = generateStudentAssessmentData(students, assessments);
  
  // Save to localStorage
  LocalStorageService.saveFaculty(facultyData);
  LocalStorageService.saveCourses(courseData);
  LocalStorageService.saveStudents(students);
  LocalStorageService.saveAssessments(assessments);
  LocalStorageService.saveStudentAssessments(studentAssessments);
  
  // Save CO and PO options by department
  const department = 'Computer Science & Engineering';
  const allCOs = courseData.flatMap(course => course.coOptions || []);
  const allPOs = courseData.flatMap(course => course.poOptions || []);
  
  LocalStorageService.saveCOOptions(department, allCOs);
  LocalStorageService.savePOOptions(department, allPOs);

  // Create randomized CO-PO mappings (<=5%) for all 2022-26 courses
  const randomCoPoMappings = [] as { id: string; coCode: string; poCode: string; percentage: number; courseId?: string; createdAt: Date }[];
  const courses202226 = courseData.filter(c => c.batch === '2022-26');
  courses202226.forEach((course, ci) => {
    const cos = course.coOptions || [];
    const pos = course.poOptions || [];
    cos.forEach((co, i) => {
      // Map each CO to 1-2 random POs with small percentages
      const poIndices = Array.from(new Set([
        Math.floor((ci + i + 1) % Math.max(1, pos.length)),
        Math.floor((ci + i + 2) % Math.max(1, pos.length))
      ]));
      poIndices.forEach((pi, k) => {
        const perc = Math.max(1, Math.floor(((ci + i + k + 3) * 7) % 5)); // 1..4%
        randomCoPoMappings.push({
          id: `init-copo-${course.id}-${co.coCode}-${pos[pi]?.poCode}-${k}`,
          coCode: co.coCode,
          poCode: pos[pi]?.poCode || 'PO1',
          percentage: perc,
          courseId: course.id,
          createdAt: new Date()
        });
      });
    });
  });
  LocalStorageService.saveCOPOMappings(randomCoPoMappings);
  
  // Save batch options
  const batches = ['2022-26', '2023-27', '2024-28', '2025-29'];
  LocalStorageService.saveBatchOptions(department, batches);
  
  console.log('Data initialization complete!');
  console.log(`Created ${facultyData.length} faculty members`);
  console.log(`Created ${courseData.length} courses`);
  console.log(`Created ${students.length} students`);
  console.log(`Created ${assessments.length} assessments`);
  console.log(`Created ${studentAssessments.length} student assessments`);
  
  return {
    faculty: facultyData,
    courses: courseData,
    students,
    assessments,
    studentAssessments
  };
}
