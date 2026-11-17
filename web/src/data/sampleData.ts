import type { VerseItem, TeamMember, BookAnalytics } from '../types';

export const SAMPLE_TEAM: TeamMember[] = [
  {
    name: 'Dr. Paul',
    role: 'Theological Reviewer',
    roles: ['Theological Reviewer', 'Committee'],
    phone: '919876543214',
    email: 'drpaul@glbc.org',
    active: true,
    avatar: 'PP',
    avatarColor: 'bg-emerald-600'
  },
  {
    name: 'Fr. Thomas',
    role: 'Technical Reviewer',
    phone: '919876543211',
    email: 'frthomas@glbc.org',
    active: true,
    avatar: 'FT',
    avatarColor: 'bg-blue-600'
  },
  {
    name: 'Anita',
    role: 'Style & Language Reviewer',
    phone: '919876543212',
    email: 'anita@glbc.org',
    active: true,
    avatar: 'AN',
    avatarColor: 'bg-amber-600'
  },
  {
    name: 'John',
    role: 'Orthographic Reviewer',
    phone: '919876543213',
    email: 'john@glbc.org',
    active: true,
    avatar: 'JN',
    avatarColor: 'bg-indigo-600'
  },
  {
    name: 'Pastor David',
    role: 'Committee',
    phone: '919876543215',
    email: 'pastordavid@glbc.org',
    active: true,
    avatar: 'PD',
    avatarColor: 'bg-purple-600'
  },
  {
    name: 'David',
    role: 'Final Editor',
    phone: '919876543216',
    email: 'david@glbc.org',
    active: true,
    avatar: 'DV',
    avatarColor: 'bg-rose-600'
  }
];

export const SAMPLE_VERSES: VerseItem[] = [
  {
    row: 2,
    verse: 'Rom 1:1',
    chapter: 1,
    verseNumber: 1,
    status: 'Under Review',
    version: 'v.04',
    lastEdited: '2 hours ago',
    oldReading: 'Paul, a servant of Jesus Christ, called to be an apostle, separated unto the gospel of God,',
    proposed: 'ಪೌಲನು, ಯೇಸು ಕ್ರಿಸ್ತನ ಸೇವಕನೂ, ಅಪೊಸ್ತಲನಾಗಲು ಕರೆಯಲ್ಪಟ್ಟವನೂ, ದೇವರ ಸುವಾರ್ತೆಗಾಗಿ ಪ್ರತ್ಯೇಕಿಸಲ್ಪಟ್ಟವನೂ ಆಗಿದ್ದಾನೆ.',
    drafterCmt: 'Kannada word order preserves Greek emphasis on calling and separation.',
    confirms: {
      drafter: true,
      tech: true,
      style: true,
      ortho: false,
      theo: false,
      comm: false,
      final: false
    },
    reviews: {
      tech: 'Fr. Thomas: Verified Greek concordance against NA28. Phrasing is technically solid.',
      style: 'Anita: Flow and euphonic sandhi are natural.',
      ortho: '',
      theo: '',
      conclusion: '',
      final: ''
    },
    wordPairs: [
      { kannada: 'ಪೌಲನು', english: 'Paul' },
      { kannada: 'ಯೇಸು ಕ್ರಿಸ್ತನ', english: 'of Jesus Christ' },
      { kannada: 'ಸೇವಕನೂ', english: 'a servant' },
      { kannada: 'ಅಪೊಸ್ತಲನಾಗಲು', english: 'to be an apostle' },
      { kannada: 'ಕರೆಯಲ್ಪಟ್ಟವನೂ', english: 'called' },
      { kannada: 'ದೇವರ ಸುವಾರ್ತೆಗಾಗಿ', english: 'for the gospel of God' },
      { kannada: 'ಪ್ರತ್ಯೇಕಿಸಲ್ಪಟ್ಟವನೂ', english: 'separated / set apart' },
      { kannada: 'ಆಗಿದ್ದಾನೆ', english: 'is' }
    ],
    notes: [
      {
        type: 'grammar',
        title: 'Grammar',
        text: 'Compound participles maintain the formal register used throughout the epistle.'
      },
      {
        type: 'variant',
        title: 'Textual variant',
        text: '“Set apart” follows the source phrasing (ἀφωρισμένος); see note on verb aspect.'
      }
    ],
    comments: [
      {
        id: 'c1',
        authorName: 'Fr. Thomas',
        authorRole: 'Technical Reviewer',
        avatarColor: 'bg-blue-600',
        timeAgo: 'Yesterday, 2:14 PM',
        text: 'The word “ದಾಸನು” is too literal in ancient Kannada context; recommend “ಸೇವಕನು” for natural syntax.'
      }
    ]
  },
  {
    row: 3,
    verse: 'Rom 1:2',
    chapter: 1,
    verseNumber: 2,
    status: 'Under Review',
    version: 'v.03',
    lastEdited: '5 hours ago',
    oldReading: '(Which he had promised afore by his prophets in the holy scriptures,)',
    proposed: '(ಆ ಸುವಾರ್ತೆಯನ್ನು ಆತನು ಪವಿತ್ರ ಲೇಖನಗಳಲ್ಲಿ ತನ್ನ ಪ್ರವಾದಿಗಳ ಮೂಲಕ ಮೊದಲೇ ವಾಗ್ದಾನ ಮಾಡಿದ್ದನು;)',
    drafterCmt: 'Parenthetical clause follows KJV structure closely.',
    confirms: {
      drafter: true,
      tech: true,
      style: false,
      ortho: false,
      theo: false,
      comm: false,
      final: false
    },
    reviews: {
      tech: 'Fr. Thomas: Prophet references verified against OT citations.',
      style: '',
      ortho: '',
      theo: '',
      conclusion: '',
      final: ''
    },
    wordPairs: [
      { kannada: 'ಆ ಸುವಾರ್ತೆಯನ್ನು', english: 'which (gospel)' },
      { kannada: 'ಆತನು', english: 'he' },
      { kannada: 'ಪವಿತ್ರ ಲೇಖನಗಳಲ್ಲಿ', english: 'in the holy scriptures' },
      { kannada: 'ತನ್ನ ಪ್ರವಾದಿಗಳ ಮೂಲಕ', english: 'through his prophets' },
      { kannada: 'ಮೊದಲೇ', english: 'before / afore' },
      { kannada: 'ವಾಗ್ದಾನ ಮಾಡಿದ್ದನು', english: 'had promised' }
    ],
    notes: [
      {
        type: 'lexical',
        title: 'Lexical Choice',
        text: '“ಪವಿತ್ರ ಲೇಖನಗಳಲ್ಲಿ” (in the holy scriptures) matches classic Protestant Kannada usage.'
      }
    ],
    comments: []
  },
  {
    row: 4,
    verse: 'Rom 1:3',
    chapter: 1,
    verseNumber: 3,
    status: 'Awaiting Review',
    version: 'v.02',
    lastEdited: '1 day ago',
    oldReading: 'Concerning his Son Jesus Christ our Lord, which was made of the seed of David according to the flesh;',
    proposed: 'ಇದು ಆತನ ಕುಮಾರನೂ ನಮ್ಮ ಕರ್ತನೂ ಆಗಿರುವ ಯೇಸು ಕ್ರಿಸ್ತನ ವಿಷಯವಾಗಿದೆ; ಆತನು ಶರೀರದ ಪ್ರಕಾರ ದಾವೀದನ ಸಂತತಿಯಿಂದ ಹುಟ್ಟಿದವನೂ,',
    drafterCmt: 'Christology is central here; preserved dual nature distinction clearly.',
    confirms: {
      drafter: true,
      tech: false,
      style: false,
      ortho: false,
      theo: false,
      comm: false,
      final: false
    },
    reviews: {
      tech: '',
      style: '',
      ortho: '',
      theo: '',
      conclusion: '',
      final: ''
    },
    wordPairs: [
      { kannada: 'ಆತನ ಕುಮಾರನೂ', english: 'his Son' },
      { kannada: 'ನಮ್ಮ ಕರ್ತನೂ', english: 'our Lord' },
      { kannada: 'ಯೇಸು ಕ್ರಿಸ್ತನ', english: 'Jesus Christ' },
      { kannada: 'ಶರೀರದ ಪ್ರಕಾರ', english: 'according to the flesh' },
      { kannada: 'ದಾವೀದನ ಸಂತತಿಯಿಂದ', english: 'of the seed of David' }
    ],
    notes: [
      {
        type: 'grammar',
        title: 'Theological Focus',
        text: 'Ensure “ಶರೀರದ ಪ್ರಕಾರ” conveys incarnation without modalist ambiguity.'
      }
    ],
    comments: []
  },
  {
    row: 5,
    verse: 'Rom 1:4',
    chapter: 1,
    verseNumber: 4,
    status: 'Awaiting Review',
    version: 'v.02',
    lastEdited: '1 day ago',
    oldReading: 'And declared to be the Son of God with power, according to the spirit of holiness, by the resurrection from the dead:',
    proposed: 'ಪವಿತ್ರತೆಯ ಆತ್ಮದ ಪ್ರಕಾರ ಸತ್ತವರೊಳಗಿಂದ ಪುನರುತ್ಥಾನ ಹೊಂದಿದದ್ದರಿಂದ ದೇವರ ಕುಮಾರನೆಂದು ಸಾಮರ್ಥ್ಯದಿಂದ ತೋರ್ಪಡಿಸಲ್ಪಟ್ಟವನೂ ಆಗಿದ್ದಾನೆ.',
    drafterCmt: '“ತೋರ್ಪಡಿಸಲ್ಪಟ್ಟವನೂ” conveys ὁρισθέντος (declared / designated).',
    confirms: {
      drafter: true,
      tech: false,
      style: false,
      ortho: false,
      theo: false,
      comm: false,
      final: false
    },
    reviews: {
      tech: '',
      style: '',
      ortho: '',
      theo: '',
      conclusion: '',
      final: ''
    },
    wordPairs: [
      { kannada: 'ಪವಿತ್ರತೆಯ ಆತ್ಮದ ಪ್ರಕಾರ', english: 'according to the spirit of holiness' },
      { kannada: 'ಸತ್ತವರೊಳಗಿಂದ ಪುನರುತ್ಥಾನ', english: 'resurrection from the dead' },
      { kannada: 'ದೇವರ ಕುಮಾರನೆಂದು', english: 'the Son of God' },
      { kannada: 'ಸಾಮರ್ಥ್ಯದಿಂದ', english: 'with power' }
    ],
    notes: [],
    comments: []
  },
  {
    row: 6,
    verse: 'Rom 1:5',
    chapter: 1,
    verseNumber: 5,
    status: 'Done',
    version: 'v.05',
    lastEdited: '3 days ago',
    oldReading: 'By whom we have received grace and apostleship, for obedience to the faith among all nations, for his name:',
    proposed: 'ಆತನ ಮೂಲಕವೇ ಆತನ ನಾಮಕ್ಕಾಗಿ ಸಕಲ ಜನಾಂಗಗಳಲ್ಲಿ ನಂಬಿಕೆಗೆ ವಿಧೇಯರಾಗುವಂತೆ ನಾವು ಕೃಪೆಯನ್ನೂ ಅಪೊಸ್ತಲತ್ವವನ್ನೂ ಹೊಂದಿದ್ದೇವೆ;',
    drafterCmt: 'All reviewers approved.',
    confirms: {
      drafter: true,
      tech: true,
      style: true,
      ortho: true,
      theo: true,
      comm: true,
      final: true
    },
    reviews: {
      tech: 'Fr. Thomas: Approved.',
      style: 'Anita: Approved.',
      ortho: 'John: Approved.',
      theo: 'Dr. Paul: Approved.',
      conclusion: 'Pastor David: Committee consensus reached.',
      final: 'David: Final edit confirmed.'
    },
    wordPairs: [
      { kannada: 'ಆತನ ಮೂಲಕವೇ', english: 'By whom' },
      { kannada: 'ನಾವು ಕೃಪೆಯನ್ನೂ', english: 'we received grace' },
      { kannada: 'ಅಪೊಸ್ತಲತ್ವವನ್ನೂ', english: 'and apostleship' },
      { kannada: 'ಸಕಲ ಜನಾಂಗಗಳಲ್ಲಿ', english: 'among all nations' }
    ],
    notes: [],
    comments: []
  },
  {
    row: 7,
    verse: 'Rom 1:6',
    chapter: 1,
    verseNumber: 6,
    status: 'Awaiting Committee',
    version: 'v.03',
    lastEdited: '4 hours ago',
    oldReading: 'Among whom are ye also the called of Jesus Christ:',
    proposed: 'ಅವರೊಳಗೆ ನೀವೂ ಯೇಸು ಕ್ರಿಸ್ತನಿಂದ ಕರೆಯಲ್ಪಟ್ಟವರಾಗಿದ್ದೀರಿ:',
    drafterCmt: 'Kannada “ಅವರೊಳಗೆ” translates “Among whom”. Word-by-word back-translation reflects Greek word order.',
    confirms: {
      drafter: true,
      tech: true,
      style: true,
      ortho: true,
      theo: true,
      comm: false,
      final: false
    },
    reviews: {
      tech: 'Fr. Thomas: Verified ἐν οἷς ἐστε καὶ ὑμεῖς κλητοὶ Ἰησοῦ Χριστοῦ. Phrasing accurately conveys the Greek genitive of relationship.',
      style: 'Anita: Euphony is smooth. Recommend checking whether “ಯೇಸು ಕ್ರಿಸ್ತನ ಕರೆಯಲ್ಪಟ್ಟವರು” reads more poetically than “ಯೇಸು ಕ್ರಿಸ್ತನಿಂದ”.',
      ortho: 'John: Spelling of “ಕರೆಯಲ್ಪಟ್ಟವರಾಗಿದ್ದೀರಿ” is orthographically standard with correct conjunct ta-vattu.',
      theo: 'Dr. Paul: Theological emphasis on divine calling (vocatio) must be guarded. “ಯೇಸು ಕ್ರಿಸ್ತನಿಂದ” is orthodox and preserves the divine agent.',
      conclusion: '',
      final: ''
    },
    wordPairs: [
      { kannada: 'ಅವರೊಳಗೆ', english: 'Among whom' },
      { kannada: 'ನೀವೂ', english: 'are ye also' },
      { kannada: 'ಯೇಸು ಕ್ರಿಸ್ತನಿಂದ', english: 'of Jesus Christ (by)' },
      { kannada: 'ಕರೆಯಲ್ಪಟ್ಟವರಾಗಿದ್ದೀರಿ', english: 'the called' }
    ],
    notes: [
      {
        type: 'grammar',
        title: 'Genitive of Possession vs Agency',
        text: 'Greek Ἰησοῦ Χριστοῦ can be subjective or possessive genitive ("belonging to Jesus Christ"). Kannada phrasing captures both nuance.'
      }
    ],
    comments: [
      {
        id: 'c-6-1',
        authorName: 'Anita',
        authorRole: 'Style & Language Reviewer',
        avatarColor: 'bg-amber-600',
        timeAgo: 'Yesterday, 4:00 PM',
        text: 'Both “ಯೇಸು ಕ್ರಿಸ್ತನಿಂದ” and “ಯೇಸು ಕ್ರಿಸ್ತನ ಸೇವಕರು” are possible; let Committee choose the most natural rhythm.'
      },
      {
        id: 'c-6-2',
        authorName: 'Dr. Paul',
        authorRole: 'Theological Reviewer',
        avatarColor: 'bg-emerald-600',
        timeAgo: 'Yesterday, 5:30 PM',
        text: 'Agreed. “ಯೇಸು ಕ್ರಿಸ್ತನಿಂದ ಕರೆಯಲ್ಪಟ್ಟವರಾಗಿದ್ದೀರಿ” conveys divine calling most faithfully to the Greek.'
      }
    ]
  },
  {
    row: 8,
    verse: 'Rom 1:7',
    chapter: 1,
    verseNumber: 7,
    status: 'Needs Final',
    version: 'v.04',
    lastEdited: '1 hour ago',
    oldReading: 'To all that be in Rome, beloved of God, called to be saints: Grace to you and peace from God our Father, and the Lord Jesus Christ.',
    proposed: 'ರೋಮದಲ್ಲಿರುವ ದೇವರಿಗೆ ಪ್ರಿಯರೂ ಪರಿಶುದ್ಧರಾಗಲು ಕರೆಯಲ್ಪಟ್ಟವರೂ ಆದ ಎಲ್ಲರಿಗೂ: ನಮ್ಮ ತಂದೆಯಾದ ದೇವರಿಂದಲೂ ಕರ್ತನಾದ ಯೇಸು ಕ್ರಿಸ್ತನಿಂದಲೂ ಕೃಪೆಯೂ ಶಾಂತಿಯೂ ನಿಮಗುಂಟಾಗಲಿ.',
    drafterCmt: 'Apostolic salutation rendered in formal epistolary Kannada style.',
    confirms: {
      drafter: true,
      tech: true,
      style: true,
      ortho: true,
      theo: true,
      comm: true,
      final: false
    },
    reviews: {
      tech: 'Fr. Thomas: Verified salutation structure. Matches Greek χάρις ὑμῖನ್ καὶ εἰρήνη.',
      style: 'Anita: Formal benediction reads with high reverential dignity.',
      ortho: 'John: Orthography verified.',
      theo: 'Dr. Paul: Trinitarian greeting perfectly balanced between Father and Lord Jesus Christ.',
      conclusion: 'Pastor David: Committee consensus unanimous. Adopt drafter reading with reverential punctuation.',
      final: ''
    },
    wordPairs: [
      { kannada: 'ರೋಮದಲ್ಲಿರುವ', english: 'To all that be in Rome' },
      { kannada: 'ದೇವರಿಗೆ ಪ್ರಿಯರೂ', english: 'beloved of God' },
      { kannada: 'ಪರಿಶುದ್ಧರಾಗಲು ಕರೆಯಲ್ಪಟ್ಟವರೂ', english: 'called to be saints' },
      { kannada: 'ಕೃಪೆಯೂ ಶಾಂತಿಯೂ', english: 'Grace and peace' },
      { kannada: 'ನಮ್ಮ ತಂದೆಯಾದ ದೇವರಿಂದಲೂ', english: 'from God our Father' }
    ],
    notes: [
      {
        type: 'lexical',
        title: 'Benediction Formula',
        text: 'Standard biblical Kannada blessing phrase “ನಿಮಗುಂಟಾಗಲಿ” (unto you be).'
      }
    ],
    comments: []
  }
];

export const SAMPLE_ANALYTICS: BookAnalytics = {
  total: 433,
  completed: 85,
  completionRate: 20,
  stages: {
    notStarted: 120,
    awaitingReview: 140,
    underReview: 48,
    awaitingCommittee: 24,
    needsFinal: 16,
    done: 85
  },
  bottlenecks: {
    technical: 12,
    style: 18,
    orthographic: 35,
    theological: 7,
    committee: 24,
    finalEditor: 16
  }
};
