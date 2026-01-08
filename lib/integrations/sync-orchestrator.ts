import { nbClient } from './nationbuilder-client'
import { mcClient } from './mailchimp-client'
import { createAdminClient } from '@/lib/supabase/admin'

// Define which services are active (could be dynamic from DB/Env)
const SERVICES = {
    nationbuilder: !!process.env.NATIONBUILDER_API_TOKEN,
    mailchimp: !!process.env.MAILCHIMP_API_KEY
}

class SyncOrchestrator {
    private supabase = createAdminClient()

    /**
     * Pushes a local contact to all active external services.
     */
    async syncContact(contactId: string) {
        console.log(`Orchestrator: Syncing contact ${contactId} to active services...`)

        // 1. Fetch Contact
        const { data: contact } = await this.supabase
            .from('contacts')
            .select('*')
            .eq('id', contactId)
            .single()

        if (!contact) return

        const results: Record<string, any> = {}

        // 2. NationBuilder
        if (SERVICES.nationbuilder) {
            try {
                // Determine if create or update based on stored NB ID
                // nbClient handles this internally via params usually, but here we can be explicit
                let nbId = contact.nationbuilder_id
                if (nbId) {
                    await nbClient.updatePerson(nbId, { tags: ['Syncd_Orchestrator'] }, contactId)
                    results.nationbuilder = 'updated'
                } else {
                    nbId = await nbClient.createPerson({
                        email: contact.email,
                        firstName: contact.first_name || undefined,
                        lastName: contact.last_name || undefined,
                        phone: contact.phone || undefined
                    }, contactId)
                    if (nbId) {
                        await this.supabase.from('contacts').update({ nationbuilder_id: String(nbId) }).eq('id', contactId)
                        results.nationbuilder = 'created'
                    }
                }
            } catch (e) {
                results.nationbuilder = 'error'
            }
        } else {
            results.nationbuilder = 'skipped_no_creds'
        }

        // 3. Mailchimp
        if (SERVICES.mailchimp) {
            try {
                const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
                if (audienceId) {
                    await mcClient.addContactToAudience(audienceId, {
                        email: contact.email,
                        first_name: contact.first_name || undefined,
                        last_name: contact.last_name || undefined
                    })
                    results.mailchimp = 'synced'
                } else {
                    results.mailchimp = 'skipped_no_audience_id'
                }
            } catch (e) {
                results.mailchimp = 'error'
            }
        } else {
            results.mailchimp = 'skipped_no_creds'
        }

        return results
    }
}

export const orchestrator = new SyncOrchestrator()
