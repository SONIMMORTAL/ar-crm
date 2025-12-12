export interface DeliverabilityTestResult {
    id: string
    status: 'pending' | 'completed' | 'failed'
    spamScore: number // 0-10, where 10 is perfect
    placement: {
        folder: 'inbox' | 'spam' | 'promotions'
        provider: 'gmail' | 'outlook' | 'yahoo' | 'protonmail'
    }[]
    recommendations: string[]
}

export async function testEmailDeliverability({
    subject,
    htmlBody,
    fromEmail,
    fromName,
}: {
    subject: string
    htmlBody: string
    fromEmail: string
    fromName: string
}): Promise<DeliverabilityTestResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // MOCK LOGIC: Result depends on content length or keywords!
    // If subject contains "VIAGRA" or "FREE MONEY", spam score tanks.
    // Otherwise, it's pretty good.

    const isSpammy =
        subject.toUpperCase().includes('FREE') ||
        subject.toUpperCase().includes('MONEY') ||
        htmlBody.length < 50; // Too short is suspicious

    const score = isSpammy ? 3.5 : 8.9 + (Math.random() * 1.1) // 8.9 to 10

    return {
        id: `test_${Date.now()}`,
        status: 'completed',
        spamScore: Math.min(10, Number(score.toFixed(1))),
        placement: [
            { provider: 'gmail', folder: isSpammy ? 'spam' : 'inbox' },
            { provider: 'outlook', folder: isSpammy ? 'spam' : 'inbox' },
            { provider: 'yahoo', folder: 'inbox' }, // Yahoo is lenient in our mock world
            { provider: 'protonmail', folder: 'inbox' },
        ],
        recommendations: isSpammy
            ? ['Avoid using "FREE" in subject line', 'Add more text content to balance HTML ratio']
            : ['Great job! Your email looks healthy.', 'Ensure you have SPF/DKIM set up on your domain.']
    }
}
