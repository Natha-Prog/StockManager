import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ArrowLeftRight, Users, Settings,
  Menu, X, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import Button from './ui/Button'
import Logo from './Logo'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const { t } = useSettings()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/products', label: t('nav.products'), icon: Package },
    { path: '/movements', label: t('nav.movements'), icon: ArrowLeftRight },
    { path: '/settings', label: t('nav.settings'), icon: Settings },
    ...(isAdmin ? [{ path: '/users', label: t('nav.users'), icon: Users }] : []),
  ]

  const roleLabel = user?.role === 'admin' ? t('roles.admin') : t('roles.operator')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = ({ onNavigate }) => (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <Logo size="md" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{t('appName')}</p>
          <p className="text-xs text-slate-400 truncate">{t('nav.dashboard')}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className="px-3 py-3 mb-3 rounded-lg bg-slate-800/60">
          <p className="text-sm font-medium text-white truncate">{user?.email}</p>
          <p className="text-xs text-slate-400 mt-0.5">{roleLabel}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('auth.logout')}
        </Button>
        <p className="text-[10px] text-slate-500 text-center mt-4 px-2 leading-relaxed">
          {t('footer')}
        </p>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-surface-muted">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-slate-900 shadow-sidebar z-30">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 flex items-center gap-4 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-surface-border lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Logo size="sm" />
            <span className="font-semibold text-slate-900 truncate">{t('appName')}</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="page-container">
            <Outlet />
          </div>
        </main>

        <footer className="hidden lg:block px-8 py-4 text-center text-xs text-slate-400 border-t border-surface-border bg-white/50">
          {t('footer')}
        </footer>
      </div>
    </div>
  )
}
