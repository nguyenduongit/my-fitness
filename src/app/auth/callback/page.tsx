"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase client automatically processes the URL query parameters or hash,
    // exchanges the code for a session, and saves it in local storage.
    
    // Listen for the signed in event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        router.push("/settings");
      }
    });

    // Check if we already have a session (in case the event fired before we listened)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/settings");
      } else {
        // Fallback: wait a bit for the automatic exchange to finish, then go back to settings
        // If there's an error in the URL (like ?error=access_denied), it will also just return to settings
        setTimeout(() => {
          router.push("/settings");
        }, 3000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
      <p className="text-white/70 font-medium">Đang hoàn tất đăng nhập...</p>
    </main>
  );
}
