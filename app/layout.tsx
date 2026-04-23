import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Book Here | AlphaLuxClean',
  description: 'Premium cleaning services in Texas & California',
  authors: [{ name: 'AlphaLuxClean' }],
  icons: {
    icon: 'https://storage.googleapis.com/gpt-engineer-file-uploads/gKZdtAV5x1fAVy9ghNl5qNeLg112/uploads/1760931030113-Untitled design (1).png',
  },
  openGraph: {
    type: 'website',
    title: 'Book Here | AlphaLuxClean',
    description: 'Premium cleaning services in Texas & California',
    images: [
      'https://storage.googleapis.com/gpt-engineer-file-uploads/gKZdtAV5x1fAVy9ghNl5qNeLg112/social-images/social-1760931236601-Untitled design (2).png',
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@alphaluxclean',
    title: 'Book Here | AlphaLuxClean',
    description: 'Premium cleaning services in Texas & California',
    images: [
      'https://storage.googleapis.com/gpt-engineer-file-uploads/gKZdtAV5x1fAVy9ghNl5qNeLg112/social-images/social-1760931236601-Untitled design (2).png',
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '683996898113618');fbq('track', 'PageView');`}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=683996898113618&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        {/* Mouseflow Heatmap */}
        <Script id="mouseflow" strategy="afterInteractive">
          {`window._mfq = window._mfq || []; (function() { var mf = document.createElement("script"); mf.type = "text/javascript"; mf.defer = true; mf.src = "//cdn.mouseflow.com/projects/04fea0d1-c0fa-44ee-98ba-6cf464d16d40.js"; document.getElementsByTagName("head")[0].appendChild(mf); })();`}
        </Script>

        <div id="root">{children}</div>
      </body>
    </html>
  );
}
