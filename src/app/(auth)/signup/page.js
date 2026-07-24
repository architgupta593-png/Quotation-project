"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ── Password strength ──────────────────────────────────────────────────────────
const passwordRules = [
  { test: (v) => v.length >= 8 },
  { test: (v) => /[a-zA-Z]/.test(v) },
  { test: (v) => /[0-9]/.test(v) },
  { test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = [
  "bg-gray-200",
  "bg-red-400",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-emerald-500",
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const strength = passwordRules.filter((r) => r.test(passwordValue)).length;

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || "Signup failed. Please try again.");
        return;
      }
      router.push("/login?registered=true");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign in →
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px]">

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-[24px] font-semibold text-gray-900 tracking-[-0.03em] mb-1.5">
              Create an account
            </h1>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              Join as a team member and start creating quotations.
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>

            {/* ── Full name ────────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-name"
                className="block text-[13px] font-medium text-gray-700"
              >
                Full name
              </label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Rahul Sharma"
                autoComplete="name"
                className={cn(
                  "h-10 rounded-xl border-gray-200 bg-gray-50 text-[14px] text-gray-900",
                  "placeholder:text-gray-400 focus:bg-white transition-colors",
                  "focus-visible:ring-1 focus-visible:ring-gray-900 focus-visible:border-gray-900",
                  errors.name && "border-red-300 focus-visible:ring-red-400"
                )}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-[12px] text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* ── Email ───────────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="block text-[13px] font-medium text-gray-700"
              >
                Email address
              </label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@agency.com"
                autoComplete="email"
                className={cn(
                  "h-10 rounded-xl border-gray-200 bg-gray-50 text-[14px] text-gray-900",
                  "placeholder:text-gray-400 focus:bg-white transition-colors",
                  "focus-visible:ring-1 focus-visible:ring-gray-900 focus-visible:border-gray-900",
                  errors.email && "border-red-300 focus-visible:ring-red-400"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[12px] text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* ── Password ─────────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-password"
                className="block text-[13px] font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={cn(
                    "h-10 rounded-xl border-gray-200 bg-gray-50 text-[14px] text-gray-900",
                    "placeholder:text-gray-400 focus:bg-white pr-10 transition-colors",
                    "focus-visible:ring-1 focus-visible:ring-gray-900 focus-visible:border-gray-900",
                    errors.password && "border-red-300 focus-visible:ring-red-400"
                  )}
                  {...register("password", {
                    onChange: (e) => setPasswordValue(e.target.value),
                  })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password strength bar */}
              {passwordValue.length > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          i < strength ? strengthColors[strength] : "bg-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  {strength > 0 && (
                    <p
                      className={cn(
                        "text-[11px] font-medium transition-colors",
                        strength === 1 && "text-red-500",
                        strength === 2 && "text-orange-500",
                        strength === 3 && "text-yellow-600",
                        strength === 4 && "text-emerald-600"
                      )}
                    >
                      {strengthLabels[strength]}
                    </p>
                  )}
                </div>
              )}

              {errors.password && !passwordValue && (
                <p className="text-[12px] text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* ── Confirm password ─────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-confirm"
                className="block text-[13px] font-medium text-gray-700"
              >
                Confirm password
              </label>
              <div className="relative">
                <Input
                  id="signup-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={cn(
                    "h-10 rounded-xl border-gray-200 bg-gray-50 text-[14px] text-gray-900",
                    "placeholder:text-gray-400 focus:bg-white pr-10 transition-colors",
                    "focus-visible:ring-1 focus-visible:ring-gray-900 focus-visible:border-gray-900",
                    errors.confirmPassword && "border-red-300 focus-visible:ring-red-400"
                  )}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[12px] text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* ── Submit ───────────────────────────────────────────────────── */}
            <button
              id="signup-submit"
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-10 rounded-xl text-[14px] font-medium text-white mt-1",
                "flex items-center justify-center gap-2 transition-colors",
                "bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-gray-400 mt-8 leading-relaxed">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-gray-700 font-medium underline underline-offset-2 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
          </p>
          <p className="text-center text-[11px] text-gray-400 mt-2 leading-relaxed">
            By continuing, you agree to our{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-gray-600 transition-colors">
              Terms
            </span>{" "}
            &{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-gray-600 transition-colors">
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
