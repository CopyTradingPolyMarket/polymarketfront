"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { API_BASE as API } from "@/src/config/api";


// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function TwitterXIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M2 9h16" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="14.5" cy="13" r="1.5" fill="currentColor"/>
      <path d="M6 3h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M4 10l5 5 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Social Button ────────────────────────────────────────────────────────────

function SocialButton({
  icon, label, onClick, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.14] active:scale-[0.98] transition-all duration-150 text-[13px] font-medium text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed group"
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600">
        <ArrowRightIcon />
      </span>
    </button>
  );
}

// ─── Username Step ────────────────────────────────────────────────────────────

function UsernameStep({
  onComplete,
  onSkip,
}: {
  onComplete: (username: string) => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = /^[a-zA-Z0-9_]{1,30}$/.test(value);

  const handleSubmit = async () => {
    if (!isValid) {
      setError("Only letters, numbers, and underscores. Max 30 chars.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onComplete(value);
    } catch (e: any) {
      setError(e?.message ?? "Username already taken.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#60a5fa]/10 border border-[#60a5fa]/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-xl">✦</span>
        </div>
        <h2 className="text-[20px] font-bold text-white leading-tight">Pick a username</h2>
        <p className="text-[13px] text-gray-500 mt-1.5">This is how other traders will see you.</p>
      </div>

      {/* Input */}
      <div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-[14px] font-semibold select-none pointer-events-none">@</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="yourname"
            maxLength={30}
            className="w-full pl-8 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-[#60a5fa]/50 focus:bg-white/[0.06] outline-none text-white text-[15px] font-medium placeholder:text-gray-700 transition-all duration-150"
          />
          {isValid && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#60a5fa]">
              <CheckIcon />
            </span>
          )}
        </div>
        {error && (
          <p className="text-[12px] text-red-400 mt-2 ml-1">{error}</p>
        )}
        <p className="text-[11px] text-gray-700 mt-2 ml-1">Letters, numbers, underscores. Max 30 chars.</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full py-3 rounded-xl bg-[#60a5fa] hover:bg-[#2563eb] active:scale-[0.98] text-black text-[14px] font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Saving…" : "Set username"}
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2.5 text-[13px] text-gray-600 hover:text-gray-400 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function AuthModal({ isOpen, onClose, defaultMode = "signup" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [step, setStep] = useState<"auth" | "username">("auth");
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const {
    login,
    authenticated,
    user,
    getAccessToken,
  } = usePrivy();

  // Sync mode when prop changes
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setStep("auth");
      setLoginLoading(null);
    }
  }, [isOpen, defaultMode]);

  // After Privy auth, call /api/auth/sync and maybe show username step
  useEffect(() => {
    if (!authenticated || !isOpen) return;

    const checkUser = async () => {
      const token = await getAccessToken();

      const res = await fetch(`${API}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setStep("username");
        return;
      }

      const data = await res.json();

      if (!data?.slug) {
        setStep("username");
      } else {
        onClose();
      }
    };

    checkUser();
  }, [authenticated, isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const sw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${sw}px`;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSocialLogin = async (provider: string) => {
    setLoginLoading(provider);

    try {
      await login(); // 👈 samo ovo
    } catch (e) {
      console.error(e);
      setLoginLoading(null);
    }
  };

  const handleUsernameComplete = async (username: string) => {
    const token = await getAccessToken();

    const res = await fetch(`${API}/api/auth/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }

    onClose();
  };

  if (!isOpen) return null;

  const isSignup = mode === "signup";

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 z-[9998]"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isSignup ? "Sign up" : "Log in"}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative w-full max-w-[400px] rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #111316 0%, #0d0e10 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.5), transparent)" }} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-gray-500 hover:text-white transition-all z-10"
          >
            <CloseIcon />
          </button>

          <div className="px-7 py-7">
            {step === "username" ? (
              <UsernameStep
                onComplete={handleUsernameComplete}
                onSkip={onClose}
              />
            ) : (
              <>
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-5">
                    {/* Logo mark */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                      <path d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[13px] font-semibold text-gray-400 tracking-tight">Polymarket</span>
                  </div>

                  <h2 className="text-[22px] font-bold text-white leading-tight">
                    {isSignup ? "Create your account" : "Welcome back"}
                  </h2>
                  <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">
                    {isSignup
                      ? "Trade on real-world events. No commissions."
                      : "Sign in to access your portfolio and positions."}
                  </p>
                </div>

                {/* Social login buttons */}
                <div className="flex flex-col gap-2.5">
                  <SocialButton
                    icon={<GoogleIcon />}
                    label="Continue with Google"
                    onClick={() => handleSocialLogin("google")}
                    disabled={loginLoading !== null}
                  />
                  <SocialButton
                    icon={<TwitterXIcon />}
                    label="Continue with X"
                    onClick={() => handleSocialLogin("twitter")}
                    disabled={loginLoading !== null}
                  />
                  <SocialButton
                    icon={<WalletIcon />}
                    label="Connect a wallet"
                    onClick={() => handleSocialLogin("wallet")}
                    disabled={loginLoading !== null}
                  />

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[11px] text-gray-700">or</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  <SocialButton
                    icon={<EmailIcon />}
                    label="Continue with email"
                    onClick={() => handleSocialLogin("email")}
                    disabled={loginLoading !== null}
                  />
                </div>

                {/* Mode toggle */}
                <p className="text-center text-[12px] text-gray-600 mt-5">
                  {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    onClick={() => setMode(isSignup ? "login" : "signup")}
                    className="text-[#60a5fa] hover:text-[#2563eb] font-semibold transition-colors"
                  >
                    {isSignup ? "Log in" : "Sign up"}
                  </button>
                </p>

                {/* Legal */}
                <p className="text-center text-[11px] text-gray-700 mt-3 leading-relaxed px-2">
                  By continuing you agree to our{" "}
                  <a href="/terms" className="text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors">Terms</a>
                  {" "}and{" "}
                  <a href="/privacy" className="text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors">Privacy Policy</a>.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
