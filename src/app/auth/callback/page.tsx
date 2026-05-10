"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlSearch = window.location.search;
    const urlHash = window.location.hash;
    setDebugInfo(`Search: ${urlSearch}\nHash: ${urlHash}`);
    
    const params = new URLSearchParams(urlSearch || urlHash.replace('#', '?'));
    
    // 1. Check for errors from OAuth provider
    if (params.get("error")) {
      setErrorMsg(`${params.get("error")}: ${params.get("error_description")}`);
      return;
    }

    // 2. Explicitly handle PKCE code exchange if present
    const code = params.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          // If the error is about a code already being exchanged, ignore it.
          // Because the supabase client might have auto-exchanged it in the background.
          if (error.message.includes("code already exchanged")) {
             router.push("/settings");
          } else {
             setErrorMsg("Lỗi trao đổi code: " + error.message);
          }
        } else {
          router.push("/settings");
        }
      }).catch(err => {
        setErrorMsg("Ngoại lệ: " + err.message);
      });
      return; // Wait for exchange to finish
    }

    // 3. If no code, listen for implicit flow or pre-existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push("/settings");
      }
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setErrorMsg(error.message);
      } else if (session) {
        router.push("/settings");
      }
      // If no session and no code, we just wait. The debug info will be visible.
    }).catch(err => {
      setErrorMsg(err.message);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
      {errorMsg ? (
        <div className="bg-red-500/20 text-red-200 p-4 rounded-xl border border-red-500/50 max-w-md w-full break-words">
          <h2 className="font-bold mb-2 text-red-400">Lỗi xác thực</h2>
          <p className="text-sm mb-4">{errorMsg}</p>
          <div className="mt-4 text-xs font-mono opacity-70 whitespace-pre-wrap">{debugInfo}</div>
          <button 
            onClick={() => router.push('/settings')}
            className="mt-6 px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors w-full font-medium"
          >
            Quay lại trang cài đặt
          </button>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-white/90 font-medium mb-6">Đang hoàn tất đăng nhập...</p>
          
          <div className="text-[10px] font-mono opacity-30 whitespace-pre-wrap break-all max-w-xs text-center bg-black/20 p-2 rounded-lg">
            {debugInfo || "Đang phân tích URL..."}
          </div>
          
          <button 
            onClick={() => router.push('/settings')}
            className="mt-8 px-4 py-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            Hủy và quay lại
          </button>
        </>
      )}
    </main>
  );
}
