"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client.js";
import InteractionLock from "./InteractionLock.js";

const LOGIN_ERROR = "Invalid email or password";
const SIGNUP_ERROR = "Unable to create account";

const styles = {
  page: {
    width: "100vw",
    minHeight: "100svh",
    marginTop: "calc(-1 * var(--header-height))",
    marginLeft: "calc(50% - 50vw)",
    display: "grid",
    placeItems: "center",
    padding: "clamp(2rem, 6vw, 5rem) 1.25rem",
    backgroundColor: "var(--color-red-dark)",
    backgroundImage: "radial-gradient(circle at 50% 18%, rgba(167, 123, 61, 0.18), transparent 48%)",
    color: "var(--color-on-dark)",
    transition: "opacity 420ms ease",
  },
  card: {
    position: "relative",
    width: "min(100%, 28rem)",
    padding: "clamp(1.5rem, 5vw, 3rem)",
    border: "1px solid var(--color-gold-muted)",
    backgroundColor: "rgba(248, 240, 226, 0.97)",
    color: "var(--color-text)",
    boxShadow: "var(--shadow-soft)",
    transition: "opacity 520ms ease, transform 520ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms ease",
  },
  eyebrow: {
    margin: 0,
    color: "var(--color-red)",
    fontFamily: "var(--font-meta)",
    fontSize: "var(--type-meta)",
    fontWeight: 700,
    letterSpacing: "0.11em",
    textTransform: "uppercase",
  },
  title: {
    margin: "0.65rem 0 0",
    color: "var(--color-title-gold)",
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2rem, 6vw, 3rem)",
    fontWeight: 400,
    letterSpacing: "-0.04em",
    lineHeight: 1,
  },
  intro: {
    margin: "0.8rem 0 0",
    color: "var(--color-muted)",
    fontSize: "0.9rem",
  },
  form: {
    display: "grid",
    gap: "1rem",
    marginTop: "1.75rem",
  },
  field: {
    display: "grid",
    gap: "0.35rem",
  },
  label: {
    color: "var(--color-brown)",
    fontFamily: "var(--font-meta)",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    minHeight: "2.8rem",
    padding: "0.65rem 0.75rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--color-gold-muted)",
    borderRadius: "0.15rem",
    backgroundColor: "rgba(255, 252, 246, 0.78)",
    color: "var(--color-text)",
    font: "inherit",
    outline: "none",
    transition: "border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease, transform 180ms ease",
  },
  inputFocused: {
    borderColor: "var(--color-gold)",
    backgroundColor: "#fffdf8",
    boxShadow: "0 0 0 3px rgba(201, 169, 104, 0.2)",
    transform: "translateY(-1px)",
  },
  button: {
    alignItems: "center",
    display: "inline-flex",
    justifyContent: "center",
    minHeight: "2.9rem",
    minWidth: "10rem",
    marginTop: "0.35rem",
    padding: "0.7rem 1rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--color-gold-light)",
    borderRadius: "0.15rem",
    backgroundColor: "var(--color-red)",
    color: "var(--color-on-dark)",
    cursor: "pointer",
    fontFamily: "var(--font-meta)",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    transition: "background-color 180ms ease, border-color 180ms ease, box-shadow 220ms ease, transform 220ms ease",
  },
  buttonHovered: {
    borderColor: "var(--color-gold-light)",
    backgroundColor: "var(--color-title-gold)",
    boxShadow: "0 0.55rem 1.25rem rgba(53, 23, 26, 0.2)",
    transform: "translateY(-2px)",
  },
  buttonDisabled: {
    opacity: 0.65,
    cursor: "wait",
  },
  message: {
    margin: "0.2rem 0 0",
    color: "var(--color-red)",
    fontSize: "0.86rem",
  },
  status: {
    minHeight: "1.35rem",
    transition: "opacity 180ms ease",
  },
  footer: {
    margin: "1.5rem 0 0",
    color: "var(--color-muted)",
    fontSize: "0.86rem",
    textAlign: "center",
  },
  link: {
    color: "var(--color-red)",
    fontWeight: 700,
    textDecoration: "underline",
    textUnderlineOffset: "0.18em",
    transition: "color 180ms ease, text-shadow 180ms ease",
  },
  linkHovered: {
    color: "var(--color-title-gold)",
    textShadow: "0 0 0.7rem rgba(167, 123, 61, 0.35)",
  },
};

export default function AuthForm({ mode = "login" }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isLinkHovered, setIsLinkHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError(isLogin ? LOGIN_ERROR : SIGNUP_ERROR);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    let keepInteractionLocked = false;

    try {
      const supabase = createClient();
      const result = isLogin
        ? await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        : await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

      if (result.error) {
        setError(isLogin ? LOGIN_ERROR : SIGNUP_ERROR);
        return;
      }

      if (isLogin || result.data.session) {
        keepInteractionLocked = true;
        router.replace("/");
        return;
      }

      setMessage("Check your email to confirm your account.");
    } catch {
      setError(isLogin ? LOGIN_ERROR : SIGNUP_ERROR);
    } finally {
      if (!keepInteractionLocked) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  };

  return (
    <section
      style={{ ...styles.page, opacity: isMounted ? 1 : 0 }}
      aria-labelledby="auth-title"
      aria-busy={isSubmitting}
    >
      <div
        style={{
          ...styles.card,
          opacity: isMounted ? 1 : 0,
          transform: isMounted ? "translateY(0)" : "translateY(0.75rem)",
        }}
        inert={isSubmitting}
      >
        <p style={styles.eyebrow}>{isLogin ? "Welcome back" : "Join the archive"}</p>
        <h1 id="auth-title" style={styles.title}>{isLogin ? "Log in" : "Sign up"}</h1>
        <p style={styles.intro}>
          {isLogin
            ? "Continue your archive journey."
            : "Create an account to continue."}
        </p>

        <form style={styles.form} onSubmit={handleSubmit} noValidate>
          <label style={styles.field}>
            <span style={styles.label}>Email</span>
            <input
              className="auth-form__input"
              style={{ ...styles.input, ...(focusedField === "email" ? styles.inputFocused : {}) }}
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField("")}
              disabled={isSubmitting}
              required
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Password</span>
            <input
              className="auth-form__input"
              style={{ ...styles.input, ...(focusedField === "password" ? styles.inputFocused : {}) }}
              type="password"
              name="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField("")}
              disabled={isSubmitting}
              required
            />
          </label>

          {!isLogin ? (
            <label style={styles.field}>
              <span style={styles.label}>Confirm password</span>
              <input
                className="auth-form__input"
                style={{ ...styles.input, ...(focusedField === "confirm-password" ? styles.inputFocused : {}) }}
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onFocus={() => setFocusedField("confirm-password")}
                onBlur={() => setFocusedField("")}
                disabled={isSubmitting}
                required
              />
            </label>
          ) : null}

          <div style={styles.status} aria-live="polite">
            {error ? <p style={styles.message} role="alert">{error}</p> : null}
            {!error && message ? <p style={styles.message} role="status">{message}</p> : null}
          </div>

          <button
            style={{
              ...styles.button,
              ...(isButtonHovered && !isSubmitting ? styles.buttonHovered : {}),
              ...(isSubmitting ? styles.buttonDisabled : {}),
            }}
            type="submit"
            disabled={isSubmitting}
            onPointerEnter={() => setIsButtonHovered(true)}
            onPointerLeave={() => setIsButtonHovered(false)}
          >
            {isSubmitting ? "Please wait" : isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        <p style={styles.footer}>
          {isLogin ? "Need an account? " : "Already have an account? "}
          <Link
            style={{ ...styles.link, ...(isLinkHovered ? styles.linkHovered : {}) }}
            href={isLogin ? "/signup" : "/login"}
            onPointerEnter={() => setIsLinkHovered(true)}
            onPointerLeave={() => setIsLinkHovered(false)}
          >
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </p>
      </div>
      {isSubmitting ? (
        <InteractionLock message={isLogin ? "Signing in…" : "Creating account…"} />
      ) : null}
    </section>
  );
}
