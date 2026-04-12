const DEFAULT_WEB_API_BASE = "http://127.0.0.1:5000";
const DEFAULT_ANDROID_API_BASE = "http://192.168.1.11:5000";

type CapacitorRuntime = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

declare global {
  interface Window {
    Capacitor?: CapacitorRuntime;
  }
}

export const isBrowser = typeof window !== "undefined";

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function isLoopbackUrl(url: string) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(normalizeUrl(url));
}

function getCapacitorRuntime() {
  if (!isBrowser) {
    return null;
  }

  return window.Capacitor ?? null;
}

export function isNativeAppShell() {
  const capacitor = getCapacitorRuntime();

  if (capacitor?.isNativePlatform) {
    return capacitor.isNativePlatform();
  }

  return isBrowser && window.location.origin === "https://localhost";
}

export function isAndroidAppShell() {
  const capacitor = getCapacitorRuntime();

  if (capacitor?.getPlatform) {
    return capacitor.getPlatform() === "android";
  }

  return isNativeAppShell() && typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

export function getApiBaseUrl() {
  const defaultEnvUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const androidEnvUrl = import.meta.env.VITE_ANDROID_API_BASE_URL?.trim();

  if (isAndroidAppShell() && androidEnvUrl) {
    const normalizedAndroidUrl = normalizeUrl(androidEnvUrl);

    if (defaultEnvUrl && isLoopbackUrl(normalizedAndroidUrl) && !isLoopbackUrl(defaultEnvUrl)) {
      return normalizeUrl(defaultEnvUrl);
    }

    return normalizedAndroidUrl;
  }

  if (defaultEnvUrl) {
    return normalizeUrl(defaultEnvUrl);
  }

  return isAndroidAppShell() ? DEFAULT_ANDROID_API_BASE : DEFAULT_WEB_API_BASE;
}

export const appStorage = {
  get(key: string) {
    if (!isBrowser) {
      return null;
    }

    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("Failed to read local storage", error);
      return null;
    }
  },

  set(key: string, value: string) {
    if (!isBrowser) {
      return;
    }

    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn("Failed to write local storage", error);
    }
  },

  remove(key: string) {
    if (!isBrowser) {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn("Failed to remove local storage", error);
    }
  },
};

export function getGeolocation() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }

  return navigator.geolocation;
}

export function openExternalUrl(url: string) {
  if (!isBrowser) {
    return false;
  }

  return Boolean(window.open(url, "_blank", "noopener,noreferrer"));
}
