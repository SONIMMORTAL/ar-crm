# AR CRM (Advanced React CRM)

A modern, high-performance Customer Relationship Management system built with Next.js 14, Supabase, and Tailwind CSS. Designed for event management, email marketing, and advanced contact analytics.

![Dashboard Preview](./public/dashboard-preview.png)
*(Note: Add a screenshot of your dashboard here if you have one)*

## 🚀 Key Features

### 1. Contact Management
- **Single Source of Truth**: Centralized contact database with Supabase.
- **Engagement Scoring**: Algorithmic scoring (High/Medium/Low) based on interactions.
- **Advanced Filters**: Filter by engagement tier, recency, and activity.

### 2. Event Management
- **Event Creation**: Manage capacity, location, and dates.
- **QR Code Check-ins**: Built-in QR scanner for attendee check-in.
- **Registration**: Public-facing registration pages having `<domain>/register/[event-slug]`.

### 3. Email Marketing
- **Campaign Builder**: WYSIWYG editor (Tiptap) for beautiful emails.
- **Smart Segments**: Target contacts based on engagement or attendance.
- **Analytics**: Track Opens and Clicks in real-time.

### 4. Integrations & Sync
- **Traffic Controller**: Robust sync orchestrator for 3rd-party tools.
- **NationBuilder**: Two-way sync for People and Attendance.
- **Mailchimp**: Audience sync and Webhook processing.

### 5. Analytics & Reports
- **Command Center**: Real-time dashboard with Recharts.
- **PDF Reports**: One-click export for stakeholders.
- **Global Search**: `Cmd+K` accessibility for rapid navigation.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Auth**: Supabase Auth (Middleware protected)
- **Email**: Resend API
- **Maps**: Mapbox (Optional)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ar-crm.git
   cd ar-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_key
   
   # Integrations (Optional)
   NATIONBUILDER_SLUG=your_slug
   NATIONBUILDER_API_TOKEN=your_token
   MAILCHIMP_API_KEY=your_key
   MAILCHIMP_SERVER_PREFIX=us1
   MAILCHIMP_AUDIENCE_ID=your_id
   ```

4. **Initialize Database**
   Run the migration scripts located in `supabase/migrations/` in your Supabase SQL Editor.

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔒 Security

- **Row Level Security (RLS)**: Enabled on all tables.
- **Middleware Protection**: Admin routes require active session.
- **Secure Webhooks**: Signature verification for Mailchimp/NationBuilder.

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
