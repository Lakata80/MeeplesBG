'use client'

import Script      from 'next/script'
import { useState, useEffect } from 'react'

const GA_ID       = 'G-FLFYHDQGNN'
const CONSENT_KEY = 'meeplebg-cookie-consent'

function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return parsed?.категории?.аналитични === true
  } catch {
    return false
  }
}

export default function GoogleAnalytics() {
  const [load, setLoad] = useState(false)

  useEffect(() => {
    setLoad(hasAnalyticsConsent())
  }, [])

  if (!load) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  )
}
