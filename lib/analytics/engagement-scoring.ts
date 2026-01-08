import { createAdminClient } from '@/lib/supabase/admin'

const SCORING_WEIGHTS = {
    email_open: 5,
    email_click: 10,
    event_attended: 20,
    event_registered: 5,
    recency_bonus_7d: 20,
    recency_bonus_30d: 10
}

export class EngagementScorer {
    private supabase = createAdminClient()

    async calculateScore(contactId: string) {
        let score = 0

        // 1. Fetch Contact Interactions
        const { count: attendanceCount } = await this.supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('contact_id', contactId)
            .eq('status', 'checked_in')

        // Approximation: We don't have separate 'registered' vs 'check_in' efficiently without more queries
        // or granular event logs. For MVP, we use what we have.

        score += (attendanceCount || 0) * SCORING_WEIGHTS.event_attended

        // 2. Email Stats (using email_events table if populated, or aggregate counts)
        // Assuming we have aggregated counts on contacts table? No, we have email_events.
        const { count: openCount } = await this.supabase
            .from('email_events')
            .select('*', { count: 'exact', head: true })
            .eq('contact_id', contactId)
            .eq('event_type', 'opened')

        score += (openCount || 0) * SCORING_WEIGHTS.email_open

        // 3. Recency (Last Updated)
        const { data: contact } = await this.supabase
            .from('contacts')
            .select('updated_at')
            .eq('id', contactId)
            .single()

        if (contact?.updated_at) {
            const daysSinceUpdate = (Date.now() - new Date(contact.updated_at).getTime()) / (1000 * 3600 * 24)
            if (daysSinceUpdate <= 7) score += SCORING_WEIGHTS.recency_bonus_7d
            else if (daysSinceUpdate <= 30) score += SCORING_WEIGHTS.recency_bonus_30d
        }

        // 4. Cap Score (optional, but good for tiers) e.g. 100 max? 
        // Or just let it grow. Let's cap visual tier at 100.

        // 5. Update Contact
        await this.supabase.from('contacts').update({ engagement_score: score }).eq('id', contactId)

        return score
    }

    async updateAllScores() {
        console.log('Starting Batch Engagement Scoring...')
        const { data: contacts } = await this.supabase.from('contacts').select('id')
        if (!contacts) return

        let processed = 0
        for (const c of contacts) {
            await this.calculateScore(c.id)
            processed++
        }
        console.log(`Updated scores for ${processed} contacts.`)
        return processed
    }
}

export const engagementScorer = new EngagementScorer()
