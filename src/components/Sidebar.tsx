import { useState } from 'react'
import {
  LayoutDashboard,
  Image,
  Video,
  Filter,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Database
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
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'approved', label: 'Approved', icon: Filter },
  { id: 'collection', label: 'Data Collection', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ isCollapsed, onToggle, activePage, onPageChange }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo and collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">UC</span>
              </div>
              <div>
                <span className="font-bold text-lg text-black">UGC Hub</span>
                <p className="text-xs text-gray-500">TDR Management</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="ml-auto text-gray-600 hover:text-black hover:bg-gray-100"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isCollapsed && "justify-center px-2",
                  isActive && "bg-black text-white hover:bg-gray-800",
                  !isActive && "text-gray-700 hover:text-black hover:bg-gray-100"
                )}
                onClick={() => {
                  onPageChange(item.id)
                  setIsMobileOpen(false)
                }}
              >
                <Icon className={cn(
                  "h-4 w-4",
                  !isCollapsed && "mr-3"
                )} />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Button>
            )
          })}
        </nav>

        {/* Logout button at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-gray-600 hover:text-black hover:bg-gray-100 border-gray-300",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className={cn(
              "h-4 w-4",
              !isCollapsed && "mr-3"
            )} />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </div>
    </>
  )
}