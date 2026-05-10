import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineHome,
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2'
import { RiRobot2Line } from 'react-icons/ri'

const navItems = [
  { path: '/', label: 'Home', icon: HiOutlineHome },
  { path: '/chat', label: 'Ask AI', icon: HiOutlineChatBubbleLeftRight },
  { path: '/documents', label: 'Documents', icon: HiOutlineDocumentText },
  { path: '/upload', label: 'Upload', icon: HiOutlineCloudArrowUp },
  { path: '/history', label: 'History', icon: HiOutlineClock },
  { path: '/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="app-shell min-h-screen text-text-primary">
      <div className="ambient-grid" />
      <div className="ambient-rings" />

      <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[1.75rem] px-4 py-3 nav-float backdrop-blur-2xl sm:px-5">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
              <RiRobot2Line className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-text-primary">modelsForDoc</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-text-muted">Creative RAG workspace</p>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-text-primary text-white shadow-lg shadow-text-primary/10'
                      : 'text-text-secondary hover:text-text-primary'
                  }`
                }
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="metric-pill py-2">
              <span className="halo-ring flex h-2.5 w-2.5 rounded-full bg-success" />
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-secondary">Live context</span>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/60 text-text-secondary transition-colors hover:text-text-primary lg:hidden"
          >
            {mobileOpen ? <HiOutlineXMark className="h-6 w-6" /> : <HiOutlineBars3 className="h-6 w-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <Motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto mt-3 max-w-7xl overflow-hidden rounded-[1.5rem] glass lg:hidden"
            >
              <div className="grid gap-2 p-3">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-text-primary text-white'
                          : 'bg-white/35 text-text-secondary hover:bg-white/65 hover:text-text-primary'
                      }`
                    }
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </span>
                  </NavLink>
                ))}
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </header>

      <main
        className={
          isHome
            ? 'relative w-full overflow-hidden'
            : 'mx-auto flex w-full max-w-7xl flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8'
        }
      >
        <AnimatePresence mode="wait">
          <Motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className={isHome ? 'w-full' : 'page-shell relative w-full px-4 py-4 sm:px-6 sm:py-6'}
          >
            <Outlet />
          </Motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
