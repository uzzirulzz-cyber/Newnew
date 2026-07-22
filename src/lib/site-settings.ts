"use client";

import * as React from "react";

/**
 * Site settings hook — reads admin settings from localStorage.
 *
 * The admin Settings module saves to localStorage ("admin-settings").
 * This hook lets storefront components (header, footer, cart, etc.) read
 * those values so changes made in Settings actually appear on the storefront.
 */

export interface SiteSettings {
  siteName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  timezone: string;
  dateFormat: string;
  maintenance: boolean;
  registration: boolean;
  vendorApps: boolean;
  beta: boolean;
  shippingEnabled: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Digital Platform",
  tagline: "Premium Digital Marketplace",
  email: "contact@yourplatform.com",
  phone: "",
  address: "House 334, Street 06, Jinnahabad, Abbottabad",
  description:
    "Buy premium digital products — streaming, AI tools, games, gift cards, and more. Instant delivery, secure payments, 24/7 support.",
  timezone: "Asia/Karachi",
  dateFormat: "MMM D, YYYY",
  maintenance: false,
  registration: true,
  vendorApps: false,
  beta: false,
  shippingEnabled: false,
};

const STORAGE_KEY = "admin-settings";

let cachedSettings: SiteSettings | null = null;
const listeners = new Set<(s: SiteSettings) => void>();

function loadSettings(): SiteSettings {
  if (cachedSettings) return cachedSettings;
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      cachedSettings = { ...DEFAULT_SETTINGS, ...saved.general };
      return cachedSettings;
    }
  } catch {}
  cachedSettings = DEFAULT_SETTINGS;
  return cachedSettings;
}

/** Notify all listeners when settings change (e.g. after Save All in admin). */
function notifySettingsChange() {
  cachedSettings = null; // force reload
  const settings = loadSettings();
  listeners.forEach((fn) => fn(settings));
}

/** Listen for localStorage changes (from admin Settings Save All). */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      notifySettingsChange();
    }
  });
  // Also poll every 2 seconds for same-tab changes (storage event only fires cross-tab)
  setInterval(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const newSettings = { ...DEFAULT_SETTINGS, ...saved.general };
        if (cachedSettings && JSON.stringify(cachedSettings) !== JSON.stringify(newSettings)) {
          notifySettingsChange();
        }
      }
    } catch {}
  }, 2000);
}

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = React.useState<SiteSettings>(loadSettings);

  React.useEffect(() => {
    const fn = (s: SiteSettings) => setSettings(s);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return settings;
}

/** Force a settings refresh (call after saving in admin). */
export function refreshSiteSettings() {
  notifySettingsChange();
}

export { DEFAULT_SETTINGS };
