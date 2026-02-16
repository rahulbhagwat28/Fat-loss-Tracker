"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register, user } = useAuth();
  const router = useRouter();

  if (user) {
    router.replace("/feed");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(email, password, name);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "linear-gradient(rgba(30, 61, 47, 0.92), rgba(30, 61, 47, 0.88)), url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-white tracking-tight whitespace-nowrap">
            Fat Loss Fitness Tracker
          </h1>
          <p className="text-slate-300 mt-2">Create your account</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-surface-card border border-surface-border rounded-2xl p-8 shadow-xl"
        >
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent mb-4"
            placeholder="Your name"
          />
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent mb-4"
            placeholder="you@example.com"
          />
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent mb-6"
            placeholder="••••••••"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Sign up"}
          </button>
          <p className="text-center text-slate-400 mt-6 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-400 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
