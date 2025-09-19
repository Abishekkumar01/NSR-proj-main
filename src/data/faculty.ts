import { Faculty } from '../types';

// Faculty data based on the provided information
export const facultyData: Faculty[] = [
  // ASET - Computer Science & Engineering
  {
    id: 'faculty-001',
    name: 'Dr. Sunil Patak',
    email: 'sunil.patak@amity.edu',
    school: 'ASET',
    department: 'Computer Science & Engineering',
    batches: ['2021-25', '2022-26'],
    sections: ['A', 'B'],
    subjects: ['C++', 'Data Structures', 'Algorithms'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-002',
    name: 'Dr. Attrikesh Verma',
    email: 'attrikesh.verma@amity.edu',
    school: 'ASET',
    department: 'Computer Science & Engineering',
    batches: ['2020-24', '2021-25'],
    sections: ['A', 'C'],
    subjects: ['Operating Systems', 'Database Management'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-003',
    name: 'Dr. Nitesh Singh Rajput',
    email: 'nitesh.rajput@amity.edu',
    school: 'ASET',
    department: 'Computer Science & Engineering',
    batches: ['2022-26', '2023-27'],
    sections: ['B', 'D'],
    subjects: ['Python', 'Machine Learning'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-004',
    name: 'Dr. Yashpal Chauhan',
    email: 'yashpal.chauhan@amity.edu',
    school: 'ASET',
    department: 'Computer Science & Engineering',
    batches: ['2021-25'],
    sections: ['A', 'B', 'C'],
    subjects: ['Java', 'Web Development'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-005',
    name: 'Dr. Ankesh Saini',
    email: 'ankesh.saini@amity.edu',
    school: 'ASET',
    department: 'Computer Science & Engineering',
    batches: ['2020-24', '2022-26'],
    sections: ['A', 'D'],
    subjects: ['.NET', 'Software Engineering'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-006',
    name: 'Dr. Sunil Yadav',
    email: 'sunil.yadav@amity.edu',
    school: 'ASET',
    department: 'Computer Science & Engineering',
    batches: ['2023-27'],
    sections: ['B', 'C'],
    subjects: ['Computer Networks', 'Cybersecurity'],
    createdAt: new Date('2023-01-01')
  },

  // ASET - Electronics & Communication Engineering
  {
    id: 'faculty-007',
    name: 'Dr. Amit Tiwari',
    email: 'amit.tiwari@amity.edu',
    school: 'ASET',
    department: 'Electronics & Communication Engineering',
    batches: ['2021-25', '2022-26'],
    sections: ['A', 'B'],
    subjects: ['Digital Electronics', 'Communication Systems'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-008',
    name: 'Dr. Pankaj Sharma',
    email: 'pankaj.sharma@amity.edu',
    school: 'ASET',
    department: 'Electronics & Communication Engineering',
    batches: ['2020-24'],
    sections: ['A', 'C'],
    subjects: ['Microprocessors', 'VLSI Design'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-009',
    name: 'Dr. Rekha Kumari',
    email: 'rekha.kumari@amity.edu',
    school: 'ASET',
    department: 'Electronics & Communication Engineering',
    batches: ['2022-26', '2023-27'],
    sections: ['B', 'D'],
    subjects: ['Signal Processing', 'Embedded Systems'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-010',
    name: 'Dr. Deepak Mishra',
    email: 'deepak.mishra@amity.edu',
    school: 'ASET',
    department: 'Electronics & Communication Engineering',
    batches: ['2021-25'],
    sections: ['A', 'B', 'C'],
    subjects: ['RF Engineering', 'Antenna Design'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-011',
    name: 'Dr. Sanjay Bhardwaj',
    email: 'sanjay.bhardwaj@amity.edu',
    school: 'ASET',
    department: 'Electronics & Communication Engineering',
    batches: ['2020-24', '2022-26'],
    sections: ['A', 'D'],
    subjects: ['Optical Communication', 'Wireless Networks'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-012',
    name: 'Dr. Priyanka Jain',
    email: 'priyanka.jain@amity.edu',
    school: 'ASET',
    department: 'Electronics & Communication Engineering',
    batches: ['2023-27'],
    sections: ['B', 'C'],
    subjects: ['IoT', '5G Technology'],
    createdAt: new Date('2023-01-01')
  },

  // ASET - Information Technology
  {
    id: 'faculty-013',
    name: 'Dr. Rakesh Kumar',
    email: 'rakesh.kumar@amity.edu',
    school: 'ASET',
    department: 'Information Technology',
    batches: ['2021-25', '2022-26'],
    sections: ['A', 'B'],
    subjects: ['Database Systems', 'Web Technologies'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-014',
    name: 'Dr. Neha Pandey',
    email: 'neha.pandey@amity.edu',
    school: 'ASET',
    department: 'Information Technology',
    batches: ['2020-24'],
    sections: ['A', 'C'],
    subjects: ['Software Testing', 'Project Management'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-015',
    name: 'Dr. Abhishek Yadav',
    email: 'abhishek.yadav@amity.edu',
    school: 'ASET',
    department: 'Information Technology',
    batches: ['2022-26', '2023-27'],
    sections: ['B', 'D'],
    subjects: ['Cloud Computing', 'DevOps'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-016',
    name: 'Dr. Shruti Verma',
    email: 'shruti.verma@amity.edu',
    school: 'ASET',
    department: 'Information Technology',
    batches: ['2021-25'],
    sections: ['A', 'B', 'C'],
    subjects: ['Mobile App Development', 'UI/UX Design'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-017',
    name: 'Dr. Mohit Gupta',
    email: 'mohit.gupta@amity.edu',
    school: 'ASET',
    department: 'Information Technology',
    batches: ['2020-24', '2022-26'],
    sections: ['A', 'D'],
    subjects: ['Big Data Analytics', 'Data Science'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-018',
    name: 'Dr. Kavita Singh',
    email: 'kavita.singh@amity.edu',
    school: 'ASET',
    department: 'Information Technology',
    batches: ['2023-27'],
    sections: ['B', 'C'],
    subjects: ['Blockchain', 'Cyber Security'],
    createdAt: new Date('2023-01-01')
  },

  // AIIT - Computer Science & Applications
  {
    id: 'faculty-019',
    name: 'Dr. Vivek Verma',
    email: 'vivek.verma@amity.edu',
    school: 'AIIT',
    department: 'Computer Science & Applications',
    batches: ['2021-24', '2022-25'],
    sections: ['A', 'B'],
    subjects: ['Programming Fundamentals', 'Data Structures'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-020',
    name: 'Dr. Sheetal Sharma',
    email: 'sheetal.sharma@amity.edu',
    school: 'AIIT',
    department: 'Computer Science & Applications',
    batches: ['2020-23'],
    sections: ['A', 'C'],
    subjects: ['Database Management', 'Web Development'],
    createdAt: new Date('2023-01-01')
  },

  // ABS - Management & Business Studies
  {
    id: 'faculty-021',
    name: 'Dr. Saurabh Sharma',
    email: 'saurabh.sharma@amity.edu',
    school: 'ABS',
    department: 'Management & Business Studies',
    batches: ['2021-25', '2022-26'],
    sections: ['A', 'B'],
    subjects: ['Business Management', 'Marketing'],
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'faculty-022',
    name: 'Dr. Priya Singh',
    email: 'priya.singh@amity.edu',
    school: 'ABS',
    department: 'Management & Business Studies',
    batches: ['2020-24'],
    sections: ['A', 'C'],
    subjects: ['Finance', 'Human Resources'],
    createdAt: new Date('2023-01-01')
  }
];

// Department-specific subjects mapping
export const departmentSubjects: { [key: string]: string[] } = {
  'Computer Science & Engineering': [
    'C++', 'Java', 'Python', 'Data Structures', 'Algorithms', 'Operating Systems',
    'Database Management', 'Computer Networks', 'Software Engineering', 'Machine Learning',
    'Web Development', '.NET', 'Cybersecurity', 'Computer Graphics', 'Artificial Intelligence'
  ],
  'Electronics & Communication Engineering': [
    'Digital Electronics', 'Communication Systems', 'Microprocessors', 'VLSI Design',
    'Signal Processing', 'Embedded Systems', 'RF Engineering', 'Antenna Design',
    'Optical Communication', 'Wireless Networks', 'IoT', '5G Technology'
  ],
  'Information Technology': [
    'Database Systems', 'Web Technologies', 'Software Testing', 'Project Management',
    'Cloud Computing', 'DevOps', 'Mobile App Development', 'UI/UX Design',
    'Big Data Analytics', 'Data Science', 'Blockchain', 'Cyber Security'
  ],
  'Computer Science & Applications': [
    'Programming Fundamentals', 'Data Structures', 'Database Management', 'Web Development',
    'Software Engineering', 'Computer Networks', 'Operating Systems'
  ],
  'Management & Business Studies': [
    'Business Management', 'Marketing', 'Finance', 'Human Resources', 'Operations Management',
    'Strategic Management', 'International Business', 'Digital Marketing'
  ]
};

// Batch combinations for different course durations
export const batchCombinations = {
  '2-year': [
    '2016-18', '2017-19', '2018-20', '2019-21', '2020-22', '2021-23', '2022-24', '2023-25', '2024-26', '2025-27'
  ],
  '3-year': [
    '2016-19', '2017-20', '2018-21', '2019-22', '2020-23', '2021-24', '2022-25', '2023-26', '2024-27', '2025-28'
  ],
  '4-year': [
    '2016-20', '2017-21', '2018-22', '2019-23', '2020-24', '2021-25', '2022-26', '2023-27', '2024-28', '2025-29'
  ],
  '5-year': [
    '2016-21', '2017-22', '2018-23', '2019-24', '2020-25', '2021-26', '2022-27', '2023-28', '2024-29', '2025-30'
  ]
};

export const allBatches = [
  ...batchCombinations['2-year'],
  ...batchCombinations['3-year'],
  ...batchCombinations['4-year'],
  ...batchCombinations['5-year']
].sort();



