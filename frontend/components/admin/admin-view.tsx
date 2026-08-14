'use client'

import { useState } from 'react'
import { Shield, Users, Activity, Settings, CheckCircle2, XCircle, Clock, BarChart3, Eye, Trash2, UserCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { StatusPill } from '@/components/shell/status-pill'
import { RoleGuard } from '@/components/shell/role-guard'
import { ROLE_USERS, PERMISSIONS } from '@/lib/rbac'

const MOCK_USERS = Object.values(ROLE_USERS).map((u, i) => ({
  ...u,
  status: i === 3 ? 'pending' : 'active',
  lastLogin: i === 0 ? '2 min ago' : i === 1 ? '1h ago' : i === 2 ? '3h ago' : 'Never',
  createdAt: '2026-01-15',
}))

const AUDIT_LOGS = [
  { id: 1, user: 'D. Nzeyimana', action: 'Viewed scan SCN-24810', resource: 'Scans', time: '2 min ago', level: 'info' },
  { id: 2, user: 'J. Habimana', action: 'Annotated site RW-RTG-01', resource: 'Map', time: '15 min ago', level: 'info' },
  { id: 3, user: 'C. Mukamana', action: 'Submitted OECD Q2 report', resource: 'Compliance', time: '1h ago', level: 'success' },
  { id: 4, user: 'System', action: 'GPS integrity lost on SHP-4023', resource: 'Transport', time: '2h ago', level: 'warning' },
  { id: 5, user: 'D. Nzeyimana', action: 'Exported scan report PDF', resource: 'Scans', time: '3h ago', level: 'info' },
  { id: 6, user: 'System', action: 'Critical safety score at Musha Cassiterite', resource: 'Sites', time: '4h ago', level: 'danger' },
]

const SYSTEM_STATS = [
  { label: 'Total Users', value: '4', icon: Users, color: 'text-primary' },
  { label: 'Active Sessions', value: '3', icon: Activity, color: 'text-accent' },
  { label: 'Audit Events Today', value: '47', icon: Eye, color: 'text-[var(--success)]' },
  { label: 'Pending Approvals', value: '1', icon: Clock, color: 'text-destructive' },
]

const ROLE_COLOR: Record<string, string> = {
  system_admin: 'danger',
  mine_analyst: 'warning',
  geologist: 'info',
  compliance_officer: 'success',
}

export function AdminView() {
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'permissions' | 'system'>('users')

  return (
    <RoleGuard permission="users.manage">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SYSTEM_STATS.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="border-border bg-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex size-10 items-center justify-center rounded-md bg-secondary/70">
                    <Icon className={`size-5 ${s.color}`} />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-border bg-card/40 p-1 w-fit">
          {(['users', 'audit', 'permissions', 'system'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setActiveTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${activeTab === t ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'users' ? 'User Management' : t === 'audit' ? 'Audit Logs' : t === 'permissions' ? 'Role Permissions' : 'System Config'}
            </button>
          ))}
        </div>

        {/* USER MANAGEMENT */}
        {activeTab === 'users' && (
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Platform Users</CardTitle>
                <CardDescription>Manage accounts, roles and access levels</CardDescription>
              </div>
              <button type="button" className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                <UserCheck className="size-3.5" /> Approve Request
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_USERS.map((u) => (
                <div key={u.email} className="flex items-center gap-4 rounded-lg border border-border bg-background/40 px-4 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {u.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <StatusPill tone={ROLE_COLOR[u.role] as 'danger' | 'warning' | 'info' | 'success'}>{u.roleLabel}</StatusPill>
                  <div className="hidden md:block text-right">
                    <p className="text-xs text-foreground">{u.status === 'active' ? 'Active' : 'Pending'}</p>
                    <p className="text-[10px] text-muted-foreground">Last: {u.lastLogin}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {u.status === 'active'
                      ? <CheckCircle2 className="size-4 text-[var(--success)]" />
                      : <Clock className="size-4 text-primary" />}
                    <button type="button" className="ml-1 rounded p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* AUDIT LOGS */}
        {activeTab === 'audit' && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm">Audit Trail</CardTitle>
              <CardDescription>All user actions logged per OECD compliance requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {AUDIT_LOGS.map((log) => (
                <div key={log.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-4 py-2.5">
                  <span className={`size-2 shrink-0 rounded-full ${log.level === 'danger' ? 'bg-destructive' : log.level === 'warning' ? 'bg-primary' : log.level === 'success' ? 'bg-[var(--success)]' : 'bg-accent'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground"><span className="font-medium">{log.user}</span> — {log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.resource} · {log.time}</p>
                  </div>
                  <StatusPill tone={log.level === 'danger' ? 'danger' : log.level === 'warning' ? 'warning' : log.level === 'success' ? 'success' : 'info'}>
                    {log.level}
                  </StatusPill>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ROLE PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(PERMISSIONS) as [string, string[]][]).map(([role, perms]) => (
              <Card key={role} className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm capitalize">{role.replace('_', ' ')}</CardTitle>
                  <CardDescription>{perms.length} permissions granted</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {perms.map((p) => (
                      <span key={p} className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        <CheckCircle2 className="size-3 text-[var(--success)]" /> {p}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* SYSTEM CONFIG */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Shield, title: 'JWT Token Expiry', value: '8 hours', desc: 'Session tokens expire after 8h of inactivity', color: 'text-primary' },
              { icon: Activity, title: 'Sensor Network', value: 'Online', desc: '12 UAV units · 34 ground nodes · Kigali hub', color: 'text-[var(--success)]' },
              { icon: BarChart3, title: 'AI Model Version', value: 'specnet-v4', desc: 'Last retrained: 2026-06-01 · 97.8% peak accuracy', color: 'text-accent' },
              { icon: Settings, title: 'Compliance Mode', value: 'OECD + ITSCI', desc: 'EU Conflict Minerals Reg. 2017/821 active', color: 'text-[var(--success)]' },
              { icon: XCircle, title: 'Failed Logins (24h)', value: '0', desc: 'No brute-force attempts detected', color: 'text-[var(--success)]' },
              { icon: Users, title: 'RMB Integration', value: 'Connected', desc: 'Rwanda Mines Board API · last sync 4 min ago', color: 'text-accent' },
            ].map(({ icon: Icon, title, value, desc, color }) => (
              <Card key={title} className="border-border bg-card">
                <CardContent className="flex items-start gap-4 p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary/70">
                    <Icon className={`size-5 ${color}`} />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
                    <p className="text-lg font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
