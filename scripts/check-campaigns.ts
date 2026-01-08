
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createAdminClient } from '@/lib/supabase/admin'

async function check() {
    const supabase = createAdminClient()

    // Reset CRM TEST and the other recent one
    const idsToReset = [
        '7e72ce70-502a-4e4e-b509-b924956d5f9d', // CRM TEST
        '493f41a0-1889-4a73-9d3c-f57d31430076'  // Untitled
    ]

    const { error } = await supabase.from('email_campaigns')
        .update({ status: 'draft' })
        .in('id', idsToReset)

    if (error) console.error('Error resetting:', error)
    else console.log('Successfully reset campaigns to draft.')
}

check()
