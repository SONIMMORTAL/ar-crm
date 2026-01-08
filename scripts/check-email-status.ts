
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { Resend } from 'resend'

async function checkStatus() {
    const key = process.env.RESEND_API_KEY
    if (!key) {
        console.error('No API Key found')
        return
    }
    const resend = new Resend(key)

    // The ID from the previous verification run
    const emailId = '555ce457-9612-4fa6-b434-adf44d013f22'

    try {
        const { data, error } = await resend.emails.get(emailId)
        console.log('Email Status Check:', JSON.stringify(data || error, null, 2))
    } catch (e) {
        console.error(e)
    }
}

checkStatus()
