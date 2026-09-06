export interface ColorToken {
  name: string
  varName: string
  className: string
  textClassName: string
  note: string
}

export const brandColors: ColorToken[] = [
  {
    name: 'Primary / Maroon',
    varName: '--primary',
    className: 'bg-primary',
    textClassName: 'text-primary-foreground',
    note: 'Deep maroon. Primary actions, active nav, brand anchor.',
  },
  {
    name: 'Gold / Champagne',
    varName: '--gold',
    className: 'bg-gold',
    textClassName: 'text-gold-foreground',
    note: 'Champagne gold. Premium, featured, and accent moments.',
  },
  {
    name: 'Heart / Crimson',
    varName: '--heart',
    className: 'bg-heart',
    textClassName: 'text-heart-foreground',
    note: 'Crimson. Interest, likes, and affinity signals.',
  },
]

export const surfaceColors: ColorToken[] = [
  {
    name: 'Background',
    varName: '--background',
    className: 'bg-background',
    textClassName: 'text-foreground',
    note: 'Warm ivory. App canvas.',
  },
  {
    name: 'Card',
    varName: '--card',
    className: 'bg-card',
    textClassName: 'text-card-foreground',
    note: 'Surface for cards and panels.',
  },
  {
    name: 'Secondary',
    varName: '--secondary',
    className: 'bg-secondary',
    textClassName: 'text-secondary-foreground',
    note: 'Subtle fills and hovers.',
  },
  {
    name: 'Muted',
    varName: '--muted',
    className: 'bg-muted',
    textClassName: 'text-muted-foreground',
    note: 'Quiet backgrounds and disabled states.',
  },
]

export const statusColors: ColorToken[] = [
  {
    name: 'Success',
    varName: '--success',
    className: 'bg-success',
    textClassName: 'text-success-foreground',
    note: 'Approved, verified, completed.',
  },
  {
    name: 'Warning',
    varName: '--warning',
    className: 'bg-warning',
    textClassName: 'text-warning-foreground',
    note: 'Pending, under review.',
  },
  {
    name: 'Destructive',
    varName: '--destructive',
    className: 'bg-destructive',
    textClassName: 'text-destructive-foreground',
    note: 'Rejected, blocked, destructive actions.',
  },
]

export const typeScale = [
  { label: 'Display', className: 'font-serif text-5xl font-bold', sample: 'Find your person', meta: 'Playfair Display · 48px / Bold' },
  { label: 'H1', className: 'font-serif text-4xl font-bold', sample: 'Matches made with care', meta: 'Playfair Display · 36px / Bold' },
  { label: 'H2', className: 'font-serif text-2xl font-semibold', sample: 'Recommended for you', meta: 'Playfair Display · 24px / Semibold' },
  { label: 'H3', className: 'text-lg font-semibold', sample: 'Partner preferences', meta: 'Inter · 18px / Semibold' },
  { label: 'Body', className: 'text-base leading-relaxed', sample: 'A trusted place to find a life partner, built around privacy, verification, and genuine intent.', meta: 'Inter · 16px / Regular' },
  { label: 'Small', className: 'text-sm text-muted-foreground', sample: 'Profile last active 2 hours ago', meta: 'Inter · 14px / Regular' },
  { label: 'Mono', className: 'font-mono text-sm', sample: 'MGZ-100244', meta: 'Geist Mono · IDs & codes' },
]

export interface DemoProfile {
  profileId: string
  firstName: string
  lastName?: string
  age?: number
  currentCity?: string
  heightCm?: number
  highestEducation?: string
  profession?: string
  religion?: string
  caste?: string
  primaryPhotoUrl?: string
  verified?: boolean
  featured?: boolean
  matchScore?: number
  activityStatus?: 'ONLINE' | 'RECENT' | 'UNKNOWN'
}

export const demoProfiles: DemoProfile[] = [
  {
    profileId: 'MGZ-100244',
    firstName: 'Priya',
    lastName: 'Ramesh',
    age: 27,
    currentCity: 'Chennai',
    heightCm: 163,
    highestEducation: 'M.Tech',
    profession: 'Product Designer',
    religion: 'Hindu',
    caste: 'Iyer',
    primaryPhotoUrl: '/profiles/priya.png',
    verified: true,
    featured: true,
    matchScore: 92,
    activityStatus: 'ONLINE',
  },
  {
    profileId: 'MGZ-100871',
    firstName: 'Arjun',
    lastName: 'Menon',
    age: 30,
    currentCity: 'Bengaluru',
    heightCm: 178,
    highestEducation: 'MBA',
    profession: 'Financial Analyst',
    religion: 'Hindu',
    caste: 'Nair',
    primaryPhotoUrl: '/profiles/arjun.png',
    verified: true,
    matchScore: 84,
    activityStatus: 'RECENT',
  },
  {
    profileId: 'MGZ-101532',
    firstName: 'Meera',
    lastName: 'Iyer',
    age: 26,
    currentCity: 'Coimbatore',
    heightCm: 158,
    highestEducation: 'MBBS',
    profession: 'Physician',
    religion: 'Hindu',
    caste: 'Iyer',
    primaryPhotoUrl: '/profiles/meera.png',
    verified: false,
    matchScore: 78,
    activityStatus: 'RECENT',
  },
]
