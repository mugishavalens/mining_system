'use client'

import Link from 'next/link'
import { BarChart3, Globe2, ShieldCheck, Shield, ArrowRight, MapPin, ScanLine, Link2, Truck, FileCheck2, Users, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const ROLE_CONFIG = {
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
  mine_analyst: {
    icon: BarChart3,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    greeting: 'Mine Analyst Portal',
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
  compliance_officer: {
    icon: ShieldCheck,
    color: 'text-[var(--success)]',
    bg: 'bg-[var(--success)]/10 border-[var(--success)]/20',
    greeting: 'Compliance Officer Portal',
    desc: 'Manage OECD due diligence reports, ITSCI tag reconciliation, RMB licensing returns and flag non-compliant mineral lots.',
    quickLinks: [
      { href: '/compliance', label: 'OECD Reports', icon: ShieldCheck },
      { href: '/traceability', label: 'Chain of Custody', icon: Link2 },
      { href: '/transport', label: 'Convoy Compliance', icon: Truck },
      { href: '/scans', label: 'Scan Records', icon: ScanLine },
    ],
  },
}

export function RoleDashboard() {
  const { user } = useAuth()
  if (!user) return null

  const cfg = ROLE_CONFIG[user.role]
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
