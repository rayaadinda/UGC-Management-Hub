import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UGCContentFilters } from '@/types'

interface UGCFilterControlsProps {
  filters: UGCContentFilters
  onFiltersChange: (filters: UGCContentFilters) => void
}

export function UGCFilterControls({ filters, onFiltersChange }: UGCFilterControlsProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '')

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    onFiltersChange({ ...filters, search: value || undefined })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : value as UGCContentFilters['status'],
    })
  }

  const handlePlatformChange = (value: string) => {
    onFiltersChange({
      ...filters,
      platform: value === 'all' ? undefined : value as UGCContentFilters['platform'],
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-6 bg-white dark:bg-gray-800 border-b">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by username or caption..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="approved_for_repost">Approved for Repost</SelectItem>
            <SelectItem value="weekly_winner">Weekly Winner</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.platform || 'all'} onValueChange={handlePlatformChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onFiltersChange({})}
          className="shrink-0"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}