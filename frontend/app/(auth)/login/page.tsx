'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mountain, Eye, EyeOff, ArrowRight, Shield, Globe2, ScanLine, Lock } from 'lucide-react'
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
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden">
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-15"
          poster="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80">
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/70 to-background/90" />
        <div className="absolute inset-0 grid-backdrop opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 px-12 max-w-md text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mx-auto mb-6 shadow-xl shadow-primary/30">
            <Mountain className="size-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">MDMIS</h1>
          <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
            Mineral Detection & Mining Intelligence System — Rwanda's AI-powered geophysical exploration and regulatory compliance platform.
          </p>
          <div className="space-y-3 text-left">
            {[
              { icon: Globe2, label: '3D Subsurface Mapping', color: 'text-accent' },
              { icon: ScanLine, label: 'AI Mineral Classification', color: 'text-primary' },
              { icon: Shield, label: 'OECD Compliance Automation', color: 'text-[var(--success)]' },
              { icon: Lock, label: 'Role-Based Access Control', color: 'text-destructive' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-4 py-2.5 backdrop-blur">
                <Icon className={`size-4 shrink-0 ${color}`} />
                <span className="text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[var(--success)]" />
            </span>
            Kigali Operations Center · 12 drones · 34 ground nodes online
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 grid-backdrop opacity-10" />
        <div className="relative w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Mountain className="size-5" />
            </div>
            <div>
              <p className="font-mono text-sm font-bold">MDMIS</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Mining Intelligence</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-base text-muted-foreground">Sign in to your MDMIS account</p>
          </div>

          <div className="mb-6 rounded-xl border border-border bg-card/40 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quick demo access</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((d) => (
                <button key={d.role} type="button"
                  onClick={() => { setEmail(d.email); setPassword('demo1234') }}
                  className="rounded-lg border border-border bg-background/60 px-3 py-2 text-left hover:border-primary/40 hover:bg-secondary/60 transition-colors">
                  <p className={`text-sm font-medium ${d.color}`}>{d.role}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.email}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mdmis.rw"
                className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 pr-11 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border" /> Remember me
              </label>
              <a href="#" className="text-primary hover:underline">Forgot password?</a>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all hover:scale-[1.01] shadow-lg shadow-primary/20">
              {loading ? (
                <><span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Authenticating…</>
              ) : (<>Sign In <ArrowRight className="size-4" /></>)}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need access?{' '}<Link href="/register" className="text-primary hover:underline">Request an account</Link>
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Lock className="size-3" /> JWT Secured</span>
            <span>·</span><span>OECD Compliant</span><span>·</span><span>RMB Certified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
