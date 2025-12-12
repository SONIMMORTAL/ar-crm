import { Database } from '@/types/database'

type EventRow = Database['public']['Tables']['events']['Row']
type AttendanceRow = Database['public']['Tables']['attendance']['Row']

export function generateEventICS(event: EventRow, attendance: AttendanceRow): string {
    // Format date to ICS format (YYYYMMDDTHHMMSSZ)
    const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const startDate = new Date(event.event_date)
    // Assume 2 hour duration if not specified
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)

    const now = formatDate(new Date())
    const start = formatDate(startDate)
    const end = formatDate(endDate)

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//My CRM//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:${event.name}
DTSTART:${start}
DTEND:${end}
DTSTAMP:${now}
UID:${attendance.id}@mycrm.com
DESCRIPTION:${event.description || 'Event Registration'}
LOCATION:${event.location || ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`.trim()
}
