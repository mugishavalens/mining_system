'use client'

import Link from 'next/link'
import { BarChart3, Globe2, ShieldCheck, Shield, ArrowRight, MapPin, ScanLine, Link2, Truck, FileCheck2, Users, Settings, Radio, HardHat, Gavel, TrendingUp } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import type { Role } from '@/lib/rbac'

const ROLE_CONFIG: Record<Role, {
  icon: React.ElementType
  color: string
  bg: string
  greeting: string
  desc: string
  quickLinks: { href: string; label: string; icon: React.ElementType }[]
}> = {
  system_admin: {
    icon: Shield,
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
    greeting: 'System Administrator Portal',
    desc: 'Full platform access — manage users, review audit logs, configure system settings and monitor all operations.',
    quickLinks: [
      { href: '/admin', label: 'User Management', icon: Users },
      { href: '/admin', label: 'Audit Logs', icon: FileCheck2 },
      { href: '/admin', label: 'System Config', icon: Settings },
      { href: '/compliance', label: 'Compliance Reports', icon: ShieldCheck },
    ],
  },
  company_admin: {
    icon: Shield,
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
    greeting: 'Company Admin Portal',
    desc: 'Manage your organisation’s users and sites, review the org-wide audit trail and configure notifications.',
    quickLinks: [
      { href: '/admin', label: 'User Management', icon: Users },
      { href: '/admin', label: 'Audit Logs', icon: FileCheck2 },
      { href: '/map', label: 'Site Overview', icon: MapPin },
      { href: '/compliance', label: 'Compliance Reports', icon: ShieldCheck },
    ],
  },
  mine_manager: {
    icon: BarChart3,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    greeting: 'Mine Manager Portal',
    desc: 'View detection sites, run AI classifications, export scan reports and monitor supply-chain compliance status.',
    quickLinks: [
      { href: '/scans', label: 'AI Scan Analysis', icon: ScanLine },
      { href: '/map', label: '3D Site Map', icon: MapPin },
      { href: '/traceability', label: 'Chain of Custody', icon: Link2 },
      { href: '/transport', label: 'Fleet Status', icon: Truck },
    ],
  },
  geologist: {
    icon: Globe2,
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
    greeting: 'Geologist Portal',
    desc: 'Explore 3D subsurface maps, annotate detection sites, analyze multi-sensor scan data and review geological survey results.',
    quickLinks: [
      { href: '/map', label: '3D Subsurface Explorer', icon: Globe2 },
      { href: '/scans', label: 'Hyperspectral Scans', icon: ScanLine },
      { href: '/traceability', label: 'Site Traceability', icon: Link2 },
      { href: '/map', label: 'Annotate Sites', icon: MapPin },
    ],
  },
  compliance_manager: {
    icon: ShieldCheck,
    color: 'text-[var(--success)]',
    bg: 'bg-[var(--success)]/10 border-[var(--success)]/20',
    greeting: 'Compliance Manager Portal',
    desc: 'Manage OECD due diligence reports, ITSCI tag reconciliation, RMB licensing returns and flag non-compliant mineral lots.',
    quickLinks: [
      { href: '/compliance', label: 'OECD Reports', icon: ShieldCheck },
      { href: '/traceability', label: 'Chain of Custody', icon: Link2 },
      { href: '/transport', label: 'Convoy Compliance', icon: Truck },
      { href: '/scans', label: 'Scan Records', icon: ScanLine },
    ],
  },
  safety_officer: {
    icon: HardHat,
    color: 'text-[oklch(0.72_0.16_55)]',
    bg: 'bg-[oklch(0.72_0.16_55)]/10 border-[oklch(0.72_0.16_55)]/20',
    greeting: 'Safety Officer Portal',
    desc: 'Monitor real-time site risk scores, acknowledge safety incidents and review subsurface stability alerts.',
    quickLinks: [
      { href: '/map', label: 'Risk Scores', icon: ShieldCheck },
      { href: '/map', label: '3D Subsurface View', icon: Globe2 },
      { href: '/dashboard', label: 'Active Alerts', icon: Radio },
    ],
  },
  government_auditor: {
    icon: Gavel,
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
    greeting: 'Government Auditor Portal',
    desc: 'Read-only access to compliance records, grading certificates and traceability reports for your area of concession.',
    quickLinks: [
      { href: '/compliance', label: 'Compliance Records', icon: ShieldCheck },
      { href: '/traceability', label: 'Traceability Reports', icon: Link2 },
      { href: '/scans', label: 'Grading Records', icon: ScanLine },
    ],
  },
  investor: {
    icon: TrendingUp,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    greeting: 'Investor Portal',
    desc: 'Read-only view of resource estimates, production summaries and financial analytics for your authorised sites.',
    quickLinks: [
      { href: '/compliance', label: 'Production Summaries', icon: ShieldCheck },
      { href: '/dashboard', label: 'Resource Estimates', icon: BarChart3 },
    ],
  },
  field_operator: {
    icon: Radio,
    color: 'text-muted-foreground',
    bg: 'bg-secondary/40 border-border',
    greeting: 'Field Operator',
    desc: 'Field data collection, batch tagging and safety event logging happen in the MDMIS Field App.',
    quickLinks: [
      { href: '/scans', label: 'Scan Records', icon: ScanLine },
    ],
  },
  drone_operator: {
    icon: Radio,
    color: 'text-muted-foreground',
    bg: 'bg-secondary/40 border-border',
    greeting: 'Drone Operator',
    desc: 'Flight log and hyperspectral file uploads happen in the MDMIS Field App. Upload status is visible here.',
    quickLinks: [
      { href: '/scans', label: 'Upload Status', icon: ScanLine },
    ],
  },
}

export function RoleDashboard() {
  const { user } = useAuth()
  if (!user) return null

  const cfg = ROLE_CONFIG[user.role as Role] ?? ROLE_CONFIG.field_operator
  const Icon = cfg.icon

  return (
    <div className={`rounded-xl border p-5 ${cfg.bg}`}>
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-background/40">
          <Icon className={`size-6 ${cfg.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={`text-base font-bold ${cfg.color}`}>{cfg.greeting}</h2>
            <span className="rounded-full border border-current/20 bg-background/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {user.name}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{cfg.desc}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cfg.quickLinks.map(({ href, label, icon: LinkIcon }) => (
          <Link key={label} href={href}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2.5 text-sm text-foreground hover:border-primary/40 hover:bg-background/80 transition-all group">
            <LinkIcon className={`size-4 shrink-0 ${cfg.color} group-hover:scale-110 transition-transform`} />
            <span className="truncate text-xs font-medium">{label}</span>
            <ArrowRight className="size-3 ml-auto shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  )
}
