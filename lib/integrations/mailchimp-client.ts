import mailchimp from '@mailchimp/mailchimp_marketing'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

const MC_API_KEY = process.env.MAILCHIMP_API_KEY
let MC_SERVER = process.env.MAILCHIMP_SERVER_PREFIX // e.g. "us1"

// Auto-detect server from API key if not manually set
if (MC_API_KEY && !MC_SERVER) {
    const parts = MC_API_KEY.split('-')
    if (parts.length === 2) {
        MC_SERVER = parts[1]
    }
}

if (MC_API_KEY && MC_SERVER) {
    mailchimp.setConfig({
        apiKey: MC_API_KEY,
        server: MC_SERVER
    })
} else {
    // console.warn('Mailchimp credentials missing or incomplete (API Key or Server Prefix)')
}

class MailchimpClient {
    private supabase = createAdminClient()

    private async log(logEntry: { service: string, operation: string, status: string, error_message?: string }) {
        try {
            await this.supabase.from('sync_logs').insert(logEntry)
        } catch (e) {
            console.error('Failed to write sync log', e)
        }
    }

    async getMember(email: string) {
        if (!MC_API_KEY) return null
        try {
            // MD5 hash of lowercase email is required for lookup, 
            // but the SDK let's us search or we can just try to ping?
            // simpler: search list
            // actually 'lists.getListMember' requires hash.
            // Let's assume for MVP we just return null or implement hash later if needed.
            // Or use search-members endpoint
            return null
        } catch (error) {
            return null
        }
    }

    async addContactToAudience(audienceId: string, contact: { email: string, first_name?: string, last_name?: string }) {
        if (!MC_API_KEY) {
            await this.log({ service: 'mailchimp', operation: 'push_contact', status: 'error', error_message: 'Missing API Key' })
            return { error: 'Missing Credentials' }
        }

        try {
            const response = await mailchimp.lists.addListMember(audienceId, {
                email_address: contact.email,
                status: 'subscribed',
                merge_fields: {
                    FNAME: contact.first_name || '',
                    LNAME: contact.last_name || ''
                }
            })

            await this.log({
                service: 'mailchimp',
                operation: 'push_contact',
                status: 'success'
            })

            return response
        } catch (error: any) {
            // If already exists, we should try update (PUT)
            if (error.status === 400 && error.response?.body?.title === 'Member Exists') {
                // Logic to update if needed, for now just log success as "Already there"
                await this.log({
                    service: 'mailchimp',
                    operation: 'push_contact',
                    status: 'success',
                    error_message: 'Contact already exists'
                })
                return { status: 'exists' }
            }

            await this.log({
                service: 'mailchimp',
                operation: 'push_contact',
                status: 'error',
                error_message: error.message
            })
            throw error
        }
    }

    async getAudienceMembers(audienceId: string, count = 100) {
        if (!MC_API_KEY) return { error: 'Missing Credentials' }

        try {
            const response = await mailchimp.lists.getListMembersInfo(audienceId, {
                count
            }) as any
            return response.members
        } catch (error: any) {
            await this.log({
                service: 'mailchimp',
                operation: 'get_members',
                status: 'error',
                error_message: error.message
            })
            throw error
        }
    }

    async getCampaigns(count = 10) {
        if (!MC_API_KEY) return { error: 'Missing Credentials' }
        try {
            // @ts-expect-error - Mailchimp types are incomplete
            const response = await mailchimp.campaigns.list({ count, sort_field: 'send_time', sort_dir: 'DESC' }) as any
            return response.campaigns
        } catch (error: any) {
            await this.log({ service: 'mailchimp', operation: 'get_campaigns', status: 'error', error_message: error.message })
            throw error
        }
    }

    async getCampaignReport(campaignId: string) {
        if (!MC_API_KEY) return { error: 'Missing Credentials' }
        try {
            // @ts-expect-error - Mailchimp types are incomplete
            const campaign = await mailchimp.campaigns.get(campaignId) as any
            // @ts-expect-error - Mailchimp types are incomplete
            const report = await mailchimp.reports.getCampaignReport(campaignId) as any

            return {
                id: campaign.id,
                web_id: campaign.web_id,
                title: campaign.settings.title,
                subject: campaign.settings.subject_line,
                status: campaign.status,
                stats: {
                    opens: report.opens?.opens_total || 0,
                    clicks: report.clicks?.clicks_total || 0,
                    emails_sent: report.emails_sent || 0,
                    bounces: (report.bounces?.hard_bounces || 0) + (report.bounces?.soft_bounces || 0)
                }
            }
        } catch (error: any) {
            await this.log({ service: 'mailchimp', operation: 'get_campaign_report', status: 'error', error_message: error.message })
            throw error
        }
    }

    async updateMemberTags(audienceId: string, email: string, tags: { name: string, status: 'active' | 'inactive' }[]) {
        if (!MC_API_KEY) return { error: 'Missing Credentials' }

        try {
            // Need MD5 hash of email for member operations
            const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex')


            await mailchimp.lists.updateListMemberTags(audienceId, subscriberHash, { tags })

            await this.log({ service: 'mailchimp', operation: 'update_tags', status: 'success' })
            return { success: true }
        } catch (error: any) {
            await this.log({ service: 'mailchimp', operation: 'update_tags', status: 'error', error_message: error.message })
            throw error
        }
    }
}

export const mcClient = new MailchimpClient()
