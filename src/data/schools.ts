export interface School {
  id: string
  name: string
  fullName: string
  departments: string[]
}

export const schools: School[] = [
  {
    id: 'aset',
    name: 'ASET',
    fullName: 'Amity School of Engineering & Technology',
    departments: [
      'Electronics & Communication Engineering',
      'Computer Science & Engineering',
      'Information Technology',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical & Electronics Engineering',
      'Data Science',
      'Chemical Engineering'
    ]
  },
  {
    id: 'aiit',
    name: 'AIIT',
    fullName: 'Amity Institute of Information Technology',
    departments: [
      'Computer Science & Applications',
      'Information Communication Technologies'
    ]
  },
  {
    id: 'abs',
    name: 'ABS',
    fullName: 'Amity Business School',
    departments: [
      'Bachelor of Business Administration (BBA)',
      'Integrated BBA-MBA',
      'Ph.D. in Management'
    ]
  },
  {
    id: 'als',
    name: 'Amity Law School (ALS)',
    fullName: 'Amity Law School',
    departments: [
      'B.A. LL.B. (Hons)',
      'B.Com. LL.B. (Hons)',
      'BBA LL.B. (Hons)',
      'LL.M. in Constitutional Law',
      'LL.M. in Corporate and Commercial Law',
      'LL.M. in Criminal Law',
      'Ph.D. in Law'
    ]
  },
  {
    id: 'asco',
    name: 'ASCO',
    fullName: 'Amity School of Communication',
    departments: [
      'Certificate in Podcast & Vodcast',
      'MBA in Media Management',
      'M.A. in Journalism & Mass Communication',
      'M.A. in Advertising & Marketing Management'
    ]
  },
  {
    id: 'asft',
    name: 'ASFT',
    fullName: 'Amity School of Fashion Technology',
    departments: [
      'Bachelor of Design (Fashion Design)',
      'Bachelor of Fine Arts (Animation)',
      'Master of Design (Fashion Design)',
      'Master of Fine Arts (Animation)'
    ]
  },
  {
    id: 'asfa',
    name: 'ASFA',
    fullName: 'Amity School of Fine Arts',
    departments: [
      'Bachelor of Fine Arts (BFA)',
      'Bachelor of Fine Arts (Animation)',
      'Master of Fine Arts (MFA)'
    ]
  },
  {
    id: 'asap',
    name: 'ASAP',
    fullName: 'Amity School of Architecture & Planning',
    departments: [
      'Bachelor of Architecture (B.Arch)',
      'Master of Architecture (M.Arch)',
      'Bachelor of Planning (B.Plan)',
      'Master of Planning (M.Plan)'
    ]
  },
  {
    id: 'asla',
    name: 'ASLA',
    fullName: 'Amity School of Liberal Arts',
    departments: [
      'Bachelor of Arts (BA)',
      'Master of Arts (MA)'
    ]
  }
]

