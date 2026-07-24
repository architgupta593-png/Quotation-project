"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    // Simulate a small delay for UX
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center">
          <Image
            src="/logo (2).png"
            alt="TourCraft Logo"
            width={200}
            height={60}
            className="h-20 w-auto object-contain"
            priority
          />
        </div>
        <Link
          href="/login"
          className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[380px]">
          {!submitted ? (
            <>
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center mb-6">
                <Mail className="w-5 h-5 text-white" />
              </div>

              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-[24px] font-semibold text-gray-900 tracking-[-0.03em] mb-1.5">
                  Forgot your password?
                </h1>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  Enter your email address and we&apos;ll notify your administrator to reset your password.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label
                    htmlFor="forgot-email"
                    className="block text-[13px] font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@agency.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "h-10 rounded-xl border-gray-200 bg-gray-50 text-[14px] text-gray-900",
                      "placeholder:text-gray-400 focus:bg-white transition-colors",
                      "focus-visible:ring-1 focus-visible:ring-gray-900 focus-visible:border-gray-900"
                    )}
                    required
                  />
                </div>

                <button
                  id="forgot-submit"
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className={cn(
                    "w-full h-10 rounded-xl text-[14px] font-medium text-white",
                    "flex items-center justify-center gap-2 transition-colors",
                    "bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Reset Request"
                  )}
                </button>
              </form>

              {/* Info box */}
              <div className="mt-6 px-4 py-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-[12px] text-blue-700 leading-relaxed">
                    <p className="font-medium mb-1">How password reset works</p>
                    <p>
                      For security, only a <strong>superuser</strong> can reset passwords.
                      After submitting this request, contact your system administrator
                      who will reset your password from the User Management panel.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── Success state ──────────────────────────────────────────── */
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="text-[20px] font-semibold text-gray-900 mb-2">
                Request submitted
              </h2>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-6 max-w-[300px] mx-auto">
                We&apos;ve noted your request for <strong className="text-gray-700">{email}</strong>.
                Please contact your system administrator to complete the password reset.
              </p>

              {/* Contact info box */}
              <div className="px-4 py-3.5 bg-amber-50 border border-amber-100 rounded-xl text-left mb-6">
                <div className="flex gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-[12px] text-amber-700 leading-relaxed">
                    <p className="font-medium mb-1">Next steps</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Contact your superuser / system administrator</li>
                      <li>They will reset your password from the admin panel</li>
                      <li>You&apos;ll receive a new temporary password</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Link
                href="/login"
                className={cn(
                  "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl",
                  "bg-gray-900 text-white text-[13px] font-medium",
                  "hover:bg-gray-800 transition-colors"
                )}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
