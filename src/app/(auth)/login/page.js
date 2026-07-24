"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError("");
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });
      if (result?.error) {
        setServerError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
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
          href="/signup"
          className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
        >
          Create account →
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[340px]">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[24px] font-semibold text-gray-900 tracking-[-0.03em] mb-1.5">
              Sign in
            </h1>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600 leading-snug">
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-[13px] font-medium text-gray-700"
              >
                Email address
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@agency.com"
                autoComplete="email"
                className={cn(
                  "h-10 rounded-xl border-gray-200 bg-gray-50 text-[14px] text-gray-900",
                  "placeholder:text-gray-400 focus:bg-white transition-colors",
                  "focus-visible:ring-1 focus-visible:ring-gray-900 focus-visible:border-gray-900",
                  errors.email && "border-red-300 focus-visible:ring-red-400 bg-red-50"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[12px] text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-[13px] font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    "h-10 rounded-xl border-gray-200 bg-gray-50 text-[14px] text-gray-900",
                    "placeholder:text-gray-400 focus:bg-white pr-10 transition-colors",
                    "focus-visible:ring-1 focus-visible:ring-gray-900 focus-visible:border-gray-900",
                    errors.password && "border-red-300 focus-visible:ring-red-400"
                  )}
                  {...register("password")}
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
              {errors.password && (
                <p className="text-[12px] text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end -mt-1">
              <Link
                href="/forgot-password"
                className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-10 rounded-xl text-[14px] font-medium text-white",
                "flex items-center justify-center gap-2 transition-colors mt-1",
                "bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Sign up */}
          <Link
            href="/signup"
            className={cn(
              "flex w-full h-10 items-center justify-center rounded-xl border border-gray-200",
              "text-[14px] text-gray-700 font-medium",
              "hover:bg-gray-50 hover:border-gray-300 transition-colors"
            )}
          >
            Create an account
          </Link>

          <p className="text-center text-[11px] text-gray-400 mt-10 leading-relaxed">
            By continuing, you agree to our{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-gray-600 transition-colors">
              Terms
            </span>{" "}
            and{" "}
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
