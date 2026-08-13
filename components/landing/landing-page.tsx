'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
import { useInView as useInViewHook } from 'react-intersection-observer'
import {
  Mountain, Globe2, ScanLine, Link2, Truck, ShieldCheck,
  ArrowRight, Play, ChevronDown, Zap, Lock, Users,
  BarChart3, Radio, Shield, MapPin, Sparkles, Cpu, Eye,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ProfileDropdown } from '@/components/shell/profile-dropdown'
import { useAuth } from '@/lib/auth-context'
import { KPIS, MINERAL_META } from '@/lib/mdmis-data'

const ROLES = [
  {
    role: 'System Admin',
    email: 'admin@mdmis.rw',
    icon: Shield,
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
    permissions: ['Full platform access', 'User & role management', 'Audit logs', 'System configuration'],
  },
  {
    role: 'Mine Analyst',
    email: 'analyst@mdmis.rw',
    icon: BarChart3,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    permissions: ['View all detection sites', 'Run AI classifications', 'Export scan reports', 'Read compliance data'],
  },
  {
    role: 'Geologist',
    email: 'geo@mdmis.rw',
    icon: Globe2,
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
    permissions: ['3D map explorer', 'Subsurface data layers', 'Site annotations', 'Scan history'],
  },
  {
    role: 'Compliance Officer',
    email: 'compliance@mdmis.rw',
    icon: ShieldCheck,
    color: 'text-[var(--success)]',
    bg: 'bg-[var(--success)]/10 border-[var(--success)]/20',
    permissions: ['OECD due diligence', 'ITSCI reconciliation', 'RMB licensing returns', 'Flag management'],
  },
]

const FEATURES = [
  { 
    icon: Globe2, 
    title: '3D Subsurface Mapping', 
    desc: 'Interactive globe with underground mineral layers, depth visualization and real-time site markers across Rwanda & East Africa.', 
    color: 'text-accent',
    video: '/videos/istockphoto-1689123730-640_adpp_is.mp4'
  },
  { 
    icon: ScanLine, 
    title: 'AI Mineral Classification', 
    desc: 'mdmis-specnet-v4 classifies drone hyperspectral, GPR, EM and satellite scans with up to 97.8% confidence.', 
    color: 'text-primary',
    video: '/videos/istockphoto-1223706310-640_adpp_is.mp4'
  },
  { 
    icon: Link2, 
    title: 'Chain of Custody', 
    desc: 'Ledger-backed traceability from detection through export — every lot tagged, tracked and tamper-evident.', 
    color: 'text-[var(--success)]',
    video: '/videos/13476-248644895_medium.mp4'
  },
  { 
    icon: Truck, 
    title: 'Live Transport Tracking', 
    desc: 'Real-time convoy GPS, integrity alerts and delivery status across all export corridors to Mombasa & Dar.', 
    color: 'text-primary',
    video: '/videos/40030-424911975_medium.mp4'
  },
  { 
    icon: ShieldCheck, 
    title: 'Compliance Automation', 
    desc: 'OECD due diligence, ITSCI reconciliation and RMB licensing returns generated automatically.', 
    color: 'text-accent',
    video: '/videos/istockphoto-1453371060-640_adpp_is.mp4'
  },
  { 
    icon: Lock, 
    title: 'Role-Based Access Control', 
    desc: 'Granular RBAC with 4 roles ensuring data security and regulatory compliance at every level.', 
    color: 'text-destructive',
    video: '/videos/istockphoto-1977219422-640_adpp_is.mp4'
  },
]

const STATS = [
  { label: 'Active Sites', value: `${KPIS.activeSites}/${KPIS.totalSites}` },
  { label: 'AI Confidence', value: `${KPIS.avgConfidence}%` },
  { label: 'Reserve Tonnes', value: `${(KPIS.estimatedReserveTonnes / 1000).toFixed(0)}k t` },
  { label: 'Compliant Lots', value: `${KPIS.compliantLotsPct}%` },
]

// Video Background Component with overlay effects
function VideoBackground({ videoSrc, overlay = 0.7 }: { videoSrc: string; overlay?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay failed - likely user interaction required
      })
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div 
        className="absolute inset-0 bg-background" 
        style={{ opacity: overlay }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-background/90" />
      
      {/* Scanning beam overlay */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-primary/40 to-transparent"
        style={{ animation: 'scanBeam 12s linear infinite' }}
      />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 grid-backdrop opacity-10" />
      
      <style>{`
        @keyframes scanBeam {
          0% { left: -2px; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// Animated Counter Component
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [ref, inView] = useInViewHook({ triggerOnce: true, threshold: 0.5 })
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (inView) {
      const numValue = parseFloat(value.replace(/[^0-9.]/g, ''))
      let start = 0
      const duration = 2000
      const increment = numValue / (duration / 16)
      
      const timer = setInterval(() => {
        start += increment
        if (start >= numValue) {
          setCount(numValue)
          clearInterval(timer)
        } else {
          setCount(start)
        }
      }, 16)
      
      return () => clearInterval(timer)
    }
  }, [inView, value])
  
  return (
    <span ref={ref}>
      {value.includes('%') ? `${Math.round(count)}%` : 
       value.includes('k') ? `${Math.round(count)}k` : 
       value.includes('/') ? value : 
       Math.round(count)}
      {suffix}
    </span>
  )
}

export function LandingPage() {
  const [activeRole, setActiveRole] = useState(0)
  const { user } = useAuth()
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.9])
  const smoothScrollY = useSpring(scrollY, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const t = setInterval(() => setActiveRole((p) => (p + 1) % ROLES.length), 3500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── NAV ── */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/60 backdrop-blur-xl"
      >
        <Link href="/" className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            <Mountain className="size-5" />
          </motion.div>
          <div className="leading-tight">
            <p className="font-mono text-sm font-bold tracking-tight">MDMIS</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Mining Intelligence</p>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {[
            { href: '#features', label: 'Features' },
            { href: '#roles', label: 'Access Control' },
            { href: '#minerals', label: 'Minerals' },
            { href: '#contact', label: 'Contact' },
          ].map((link) => (
            <motion.a 
              key={link.href}
              href={link.href} 
              whileHover={{ scale: 1.05, color: 'var(--foreground)' }}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </motion.a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {!user && <ThemeToggle />}
          {user ? (
            <ProfileDropdown />
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login" className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Get Access <ArrowRight className="size-3.5" />
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </motion.nav>

      {/* ── HERO — Video Background with Parallax ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <VideoBackground videoSrc="/videos/istockphoto-1689123730-640_adpp_is.mp4" overlay={0.75} />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-8 backdrop-blur-sm"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Live · {KPIS.activeSites} active detection sites · Rwanda
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.05]"
          >
            Mineral Detection &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
              Mining Intelligence
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AI-powered pre-extraction detection, 3D subsurface mapping, drone hyperspectral sensing,
            full chain-of-custody traceability and compliance automation — built for Rwanda's mining sector.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-md bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Launch Platform <ArrowRight className="size-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a
                href="#features"
                className="flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-8 py-3.5 text-base font-medium text-foreground hover:bg-secondary transition-colors backdrop-blur"
              >
                <Play className="size-4 text-primary" /> Explore Features
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {STATS.map((s, i) => (
              <motion.div 
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                whileHover={{ scale: 1.05, borderColor: 'var(--primary)' }}
                className="rounded-xl border border-border/60 bg-card/60 backdrop-blur px-4 py-3 text-center"
              >
                <p className="font-mono text-2xl font-bold text-primary">
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <ChevronDown className="size-4" />
        </motion.div>
      </section>

      {/* ── FEATURES — Each with video background ── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="absolute inset-0 grid-backdrop opacity-20" />
        <div className="relative max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Platform Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything geologists need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From underground detection to export compliance — one unified intelligence platform.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              const [ref, inView] = useInViewHook({ triggerOnce: true, threshold: 0.2 })
              
              return (
                <motion.div
                  key={f.title}
                  ref={ref}
                  initial={{ opacity: 0, y: 50 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="group relative rounded-xl border border-border bg-card/60 overflow-hidden"
                >
                  {/* Video Background for each feature */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      <source src={f.video} type="video/mp4" />
                    </video>
                  </div>
                  
                  <div className="relative p-6 hover:border-primary/40 transition-all duration-300">
                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                      className="mb-4 flex size-10 items-center justify-center rounded-lg border border-border bg-background/60"
                    >
                      <Icon className={`size-5 ${f.color}`} />
                    </motion.div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── RBAC ROLES — Interactive with animations ── */}
      <section id="roles" className="py-24 px-6 relative">
        <div className="absolute inset-0 grid-backdrop opacity-15" />
        <div className="relative max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-destructive mb-3">Role-Based Access Control</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Right access, right people</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Four distinct roles with granular permissions — ensuring every user sees exactly what they need.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLES.map((r, i) => {
              const Icon = r.icon
              const isActive = i === activeRole
              const [ref, inView] = useInViewHook({ triggerOnce: true, threshold: 0.2 })
              
              return (
                <motion.div
                  key={r.role}
                  ref={ref}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  onClick={() => setActiveRole(i)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-xl border p-5 cursor-pointer transition-all duration-300 ${r.bg} ${isActive ? 'shadow-xl shadow-current/10' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5 }}
                      className="flex size-10 items-center justify-center rounded-lg border border-current/20 bg-background/40"
                    >
                      <Icon className={`size-5 ${r.color}`} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${r.color}`}>{r.role}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{r.email}</p>
                    </div>
                    {isActive && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex size-2 shrink-0"
                      >
                        <span className="absolute inline-flex size-2 animate-ping rounded-full bg-current opacity-60" style={{ color: 'currentColor' }} />
                        <span className="relative inline-flex size-2 rounded-full bg-current" />
                      </motion.span>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {r.permissions.map((p, j) => (
                      <motion.li 
                        key={p}
                        initial={{ opacity: 0, x: -10 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.3, delay: i * 0.1 + j * 0.05 }}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span className={`size-1.5 shrink-0 rounded-full bg-current ${r.color}`} />
                        {p}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 rounded-xl border border-border bg-card/40 p-5 text-center"
          >
            <p className="text-sm text-muted-foreground">
              <Lock className="inline size-4 text-primary mr-1.5 -mt-0.5" />
              All roles enforced server-side · JWT-based sessions · Audit trail on every action ·
              <span className="text-primary"> OECD-compliant access logging</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── MINERALS — Animated cards ── */}
      <section id="minerals" className="py-16 px-6 border-y border-border bg-card/20">
        <div className="max-w-6xl mx-auto">
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8"
          >
            Minerals Tracked by MDMIS
          </motion.p>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(MINERAL_META).map(([name, meta], i) => {
              const [ref, inView] = useInViewHook({ triggerOnce: true, threshold: 0.5 })
              
              return (
                <motion.div 
                  key={name}
                  ref={ref}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-5 py-3 hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <motion.span 
                    whileHover={{ scale: 1.3, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="size-3 rounded-full" 
                    style={{ background: meta.color.includes('var') ? '#e6b84d' : meta.color }} 
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{meta.symbol} · {meta.commodity}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA — With video background ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <VideoBackground videoSrc="/videos/istockphoto-1453371060-640_adpp_is.mp4" overlay={0.8} />
        
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-8 backdrop-blur-sm"
          >
            <Zap className="size-3" /> Powered by mdmis-specnet-v4 AI
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-foreground mb-6"
          >
            Ready to see what's<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">beneath the surface?</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto"
          >
            Join Rwanda's leading mineral intelligence platform. Request access and start detecting, classifying and tracking minerals today.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-md bg-primary px-10 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/25"
              >
                Sign In to MDMIS <ArrowRight className="size-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-10 py-4 text-base font-medium text-foreground hover:bg-secondary transition-colors backdrop-blur"
              >
                <Users className="size-4" /> Request Access
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT — Animated cards ── */}
      <section id="contact" className="py-20 px-6 border-t border-border bg-card/20">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Get In Touch</p>
            <h2 className="text-3xl font-bold text-foreground mb-4">Contact MDMIS</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Questions about access, partnerships or technical implementation? Our team is here to help.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: MapPin, color: 'text-primary', bg: 'bg-primary/10 border-primary/20', title: 'Headquarters', sub: 'Kigali Operations Center', body: 'KG 7 Ave, Kigali\nRwanda Mines, Petroleum and Gas Board\nKigali, Rwanda' },
              { icon: Users, color: 'text-accent', bg: 'bg-accent/10 border-accent/20', title: 'Technical Support', sub: 'Platform & Integration', body: 'support@mdmis.rw\n+250 788 XXX XXX\nMon–Fri, 8:00 AM – 6:00 PM EAT' },
              { icon: Shield, color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10 border-[var(--success)]/20', title: 'Compliance Office', sub: 'OECD & ITSCI Inquiries', body: 'compliance@mdmis.rw\nRegulatory queries, audits & due diligence\nDirect line to RMB liaisons' },
              { icon: ShieldCheck, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', title: 'Access Management', sub: 'Account Requests & Roles', body: 'admin@mdmis.rw\nNew account approvals, role changes\nRBAC policy questions' },
            ].map(({ icon: Icon, color, bg, title, sub, body }, i) => {
              const [ref, inView] = useInViewHook({ triggerOnce: true, threshold: 0.3 })
              
              return (
                <motion.div 
                  key={title}
                  ref={ref}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ scale: 1.02, borderColor: 'var(--primary)' }}
                  className="rounded-xl border border-border bg-card/60 p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                      className={`flex size-10 items-center justify-center rounded-lg border ${bg}`}
                    >
                      <Icon className={`size-5 ${color}`} />
                    </motion.div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{title}</p>
                      <p className="text-[11px] text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-card/20 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground"
            >
              <Mountain className="size-4" />
            </motion.div>
            <div>
              <p className="font-mono text-sm font-bold">MDMIS</p>
              <p className="text-[10px] text-muted-foreground">Mineral Detection & Mining Intelligence System</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Radio className="size-3 text-[var(--success)]" />
            Kigali Operations Center · Rwanda Mines Board Compliant
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4 text-xs text-muted-foreground"
          >
            <span>OECD Due Diligence</span>
            <span>·</span>
            <span>ITSCI Certified</span>
            <span>·</span>
            <span>EU Conflict Minerals</span>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
