"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const HCAPTCHA_SCRIPT_ID = "hcaptcha-api-script";
const HCAPTCHA_ONLOAD_CALLBACK = "__khmerWeddingArchiveHCaptchaReady";
const HCAPTCHA_SCRIPT_SRC = `https://js.hcaptcha.com/1/api.js?onload=${HCAPTCHA_ONLOAD_CALLBACK}&render=explicit`;

let hCaptchaScriptPromise;

function loadHCaptchaScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("hCaptcha is only available in the browser"));
  }

  if (window.hcaptcha) {
    return Promise.resolve(window.hcaptcha);
  }

  if (hCaptchaScriptPromise) {
    return hCaptchaScriptPromise;
  }

  hCaptchaScriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(HCAPTCHA_SCRIPT_ID);
    let isSettled = false;

    const cleanup = () => {
      if (window[HCAPTCHA_ONLOAD_CALLBACK] === handleReady) {
        delete window[HCAPTCHA_ONLOAD_CALLBACK];
      }
    };
    const handleReady = () => {
      if (isSettled) {
        return;
      }

      if (window.hcaptcha) {
        isSettled = true;
        cleanup();
        resolve(window.hcaptcha);
      }
    };
    const handleError = () => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        reject(new Error("Unable to load hCaptcha"));
      }
    };

    window[HCAPTCHA_ONLOAD_CALLBACK] = handleReady;

    if (!script) {
      script = document.createElement("script");
      script.id = HCAPTCHA_SCRIPT_ID;
      script.src = HCAPTCHA_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", handleReady, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (window.hcaptcha) {
      handleReady();
    }
  }).catch((error) => {
    hCaptchaScriptPromise = undefined;
    throw error;
  });

  return hCaptchaScriptPromise;
}

const HCaptchaWidget = forwardRef(function HCaptchaWidget({
  sitekey,
  theme = "dark",
  onVerify,
  onExpired,
  onError,
  onReady,
}, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const apiRef = useRef(null);
  const callbackRefs = useRef({ onVerify, onExpired, onError, onReady });
  const [widgetSize, setWidgetSize] = useState("normal");
  const [status, setStatus] = useState(sitekey ? "loading" : "missing");

  callbackRefs.current = { onVerify, onExpired, onError, onReady };

  useImperativeHandle(ref, () => ({
    reset() {
      if (apiRef.current && widgetIdRef.current !== null) {
        apiRef.current.reset(widgetIdRef.current);
      }

      setStatus("ready");
      callbackRefs.current.onVerify?.("");
    },
  }), []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 480px)");
    const updateWidgetSize = () => setWidgetSize(mediaQuery.matches ? "compact" : "normal");

    updateWidgetSize();
    mediaQuery.addEventListener?.("change", updateWidgetSize);

    return () => mediaQuery.removeEventListener?.("change", updateWidgetSize);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    setStatus(sitekey ? "loading" : "missing");
    widgetIdRef.current = null;
    apiRef.current = null;
    container.replaceChildren();

    if (!sitekey) {
      callbackRefs.current.onError?.(new Error("Missing hCaptcha sitekey"));
      return undefined;
    }

    loadHCaptchaScript()
      .then((api) => {
        if (isCancelled || !containerRef.current) {
          return;
        }

        const widgetId = api.render(containerRef.current, {
          sitekey,
          theme,
          size: widgetSize,
          callback: (token) => {
            setStatus("verified");
            callbackRefs.current.onVerify?.(token);
          },
          "expired-callback": () => {
            setStatus("ready");
            callbackRefs.current.onExpired?.();
          },
          "error-callback": () => {
            setStatus("error");
            callbackRefs.current.onError?.(new Error("hCaptcha verification failed"));
          },
        });

        apiRef.current = api;
        widgetIdRef.current = widgetId;
        setStatus("ready");
        callbackRefs.current.onReady?.();
      })
      .catch((error) => {
        if (!isCancelled) {
          setStatus("error");
          callbackRefs.current.onError?.(error);
        }
      });

    return () => {
      isCancelled = true;

      if (apiRef.current && widgetIdRef.current !== null) {
        try {
          apiRef.current.remove(widgetIdRef.current);
        } catch {
          // The widget may already have been removed by hCaptcha.
        }
      }

      widgetIdRef.current = null;
      apiRef.current = null;
    };
  }, [sitekey, theme, widgetSize]);

  return (
    <div
      className={`auth-captcha auth-captcha--${status}`}
      aria-busy={status === "loading"}
      aria-live="polite"
    >
      <div ref={containerRef} />
      {status === "loading" ? (
        <span className="auth-captcha__status">Loading security check…</span>
      ) : null}
      {status === "missing" ? (
        <span className="auth-captcha__status">Security check is not configured.</span>
      ) : null}
      {status === "error" ? (
        <span className="auth-captcha__status">Security check could not load. Try again.</span>
      ) : null}
    </div>
  );
});

export default HCaptchaWidget;
