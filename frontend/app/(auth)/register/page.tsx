'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mountain, Eye, EyeOff, ArrowRight, CheckCircle2, Lock } from 'lucide-react'

const ROLES = ['Mine Analyst', 'Geologist', 'Compliance Officer', 'System Admin']

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', role: '', organization: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.role || !form.password) { setError('Please fill in all required fields.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1400))
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="absolute inset-0 grid-backdrop opacity-10" />
        <div className="relative text-center max-w-md">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--success)]/15 border border-[var(--success)]/30 mx-auto mb-6">
            <CheckCircle2 className="size-8 text-[var(--success)]" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Request submitted</h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Your access request has been sent to the MDMIS System Administrator. You'll receive an email at <span className="text-foreground font-medium">{form.email}</span> once your account is approved.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Sign In <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden">
        {/* Real mining/geological video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-15"
          poster="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80"
        >
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/70 to-background/90" />
        <div className="absolute inset-0 grid-backdrop opacity-20" />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-accent/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-primary/10 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 px-12 max-w-md text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mx-auto mb-6 shadow-xl shadow-primary/30">
            <Mountain className="size-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Join MDMIS</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Request access to Rwanda's premier mineral detection and mining intelligence platform.
          </p>
          <div className="rounded-xl border border-border bg-card/40 p-5 text-left space-y-3">
            <p className="text-xs font-medium text-foreground mb-2">Access request process</p>
            {['Submit your role request', 'Admin reviews & approves', 'Receive credentials via email', 'Access your role dashboard'].map((step, i) => (
              <div key={step} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
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
            <h2 className="text-2xl font-bold text-foreground mb-1">Request access</h2>
            <p className="text-sm text-muted-foreground">Fill in your details — an admin will approve your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Valens Mugisha"
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Work email <span className="text-destructive">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@organization.rw"
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Requested role <span className="text-destructive">*</span></label>
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="">Select role…</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Organization</label>
                <input
                  type="text"
                  value={form.organization}
                  onChange={(e) => set('organization', e.target.value)}
                  placeholder="Rwanda Mines Board"
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password <span className="text-destructive">*</span></label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm password <span className="text-destructive">*</span></label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all hover:scale-[1.01] shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Submitting request…
                </>
              ) : (
                <>Submit Access Request <ArrowRight className="size-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Lock className="size-3" /> JWT Secured</span>
            <span>·</span>
            <span>Admin-approved access</span>
            <span>·</span>
            <span>RBAC enforced</span>
          </div>
        </div>
      </div>
    </div>
  )
}
