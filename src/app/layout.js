import '@/app/globals.css';
import ClientCursor from '@/components/ui/ClientCursor';
import ClientFontLoader from '@/components/ui/ClientFontLoader';
import LayoutWrapper from '@/components/layout/LayoutWrapper';

const baseUrl = process.env.APP_URL || 'https://tanico.id';

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'TaniCo',
    template: '%s | TaniCo'
  },
  description: 'A high-fidelity, premium, and beautifully minimalist e-commerce platform for curated fresh organic and hydroponic vegetables, featuring sustainable farm stories and editorial layouts.',
  keywords: ['sayur segar', 'sayur organik bangka', 'hidroponik bangka', 'tanico', 'belanja sayur online', 'petani lokal'],
  authors: [{ name: 'TaniCo Indonesia' }],
  creator: 'TaniCo',
  publisher: 'TaniCo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  alternates: {
    canonical: './'
  },
  openGraph: {
    title: 'TaniCo',
    description: 'A high-fidelity, premium, and beautifully minimalist e-commerce platform for curated fresh organic and hydroponic vegetables, featuring sustainable farm stories and editorial layouts.',
    url: baseUrl,
    siteName: 'TaniCo',
    locale: 'id_ID',
    type: 'website',
    images: []
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaniCo',
    description: 'Belanja sayur segar langsung dari kebun lokal Bangka.',
    images: []
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TaniCo',
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
    description: 'Platform belanja sayuran segar, organik, dan hidroponik langsung dari petani lokal Bangka.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jl. Raya Pemali No. 45',
      addressLocality: 'Sungailiat',
      addressRegion: 'Bangka',
      addressCountry: 'ID'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+628127300400',
      contactType: 'Customer Service',
      areaServed: 'ID',
      availableLanguage: 'Indonesian'
    }
  };

  return (
    <html lang="id" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="bg-[#FCFCFC] text-[#174C3C] font-sans antialiased selection:bg-[#DCEFE0] selection:text-[#174C3C]">
        <ClientFontLoader />
        <ClientCursor />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
