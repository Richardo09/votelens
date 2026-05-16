"use client";

import { useState } from "react";
import type { TabKey } from "@/lib/dashboard/types";

type DashboardMobileMenuProps = {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

type MobileTabItem = {
  key: TabKey;
  label: string;
  description: string;
};

/**
 * Navigasi dashboard untuk tampilan mobile.
 */
export default function DashboardMobileMenu({
  activeTab,
  onChangeTab,
}: DashboardMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tabList: MobileTabItem[] = [
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

  const activeTabLabel =
    tabList.find((tab) => tab.key === activeTab)?.label ?? "Menu";

  /**
   * Mengganti tab aktif lalu menutup menu mobile.
   */
  function handleSelectTab(tab: TabKey) {
    onChangeTab(tab);
    setIsOpen(false);
  }

  return (
    <section className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            Menu Dashboard
          </p>

          <p className="mt-1 truncate text-base font-black text-slate-950">
            {activeTabLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-200"
          aria-label="Buka menu dashboard"
        >
          <span className="h-0.5 w-5 rounded-full bg-white" />
          <span className="h-0.5 w-5 rounded-full bg-white" />
          <span className="h-0.5 w-5 rounded-full bg-white" />
        </button>
      </div>

      {isOpen ? (
        <div className="mt-3 grid gap-2 rounded-4xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200">
          {tabList.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSelectTab(tab.key)}
                className={
                  isActive
                    ? "rounded-3xl border border-slate-950 bg-slate-950 px-4 py-3 text-left text-white"
                    : "rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-950 transition hover:bg-slate-50"
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
      ) : null}
    </section>
  );
}