
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { sendEmail } from '@/lib/email-service'

async function verify() {
    console.log('Verifying Email Configuration...')
    console.log('API Key present:', !!process.env.RESEND_API_KEY)

    // Attempt send
    const result = await sendEmail({
        to: 'dontfeedthegreys@gmail.com',
        subject: 'System Verification',
        html: '<h1>It Works!</h1><p>Your CRM email system is correctly configured.</p>'
    })

    console.log('Send Result:', result)
}

verify()
