// MDMIS Role-Based Access Control definitions
// Based on MDMIS SRS v2.0 Section 3.1 (Role Matrix) — 10 platform roles.
// Role identity now comes from the Django backend (see ../backend/accounts)
// via auth-context; this file only maps a role slug to permissions/nav.

export type Role =
  | 'field_operator'
  | 'drone_operator'
  | 'geologist'
  | 'mine_manager'
  | 'safety_officer'
  | 'compliance_manager'
  | 'government_auditor'
  | 'investor'
  | 'company_admin'
  | 'system_admin'

export interface RoleUser {
  name: string
  email: string
  role: Role
  roleLabel: string
  initials: string
}

// Illustrative sample rows for the Admin > User Management table.
// Real accounts are created via /register (POST /api/auth/register/) and
// approved by an admin — this is display-only sample data, not a login list.
export const ROLE_USERS: Record<string, RoleUser> = {
  'admin@mdmis.rw': {
    name: 'A. Nkurunziza', email: 'admin@mdmis.rw', role: 'system_admin', roleLabel: 'System Admin', initials: 'AN',
  },
  'analyst@mdmis.rw': {
    name: 'D. Nzeyimana', email: 'analyst@mdmis.rw', role: 'mine_manager', roleLabel: 'Mine Manager', initials: 'DN',
  },
  'geo@mdmis.rw': {
    name: 'J. Habimana', email: 'geo@mdmis.rw', role: 'geologist', roleLabel: 'Geologist', initials: 'JH',
  },
  'compliance@mdmis.rw': {
    name: 'C. Mukamana', email: 'compliance@mdmis.rw', role: 'compliance_manager', roleLabel: 'Compliance Manager', initials: 'CM',
  },
}

// Permissions per role — derived from the SRS Section 3.1 role matrix.
export const PERMISSIONS: Record<Role, string[]> = {
  field_operator: ['dashboard.view', 'scans.view'],
  drone_operator: ['dashboard.view', 'scans.view'],
  geologist: [
    'dashboard.view', 'map.view', 'map.annotate', 'scans.view', 'scans.classify', 'traceability.view',
  ],
  mine_manager: [
    'dashboard.view', 'map.view', 'map.annotate', 'scans.view', 'scans.classify',
    'traceability.view', 'traceability.edit', 'transport.view', 'compliance.view',
  ],
  safety_officer: ['dashboard.view', 'map.view', 'scans.view'],
  compliance_manager: [
    'dashboard.view', 'compliance.view', 'compliance.submit', 'compliance.edit',
    'traceability.view', 'transport.view', 'scans.view',
  ],
  government_auditor: ['dashboard.view', 'compliance.view', 'traceability.view', 'scans.view'],
  investor: ['dashboard.view', 'compliance.view'],
  company_admin: [
    'dashboard.view', 'dashboard.admin', 'map.view', 'map.annotate', 'scans.view', 'scans.classify',
    'traceability.view', 'traceability.edit', 'transport.view', 'compliance.view', 'compliance.submit',
    'users.manage', 'audit.view',
  ],
  system_admin: [
    'dashboard.view', 'dashboard.admin', 'map.view', 'map.edit', 'scans.view', 'scans.classify', 'scans.delete',
    'traceability.view', 'traceability.edit', 'transport.view', 'transport.edit', 'compliance.view',
    'compliance.submit', 'compliance.approve', 'users.manage', 'audit.view', 'system.configure',
  ],
}

export function can(role: Role, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

// Nav items visible per role. Field/drone operators are Field-App-only in
// the SRS (Section 1.1); on the web portal they see just the dashboard.
export const ROLE_NAV: Record<Role, string[]> = {
  field_operator: ['/dashboard'],
  drone_operator: ['/dashboard', '/scans'],
  geologist: ['/dashboard', '/map/globe', '/map', '/scans', '/traceability'],
  mine_manager: ['/dashboard', '/map/globe', '/map', '/scans', '/traceability', '/transport', '/compliance'],
  safety_officer: ['/dashboard', '/map/globe', '/map'],
  compliance_manager: ['/dashboard', '/compliance', '/traceability', '/transport', '/scans'],
  government_auditor: ['/dashboard', '/compliance', '/traceability', '/scans'],
  investor: ['/dashboard', '/compliance'],
  company_admin: ['/dashboard', '/map/globe', '/map', '/scans', '/traceability', '/transport', '/compliance', '/admin'],
  system_admin: ['/dashboard', '/map/globe', '/map', '/scans', '/traceability', '/transport', '/compliance', '/admin'],
}
