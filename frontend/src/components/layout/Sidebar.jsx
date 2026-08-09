import { NavLink } from 'react-router-dom';
import { GraduationCap, LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from './navConfig';

export default function Sidebar({ mobileOpen, onCloseMobile, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => item.section || item.roles.includes(user?.role));

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-200 ease-out',
          'dark:border-slate-800 dark:bg-slate-900',
          'md:sticky md:top-0 md:z-30 md:translate-x-0',
          collapsed ? 'md:w-[76px]' : 'md:w-64',
          'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className={cn('flex h-16 items-center gap-2.5 border-b border-slate-100 px-5 dark:border-slate-800', collapsed && 'md:justify-center md:px-0')}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-xs">
            <GraduationCap className="h-4.5 w-4.5" />
          </span>
          {!collapsed && <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">Orbit LMS</span>}
          <button
            onClick={onCloseMobile}
            className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {items.map((item, idx) =>
              item.section ? (
                <li key={`section-${idx}`} className={cn('px-2.5 pt-4 pb-1.5 first:pt-0', collapsed && 'md:hidden')}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {item.section}
                  </span>
                </li>
              ) : (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                        collapsed && 'md:justify-center md:px-0',
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-400'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                      )
                    }
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    <span className={cn(collapsed && 'md:hidden')}>{item.label}</span>
                  </NavLink>
                </li>
              )
            )}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <button
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400',
              collapsed && 'md:justify-center md:px-0'
            )}
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            <span className={cn(collapsed && 'md:hidden')}>Logout</span>
          </button>
          <button
            onClick={onToggleCollapse}
            className="mt-1 hidden w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 md:flex dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
