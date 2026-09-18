const HCAPTCHA_SOURCES = ["https://hcaptcha.com", "https://*.hcaptcha.com"];
const HCAPTCHA_SOURCE_STRING = HCAPTCHA_SOURCES.join(" ");

function getAllowedOrigin(value, isDevelopment) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const isHttps = url.protocol === "https:";
    const isDevelopmentHttp = isDevelopment && url.protocol === "http:";

    if (!isHttps && !isDevelopmentHttp) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function buildSecurityHeaders({ supabaseUrl, isDevelopment = false } = {}) {
  const supabaseOrigin = getAllowedOrigin(supabaseUrl, isDevelopment);
  const connectSources = new Set([
    "'self'",
    ...HCAPTCHA_SOURCES,
    "https://*.supabase.co",
    "wss://*.supabase.co",
  ]);

  if (supabaseOrigin) {
    connectSources.add(supabaseOrigin);

    const url = new URL(supabaseOrigin);
    connectSources.add(`${url.protocol === "https:" ? "wss" : "ws"}://${url.host}`);
  }

  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} ${HCAPTCHA_SOURCE_STRING}`,
    `style-src 'self' 'unsafe-inline' ${HCAPTCHA_SOURCE_STRING}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    `connect-src ${Array.from(connectSources).join(" ")}`,
    `frame-src 'self' ${HCAPTCHA_SOURCE_STRING}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; ");

  const headers = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "off" },
  ];

  if (!isDevelopment) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}
