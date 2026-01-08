import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AR CRM",
  description: "Premium CRM for managing contacts, campaigns, and events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#020817" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body
        className={`${inter.variable} ${dmSans.variable} antialiased`}
      >
        {children}
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(registration) {
                        console.log('Service Worker registration successful with scope: ', registration.scope);
                      },
                      function(err) {
                        console.log('Service Worker registration failed: ', err);
                      }
                    );
                  });
                }
              `,
          }}
        />
      </body>
    </html>
  );
}
