
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
    console.log('Seeding event...')
    const { data, error } = await supabase.from('events').insert({
        name: 'Product Launch Party',
        slug: 'launch-party',
        description: 'Join us for the official launch of our new CRM product. Drinks and networking provided.',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Tech Hub Center, San Francisco',
        capacity: 100
    }).select().single()

    if (error) {
        // If error is uniqueness violation, that's fine, it exists.
        if (error.code === '23505') {
            console.log('Event already exists.')
        } else {
            console.error('Error creating event:', error)
        }
    } else {
        console.log('Event created successfully:', data.slug)
    }
}

seed()
