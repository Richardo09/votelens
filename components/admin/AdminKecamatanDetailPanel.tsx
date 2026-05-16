"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type DapilInfo = {
  id: number;
  kode: string;
  nama: string;
  jumlah_kursi: number | null;
};

type KecamatanInfo = {
  id: number;
  nama: string;
};

type AdminKelurahanSummary = {
  kelurahanId: number;
  namaKelurahan: string;
  totalTps: number;
  suaraPartai: number;
  suaraKandidat: number;
  totalSuara: number;
  persenSuara: number;
};

type AdminKecamatanDetailResponse = {
  success: boolean;
  message?: string;
  dapil: DapilInfo;
  kecamatan: KecamatanInfo;
  totalKelurahan: number;
  totalTps: number;
  totalSuara: number;
  kelurahanSummaryList: AdminKelurahanSummary[];
};

type AdminKecamatanDetailPanelProps = {
  dapilId: number;
  kecamatanId: number;
  onClose: () => void;
};

/**
 * Mengubah angka ke format lokal Indonesia.
 */
function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * Mengubah nilai persentase ke format tampilan ringkas.
 */
function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

/**
 * Menampilkan detail kecamatan admin dalam bentuk rekap kelurahan.
 */
export default function AdminKecamatanDetailPanel({
  dapilId,
  kecamatanId,
  onClose,
}: AdminKecamatanDetailPanelProps) {
  const [detailData, setDetailData] =
    useState<AdminKecamatanDetailResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Mengambil access token admin aktif untuk request API admin.
   */
  async function getAccessToken() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
      throw new Error("Sesi login admin tidak ditemukan.");
    }

    return data.session.access_token;
  }

  /**
   * Memuat detail kecamatan berdasarkan dapil dan kecamatan aktif.
   */
  const loadKecamatanDetail = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `/api/admin/kecamatan/detail?dapilId=${dapilId}&kecamatanId=${kecamatanId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = (await response.json()) as AdminKecamatanDetailResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memuat detail kecamatan.");
      }

      setDetailData(result);
      setErrorMessage("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memuat detail kecamatan.";

      setDetailData(null);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [dapilId, kecamatanId]);

  /**
   * Memuat data saat panel detail pertama kali dibuka.
   *
   * Timer digunakan agar fungsi yang memicu setState tidak dipanggil langsung
   * pada fase effect utama.
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadKecamatanDetail();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadKecamatanDetail]);

  /**
   * Mengurutkan kelurahan berdasarkan nama agar tampilan konsisten.
   */
  const sortedKelurahanList = useMemo(() => {
    return (detailData?.kelurahanSummaryList ?? []).slice().sort((a, b) => {
      return a.namaKelurahan.localeCompare(b.namaKelurahan);
    });
  }, [detailData]);

  const maxKelurahanVote = useMemo(() => {
    return Math.max(
      1,
      ...sortedKelurahanList.map((kelurahan) => {
        return kelurahan.totalSuara;
      })
    );
  }, [sortedKelurahanList]);

  return (
    <section className="rounded-4xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            Detail Kecamatan
          </p>

          <h3 className="mt-2 text-2xl font-black text-slate-950">
            {detailData?.kecamatan.nama ?? "Memuat kecamatan..."}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Detail ini menampilkan rekap kelurahan berdasarkan dapil dan
            kecamatan yang dipilih admin.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadKecamatanDetail}
            disabled={isLoading}
            className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Memuat..." : "Muat Ulang"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Tutup Detail
          </button>
        </div>
      </div>

      {errorMessage ? (
        <section className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-red-700">{errorMessage}</p>
        </section>
      ) : null}

      {isLoading ? (
        <section className="mt-5 rounded-3xl border border-blue-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-600">
            Memuat detail kecamatan...
          </p>
        </section>
      ) : null}

      {!isLoading && detailData ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-blue-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Dapil
              </p>

              <p className="mt-2 text-lg font-black text-slate-950">
                {detailData.dapil.kode}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-600">
                {detailData.dapil.nama}
              </p>
            </article>

            <article className="rounded-3xl border border-blue-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                Kelurahan
              </p>

              <p className="mt-2 text-3xl font-black text-slate-950">
                {formatNumber(detailData.totalKelurahan)}
              </p>
            </article>

            <article className="rounded-3xl border border-blue-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                TPS
              </p>

              <p className="mt-2 text-3xl font-black text-slate-950">
                {formatNumber(detailData.totalTps)}
              </p>
            </article>

            <article className="rounded-3xl border border-slate-950 bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                Total Suara
              </p>

              <p className="mt-2 text-3xl font-black">
                {formatNumber(detailData.totalSuara)}
              </p>
            </article>
          </div>

          <section className="mt-5 rounded-4xl border border-blue-200 bg-white p-5">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                Rekap Kelurahan
              </p>

              <h4 className="mt-2 text-xl font-black text-slate-950">
                Perolehan Suara per Kelurahan
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Total suara merupakan gabungan suara partai murni dan suara
                kandidat pada setiap kelurahan.
              </p>
            </div>

            <div className="space-y-3 lg:hidden">
              {sortedKelurahanList.map((kelurahan) => {
                const width = Math.max(
                  4,
                  (kelurahan.totalSuara / maxKelurahanVote) * 100
                );

                return (
                  <article
                    key={kelurahan.kelurahanId}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                          Kelurahan
                        </p>

                        <h5 className="mt-1 wrap-break-word text-base font-black text-slate-950">
                          {kelurahan.namaKelurahan}
                        </h5>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-lg font-black text-slate-950">
                          {formatNumber(kelurahan.totalSuara)}
                        </p>

                        <p className="text-xs font-bold text-blue-600">
                          {formatPercent(kelurahan.persenSuara)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-slate-950"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-white px-3 py-2">
                        <p className="text-xs font-bold text-slate-400">TPS</p>

                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatNumber(kelurahan.totalTps)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-3 py-2">
                        <p className="text-xs font-bold text-slate-400">
                          Partai
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatNumber(kelurahan.suaraPartai)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-3 py-2">
                        <p className="text-xs font-bold text-slate-400">
                          Kandidat
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatNumber(kelurahan.suaraKandidat)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-3 py-2">
                        <p className="text-xs font-bold text-slate-400">
                          Total
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatNumber(kelurahan.totalSuara)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
              <table className="min-w-full border-collapse bg-white">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                      Kelurahan
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                      TPS
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                      Suara Partai
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                      Suara Kandidat
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                      Total
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                      Persen
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedKelurahanList.map((kelurahan, index) => (
                    <tr
                      key={kelurahan.kelurahanId}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="text-sm font-black text-slate-950">
                          {kelurahan.namaKelurahan}
                        </p>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                        {formatNumber(kelurahan.totalTps)}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                        {formatNumber(kelurahan.suaraPartai)}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                        {formatNumber(kelurahan.suaraKandidat)}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                        {formatNumber(kelurahan.totalSuara)}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                        {formatPercent(kelurahan.persenSuara)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedKelurahanList.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Belum ada kelurahan pada kecamatan ini.
                </p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );
}