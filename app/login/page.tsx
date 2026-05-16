"use client";

import { getSupabaseClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type UserProfile = {
  id: string;
  email: string;
  nama: string | null;
  role: "admin" | "user";
  dapil_id: number | null;
};

/**
 * Halaman login VoteLens.
 * Login diproses melalui Supabase Auth, lalu user diarahkan berdasarkan role di tabel profiles.
 */
export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Menangani proses login.
   * Setelah auth berhasil, profile dibaca untuk menentukan arah halaman.
   */
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const supabase = getSupabaseClient();

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) {
        throw new Error("Email atau password tidak sesuai.");
      }

      const userId = loginData.user?.id;

      if (!userId) {
        throw new Error("Login berhasil, tetapi data akun tidak ditemukan.");
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, nama, role, dapil_id")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        throw new Error("Akun belum memiliki profile akses VoteLens.");
      }

      const profile = profileData as UserProfile;

      if (profile.role === "admin") {
        router.replace("/admin");
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login gagal. Coba lagi.";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-md">
              VL
            </div>

            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-slate-950">
                VoteLens
              </p>
              <p className="text-xs font-medium text-slate-500">
                Election Data Monitoring
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Kembali
          </Link>
        </div>
      </header>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24">
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-white via-slate-50 to-white" />
        <div className="absolute left-1/2 top-24 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute bottom-20 right-16 -z-10 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />

        <div className="w-full max-w-md">
          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-base font-black text-white shadow-md">
                VL
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
                Masuk ke VoteLens
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Gunakan akun yang sudah terdaftar untuk membuka dashboard sesuai
                role dan akses dapil.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:translate-y-0"
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
              </button>
            </form>

            {errorMessage ? (
              <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4">
                <p className="text-sm font-semibold text-red-700">
                  {errorMessage}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-center">
          <p className="text-sm font-semibold text-slate-500">
            © Richardo Bram Barus
          </p>
        </div>
      </footer>
    </main>
  );
}