import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  ShieldAlert,
  Wallet,
  Target,
  CalendarClock,
  PiggyBank,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

const TABS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/bills', label: 'Bills Payment', icon: CalendarClock, badge: 'bills' },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/risk', label: 'Risk Management', icon: ShieldAlert, badge: 'breach' },
  { to: '/freedom', label: 'Freedom Plan', icon: Target },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const { breachCount, billsDueSoon } = useData()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Wallet size={18} />
              </div>
              <span className="hidden font-semibold text-slate-900 sm:block">
                PH Personal Finance Hub
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 md:block">
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map(({ to, label, icon: Icon, end, badge }) => {
              const count = badge === 'breach' ? breachCount : badge === 'bills' ? billsDueSoon : 0
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      'relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800',
                    ].join(' ')
                  }
                >
                  <Icon size={16} />
                  {label}
                  {count > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                      {count}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
