import { useState } from 'react'
import {
  LayoutDashboard,
  Image,
  Filter,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Database,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  activePage: string
  onPageChange: (page: string) => void
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'content', label: 'All Content', icon: Image },
  { id: 'approved', label: 'Approved', icon: Filter },
  { id: 'applications', label: 'Applications', icon: UserCheck }, 
  { id: 'collection', label: 'Data Collection', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ isCollapsed, onToggle, activePage, onPageChange }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="border-gray-300 bg-white shadow-md"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo and collapse button */}
        <div className="flex min-h-[64px] flex-shrink-0 items-center justify-between border-b border-gray-200 p-3 sm:min-h-[72px] sm:p-4">
          {!isCollapsed && (
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-black sm:h-10 sm:w-10">
                <span className="text-xs font-bold text-white sm:text-sm">UC</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-black sm:text-lg">
                  UGC Hub
                </span>
                <p className="truncate text-xs text-gray-500">TDR Management</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="ml-auto hidden flex-shrink-0 text-gray-600 hover:bg-gray-100 hover:text-black lg:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2 sm:p-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'h-10 w-full justify-start text-sm sm:h-11 sm:text-base',
                  isCollapsed && 'justify-center px-2',
                  isActive && 'bg-black text-white hover:bg-gray-800',
                  !isActive && 'text-gray-700 hover:bg-gray-100 hover:text-black'
                )}
                onClick={() => {
                  onPageChange(item.id)
                  setIsMobileOpen(false)
                }}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', !isCollapsed && 'mr-2 sm:mr-3')} />
                {!isCollapsed && <span className="truncate font-medium">{item.label}</span>}
              </Button>
            )
          })}
        </nav>

        {/* Logout button at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 p-2 sm:p-4">
          <Button
            variant="outline"
            className={cn(
              'h-10 w-full justify-start border-gray-300 text-sm text-gray-600 hover:bg-gray-100 hover:text-black sm:h-11 sm:text-base',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className={cn('h-4 w-4 flex-shrink-0', !isCollapsed && 'mr-2 sm:mr-3')} />
            {!isCollapsed && <span className="truncate">Logout</span>}
          </Button>
        </div>
      </div>
    </>
  )
}
