// supabase/functions/sync-to-nationbuilder/index.ts

/*
  AUTO-SYNC EDGE FUNCTION SKELETON

  This function would be triggered by a Database Webhook when:
  1. A contact is created/updated.
  2. Attendance status changes to 'checked_in'.

  DEPLOYMENT:
  - This requires Supabase CLI + Docker.
  - Setup secrets: `supabase secrets set NATIONBUILDER_API_TOKEN=...`
*/

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// NB Client would be duplicated or imported from shared lib if using monorepo
const NB_URL = `https://${Deno.env.get('NATIONBUILDER_SLUG')}.nationbuilder.com/api/v1`

serve(async (req) => {
    try {
        const payload = await req.json()
        const { record, type, table } = payload

        // 1. Setup Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log(`Processing ${type} on ${table}`)

        // 2. Logic: Handle Contact Update
        if (table === 'contacts') {
            const personData = {
                person: {
                    email: record.email,
                    first_name: record.first_name,
                    last_name: record.last_name,
                    phone: record.phone
                }
            }

            // Call NB API
            // const res = await fetch(`${NB_URL}/people/push`, ...)

            // Log Success
            await supabaseClient.from('sync_logs').insert({
                integration: 'nationbuilder',
                entity_type: 'contact',
                entity_id: record.id,
                status: 'success',
                message: 'Auto-synced via Edge Function'
            })
        }

        // 3. Logic: Handle Attendance Check-in
        if (table === 'attendance' && record.status === 'checked_in') {
            // Fetch event details to generate tag
            const { data: event } = await supabaseClient
                .from('events')
                .select('slug, event_date')
                .eq('id', record.event_id)
                .single()

            if (event) {
                const tag = `Attended_${event.slug}_${event.event_date.split('T')[0]}`
                // Call NB API to add tag
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
