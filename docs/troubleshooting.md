# Troubleshooting

## Common Issues

### 1. Emails Not Delivering
- **Check Credentials**: Verify `RESEND_API_KEY` in `.env.local` (or Vercel variables).
- **Spam Folder**: Check if the domain is authenticated (DKIM/SPF).

### 2. Scanner Not Working
- **Permissions**: Ensure browser camera permissions are ALLOWED.
- **https**: Camera access requires HTTPS (or localhost). It will not work on HTTP production unless secured.

### 3. Sync Failed
- **Logs**: Check Admin > Integrations > NationBuilder/Mailchimp for error logs.
- **Rate Limits**: If you see 429 errors, wait an hour and retry.

## Getting Support
Contact your system administrator or open a GitHub issue.
