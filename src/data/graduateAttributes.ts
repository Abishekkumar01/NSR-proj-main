import { GraduateAttribute } from '../types';

export const graduateAttributes: GraduateAttribute[] = [
  {
    id: 'ga1',
    code: 'GA1',
    name: 'Engineering Knowledge',
    description: 'Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.',
    proficiencyLevels: [
      {
        id: 'ga1-intro',
        level: 'Introductory',
        description: 'Recalls and understands basic engineering concepts',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga1-inter',
        level: 'Intermediate',
        description: 'Applies engineering knowledge to solve well-defined problems',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga1-adv',
        level: 'Advanced',
        description: 'Applies comprehensive engineering knowledge to complex problems',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga2',
    code: 'GA2',
    name: 'Problem Analysis',
    description: 'Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.',
    proficiencyLevels: [
      {
        id: 'ga2-intro',
        level: 'Introductory',
        description: 'Identifies and formulates simple problems',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga2-inter',
        level: 'Intermediate',
        description: 'Analyzes moderately complex problems with guidance',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga2-adv',
        level: 'Advanced',
        description: 'Independently analyzes complex engineering problems',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga3',
    code: 'GA3',
    name: 'Design/Development of Solutions',
    description: 'Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.',
    proficiencyLevels: [
      {
        id: 'ga3-intro',
        level: 'Introductory',
        description: 'Designs simple components with guidance',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga3-inter',
        level: 'Intermediate',
        description: 'Designs moderately complex systems with some independence',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga3-adv',
        level: 'Advanced',
        description: 'Independently designs complex systems considering all constraints',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga4',
    code: 'GA4',
    name: 'Conduct Investigations',
    description: 'Conduct investigations of complex problems: design experiments, analyze and interpret data, and synthesize the information to provide valid conclusions.',
    proficiencyLevels: [
      {
        id: 'ga4-intro',
        level: 'Introductory',
        description: 'Conducts simple experiments following procedures',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga4-inter',
        level: 'Intermediate',
        description: 'Designs and conducts experiments with guidance',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga4-adv',
        level: 'Advanced',
        description: 'Independently designs and conducts complex investigations',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga5',
    code: 'GA5',
    name: 'Modern Tool Usage',
    description: 'Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.',
    proficiencyLevels: [
      {
        id: 'ga5-intro',
        level: 'Introductory',
        description: 'Uses basic tools and software',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga5-inter',
        level: 'Intermediate',
        description: 'Selects and uses appropriate tools effectively',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga5-adv',
        level: 'Advanced',
        description: 'Creates and adapts advanced tools for complex problems',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga6',
    code: 'GA6',
    name: 'The Engineer and Society',
    description: 'Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.',
    proficiencyLevels: [
      {
        id: 'ga6-intro',
        level: 'Introductory',
        description: 'Identifies basic societal and safety issues',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga6-inter',
        level: 'Intermediate',
        description: 'Analyzes societal impact with guidance',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga6-adv',
        level: 'Advanced',
        description: 'Comprehensively evaluates all societal considerations',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga7',
    code: 'GA7',
    name: 'Environment and Sustainability',
    description: 'Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.',
    proficiencyLevels: [
      {
        id: 'ga7-intro',
        level: 'Introductory',
        description: 'Recognizes environmental impact',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga7-inter',
        level: 'Intermediate',
        description: 'Considers sustainability in solutions',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga7-adv',
        level: 'Advanced',
        description: 'Integrates comprehensive sustainability principles',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga8',
    code: 'GA8',
    name: 'Ethics',
    description: 'Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.',
    proficiencyLevels: [
      {
        id: 'ga8-intro',
        level: 'Introductory',
        description: 'Understands basic ethical principles',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga8-inter',
        level: 'Intermediate',
        description: 'Applies ethical reasoning to common situations',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga8-adv',
        level: 'Advanced',
        description: 'Demonstrates ethical leadership in complex scenarios',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga9',
    code: 'GA9',
    name: 'Individual and Team Work',
    description: 'Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.',
    proficiencyLevels: [
      {
        id: 'ga9-intro',
        level: 'Introductory',
        description: 'Participates effectively in teams',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga9-inter',
        level: 'Intermediate',
        description: 'Contributes meaningfully to team objectives',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga9-adv',
        level: 'Advanced',
        description: 'Leads diverse teams effectively',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga10',
    code: 'GA10',
    name: 'Communication',
    description: 'Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.',
    proficiencyLevels: [
      {
        id: 'ga10-intro',
        level: 'Introductory',
        description: 'Communicates basic technical information clearly',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga10-inter',
        level: 'Intermediate',
        description: 'Presents complex information effectively',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga10-adv',
        level: 'Advanced',
        description: 'Communicates expertly with all stakeholders',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga11',
    code: 'GA11',
    name: 'Project Management and Finance',
    description: 'Demonstrate knowledge and understanding of the engineering and management principles and apply these to one\'s own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.',
    proficiencyLevels: [
      {
        id: 'ga11-intro',
        level: 'Introductory',
        description: 'Understands basic project management concepts',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga11-inter',
        level: 'Intermediate',
        description: 'Applies project management to moderate complexity',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga11-adv',
        level: 'Advanced',
        description: 'Manages complex multidisciplinary projects',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  },
  {
    id: 'ga12',
    code: 'GA12',
    name: 'Life-long Learning',
    description: 'Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.',
    proficiencyLevels: [
      {
        id: 'ga12-intro',
        level: 'Introductory',
        description: 'Recognizes need for continuous learning',
        scoreRange: { min: 0, max: 60 }
      },
      {
        id: 'ga12-inter',
        level: 'Intermediate',
        description: 'Actively pursues learning opportunities',
        scoreRange: { min: 60, max: 80 }
      },
      {
        id: 'ga12-adv',
        level: 'Advanced',
        description: 'Demonstrates autonomous learning and adaptation',
        scoreRange: { min: 80, max: 100 }
      }
    ]
  }
];