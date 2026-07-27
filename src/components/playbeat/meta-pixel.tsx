"use client";

import Script from "next/script";

const META_PIXEL_ID = "489762161686775";

// Facebook App ID — used by the Facebook JavaScript SDK for Login,
// Share, Like, and other social plugins.
// From developers.facebook.com → My Apps → playbeat.digital
const FACEBOOK_APP_ID = "1768887737439036";

/**
 * Meta (Facebook) Pixel + JavaScript SDK.
 *
 * Two things are loaded:
 *
 * 1. Meta Pixel (fbevents.js) — for ad attribution and conversion tracking.
 *    Track events via: window.fbq('track', 'Purchase', { ... })
 *    or the trackMetaEvent() helper.
 *
 * 2. Facebook JavaScript SDK (sdk.js) — for social features:
 *    - Facebook Login (FB.login)
 *    - Share dialogs (FB.ui)
 *    - Like / Share buttons
 *    - Page plugins
 *    - FB.AppEvents.logPageView()
 *
 * The SDK is initialized with appId, cookie, xfbml, and API version.
 * After load, window.FB is available for use.
 */
export function MetaPixel() {
  return (
    <>
      {/* 1. Meta Pixel — conversion tracking */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* 2. Facebook JavaScript SDK — social plugins + login */}
      <Script id="facebook-sdk" strategy="afterInteractive">
        {`
          window.fbAsyncInit = function() {
            FB.init({
              appId      : '${FACEBOOK_APP_ID}',
              cookie     : true,
              xfbml      : true,
              version    : 'v21.0'
            });
            FB.AppEvents.logPageView();
          };

          (function(d, s, id){
             var js, fjs = d.getElementsByTagName(s)[0];
             if (d.getElementById(id)) {return;}
             js = d.createElement(s); js.id = id;
             js.src = "https://connect.facebook.net/en_US/sdk.js";
             fjs.parentNode.insertBefore(js, fjs);
           }(document, 'script', 'facebook-jssdk'));
        `}
      </Script>
    </>
  );
}

/** Helper to track Meta Pixel events from client components. */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>,
) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", event, params);
  }
}

/**
 * Helper to use the Facebook SDK after it's loaded.
 * The SDK loads asynchronously, so we wait for window.FB to be ready.
 */
export function withFacebookSDK(callback: (FB: any) => void) {
  if (typeof window === "undefined") return;
  if ((window as any).FB) {
    callback((window as any).FB);
  } else {
    // Poll until the SDK is ready (fbAsyncInit has run)
    const interval = setInterval(() => {
      if ((window as any).FB) {
        clearInterval(interval);
        callback((window as any).FB);
      }
    }, 100);
    // Give up after 10 seconds
    setTimeout(() => clearInterval(interval), 10000);
  }
}
