"use client";

import { useMemo } from "react";
import { exportDashboardTable } from "@/lib/dashboard/exportExcel";
import { formatNumber } from "@/lib/dashboard/format";
import type {
  KecamatanPartaiKelurahanTpsItem,
  KecamatanPartyCardItem,
  KelurahanColumn,
} from "@/lib/dashboard/types";

type KelurahanTpsDetailProps = {
  partai: KecamatanPartyCardItem;
  kelurahan: KelurahanColumn;
  detailRows: KecamatanPartaiKelurahanTpsItem[];
  isLoading: boolean;
  errorMessage: string;
  onBack: () => void;
};

type TpsColumn = {
  tpsId: number;
  nomorTps: number;
  totalSuara: number;
};

type CandidateMatrixRow = {
  kandidatId: number;
  noUrutKandidat: number;
  namaKandidat: string;
  totalSuara: number;
  suaraPerTps: Record<number, number>;
};

/**
 * Menampilkan rekap suara kandidat partai per TPS pada satu kelurahan.
 */
export default function KelurahanTpsDetail({
  partai,
  kelurahan,
  detailRows,
  isLoading,
  errorMessage,
  onBack,
}: KelurahanTpsDetailProps) {
  /**
   * Membentuk daftar TPS sebagai kolom tabel.
   */
  const tpsColumns = useMemo<TpsColumn[]>(() => {
    const tpsMap = new Map<number, TpsColumn>();

    detailRows.forEach((row) => {
      const tpsId = Number(row.tps_id);
      const jumlahSuara = Number(row.jumlah_suara ?? 0);
      const current = tpsMap.get(tpsId);

      if (current) {
        current.totalSuara += jumlahSuara;
        return;
      }

      tpsMap.set(tpsId, {
        tpsId,
        nomorTps: row.nomor_tps,
        totalSuara: jumlahSuara,
      });
    });

    return Array.from(tpsMap.values()).sort((a, b) => {
      return a.nomorTps - b.nomorTps;
    });
  }, [detailRows]);

  /**
   * Membentuk baris kandidat beserta distribusi suara pada setiap TPS.
   */
  const candidateRows = useMemo<CandidateMatrixRow[]>(() => {
    const candidateMap = new Map<number, CandidateMatrixRow>();

    detailRows.forEach((row) => {
      const kandidatId = Number(row.kandidat_id);
      const tpsId = Number(row.tps_id);
      const jumlahSuara = Number(row.jumlah_suara ?? 0);
      const current = candidateMap.get(kandidatId);

      if (current) {
        current.totalSuara += jumlahSuara;
        current.suaraPerTps[tpsId] =
          (current.suaraPerTps[tpsId] ?? 0) + jumlahSuara;
        return;
      }

      candidateMap.set(kandidatId, {
        kandidatId,
        noUrutKandidat: row.no_urut_kandidat,
        namaKandidat: row.nama_kandidat,
        totalSuara: jumlahSuara,
        suaraPerTps: {
          [tpsId]: jumlahSuara,
        },
      });
    });

    return Array.from(candidateMap.values()).sort((a, b) => {
      return a.noUrutKandidat - b.noUrutKandidat;
    });
  }, [detailRows]);

  /**
   * Menghitung total suara kandidat dari seluruh baris kandidat.
   */
  const totalSuaraKandidat = useMemo(() => {
    return candidateRows.reduce((total, candidate) => {
      return total + candidate.totalSuara;
    }, 0);
  }, [candidateRows]);

  /**
   * Mengambil suara partai murni dari data detail atau fallback dari rekap partai.
   */
  const suaraPartaiMurni = useMemo(() => {
    const firstRow = detailRows[0];

    if (firstRow) {
      return Number(firstRow.suara_partai_murni_kelurahan ?? 0);
    }

    return Number(partai.suaraPartai ?? 0);
  }, [detailRows, partai.suaraPartai]);

  const totalSuaraPartai = totalSuaraKandidat + suaraPartaiMurni;

  /**
   * Mengekspor matriks kandidat dan TPS ke Excel.
   */
  function handleExportExcel() {
    const headers = [
      "No",
      "Kandidat",
      ...tpsColumns.map((tps) => `TPS ${tps.nomorTps}`),
      "Total Kandidat",
    ];

    const rows = candidateRows.map((candidate) => {
      return [
        candidate.noUrutKandidat,
        candidate.namaKandidat,
        ...tpsColumns.map((tps) => {
          return candidate.suaraPerTps[tps.tpsId] ?? 0;
        }),
        candidate.totalSuara,
      ];
    });

    exportDashboardTable({
      fileName: `${kelurahan.nama}-${partai.namaPartai}-detail-tps`,
      sheetName: "Detail TPS",
      title: `Detail TPS ${partai.namaPartai}`,
      subtitle: `Kelurahan ${kelurahan.nama}`,
      headers,
      rows,
      footerRows: [
        [
          "",
          "Total Per TPS",
          ...tpsColumns.map((tps) => tps.totalSuara),
          totalSuaraKandidat,
        ],
        [
          "",
          "Suara Partai Murni",
          ...tpsColumns.map(() => ""),
          suaraPartaiMurni,
        ],
        ["", "Total Partai", ...tpsColumns.map(() => ""), totalSuaraPartai],
      ],
      columnWidths: [10, 30, ...tpsColumns.map(() => 12), 18],
    });
  }

  if (isLoading) {
    return (
      <section className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-600">
          Memuat detail TPS...
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-4xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-bold text-red-700">{errorMessage}</p>
      </section>
    );
  }

  if (detailRows.length === 0) {
    return (
      <section className="rounded-4xl border border-slate-200 bg-slate-50 p-6 text-center">
        <h3 className="text-lg font-black text-slate-950">
          Detail TPS belum tersedia.
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Belum ada data TPS untuk partai ini pada kelurahan yang dipilih.
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white"
        >
          Tutup Detail
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-4xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            Detail TPS
          </p>

          <h3 className="mt-2 wrap-break-word text-xl font-black text-slate-950 sm:text-2xl">
            {partai.nomorUrut}. {partai.namaPartai}
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Kelurahan {kelurahan.nama}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
          >
            Save Excel
          </button>

          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            TPS Terbaca
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {formatNumber(tpsColumns.length)}
          </p>
        </div>

        <div className="rounded-3xl bg-blue-50 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
            Suara Kandidat
          </p>

          <p className="mt-2 text-3xl font-black text-blue-700">
            {formatNumber(totalSuaraKandidat)}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-50 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Suara Partai
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {formatNumber(suaraPartaiMurni)}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950 px-4 py-4 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
            Total Partai
          </p>

          <p className="mt-2 text-3xl font-black">
            {formatNumber(totalSuaraPartai)}
          </p>
        </div>
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4">
          <h4 className="text-lg font-black text-slate-950">
            Tabel Suara Kandidat x TPS
          </h4>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Nama kandidat berada di sisi kiri, nomor TPS berada di bagian atas.
            Geser tabel ke kanan untuk melihat seluruh TPS.
          </p>
        </div>

        <div className="max-w-full overflow-auto rounded-3xl border border-slate-200">
          <table className="min-w-max border-collapse bg-white">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="sticky left-0 top-0 z-40 w-52 bg-slate-950 px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide sm:w-64 sm:px-4 sm:text-xs">
                  Kandidat
                </th>

                {tpsColumns.map((tps) => (
                  <th
                    key={tps.tpsId}
                    className="sticky top-0 z-30 min-w-20 bg-slate-950 px-3 py-3 text-center text-[10px] font-black uppercase tracking-wide sm:min-w-24 sm:px-4 sm:text-xs"
                  >
                    TPS {tps.nomorTps}
                  </th>
                ))}

                <th className="sticky top-0 z-30 min-w-28 bg-slate-950 px-3 py-3 text-center text-[10px] font-black uppercase tracking-wide sm:px-4 sm:text-xs">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {candidateRows.map((candidate, index) => (
                <tr
                  key={candidate.kandidatId}
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  <td className="sticky left-0 z-20 border-b border-slate-100 bg-inherit px-3 py-3 sm:px-4">
                    <p className="text-[11px] font-black leading-tight text-slate-950 sm:text-sm">
                      {candidate.noUrutKandidat}. {candidate.namaKandidat}
                    </p>
                  </td>

                  {tpsColumns.map((tps) => (
                    <td
                      key={`${candidate.kandidatId}-${tps.tpsId}`}
                      className="border-b border-slate-100 px-3 py-3 text-center text-sm font-black text-slate-950 sm:px-4"
                    >
                      {formatNumber(candidate.suaraPerTps[tps.tpsId] ?? 0)}
                    </td>
                  ))}

                  <td className="border-b border-slate-100 px-3 py-3 text-center text-sm font-black text-slate-950 sm:px-4">
                    {formatNumber(candidate.totalSuara)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="bg-slate-950 text-white">
                <td className="sticky left-0 z-20 bg-slate-950 px-3 py-3 text-right text-xs font-black sm:px-4 sm:text-sm">
                  Total Per TPS
                </td>

                {tpsColumns.map((tps) => (
                  <td
                    key={`tps-total-${tps.tpsId}`}
                    className="px-3 py-3 text-center text-xs font-black sm:px-4 sm:text-sm"
                  >
                    {formatNumber(tps.totalSuara)}
                  </td>
                ))}

                <td className="px-3 py-3 text-center text-xs font-black sm:px-4 sm:text-sm">
                  {formatNumber(totalSuaraKandidat)}
                </td>
              </tr>

              <tr className="bg-slate-900 text-white">
                <td className="sticky left-0 z-20 bg-slate-900 px-3 py-3 text-right text-xs font-black sm:px-4 sm:text-sm">
                  Suara Partai
                </td>

                {tpsColumns.map((tps) => (
                  <td
                    key={`party-empty-${tps.tpsId}`}
                    className="px-3 py-3 text-center text-xs font-black sm:px-4 sm:text-sm"
                  >
                    -
                  </td>
                ))}

                <td className="px-3 py-3 text-center text-xs font-black sm:px-4 sm:text-sm">
                  {formatNumber(suaraPartaiMurni)}
                </td>
              </tr>

              <tr className="bg-slate-950 text-white">
                <td className="sticky left-0 z-20 bg-slate-950 px-3 py-3 text-right text-xs font-black sm:px-4 sm:text-sm">
                  Total Partai
                </td>

                {tpsColumns.map((tps) => (
                  <td
                    key={`party-total-empty-${tps.tpsId}`}
                    className="px-3 py-3 text-center text-xs font-black sm:px-4 sm:text-sm"
                  >
                    -
                  </td>
                ))}

                <td className="px-3 py-3 text-center text-xs font-black sm:px-4 sm:text-sm">
                  {formatNumber(totalSuaraPartai)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </section>
  );
}