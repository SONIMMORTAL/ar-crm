import axios, { AxiosInstance } from 'axios'
import { createAdminClient } from '@/lib/supabase/admin'

const NB_Slug = process.env.NATIONBUILDER_SLUG
const NB_Token = process.env.NATIONBUILDER_API_TOKEN

// Rate limiting types
interface SyncLog {
    service: string
    operation: string
    status: string
    error_message?: string
}

class NationBuilderClient {
    private client: AxiosInstance
    private supabase = createAdminClient()

    constructor() {
        if (!NB_Slug || !NB_Token) {
            console.warn('NationBuilder credentials missing')
        }

        this.client = axios.create({
            baseURL: `https://${NB_Slug}.nationbuilder.com/api/v1`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${NB_Token}`
            }
        })
    }

    private async log(logEntry: SyncLog) {
        try {
            await this.supabase.from('sync_logs').insert(logEntry)
        } catch (e) {
            console.error('Failed to write sync log', e)
        }
    }

    // Helper to format phone, tags, etc.
    private formatPerson(data: any) {
        return {
            person: {
                email: data.email,
                first_name: data.firstName,
                last_name: data.lastName,
                phone: data.phone,
                tags: data.tags || []
            }
        }
    }

    async createPerson(data: { email: string; firstName?: string; lastName?: string; phone?: string; tags?: string[] }, contactId: string) {
        if (!NB_Token) {
            await this.log({ service: 'nationbuilder', operation: 'create_person', status: 'error', error_message: 'Missing API Token' })
            return null
        }

        try {
            const payload = this.formatPerson(data)
            // Push to People endpoint
            const res = await this.client.post('/people', payload)

            const nbId = res.data.person.id

            await this.log({
                service: 'nationbuilder',
                operation: 'create_person',
                status: 'success'
            })

            return nbId

        } catch (error: any) {
            const msg = error.response?.data?.message || error.message
            await this.log({
                service: 'nationbuilder',
                operation: 'create_person',
                status: 'error',
                error_message: `Failed to create: ${msg}`
            })
            throw error
        }
    }

    async updatePerson(nbId: string, data: { tags?: string[] }, contactId: string) {
        if (!NB_Token) return null

        try {
            // NB Update needs ID
            const res = await this.client.put(`/people/${nbId}`, {
                person: {
                    tags: data.tags
                }
            })

            await this.log({
                service: 'nationbuilder',
                operation: 'update_person',
                status: 'success'
            })
            return res.data.person.id

        } catch (error: any) {
            const msg = error.response?.data?.message || error.message
            await this.log({
                service: 'nationbuilder',
                operation: 'update_person',
                status: 'error',
                error_message: `Failed to update: ${msg}`
            })
            throw error
        }
    }

    async addTag(nbId: string, tag: string, contactId: string) {
        if (!NB_Token) return null

        try {
            const res = await this.client.post(`/people/${nbId}/taggings`, {
                tagging: {
                    tag: tag
                }
            })

            await this.log({
                service: 'nationbuilder',
                operation: 'add_tag',
                status: 'success'
            })
            return true

        } catch (error: any) {
            const msg = error.response?.data?.message || error.message
            await this.log({
                service: 'nationbuilder',
                operation: 'add_tag',
                status: 'error',
                error_message: `Failed to add tag: ${msg}`
            })
            return false
        }
    }
}

export const nbClient = new NationBuilderClient()
