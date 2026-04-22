"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post("/api/auth/forgot-password", { email });
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white rounded-xl shadow-md max-w-md w-full p-8 text-center">
                    <h1 className="text-2xl font-semibold text-gray-800 mb-4">Check Your Email</h1>
                    <p className="text-gray-600 mb-6">
                        If an account with that email exists, we have sent a password reset link to it.
                    </p>
                    <Link href="/auth/login" className="w-full block bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md py-2 transition-colors">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-xl shadow-md max-w-md w-full p-8">
                <h1 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
                    Reset Password
                </h1>
                <p className="text-gray-500 text-sm mb-6 text-center">
                    Enter your email to receive a reset link.
                </p>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md py-2 transition-colors mt-2"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <p className="text-center text-gray-500 text-sm mt-5">
                    Remember your password?{" "}
                    <Link
                        href="/auth/login"
                        className="text-indigo-600 font-medium hover:underline cursor-pointer"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}