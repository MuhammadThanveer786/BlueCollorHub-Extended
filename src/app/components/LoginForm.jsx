"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function LoginForm({ switchToSignup }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // 🚨 Set to false so we can handle custom redirection
      });

      if (result?.error) {
        toast.error("Login failed. Please check your credentials.");
        setLoading(false);
      } else {
        // 🧠 BRAIN: Fetch the current session to check the user role
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();

        if (session?.user?.role === "admin") {
          toast.success("Welcome back, Admin!");
          router.push("/admin"); // 🚀 Auto-redirect Admin to the Control Center
        } else {
          toast.success("Logged in successfully!");
          router.push("/dashboard/posts"); // 🚀 Regular users go to the feed
        }
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      // For social login, NextAuth usually handles redirect via callbackUrl
      // But for total control, we keep the callback to a check-route or the main dashboard
      await signIn(provider, { callbackUrl: "/dashboard/posts" });
    } catch {
      toast.error(`Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md max-w-md w-full p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
        Login
      </h1>
      <p className="text-gray-500 text-sm mb-6 text-center">
        Sign in to your account
      </p>

      <div className="flex flex-col gap-3 mb-5">
        <button
          onClick={() => handleSocialLogin("google")}
          disabled={loading}
          className={`flex items-center justify-center gap-2 w-full py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Image src="/Google-icon.webp" alt="Google Logo" width={20} height={20} />
          Sign in with Google
        </button>
      </div>

      <p className="text-gray-400 text-sm text-center mb-4">or login with email</p>

      <form className="flex flex-col" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition mb-4 text-black"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition mb-2 text-black"
        />

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md py-2 transition-colors mt-4 disabled:bg-indigo-400"
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-5">
        Don&apos;t have an account?{" "}
        <span
          className="text-indigo-600 font-medium hover:underline cursor-pointer"
          onClick={switchToSignup || (() => router.push("/signup"))}
        >
          Sign Up
        </span>
      </p>
    </div>
  );
}