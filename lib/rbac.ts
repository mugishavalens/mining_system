// MDMIS Role-Based Access Control definitions
// Based on MDMIS SRS v2.0 and Auth/Authorization Design

export type Role = 'system_admin' | 'mine_analyst' | 'geologist' | 'compliance_officer'

export interface RoleUser {
  name: string
  email: string
  role: Role
  roleLabel: string
  initials: string
}

// Map login email → user profile
export const ROLE_USERS: Record<string, RoleUser> = {
  'admin@mdmis.rw': {
    name: 'A. Nkurunziza',
    email: 'admin@mdmis.rw',
    role: 'system_admin',
    roleLabel: 'System Admin',
    initials: 'AN',
  },
  'analyst@mdmis.rw': {
    name: 'D. Nzeyimana',
    email: 'analyst@mdmis.rw',
    role: 'mine_analyst',
    roleLabel: 'Mine Analyst',
    initials: 'DN',
  },
  'geo@mdmis.rw': {
    name: 'J. Habimana',
    email: 'geo@mdmis.rw',
    role: 'geologist',
    roleLabel: 'Geologist',
    initials: 'JH',
  },
  'compliance@mdmis.rw': {
    name: 'C. Mukamana',
    email: 'compliance@mdmis.rw',
    role: 'compliance_officer',
    roleLabel: 'Compliance Officer',
    initials: 'CM',
  },
}

// Permissions per role — based on MDMIS SRS functional requirements
export const PERMISSIONS: Record<Role, string[]> = {
  system_admin: [
    'dashboard.view',
    'dashboard.admin',
    'map.view',
    'map.edit',
    'scans.view',
    'scans.classify',
    'scans.delete',
    'traceability.view',
    'traceability.edit',
    'transport.view',
    'transport.edit',
    'compliance.view',
    'compliance.submit',
    'compliance.approve',
    'users.manage',
    'audit.view',
    'system.configure',
  ],
  mine_analyst: [
    'dashboard.view',
    'map.view',
    'scans.view',
    'scans.classify',
    'traceability.view',
    'transport.view',
    'compliance.view',
  ],
  geologist: [
    'dashboard.view',
    'map.view',
    'map.annotate',
    'scans.view',
    'scans.classify',
    'traceability.view',
  ],
  compliance_officer: [
    'dashboard.view',
    'compliance.view',
    'compliance.submit',
    'compliance.edit',
    'traceability.view',
    'transport.view',
    'scans.view',
  ],
}

export function can(role: Role, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

// Nav items visible per role
export const ROLE_NAV: Record<Role, string[]> = {
  system_admin: ['/dashboard', '/map', '/scans', '/traceability', '/transport', '/compliance', '/admin'],
  mine_analyst: ['/dashboard', '/map', '/scans', '/traceability', '/transport', '/compliance'],
  geologist: ['/dashboard', '/map', '/scans', '/traceability'],
  compliance_officer: ['/dashboard', '/compliance', '/traceability', '/transport', '/scans'],
}
