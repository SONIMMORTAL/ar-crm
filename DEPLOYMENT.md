# Deployment Guide

This guide covers deploying the AR CRM to production, specifically targeting Vercel + Supabase, but the principles apply to any containerized environment.

## 1. Prerequisites
- **GitHub Repository**: Connected to your source code.
- **Vercel Account**: For hosting the frontend/API.
- **Supabase Project**: Production database instance.
- **Resend Account**: For transactional emails.

## 2. Environment Variables
Local `.env.local` variables must be added to your Vercel Project Settings.
Refer to `.env.production.example` for the complete list.

**CRITICAL**:
- Ensure `NEXT_PUBLIC_APP_URL` matches your actual Vercel domain (e.g., `https://my-crm.vercel.app`).
- Set a strong `CRON_SECRET` for securing background jobs.

## 3. Database Migration
Run your migrations against the production database.
You can do this via the Supabase Dashboard SQL Editor or CLI:
```bash
npx supabase db push --linked
```
*Or simply copy-paste the contents of `supabase/migrations/*.sql` into the Supabase SQL Editor in order.*

## 4. Build & Deploy
Push to `main` to trigger a Vercel deployment.
The build command is automatically detected as `npm run build`.

### Verify Build
Check the Vercel logs to ensure:
- Type checks pass.
- Linting passes.

## 5. Post-Deployment Setup
1. **Seed Admin User**:
   - Go to Supabase > Authentication > Users.
   - Invite your admin email manually or use the Sign Up page if public registration is enabled (it is by default).
2. **Webhooks**:
   - **Mailchimp**: Point webhook to `https://your-domain.com/api/sync/mailchimp/webhook`.
   - **Resend**: Setup webhooks in Resend dashboard to `https://your-domain.com/api/email/webhook`.
3. **Cron Jobs**:
   - Vercel Cron will automatically pick up the jobs defined in `vercel.json`.
   - Verify they run in the Vercel Dashboard > Logs.

## 6. Smoke Tests
1. **Login**: Access `/admin` and log in.
2. **Email**: Send a test campaign to yourself.
3. **Registration**: Register for an event on the public link and verify the confirmation email.

## Troubleshooting
- **500 Errors**: Check Vercel Function Logs.
- **Auth Issues**: Ensure `NEXT_PUBLIC_SUPABASE_URL` is exact.
- **Missing Styles**: Check `tailwind.config.ts` content matches.
