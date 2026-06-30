export const INITIAL_CLIENTS = [
  {
    id: 'cli-1',
    companyName: 'AeroMedia Group',
    contactPerson: 'Sarah Jenkins',
    email: 'sarah@aeromedia.com',
    phone: '+1 (555) 234-5678',
    website: 'https://aeromedia.com',
    industry: 'Aviation & Tech',
    status: 'Active',
    activeServices: ['SEO Optimization', 'Google Ads Management', 'ORM'],
    monthlyBilling: 4500,
    projectStatus: 'On Track',
    notes: 'AeroMedia is looking to expand SEO targeting into European markets next quarter. Focus on landing page optimizations.',
    documents: ['AeroMedia_Contract_2026.pdf', 'Q1_SEO_Strategy.pdf'],
    closingDate: '2026-12-31'
  },
  {
    id: 'cli-2',
    companyName: 'Apex Health Corp',
    contactPerson: 'David Miller',
    email: 'd.miller@apexhealth.org',
    phone: '+1 (555) 876-5432',
    website: 'https://apexhealth.org',
    industry: 'Healthcare & Pharma',
    status: 'Active',
    activeServices: ['Social Media Marketing', 'Website Development'],
    monthlyBilling: 6200,
    projectStatus: 'In Review',
    notes: 'Website revamp launch is scheduled for next week. Needs social media content alignment for the launch announcement.',
    documents: ['Apex_Revamp_Wireframes.fig', 'Social_Content_Calendar.xlsx'],
    closingDate: '2026-06-15'
  },
  {
    id: 'cli-3',
    companyName: 'Zenith E-Commerce',
    contactPerson: 'Yuki Tanaka',
    email: 'tanaka@zenithshop.co',
    phone: '+81 3-5555-0199',
    website: 'https://zenithshop.co',
    industry: 'Retail & E-commerce',
    status: 'Paused',
    activeServices: ['Google Ads Management', 'Video Production'],
    monthlyBilling: 3500,
    projectStatus: 'Delayed',
    notes: 'Ad budget is temporarily paused due to supply chain inventory delays. Expecting restart by June.',
    documents: ['Zenith_Q1_Performance.pdf'],
    closingDate: '2026-10-10'
  },
  {
    id: 'cli-4',
    companyName: 'Verdant Energy',
    contactPerson: 'Liam O\'Connor',
    email: 'l.oconnor@verdant.io',
    phone: '+353 1 496 0123',
    website: 'https://verdant.io',
    industry: 'Renewables',
    status: 'Pending',
    activeServices: ['SEO Optimization', 'Branding & Design'],
    monthlyBilling: 5000,
    projectStatus: 'Not Started',
    notes: 'Onboarding call scheduled. Waiting for brand assets folder upload.',
    documents: ['Verdant_Proposal_V3.pdf'],
    closingDate: '2026-05-12'
  },
  {
    id: 'cli-5',
    companyName: 'Novus Learning',
    contactPerson: 'Marcus Vance',
    email: 'marcus@novus.edu',
    phone: '+1 (555) 432-1098',
    website: 'https://novus.edu',
    industry: 'Education & EdTech',
    status: 'Completed',
    activeServices: ['Website Development', 'Branding & Design'],
    monthlyBilling: 0,
    projectStatus: 'Completed',
    notes: 'LMS Portal development successfully handed over. Support retainer under negotiation.',
    documents: ['Novus_LMS_Handover_Signed.pdf', 'Novus_Brand_Guidelines.pdf'],
    closingDate: '2026-04-30'
  }
];

export const INITIAL_SERVICES = [
  { id: 'srv-seo', name: 'SEO Optimization', category: 'SEO', price: 1500, timeline: 'Monthly', deliverables: 'Keyword Tracking, Content Audit, Backlink Building, Technical Optimization' },
  { id: 'srv-smm', name: 'Social Media Marketing', category: 'Social Media', price: 2000, timeline: 'Monthly', deliverables: '16 Custom Posts, Graphic Design, Community Management, Monthly Reports' },
  { id: 'srv-gads', name: 'Google Ads Management', category: 'PPC', price: 1800, timeline: 'Monthly', deliverables: 'Ad Copywriting, Bid Strategy, Conversion Tracking, Keyword Optimization' },
  { id: 'srv-web', name: 'Website Development', category: 'Development', price: 5000, timeline: 'One-time', deliverables: 'Custom UI Design, Next.js Development, CMS Integration, SEO Friendly Structure' },
  { id: 'srv-brand', name: 'Branding & Design', category: 'Branding', price: 2500, timeline: 'One-time', deliverables: 'Logo Suite, Typography, Color Palette, Brand Book, Collateral Templates' },
  { id: 'srv-video', name: 'Video Production & Editing', category: 'Creative', price: 3000, timeline: 'Per Project', deliverables: 'Scriptwriting, 2x 60s Promotional Videos, Custom Animations, Voiceover' },
  { id: 'srv-orm', name: 'Online Reputation Management', category: 'ORM', price: 1200, timeline: 'Monthly', deliverables: 'Review Monitoring, Negative Search Suppressing, Positive PR Amplification' }
];

export const INITIAL_TASKS = [
  { id: 'tsk-1', title: 'Optimize Homepage Meta Tags', client: 'AeroMedia Group', assignee: 'Alex Rivera', status: 'In Progress', deadline: '2026-05-25', priority: 'High', comments: 3 },
  { id: 'tsk-2', title: 'Setup Google Merchant Center', client: 'Zenith E-Commerce', assignee: 'Chloe Chen', status: 'Todo', deadline: '2026-05-30', priority: 'Medium', comments: 1 },
  { id: 'tsk-3', title: 'Finalize Brand Book Layout', client: 'Verdant Energy', assignee: 'Marcus Aurelius', status: 'Review', deadline: '2026-05-22', priority: 'High', comments: 5 },
  { id: 'tsk-4', title: 'Deploy LMS Portal Revamp', client: 'Novus Learning', assignee: 'Alex Rivera', status: 'Completed', deadline: '2026-05-18', priority: 'High', comments: 12 },
  { id: 'tsk-5', title: 'Draft June Ad Campaign copy', client: 'Apex Health Corp', assignee: 'Jane Doe', status: 'Todo', deadline: '2026-06-02', priority: 'Low', comments: 0 },
  { id: 'tsk-6', title: 'Resolve broken links in footer', client: 'AeroMedia Group', assignee: 'Chloe Chen', status: 'In Progress', deadline: '2026-05-24', priority: 'Low', comments: 2 }
];

export const INITIAL_LEADS = [
  { id: 'ld-1', company: 'Solaria Solar', contact: 'Helena Vance', email: 'helena@solaria.com', value: 8000, stage: 'Lead', industry: 'Energy', date: '2026-05-15' },
  { id: 'ld-2', company: 'Nova Fitness', contact: 'Ryan Giggs', email: 'ryan@novafit.com', value: 3500, stage: 'Contacted', industry: 'Healthcare', date: '2026-05-18' },
  { id: 'ld-3', company: 'Quantum Crypt', contact: 'Nils Bohr', email: 'nils@quantumcrypt.io', value: 12000, stage: 'Proposal', industry: 'Tech & Security', date: '2026-05-10' },
  { id: 'ld-4', company: 'Beacon Logistics', contact: 'Alan Turing', email: 'alan@beaconlog.com', value: 9500, stage: 'Negotiating', industry: 'Logistics', date: '2026-05-08' },
  { id: 'ld-5', company: 'DineOut Platform', contact: 'Gordon R.', email: 'gordon@dineout.app', value: 6000, stage: 'Closed', industry: 'Food & Beverage', date: '2026-05-02' }
];

export const INITIAL_INVOICES = [
  { id: 'inv-101', clientName: 'AeroMedia Group', clientEmail: 'sarah@aeromedia.com', amount: 4500, issueDate: '2026-05-01', dueDate: '2026-05-15', status: 'Paid', taxGst: 810, total: 5310, recurring: true, serviceList: ['SEO Optimization', 'Google Ads Management', 'ORM'] },
  { id: 'inv-102', clientName: 'Apex Health Corp', clientEmail: 'd.miller@apexhealth.org', amount: 6200, issueDate: '2026-05-01', dueDate: '2026-05-15', status: 'Paid', taxGst: 1116, total: 7316, recurring: true, serviceList: ['Social Media Marketing', 'Website Development'] },
  { id: 'inv-103', clientName: 'Zenith E-Commerce', clientEmail: 'tanaka@zenithshop.co', amount: 3500, issueDate: '2026-05-01', dueDate: '2026-05-15', status: 'Due', taxGst: 630, total: 4130, recurring: false, serviceList: ['Google Ads Management', 'Video Production'] },
  { id: 'inv-104', clientName: 'AeroMedia Group', clientEmail: 'sarah@aeromedia.com', amount: 4500, issueDate: '2026-04-01', dueDate: '2026-04-15', status: 'Paid', taxGst: 810, total: 5310, recurring: true, serviceList: ['SEO Optimization', 'Google Ads Management', 'ORM'] },
  { id: 'inv-105', clientName: 'Verdant Energy', clientEmail: 'l.oconnor@verdant.io', amount: 5000, issueDate: '2026-05-10', dueDate: '2026-05-24', status: 'Overdue', taxGst: 900, total: 5900, recurring: true, serviceList: ['SEO Optimization', 'Branding & Design'] }
];

export const INITIAL_NOTIFICATIONS = [
  { id: 'nt-1', title: 'New Service Requested', message: 'Zenith E-Commerce requested SEO Optimization service addition.', type: 'service', time: '10 mins ago', read: false },
  { id: 'nt-2', title: 'Invoice Overdue Alert', message: 'Verdant Energy invoice #105 is overdue by 3 days.', type: 'billing', time: '1 hour ago', read: false },
  { id: 'nt-3', title: 'SEO Report Compiled', message: 'The Q1 technical SEO audit for AeroMedia Group is ready for review.', type: 'report', time: '4 hours ago', read: true },
  { id: 'nt-4', title: 'Task Completed', message: 'Alex Rivera finished task "Deploy LMS Portal Revamp" for Novus Learning.', type: 'task', time: '1 day ago', read: true }
];

export const MOCK_RENEGOTIATION_LOGS = [
  { id: 'rn-1', clientName: 'AeroMedia Group', oldPrice: 5000, newPrice: 4500, date: '2026-04-12', approvedBy: 'Admin (RAJIB)', note: 'Price matched under SEO discount promo' },
  { id: 'rn-2', clientName: 'Apex Health Corp', oldPrice: 5500, newPrice: 6200, date: '2026-03-01', approvedBy: 'Admin (RAJIB)', note: 'Added Custom CMS retainer structure (+ $700)' }
];

export const SERVICE_REQUESTS = [
  { id: 'req-1', clientName: 'Zenith E-Commerce', serviceName: 'SEO Optimization', cost: 1500, requestedDate: '2026-05-20', status: 'Pending' }
];

export const INITIAL_SEO_REPORT = {
  id: 'rep-1',
  clientId: 'cli-1',
  clientName: 'AeroMedia Group',
  title: 'Q2 Core Web Vitals Audit',
  category: 'Audit',
  month: 'June',
  uploadDate: '2026-06-25',
  details: 'Audit report outlining critical mobile performance issues, LCP delays on product images, and duplicate layout shifts.',
  fileName: 'AeroMedia_Q2_WebVitals.pdf',
  fileSize: '2.4 MB'
};

export const MOCK_SEO_REPORTS = [
  INITIAL_SEO_REPORT,
  {
    id: 'rep-2',
    clientId: 'cli-1',
    clientName: 'AeroMedia Group',
    title: 'SEO Traffic & Backlink Projection',
    category: 'SEO Report',
    month: 'June',
    uploadDate: '2026-06-12',
    details: 'Detailed target keyword indexing tracker and organic domain authority projection models.',
    fileName: 'AeroMedia_SEO_June_2026.pdf',
    fileSize: '4.1 MB'
  },
  {
    id: 'rep-3',
    clientId: 'cli-2',
    clientName: 'Apex Health Corp',
    title: 'HIPAA Compliance Site Review',
    category: 'Audit',
    month: 'June',
    uploadDate: '2026-06-20',
    details: 'Comprehensive security review of data storage forms and clinic locator integrations.',
    fileName: 'Apex_HIPAA_Review.pdf',
    fileSize: '1.8 MB'
  },
  {
    id: 'rep-4',
    clientId: 'cli-2',
    clientName: 'Apex Health Corp',
    title: 'June PPC Performance Brief',
    category: 'Marketing Report',
    month: 'June',
    uploadDate: '2026-06-28',
    details: 'Ad click-through rates, budget distribution breakdown, and cost per lead analysis.',
    fileName: 'Apex_PPC_June_Brief.pdf',
    fileSize: '1.2 MB'
  },
  {
    id: 'rep-5',
    clientId: 'cli-3',
    clientName: 'Zenith E-Commerce',
    title: 'Zenith Q2 E-commerce SEO Brief',
    category: 'SEO Report',
    month: 'May',
    uploadDate: '2026-05-24',
    details: 'Technical analysis of category redirects and schema markups for product listings.',
    fileName: 'Zenith_Q2_SEO_Audit.pdf',
    fileSize: '3.5 MB'
  },
  {
    id: 'rep-6',
    clientId: 'cli-4',
    clientName: 'Verdant Energy',
    title: 'Brand Development Status Update',
    category: 'Normal Report',
    month: 'June',
    uploadDate: '2026-06-15',
    details: 'Visual asset wireframes progression and color scheme proposal feedback logging.',
    fileName: 'Verdant_Branding_June.pdf',
    fileSize: '5.6 MB'
  }
];

export const MOCK_PROJECTS = [
  {
    id: 'prj-1',
    clientId: 'cli-1',
    clientName: 'AeroMedia Group',
    name: 'AeroMedia Cloud Portal',
    value: 120000,
    paid: 80000,
    deadline: '2026-06-20',
    status: 'Going'
  },
  {
    id: 'prj-2',
    clientId: 'cli-2',
    clientName: 'Apex Health Corp',
    name: 'Apex HIPAA Migration',
    value: 180000,
    paid: 180000,
    deadline: '2026-07-15',
    status: 'Completed'
  },
  {
    id: 'prj-3',
    clientId: 'cli-3',
    clientName: 'Zenith E-Commerce',
    name: 'Zenith SEO Overhaul',
    value: 75000,
    paid: 30000,
    deadline: '2026-08-01',
    status: 'Going'
  },
  {
    id: 'prj-4',
    clientId: 'cli-4',
    clientName: 'Verdant Energy',
    name: 'Verdant Brand Strategy',
    value: 50000,
    paid: 20000,
    deadline: '2026-06-10',
    status: 'Going'
  }
];

export const MOCK_PURCHASE_ORDERS = [
  {
    id: 'po-101',
    clientName: 'AeroMedia Group',
    invoiceNo: 'PO-2026-001',
    title: 'AeroMedia Cloud Web Development Agreement',
    amount: 120000,
    date: '2026-05-10',
    fileName: 'PO-2026-001_Signed.pdf',
    fileSize: '345 KB'
  },
  {
    id: 'po-102',
    clientName: 'Apex Health Corp',
    invoiceNo: 'PO-2026-008',
    title: 'Apex Patient Portal Security Integration',
    amount: 180000,
    date: '2026-05-15',
    fileName: 'PO_Apex_HIPAA_Integration.pdf',
    fileSize: '512 KB'
  },
  {
    id: 'po-103',
    clientName: 'Zenith E-Commerce',
    invoiceNo: 'PO-2026-015',
    title: 'Zenith Retainer - SEO Overhaul Campaign',
    amount: 75000,
    date: '2026-06-01',
    fileName: 'PO_Zenith_SEO_Retainer.pdf',
    fileSize: '290 KB'
  }
];

export const MOCK_COMMENTS = [
  { id: 'c-1', taskId: 'tsk-3', user: 'Marcus Aurelius', text: 'I completed the typography definitions and color ratios. Alex, please review before presenting.', time: '3 hours ago' },
  { id: 'c-2', taskId: 'tsk-3', user: 'Alex Rivera', text: 'Looks outstanding, Marcus! Let\'s shift the emerald palette a bit darker for modern tone.', time: '1 hour ago' },
  { id: 'c-3', taskId: 'tsk-1', user: 'Alex Rivera', text: 'Targeting "aerospace cloud services" on the header tags.', time: '4 hours ago' }
];

export const MOCK_TEAM = [
  { id: 'tm-1', name: 'Alex Rivera', email: 'alex@aurascale.io', role: 'team', jobTitle: 'SEO Team Lead', workload: '4 Tasks Active', leadPipelineAccess: false, password: 'team123', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80' },
  { id: 'tm-2', name: 'Chloe Chen', email: 'team@aurascale.io', role: 'team', jobTitle: 'PPC Specialist', workload: '2 Tasks Active', leadPipelineAccess: true, password: 'team123', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80' },
  { id: 'tm-3', name: 'Marcus Aurelius', email: 'marcus@aurascale.io', role: 'team', jobTitle: 'Brand & Creative Director', workload: '1 Task Active', leadPipelineAccess: false, password: 'team123', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80' },
  { id: 'tm-4', name: 'Jane Doe', email: 'jane@aurascale.io', role: 'team', jobTitle: 'Content Writer', workload: '1 Task Active', leadPipelineAccess: false, password: 'team123', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80' }
];
