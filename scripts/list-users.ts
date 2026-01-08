
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createAdminClient } from '@/lib/supabase/admin'

async function listUsers() {
    const supabase = createAdminClient()
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
        console.error('Error fetching users:', error)
        return
    }

    console.log('Registered Users:')
    users.forEach(u => {
        console.log(`- ${u.email} (Verified: ${u.email_confirmed_at ? 'Yes' : 'No'})`)
    })
}

listUsers()
