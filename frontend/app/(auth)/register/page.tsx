'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mountain, Eye, EyeOff, ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiFetch, ApiError } from '@/lib/api'

// system_admin is intentionally excluded — that role is platform-internal
// and is never self-registerable (see backend/accounts/models.py).
const ROLES = [
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'mine_manager', label: 'Mine Manager' },
  { value: 'geologist', label: 'Geologist' },
  { value: 'safety_officer', label: 'Safety Officer' },
  { value: 'compliance_manager', label: 'Compliance Manager' },
  { value: 'government_auditor', label: 'Government Auditor' },
  { value: 'investor', label: 'Investor' },
]

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
    try {
      await apiFetch(
        '/auth/register/',
        {
          method: 'POST',
          body: JSON.stringify({
            full_name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            organisation_name: form.organization,
          }),
        },
        { auth: false },
      )
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.08),transparent_60%)]" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.02]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/30 mx-auto mb-6"
          >
            <CheckCircle2 className="size-10 text-emerald-500" />
          </motion.div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Request submitted!</h2>
          <p className="text-muted-foreground text-base mb-2 leading-relaxed">
            Your access request has been sent to the MDMIS System Administrator.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            You'll receive an email at <span className="text-foreground font-semibold">{form.email}</span> once your account is approved.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-4 text-sm font-semibold text-primary-foreground hover:from-primary/90 hover:to-primary transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
            >
              Back to Sign In <ArrowRight className="size-4" />
            </Link>
          </motion.div>
          <p className="mt-8 text-xs text-muted-foreground">
            Approval typically takes 24 hours · Check your email for updates
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">

      {/* Left panel - Immersive Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1920&q=80"
            alt="Geological exploration"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/70 to-black/85" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(168,85,247,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_70%,rgba(14,165,233,0.08),transparent_50%)]" />
        </div>

        <div className="relative z-10 px-12 max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex size-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground mx-auto mb-6 shadow-2xl shadow-primary/20">
              <Mountain className="size-10" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Join MDMIS</h1>
            <p className="text-sm uppercase tracking-[0.2em] text-white/70 mb-4">Request Platform Access</p>
            <p className="text-white/80 text-base leading-relaxed">
              Request access to Rwanda's premier mineral detection and mining intelligence platform
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-left space-y-4"
          >
            <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Access Request Process
            </p>
            {[
              'Submit your role request with credentials',
              'System admin reviews your information',
              'Receive approval email with account details',
              'Access your personalized role dashboard',
            ].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3 text-sm text-white/80"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 border border-white/10 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[10px] text-white/50"
          >
            <span>Typically approved within 24h</span>
            <span className="text-white/30">·</span>
            <span>Admin notification sent</span>
            <span className="text-white/30">·</span>
            <span>Secure JWT authentication</span>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 relative bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(14,165,233,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.05),transparent_50%)]" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.02]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Mountain className="size-6" />
            </div>
            <div>
              <p className="font-mono text-base font-bold text-foreground">MDMIS</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Request Access</p>
            </div>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground mb-2">Request access</h2>
            <p className="text-base text-muted-foreground">Fill in your details — an admin will review and approve</p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Full name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Valens Mugisha"
                  className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-secondary/80"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Work email <span className="text-destructive">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@organization.rw"
                  className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-secondary/80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Requested role <span className="text-destructive">*</span></label>
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3.5 text-[15px] text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-secondary/80"
                >
                  <option value="">Select role…</option>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Organization</label>
                <input
                  type="text"
                  value={form.organization}
                  onChange={(e) => set('organization', e.target.value)}
                  placeholder="Rwanda Mines Board"
                  className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-secondary/80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password <span className="text-destructive">*</span></label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3.5 pr-12 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-secondary/80"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm password <span className="text-destructive">*</span></label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-secondary/80"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className=" w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 py-4 text-[15px] font-semibold text-primary-foreground hover:from-primary/90 hover:to-primary disabled:opacity-60 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35"
            >
              {loading ? (
                <>
                  <span className="size-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Submitting request…</span>
                </>
              ) : (
                <>
                  <span>Submit Access Request</span>
                  <ArrowRight className="size-5" />
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="size-3" /> JWT Secured</span>
              <span className="text-border">·</span>
              <span>Admin-approved access</span>
              <span className="text-border">·</span>
              <span>RBAC enforced</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
