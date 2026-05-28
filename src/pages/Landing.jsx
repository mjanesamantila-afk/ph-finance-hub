import { Link, Navigate } from 'react-router-dom'
import {
  Wallet,
  PiggyBank,
  Landmark,
  TrendingUp,
  CalendarClock,
  CreditCard,
  Sparkles,
  Heart,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { BRAND } from '../config/branding'

export default function Landing() {
  const { session, loading } = useAuth()

  // Don't flash the landing page for someone who's already logged in.
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>
  }
  if (session) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      {/* Top bar */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Wallet size={18} />
            </span>
            <span className="text-lg font-semibold text-slate-900">{BRAND.name}</span>
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:pt-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
            <Sparkles size={12} className="text-yellow-600" /> Free during beta · Made in PH 🇵🇭
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {BRAND.tagline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            {BRAND.subtagline} Designed for the Filipino way of saving and spending — pesos,
            PSE stocks, Pag-IBIG, SSS, GCash, Maya, and every local bank, all built-in.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              Get started — it's free
              <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              See what's inside
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            No download. Open in Safari → Share → Add to Home Screen for an app-style icon.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Everything you need to manage your money, in one place
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-500">
          No more juggling spreadsheets and a dozen apps. Salapi keeps your whole financial
          life in sync.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={Wallet}
            title="Smart Spending"
            body="A flexible Money System splits your income into custom buckets (Generosity, Invest, Savings, Spend, or your own). Allocations auto-adjust to your actual monthly income."
          />
          <Feature
            icon={CalendarClock}
            title="Bills Calendar + Reminders"
            body="See all your bills on a monthly calendar. Get a red badge for anything due in 7 days. Mark paid → it disappears, returns next month."
          />
          <Feature
            icon={CreditCard}
            title="Subscriptions Tracker"
            body="Know exactly how much you're paying for Netflix, iCloud, Spotify — and what's hitting your credit card vs auto-debit."
          />
          <Feature
            icon={Landmark}
            title="Debt Management"
            body="Track every loan with auto-computed totals (₱100k @ 0.68%/mo × 12 = ₱108,160). Pay → balance drops, history saved, ledger updated."
          />
          <Feature
            icon={PiggyBank}
            title="Savings Goals"
            body="Set Travel Fund or Emergency Fund with a target date. Get the exact monthly amount to save, with a donut filling as you contribute."
          />
          <Feature
            icon={TrendingUp}
            title="Investments + Freedom Plan"
            body="Track PSE stocks live, set stop-losses, manage MP2/VUL/PERA, and project your retirement with the 4% rule plus inflation."
          />
        </div>
      </section>

      {/* Why */}
      <section className="border-y border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">Why Salapi?</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Why
              title="Filipino-first"
              body="Pesos by default. PSE stocks. Pag-IBIG, SSS, BDO VUL, GCash, Maya, GoTyme, Maribank — already in the app."
            />
            <Why
              title="Auto-synced"
              body="Mark a bill paid → it's logged in your Ledger. Add to savings → your bank balance updates. No double-typing."
            />
            <Why
              title="Made for you"
              body="Add custom buckets, banks, and categories. Delete the ones you don't use. The app adapts to your life — not the other way around."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Try it free, no credit card.
        </h2>
        <p className="mt-2 text-slate-500">
          Salapi is free during beta. Your data stays yours — secure and private, on Supabase.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          Create your free account
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white">
              <Wallet size={13} />
            </span>
            <span className="font-medium text-slate-700">{BRAND.name}</span>
            <span>· © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="hover:text-slate-800"
            >
              Contact / Support
            </a>
            <span className="flex items-center gap-1">
              Made with <Heart size={13} className="text-rose-500" /> in PH
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon: Icon, title, body }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={18} />
      </span>
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  )
}

function Why({ title, body }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  )
}
