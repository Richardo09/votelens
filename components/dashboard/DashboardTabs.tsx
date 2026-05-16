import type { TabKey } from "@/lib/dashboard/types";

type DashboardTabsProps = {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

type TabItem = {
  key: TabKey;
  label: string;
  description: string;
};

/**
 * Navigasi tab dashboard untuk tampilan tablet dan desktop.
 */
export default function DashboardTabs({
  activeTab,
  onChangeTab,
}: DashboardTabsProps) {
  const tabList: TabItem[] = [
    {
      key: "partai",
      label: "Partai",
      description: "Rekap partai dan kandidat",
    },
    {
      key: "kecamatan",
      label: "Kecamatan",
      description: "Rekap per kecamatan",
    },
    {
      key: "kelurahan",
      label: "Kelurahan",
      description: "Rekap per kelurahan",
    },
    {
      key: "kandidat-terpilih",
      label: "Kandidat Terpilih",
      description: "Hasil Sainte-Laguë",
    },
  ];

  return (
    <nav className="hidden border-b border-slate-200 bg-white lg:block">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-3 py-4">
          {tabList.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeTab(tab.key)}
                className={
                  isActive
                    ? "rounded-3xl border border-slate-950 bg-slate-950 px-5 py-4 text-left text-white shadow-lg shadow-slate-200 transition"
                    : "rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200"
                }
              >
                <p
                  className={
                    isActive
                      ? "text-sm font-black text-white"
                      : "text-sm font-black text-slate-950"
                  }
                >
                  {tab.label}
                </p>

                <p
                  className={
                    isActive
                      ? "mt-1 text-xs font-semibold text-slate-300"
                      : "mt-1 text-xs font-semibold text-slate-500"
                  }
                >
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}