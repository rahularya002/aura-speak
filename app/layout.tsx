import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Manrope } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = "https://avatars.enbquantum.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ENB Avatars | AI Avatar Platform",
    template: "%s | ENB Avatars",
  },
  description:
    "ENB Avatars helps teams build, deploy, and manage real-time conversational AI avatars for support, sales, and enterprise workflows.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "AI avatars",
    "conversational AI",
    "enterprise avatar platform",
    "real-time avatar",
    "ENB Quantum",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "ENB Avatars",
    title: "ENB Avatars | AI Avatar Platform",
    description:
      "Build and deploy real-time conversational AI avatars on the ENB Avatars platform.",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "ENB Avatars" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ENB Avatars | AI Avatar Platform",
    description:
      "Build and deploy real-time conversational AI avatars on the ENB Avatars platform.",
    images: ["/icon.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ENB Avatars",
              url: siteUrl,
              parentOrganization: {
                "@type": "Organization",
                name: "ENB Quantum",
                url: "https://enbquantum.com",
              },
              sameAs: ["https://enbquantum.com"],
            }),
          }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
