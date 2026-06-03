"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { trackEvent, identifyUser } from "@/lib/analytics/posthog";
import s from "./login.module.css";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const modeParam = searchParams.get("mode");

  const [mode, setMode] = useState<"login" | "signup">(
    modeParam === "signin" ? "login" : "signup"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(next);
    });
  }, [next, router]);

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        identifyUser(data.user.id);
        trackEvent("user_signed_up", { method: "email" });
      }
      router.push(next);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        identifyUser(data.user.id);
        trackEvent("user_logged_in", { method: "email" });
      }
      router.push(next);
    }

    setLoading(false);
  }

  return (
    <div className={s.shell}>
      {/* LEFT PANEL */}
      <div className={s.left}>
        <Link href="/" className={s.brand}>Tribune</Link>

        <div className={s.heroSection}>
          <span className={s.heroSym}>§</span>
          <h1 className={s.heroH}>
            Get your deposit back.<br />
            <em>We handle the rest.</em>
          </h1>
          <p className={s.heroSub}>
            CT § 47a-21 specialists. Tribune prepares every letter, manages every response, and takes 15% only if you recover.
          </p>
        </div>

        <div className={s.proofList}>
          <div className={s.proofItem}>
            <span className={s.proofLabel}>Fee structure</span>
            <span className={s.proofVal}>15% of recovery</span>
          </div>
          <div className={s.proofItem}>
            <span className={s.proofLabel}>If we recover nothing</span>
            <span className={s.proofVal}>You pay nothing</span>
          </div>
          <div className={s.proofItem}>
            <span className={s.proofLabel}>Statute</span>
            <span className={s.proofVal}>CT § 47a-21</span>
          </div>
          <div className={s.proofItem}>
            <span className={s.proofLabel}>Built at</span>
            <span className={s.proofVal}>Yale University</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={s.right}>
        <div className={s.formWrap}>
          <span className={s.formBrow}>
            {mode === "signup" ? "Open your case" : "Welcome back"}
          </span>
          <h2 className={s.formTitle}>
            {mode === "signup" ? "Create your account" : "Sign in"}
          </h2>
          <p className={s.formSub}>
            {mode === "signup"
              ? "Takes about 5 minutes. Upload your lease and we'll fill in most of the form."
              : "Sign in to check your case status and updates."}
          </p>

          {/* Google */}
          <button
            className={s.googleBtn}
            onClick={handleGoogle}
            disabled={googleLoading}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? "Connecting…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className={s.divider}>
            <div className={s.dividerLine} />
            <span className={s.dividerText}>or</span>
            <div className={s.dividerLine} />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailPassword}>
            <div className={s.fieldGroup}>
              <div>
                <label htmlFor="email" className={s.fieldLabel}>Email</label>
                <input
                  id="email"
                  type="email"
                  className={s.fieldInput}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="password" className={s.fieldLabel}>Password</label>
                <input
                  id="password"
                  type="password"
                  className={s.fieldInput}
                  placeholder={mode === "signup" ? "Create a password (6+ chars)" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>
            </div>

            {error && <p className={s.fieldError}>↳ {error}</p>}

            <button
              type="submit"
              className={s.submitBtn}
              disabled={loading}
            >
              {loading
                ? "Loading…"
                : mode === "signup"
                ? "Create account →"
                : "Sign in →"}
            </button>
          </form>

          <p className={s.toggleRow}>
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  className={s.toggleBtn}
                  onClick={() => { setMode("login"); setError(""); }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button
                  className={s.toggleBtn}
                  onClick={() => { setMode("signup"); setError(""); }}
                >
                  Create an account
                </button>
              </>
            )}
          </p>

          <p className={s.finePrint}>
            Tribune is a document-preparation and legal-information service — not a law firm. All correspondence is signed by you. Connecticut residential tenants only.
          </p>
        </div>
      </div>
    </div>
  );
}
