export const ISSUE_CATEGORIES = [
  'Hardware Issues',
  'Network & Connectivity Issues',
  'Software Issues',
  'Email & Communication Issues',
  'Access & Security Issues',
  'System Performance Issues',
  'Peripheral Devices',
  'General Requests'
];

export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
export const TICKET_STATUS = ['Open', 'In Progress', 'Resolved'];

export const DEPARTMENTS = [
  'Administration',
  'Audit',
  'Communications',
  'Finance',
  'Human Resources',
  'ICT',
  'Knowledge & Research',
  'Legal',
  'Placement',
  'Strategy, Planning and Compliance',
  'Supply Chain Management',
];

export const PRIORITY_CONFIG = {
  Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  High: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

export const STATUS_CONFIG = {
  Open: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'In Progress': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export const CHART_COLORS = [
  '#911414', '#d20001', '#ac0807', '#f59e0b', 
  '#10b981', '#3b82f6', '#14b8a6', '#f97316'
];

export const API_BASE_URL = 'http://localhost:5000/api';
