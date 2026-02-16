"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace("/feed");
    else router.replace("/login");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <div className="animate-pulse text-brand-400 font-display text-xl">
        Loading...
      </div>
    </div>
  );
}
