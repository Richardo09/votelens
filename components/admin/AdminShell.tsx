"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import AdminCandidateManagement from "./AdminCandidateManagement";
import AdminDapilDataSection from "./AdminDapilDataSection";
import AdminTpsManagement from "./AdminTpsManagement";
import AdminUserManagement from "./AdminUserManagement";
import AdminVoteInputManagement from "./AdminVoteInputManagement";

type AdminProfile = {
  id: string;
  email: string;
  nama: string | null;
  role: "admin" | "user";
  dapil_id: number | null;
};

type AdminSectionKey = "data" | "kandidat" | "tps" | "votes" | "users";

type AdminMenuItem = {
  key: AdminSectionKey;
  label: string;
  title: string;
  description: string;
};

/**
 * Shell utama untuk area administrasi VoteLens.
 *
 * Komponen ini bertanggung jawab untuk:
 * - Memvalidasi akses admin.
 * - Menyediakan navigasi fitur admin.
 * - Menangani proses logout admin.
 */
export default function AdminShell() {
  const router = useRouter();

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [activeSection, setActiveSection] =
    useState<AdminSectionKey>("data");

  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const adminMenuList: AdminMenuItem[] = [
    {
      key: "data",
      label: "Data Semua Dapil",
      title: "Lihat Data Semua Dapil",
      description:
        "Admin dapat memilih dapil dan melihat ringkasan data lintas dapil.",
    },
    {
      key: "kandidat",
      label: "Input Kandidat",
      title: "Input Kandidat per Dapil",
      description:
        "Admin dapat menambahkan, mengubah, dan menghapus kandidat berdasarkan dapil.",
    },
    {
      key: "tps",
      label: "Jumlah TPS",
      title: "Input Jumlah TPS",
      description:
        "Admin dapat mengatur jumlah TPS berdasarkan kecamatan dan kelurahan.",
    },
    {
      key: "votes",
      label: "Input Suara",
      title: "Input Suara per TPS",
      description:
        "Admin dapat mengisi suara partai dan suara kandidat dalam bentuk tabel.",
    },
    {
      key: "users",
      label: "User Management",
      title: "Kelola User",
      description:
        "Admin dapat menambahkan user, menghapus user, dan mengatur akses dapil.",
    },
  ];

  /**
   * Memvalidasi sesi login dan memastikan user aktif memiliki role admin.
   *
   * Timer digunakan agar proses yang memicu pembaruan state tidak dipanggil
   * langsung pada fase effect utama.
   */
  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      async function validateAdminAccess() {
        const supabase = getSupabaseClient();

        try {
          const { data: userData, error: userError } =
            await supabase.auth.getUser();

          if (userError || !userData.user) {
            router.replace("/login");
            return;
          }

          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, email, nama, role, dapil_id")
            .eq("id", userData.user.id)
            .single();

          if (profileError || !profileData) {
            throw new Error("Profile user tidak ditemukan.");
          }

          const currentProfile = profileData as AdminProfile;

          if (currentProfile.role !== "admin") {
            router.replace("/dashboard");
            return;
          }

          if (!isMounted) {
            return;
          }

          setProfile(currentProfile);
          setErrorMessage("");
        } catch (error) {
          if (!isMounted) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Gagal memvalidasi akses admin.";

          setErrorMessage(message);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      void validateAdminAccess();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [router]);

  /**
   * Menghapus sesi login admin dan mengarahkan kembali ke halaman login.
   */
  async function handleLogout() {
    const supabase = getSupabaseClient();

    setIsSigningOut(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      router.replace("/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal logout dari admin.";

      setErrorMessage(message);
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-4xl border border-slate-200 bg-slate-50 p-8">
          <p className="text-sm font-semibold text-slate-600">
            Memvalidasi akses admin...
          </p>
        </section>
      </main>
    );
  }

  if (errorMessage && !profile) {
    return (
      <main className="min-h-screen bg-white px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-4xl border border-red-200 bg-red-50 p-8">
          <p className="text-sm font-bold text-red-700">{errorMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              VoteLens Admin
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Panel Admin
            </h1>

            <p className="mt-2 text-sm font-semibold text-slate-600">
              Mengelola data dapil, kandidat, TPS, suara, dan user VoteLens.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Login sebagai
              </p>

              <p className="mt-1 text-sm font-black text-slate-950">
                {profile?.nama ?? profile?.email ?? "Admin"}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-blue-600">
                Admin
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              disabled={isSigningOut}
              className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-left shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-red-500">
                Akun
              </p>

              <p className="mt-1 text-sm font-black text-red-700">
                {isSigningOut ? "Logout..." : "Logout"}
              </p>
            </button>
          </div>
        </section>
      </header>

      {errorMessage ? (
        <section className="border-b border-red-100 bg-red-50 px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold text-red-700">{errorMessage}</p>
          </div>
        </section>
      ) : null}

      <section className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <nav className="mx-auto grid max-w-7xl gap-3 md:grid-cols-2 xl:grid-cols-5">
          {adminMenuList.map((menu) => {
            const isActive = activeSection === menu.key;

            return (
              <button
                key={menu.key}
                type="button"
                onClick={() => setActiveSection(menu.key)}
                className={
                  isActive
                    ? "rounded-4xl border border-slate-950 bg-slate-950 p-5 text-left text-white shadow-lg shadow-slate-200 transition"
                    : "rounded-4xl border border-slate-200 bg-white p-5 text-left text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200"
                }
              >
                <p
                  className={
                    isActive
                      ? "text-xs font-black uppercase tracking-widest text-slate-300"
                      : "text-xs font-black uppercase tracking-widest text-blue-600"
                  }
                >
                  {menu.label}
                </p>

                <h2
                  className={
                    isActive
                      ? "mt-3 text-lg font-black text-white"
                      : "mt-3 text-lg font-black text-slate-950"
                  }
                >
                  {menu.title}
                </h2>

                <p
                  className={
                    isActive
                      ? "mt-2 text-sm leading-6 text-slate-300"
                      : "mt-2 text-sm leading-6 text-slate-600"
                  }
                >
                  {menu.description}
                </p>
              </button>
            );
          })}
        </nav>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activeSection === "data" ? <AdminDapilDataSection /> : null}

        {activeSection === "kandidat" ? <AdminCandidateManagement /> : null}

        {activeSection === "tps" ? <AdminTpsManagement /> : null}

        {activeSection === "votes" ? <AdminVoteInputManagement /> : null}

        {activeSection === "users" ? <AdminUserManagement /> : null}
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