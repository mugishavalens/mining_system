'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mountain, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Globe2, ScanLine, Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const DEMO_ROLES = [
  { role: 'Mine Analyst', email: 'analyst@mdmis.rw', color: 'text-primary' },
  { role: 'Geologist', email: 'geo@mdmis.rw', color: 'text-accent' },
  { role: 'Compliance Officer', email: 'compliance@mdmis.rw', color: 'text-[var(--success)]' },
  { role: 'System Admin', email: 'admin@mdmis.rw', color: 'text-destructive' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError('Invalid credentials. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* LEFT PANEL - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/mine/mine-panorama.png"
            alt="Mining operations"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.15),transparent_60%)]" />
        </div>

        {/* Back to home - top-left brand mark, NAVEXA-style */}
        <Link
          href="/"
          className="relative z-10 flex items-center gap-3 px-8 pt-8 group w-fit"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Mountain className="size-5" />
          </div>
          <div className="flex items-center gap-1.5 text-white/80 group-hover:text-white transition-colors">
            <ArrowLeft className="size-3.5" />
            <span className="text-sm font-medium">Back to home</span>
          </div>
        </Link>

        <div className="relative z-10 flex flex-col justify-center flex-1 px-12 max-w-lg w-full mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">MDMIS</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Mining Intelligence System</p>
            </div>
          </div>

          <p className="text-white/90 text-lg leading-relaxed mb-8 font-light">
            AI-powered subsurface detection, 3D geospatial visualization, and compliance automation for Rwanda's mining sector
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: Globe2, label: '3D Subsurface Mapping', desc: 'X-Ray terrain', iconColor: 'text-cyan-400', border: 'border-cyan-500/20' },
              { icon: ScanLine, label: 'AI Classification', desc: '92.7% accuracy', iconColor: 'text-yellow-400', border: 'border-yellow-500/20' },
              { icon: Shield, label: 'OECD Compliance', desc: 'Auto reports', iconColor: 'text-emerald-400', border: 'border-emerald-500/20' },
              { icon: Lock, label: 'Multi-Tenant', desc: 'Role-based', iconColor: 'text-rose-400', border: 'border-rose-500/20' },
            ].map(({ icon: Icon, label, desc, iconColor, border }) => (
              <div key={label} className={`rounded-xl border ${border} bg-black/40 backdrop-blur-md px-4 py-4 hover:bg-black/55 transition-all`}>
                <Icon className={`size-5 mb-2 ${iconColor}`} />
                <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                <p className="text-[11px] text-white/60 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
            </span>
            <span>Kigali Operations · 12 drones · 34 sensors online</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.06),transparent_60%)]" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.02]" />

        <div className="relative w-full max-w-md mx-auto">
          {/* Mobile Logo + back home */}
          <div className="flex lg:hidden items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Mountain className="size-6" />
              </div>
              <div>
                <p className="font-mono text-base font-bold text-foreground">MDMIS</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Mining Intelligence</p>
              </div>
            </div>
            <Link href="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-3.5" /> Home
            </Link>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-base text-muted-foreground">Sign in to access your mining intelligence dashboard</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mdmis.rw"
                className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3.5 pr-12 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" className="rounded border-border" /> Remember me
              </label>
              <a href="#" className="text-primary hover:underline font-medium">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 py-4 text-[15px] font-semibold text-primary-foreground hover:from-primary/90 hover:to-primary disabled:opacity-60 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35"
            >
              {loading ? (
                <>
                  <span className="size-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="size-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need access?{' '}
            <Link href="/register" className="text-primary hover:underline font-semibold">
              Request an account
            </Link>
          </p>

          {/* Quick Demo Access - moved below, de-emphasized (temporary/dev-only) */}
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/30 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-3">
              Quick Demo Access <span className="opacity-60">(temporary)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword('demo1234') }}
                  className="group rounded-lg border border-border/60 bg-background/50 px-3 py-2.5 text-left hover:border-primary/40 hover:bg-secondary/40 transition-all"
                >
                  <p className={`text-xs font-semibold ${d.color}`}>{d.role}</p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono">{d.email}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="size-3" /> JWT Secured
            </span>
            <span className="text-border">·</span>
            <span>OECD Compliant</span>
            <span className="text-border">·</span>
            <span>RMB Certified</span>
          </div>
        </div>
      </div>
    </div>
  )
}