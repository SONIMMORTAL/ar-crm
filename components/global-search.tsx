'use client'

import * as React from 'react'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import { Search, User, Calendar, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')
    const [results, setResults] = React.useState<{ contacts: any[], events: any[] }>({ contacts: [], events: [] })
    const router = useRouter()
    const supabase = createClient()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    React.useEffect(() => {
        if (!query) {
            setResults({ contacts: [], events: [] })
            return
        }

        const search = async () => {
            const { data: contacts } = await supabase
                .from('contacts')
                .select('id, first_name, last_name, email')
                .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                .limit(5)

            const { data: events } = await supabase
                .from('events')
                .select('id, name, slug')
                .ilike('name', `%${query}%`)
                .limit(5)

            setResults({
                contacts: contacts || [],
                events: events || []
            })
        }

        const timeoutId = setTimeout(search, 300)
        return () => clearTimeout(timeoutId)
    }, [query])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-full justify-start rounded-[0.5rem] bg-slate-800 text-sm font-normal text-slate-400 shadow-none sm:pr-12 md:w-40 lg:w-64 border-slate-700 hover:bg-slate-800 hover:text-slate-300"
                onClick={() => setOpen(true)}
            >
                <span className="hidden lg:inline-flex">Search...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border border-slate-600 bg-slate-800 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." value={query} onValueChange={setQuery} />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {results.contacts.length > 0 && (
                        <CommandGroup heading="Contacts">
                            {results.contacts.map((contact) => (
                                <CommandItem
                                    key={contact.id}
                                    onSelect={() => runCommand(() => router.push(`/admin/contacts?id=${contact.id}`))}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{contact.first_name} {contact.last_name}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">({contact.email})</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                    {results.events.length > 0 && (
                        <CommandGroup heading="Events">
                            {results.events.map((event) => (
                                <CommandItem
                                    key={event.id}
                                    onSelect={() => runCommand(() => router.push(`/admin/events?id=${event.id}`))}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>{event.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                    <CommandSeparator />
                    <CommandGroup heading="Quick Actions">
                        <CommandItem onSelect={() => runCommand(() => router.push('/admin/campaigns/new'))}>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Create Campaign</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/admin/events'))}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Manage Events</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
