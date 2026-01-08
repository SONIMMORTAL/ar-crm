import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { createAdminClient } from '@/lib/supabase/admin'

export class ReportGenerator {
    private supabase = createAdminClient()

    async generateContactCSV() {
        const { data: contacts } = await this.supabase
            .from('contacts')
            .select('id, email, first_name, last_name, phone, engagement_score, created_at')

        if (!contacts) return ''

        return Papa.unparse(contacts)
    }

    async generateEventReportPDF() {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(18)
        doc.text('Event Performance Report', 14, 22)
        doc.setFontSize(11)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

        // Data
        const { data: events } = await this.supabase
            .from('events')
            .select('name, event_date, location, capacity')
            .order('event_date', { ascending: false })

        if (events) {
            const tableData = events.map(e => [
                e.name,
                new Date(e.event_date).toLocaleDateString(),
                e.location || 'Online',
                e.capacity || 'Unlimited'
            ])

            autoTable(doc, {
                head: [['Event Name', 'Date', 'Location', 'Capacity']],
                body: tableData,
                startY: 40,
            })
        }

        return doc.output('blob')
    }
}
