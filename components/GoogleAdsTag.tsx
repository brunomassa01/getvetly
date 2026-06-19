import Script from "next/script";

// Google tag (gtag.js) do Google Ads — usada pra medir a campanha de teste.
// ID público (aparece no HTML de qualquer jeito), então pode ficar fixo aqui.
// Só carrega em produção pra acessos locais/dev não contarem como tráfego.
const GOOGLE_ADS_ID = "AW-18253685901";

export function GoogleAdsTag() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  );
}
