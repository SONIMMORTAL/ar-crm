'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Filter, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FilterOption {
    label: string
    value: string
    group: string
}

interface AdvancedFiltersProps {
    onFilterChange: (filters: string[]) => void
}

const FILTER_OPTIONS: FilterOption[] = [
    { label: 'High Engagement', value: 'engagement:high', group: 'Engagement' },
    { label: 'Medium Engagement', value: 'engagement:medium', group: 'Engagement' },
    { label: 'Low Engagement', value: 'engagement:low', group: 'Engagement' },
    { label: 'Inactive', value: 'engagement:inactive', group: 'Engagement' },
    { label: 'Recent Contact', value: 'recency:7d', group: 'Recency' },
    { label: 'Active Last 30d', value: 'recency:30d', group: 'Recency' },
]

export function AdvancedFilters({ onFilterChange }: AdvancedFiltersProps) {
    const [selectedFilters, setSelectedFilters] = useState<string[]>([])

    const toggleFilter = (value: string) => {
        const next = selectedFilters.includes(value)
            ? selectedFilters.filter(f => f !== value)
            : [...selectedFilters, value]

        setSelectedFilters(next)
        onFilterChange(next)
    }

    const clearFilters = () => {
        setSelectedFilters([])
        onFilterChange([])
    }

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                        {selectedFilters.length > 0 && (
                            <>
                                <div className="mx-2 h-4 w-[1px] bg-slate-200" />
                                <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                    {selectedFilters.length}
                                </Badge>
                                <div className="hidden space-x-1 lg:flex">
                                    {selectedFilters.length > 2 ? (
                                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                            {selectedFilters.length} selected
                                        </Badge>
                                    ) : (
                                        FILTER_OPTIONS
                                            .filter(opt => selectedFilters.includes(opt.value))
                                            .map(opt => (
                                                <Badge
                                                    variant="secondary"
                                                    key={opt.value}
                                                    className="rounded-sm px-1 font-normal"
                                                >
                                                    {opt.label}
                                                </Badge>
                                            ))
                                    )}
                                </div>
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuLabel>Engagement Status</DropdownMenuLabel>
                    {FILTER_OPTIONS.filter(f => f.group === 'Engagement').map(opt => (
                        <DropdownMenuCheckboxItem
                            key={opt.value}
                            checked={selectedFilters.includes(opt.value)}
                            onCheckedChange={() => toggleFilter(opt.value)}
                        >
                            {opt.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Activity</DropdownMenuLabel>
                    {FILTER_OPTIONS.filter(f => f.group === 'Recency').map(opt => (
                        <DropdownMenuCheckboxItem
                            key={opt.value}
                            checked={selectedFilters.includes(opt.value)}
                            onCheckedChange={() => toggleFilter(opt.value)}
                        >
                            {opt.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                    {selectedFilters.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                onCheckedChange={clearFilters}
                                className="justify-center text-center"
                            >
                                Clear filters
                            </DropdownMenuCheckboxItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {selectedFilters.length > 0 && (
                <Button variant="ghost" className="h-8 px-2 lg:px-3" onClick={clearFilters}>
                    Reset
                    <X className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
