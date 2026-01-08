import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock Supabase Code
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: { id: 'contact-123' }, error: null })
                }))
            })),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockResolvedValue({ error: null })
        }))
    }))
}))

// Mock Crypto for signature verification logic (if we had it strictly enforced, likely need to mock headers)
// For this test, we assume internal functions are working or mocked if external.

describe('Email Webhook Route', () => {
    it('should return 200 for valid delivery event', async () => {
        const payload = {
            type: 'email.delivered',
            data: {
                id: 'msg-123',
                to: ['test@example.com'],
                subject: 'Test Subject'
            }
        }

        const req = new NextRequest('http://localhost/api/email/webhook', {
            method: 'POST',
            body: JSON.stringify(payload)
        })

        const res = await POST(req)
        expect(res.status).toBe(200)
    })

    it('should handle bounce events', async () => {
        const payload = {
            type: 'email.bounced',
            data: {
                id: 'msg-123',
                to: ['test@example.com'],
                subject: 'Test Subject'
            }
        }

        const req = new NextRequest('http://localhost/api/email/webhook', {
            method: 'POST',
            body: JSON.stringify(payload)
        })

        const res = await POST(req)
        expect(res.status).toBe(200)
    })
})
