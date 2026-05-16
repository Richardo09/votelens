"use client";

import { getSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Tombol logout global VoteLens.
 * Setelah session Supabase dihapus, pengguna diarahkan kembali ke halaman login.
 */
export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * Menghapus session login aktif.
   * Refresh dilakukan agar halaman protected langsung membaca status terbaru.
   */
  async function handleLogout() {
    setIsLoggingOut(true);

    const supabase = getSupabaseClient();
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="rounded-full bg-slate-950 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:translate-y-0"
    >
      {isLoggingOut ? "Keluar..." : "Logout"}
    </button>
  );
}