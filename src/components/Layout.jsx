import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  PiggyBank,
  Landmark,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { BRAND } from '../config/branding'

const TABS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/spending', label: 'Spending', icon: Wallet, badge: 'spending' },
  { to: '/debt', label: 'Debt', icon: Landmark },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/investment', label: 'Investment', icon: TrendingUp, badge: 'breach' },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const { breachCount, billsDueSoon, subscriptionsDueSoon } = useData()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Wallet size={18} />
              </div>
              <span className="hidden font-semibold text-slate-900 sm:block">
                {BRAND.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `hidden rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 md:block ${
                    isActive ? 'text-blue-700' : ''
                  }`
                }
                title="Account settings"
              >
                {user?.user_metadata?.name || user?.email}
              </NavLink>
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
              const count =
                badge === 'breach'
                  ? breachCount
                  : badge === 'spending'
                    ? billsDueSoon + subscriptionsDueSoon
                    : 0
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      'relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'border-blue-600 text-blue-700'
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
