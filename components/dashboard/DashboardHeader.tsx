import LogoutButton from "@/components/layout/LogoutButton";
import type { DapilItem, UserProfile } from "@/lib/dashboard/types";

type DashboardHeaderProps = {
  profile: UserProfile | null;
  dapil: DapilItem | null;
};

/**
 * Header utama dashboard user.
 */
export default function DashboardHeader({
  profile,
  dapil,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 sm:text-sm">
            User Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Dashboard Dapil VoteLens
          </h1>

          <div className="mt-2 flex flex-col gap-1 text-sm font-semibold text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            <span className="wrap-break-word">
              {profile?.nama ?? profile?.email ?? "User"}
            </span>

            {dapil ? (
              <>
                <span className="hidden text-slate-300 sm:inline">•</span>
                <span className="wrap-break-word">
                  {dapil.kode} - {dapil.nama}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}