"use client";

/* eslint-disable @next/next/no-img-element */

import { exportDashboardTable } from "@/lib/dashboard/exportExcel";
import { formatNumber, getDisplayPartyName } from "@/lib/dashboard/format";
import { buildPartyKelurahanMatrix } from "@/lib/dashboard/mappers";
import type {
  KecamatanPartaiKandidatKelurahanItem,
  KecamatanPartyCardItem,
  KelurahanColumn,
} from "@/lib/dashboard/types";

type PartyDetailInlineProps = {
  partai: KecamatanPartyCardItem;
  detailRows: KecamatanPartaiKandidatKelurahanItem[];
  isLoading: boolean;
  errorMessage: string;
  onOpenKelurahan: (kelurahan: KelurahanColumn) => void;
};

/**
 * Detail kandidat partai per kelurahan dalam satu kecamatan.
 */
export default function PartyDetailInline({
  partai,
  detailRows,
  isLoading,
  errorMessage,
  onOpenKelurahan,
}: PartyDetailInlineProps) {
  const matrix = buildPartyKelurahanMatrix(detailRows);

  const topCandidate = matrix.candidateRows
    .slice()
    .sort((a, b) => {
      if (b.totalSuaraKandidat !== a.totalSuaraKandidat) {
        return b.totalSuaraKandidat - a.totalSuaraKandidat;
      }

      return a.noUrutKandidat - b.noUrutKandidat;
    })[0];

  /**
   * Export tabel kandidat x kelurahan ke Excel.
   */
  function handleExportExcel() {
    const headers = [
      "No Urut",
      "Nama Kandidat",
      ...matrix.kelurahanColumns.map((kelurahan) => kelurahan.nama),
      "Total Suara",
      "Peringkat",
    ];

    const rows = matrix.candidateRows.map((candidate) => {
      return [
        candidate.noUrutKandidat,
        candidate.namaKandidat,
        ...matrix.kelurahanColumns.map((kelurahan) => {
          return candidate.suaraPerKelurahan[kelurahan.id] ?? 0;
        }),
        candidate.totalSuaraKandidat,
        candidate.peringkatKandidat,
      ];
    });

    exportDashboardTable({
      fileName: `${partai.kecamatanNama}-${partai.namaPartai}-kelurahan`,
      sheetName: "Detail Partai",
      title: `Detail Partai ${partai.namaPartai}`,
      subtitle: `Kecamatan ${partai.kecamatanNama}`,
      headers,
      rows,
      footerRows: [["Total Suara Kandidat", "", "", matrix.totalSuaraKandidat]],
      columnWidths: [
        12,
        32,
        ...matrix.kelurahanColumns.map(() => 18),
        16,
        12,
      ],
    });
  }

  if (isLoading) {
    return (
      <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-600">
          Memuat detail partai...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-4xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-bold text-red-700">{errorMessage}</p>
      </div>
    );
  }

  if (detailRows.length === 0) {
    return (
      <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6 text-center">
        <h3 className="text-lg font-black text-slate-950">
          Detail partai belum tersedia.
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Belum ada data kandidat dan kelurahan untuk partai ini.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-5 rounded-4xl border border-slate-200 bg-slate-50 p-3 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            Detail Partai
          </p>

          <h3 className="mt-2 wrap-break-word text-xl font-black text-slate-950 sm:text-2xl">
            {partai.nomorUrut}.{" "}
            {getDisplayPartyName(partai.namaPartai, partai.singkatanPartai)}
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Detail kandidat partai per kelurahan di Kecamatan{" "}
            {partai.kecamatanNama}.
          </p>
        </div>

        <div className="rounded-3xl bg-white px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Total Kandidat
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {formatNumber(matrix.totalSuaraKandidat)}
          </p>
        </div>

        <div className="rounded-3xl bg-white px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Kelurahan
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {formatNumber(matrix.kelurahanColumns.length)}
          </p>
        </div>
      </div>

      {topCandidate ? (
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Top Kandidat Partai Ini
          </p>

          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-16 w-14 shrink-0 items-center justify-center bg-white">
              {topCandidate.fotoUrl ? (
                <img
                  src={topCandidate.fotoUrl}
                  alt={`Foto ${topCandidate.namaKandidat}`}
                  className="max-h-16 max-w-14 object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                  {topCandidate.noUrutKandidat}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="wrap-break-word text-sm font-black text-blue-950">
                {topCandidate.noUrutKandidat}. {topCandidate.namaKandidat}
              </p>

              <p className="mt-1 text-xs font-semibold text-blue-700">
                {formatNumber(topCandidate.totalSuaraKandidat)} suara
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-lg font-black text-slate-950">
            Tabel Kandidat x Kelurahan
          </h4>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Di mobile tabel diperkecil. Kolom kandidat dan header kelurahan
            tetap sticky.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="w-fit rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          Save Excel
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white">
        <div className="max-h-168 overflow-auto rounded-3xl">
          <table className="min-w-max border-collapse bg-white">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-40 w-28 min-w-28 max-w-28 border-b border-r border-slate-800 bg-slate-950 px-2 py-2 text-left text-[10px] font-black uppercase tracking-widest text-white sm:w-64 sm:min-w-64 sm:max-w-64 sm:px-4 sm:py-3 sm:text-xs">
                  Kandidat
                </th>

                {matrix.kelurahanColumns.map((kelurahan) => (
                  <th
                    key={kelurahan.id}
                    className="sticky top-0 z-30 w-20 min-w-20 max-w-20 border-b border-slate-800 bg-slate-950 px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-white sm:w-40 sm:min-w-40 sm:max-w-40 sm:px-4 sm:py-3 sm:text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenKelurahan(kelurahan)}
                      className="line-clamp-2 rounded-xl px-1 py-1 text-white underline decoration-white/40 underline-offset-4 transition hover:bg-white/10 hover:decoration-white sm:px-2"
                      title={`Buka detail TPS ${kelurahan.nama}`}
                    >
                      {kelurahan.nama}
                    </button>
                  </th>
                ))}

                <th className="sticky top-0 z-30 w-20 min-w-20 max-w-20 border-b border-slate-800 bg-slate-950 px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-white sm:w-28 sm:min-w-28 sm:max-w-28 sm:px-4 sm:py-3 sm:text-xs">
                  Total
                </th>

                <th className="sticky top-0 z-30 w-16 min-w-16 max-w-16 border-b border-slate-800 bg-slate-950 px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-white sm:w-24 sm:min-w-24 sm:max-w-24 sm:px-4 sm:py-3 sm:text-xs">
                  Rank
                </th>
              </tr>
            </thead>

            <tbody>
              {matrix.candidateRows.map((candidate, index) => {
                const rowBackground =
                  index % 2 === 0 ? "bg-white" : "bg-slate-50";

                return (
                  <tr key={candidate.kandidatId} className={rowBackground}>
                    <td
                      className={`sticky left-0 z-20 w-28 min-w-28 max-w-28 border-b border-r border-slate-100 px-2 py-2 sm:w-64 sm:min-w-64 sm:max-w-64 sm:px-4 sm:py-3 ${rowBackground}`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden h-12 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 sm:flex">
                          {candidate.fotoUrl ? (
                            <img
                              src={candidate.fotoUrl}
                              alt={`Foto ${candidate.namaKandidat}`}
                              className="max-h-12 max-w-10 object-contain"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                              {candidate.noUrutKandidat}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-blue-600 sm:text-xs sm:font-bold sm:uppercase sm:tracking-widest sm:text-slate-400">
                            No. {candidate.noUrutKandidat}
                          </p>

                          <p className="truncate text-[11px] font-black leading-tight text-slate-950 sm:wrap-break-word sm:text-sm">
                            {candidate.namaKandidat}
                          </p>
                        </div>
                      </div>
                    </td>

                    {matrix.kelurahanColumns.map((kelurahan) => (
                      <td
                        key={`${candidate.kandidatId}-${kelurahan.id}`}
                        className="w-20 min-w-20 max-w-20 border-b border-slate-100 px-2 py-2 text-center text-xs font-black text-slate-950 sm:w-40 sm:min-w-40 sm:max-w-40 sm:px-4 sm:py-3 sm:text-sm"
                      >
                        {formatNumber(
                          candidate.suaraPerKelurahan[kelurahan.id] ?? 0
                        )}
                      </td>
                    ))}

                    <td className="w-20 min-w-20 max-w-20 border-b border-slate-100 px-2 py-2 text-center text-xs font-black text-slate-950 sm:w-28 sm:min-w-28 sm:max-w-28 sm:px-4 sm:py-3 sm:text-sm">
                      {formatNumber(candidate.totalSuaraKandidat)}
                    </td>

                    <td className="w-16 min-w-16 max-w-16 border-b border-slate-100 px-2 py-2 text-center text-xs font-black text-slate-950 sm:w-24 sm:min-w-24 sm:max-w-24 sm:px-4 sm:py-3 sm:text-sm">
                      #{candidate.peringkatKandidat}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr>
                <td className="sticky left-0 z-20 w-28 min-w-28 max-w-28 border-r border-slate-800 bg-slate-950 px-2 py-3 text-right text-[10px] font-black text-white sm:w-64 sm:min-w-64 sm:max-w-64 sm:px-4 sm:py-4 sm:text-sm">
                  Total
                </td>

                {matrix.kelurahanColumns.map((kelurahan) => {
                  const totalKelurahan = matrix.candidateRows.reduce(
                    (total, candidate) => {
                      return (
                        total + (candidate.suaraPerKelurahan[kelurahan.id] ?? 0)
                      );
                    },
                    0
                  );

                  return (
                    <td
                      key={`footer-${kelurahan.id}`}
                      className="w-20 min-w-20 max-w-20 bg-slate-950 px-2 py-3 text-center text-xs font-black text-white sm:w-40 sm:min-w-40 sm:max-w-40 sm:px-4 sm:py-4 sm:text-sm"
                    >
                      {formatNumber(totalKelurahan)}
                    </td>
                  );
                })}

                <td className="w-20 min-w-20 max-w-20 bg-slate-950 px-2 py-3 text-center text-xs font-black text-white sm:w-28 sm:min-w-28 sm:max-w-28 sm:px-4 sm:py-4 sm:text-sm">
                  {formatNumber(matrix.totalSuaraKandidat)}
                </td>

                <td className="w-16 min-w-16 max-w-16 bg-slate-950 px-2 py-3 text-white sm:w-24 sm:min-w-24 sm:max-w-24 sm:px-4 sm:py-4" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}