"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo } from "react";
import { exportDashboardTable } from "@/lib/dashboard/exportExcel";
import {
  formatNumber,
  formatPercent,
  getCandidateInitials,
  toSafeNumber,
} from "@/lib/dashboard/format";
import type {
  CandidateCardItem,
  CandidateKecamatanSummaryItem,
  CandidateTpsDetailItem,
} from "@/lib/dashboard/types";

type CandidateDetailProps = {
  candidate: CandidateCardItem;
  kecamatanSummaryList: CandidateKecamatanSummaryItem[];
  tpsRows: CandidateTpsDetailItem[];
  selectedKecamatanId: number | null;
  isSummaryLoading: boolean;
  isTpsLoading: boolean;
  summaryErrorMessage: string;
  tpsErrorMessage: string;
  onBack: () => void;
  onSelectKecamatan: (kecamatanId: number) => void;
};

type KelurahanSummaryRow = {
  kelurahanId: number;
  kelurahanNama: string;
  totalTps: number;
  totalSuara: number;
};

/**
 * Detail suara kandidat per kecamatan, kelurahan, dan TPS.
 */
export default function CandidateDetail({
  candidate,
  kecamatanSummaryList,
  tpsRows,
  selectedKecamatanId,
  isSummaryLoading,
  isTpsLoading,
  summaryErrorMessage,
  tpsErrorMessage,
  onBack,
  onSelectKecamatan,
}: CandidateDetailProps) {
  const selectedKecamatan = kecamatanSummaryList.find((item) => {
    return Number(item.kecamatan_id) === selectedKecamatanId;
  });

  const totalRekapKecamatan = useMemo(() => {
    return kecamatanSummaryList.reduce((total, item) => {
      return total + toSafeNumber(item.total_suara);
    }, 0);
  }, [kecamatanSummaryList]);

  const kelurahanSummaryList = useMemo<KelurahanSummaryRow[]>(() => {
    const summaryMap = new Map<number, KelurahanSummaryRow>();

    tpsRows.forEach((row) => {
      const kelurahanId = Number(row.kelurahan_id);
      const current = summaryMap.get(kelurahanId);

      if (current) {
        current.totalTps += 1;
        current.totalSuara += toSafeNumber(row.jumlah_suara);
        return;
      }

      summaryMap.set(kelurahanId, {
        kelurahanId,
        kelurahanNama: row.kelurahan_nama,
        totalTps: 1,
        totalSuara: toSafeNumber(row.jumlah_suara),
      });
    });

    return Array.from(summaryMap.values()).sort((a, b) => {
      return a.kelurahanNama.localeCompare(b.kelurahanNama);
    });
  }, [tpsRows]);

  const totalTpsSelected = useMemo(() => {
    return tpsRows.length;
  }, [tpsRows]);

  const totalSuaraSelectedKecamatan = useMemo(() => {
    return tpsRows.reduce((total, row) => {
      return total + toSafeNumber(row.jumlah_suara);
    }, 0);
  }, [tpsRows]);

  /**
   * Export detail TPS kandidat ke Excel.
   */
  function handleExportTpsExcel() {
    const kecamatanName = selectedKecamatan?.kecamatan_nama ?? "Kecamatan";

    const rows = tpsRows.map((row) => {
      return [
        row.kecamatan_nama,
        row.kelurahan_nama,
        `TPS ${row.nomor_tps}`,
        toSafeNumber(row.jumlah_suara),
      ];
    });

    exportDashboardTable({
      fileName: `${candidate.namaKandidat}-${kecamatanName}-detail-tps`,
      sheetName: "Detail TPS",
      title: `Detail TPS ${candidate.namaKandidat}`,
      subtitle: `${candidate.namaPartai} - ${kecamatanName}`,
      headers: ["Kecamatan", "Kelurahan", "TPS", "Jumlah Suara"],
      rows,
      footerRows: [["Total Suara", "", "", totalSuaraSelectedKecamatan]],
      columnWidths: [22, 24, 14, 16],
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 sm:text-sm">
            Detail Kandidat
          </p>

          <h2 className="mt-2 wrap-break-word text-2xl font-black text-slate-950 sm:text-3xl">
            {candidate.nomorUrutKandidat}. {candidate.namaKandidat}
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {candidate.namaPartai}
            {candidate.singkatanPartai
              ? ` (${candidate.singkatanPartai})`
              : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-fit rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Kembali ke Kandidat
        </button>
      </div>

      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[auto_1fr_1fr_1fr]">
          <div className="flex justify-center lg:justify-start">
            {candidate.fotoUrl ? (
              <img
                src={candidate.fotoUrl}
                alt={`Foto ${candidate.namaKandidat}`}
                className="max-h-80 w-full max-w-48 object-contain"
              />
            ) : (
              <div className="flex aspect-3/4 w-full max-w-48 items-center justify-center rounded-3xl bg-slate-950 text-center">
                <span className="px-4 text-3xl font-black text-white">
                  {getCandidateInitials(candidate.namaKandidat)}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-slate-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Total Suara Kandidat
            </p>

            <p className="mt-2 text-3xl font-black text-slate-950">
              {formatNumber(candidate.totalSuara)}
            </p>
          </div>

          <div
            className={
              candidate.statusTerpilih
                ? "rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4"
                : "rounded-3xl border border-red-200 bg-red-50 px-5 py-4"
            }
          >
            <p
              className={
                candidate.statusTerpilih
                  ? "text-xs font-bold uppercase tracking-widest text-emerald-600"
                  : "text-xs font-bold uppercase tracking-widest text-red-600"
              }
            >
              Status
            </p>

            <p
              className={
                candidate.statusTerpilih
                  ? "mt-2 text-2xl font-black text-emerald-700"
                  : "mt-2 text-2xl font-black text-red-700"
              }
            >
              {candidate.statusTerpilih ? "Terpilih" : "Tidak Terpilih"}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Peringkat #{candidate.peringkatKandidat || "-"} dari{" "}
              {candidate.kursiPartai} kursi partai
            </p>
          </div>

          <div className="rounded-3xl bg-blue-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
              Rekap Kecamatan
            </p>

            <p className="mt-2 text-3xl font-black text-blue-700">
              {formatNumber(totalRekapKecamatan)}
            </p>

            <p className="mt-1 text-xs font-semibold text-blue-600">
              Total dari semua kecamatan
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <h3 className="text-xl font-black text-slate-950">
            Rekap Suara Per Kecamatan
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pilih salah satu kecamatan untuk melihat detail suara kandidat
            sampai tingkat TPS.
          </p>
        </div>

        {isSummaryLoading ? (
          <div className="rounded-3xl bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-600">
              Memuat rekap kecamatan...
            </p>
          </div>
        ) : null}

        {summaryErrorMessage ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-bold text-red-700">
              {summaryErrorMessage}
            </p>
          </div>
        ) : null}

        {!isSummaryLoading && !summaryErrorMessage ? (
          <div className="rounded-3xl border border-slate-200">
            <table className="w-full table-fixed border-collapse bg-white">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="w-[34%] px-2 py-2 text-left text-[10px] font-black uppercase tracking-wide sm:px-4 sm:py-3 sm:text-xs">
                    Kecamatan
                  </th>

                  <th className="w-[23%] px-1.5 py-2 text-center text-[10px] font-black uppercase tracking-wide sm:px-4 sm:py-3 sm:text-xs">
                    Suara
                  </th>

                  <th className="w-[23%] px-1.5 py-2 text-center text-[10px] font-black uppercase tracking-wide sm:px-4 sm:py-3 sm:text-xs">
                    Persen
                  </th>

                  <th className="w-[20%] px-1.5 py-2 text-center text-[10px] font-black uppercase tracking-wide sm:px-4 sm:py-3 sm:text-xs">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {kecamatanSummaryList.map((item, index) => {
                  const kecamatanId = Number(item.kecamatan_id);
                  const totalSuara = toSafeNumber(item.total_suara);
                  const persen =
                    candidate.totalSuara > 0
                      ? (totalSuara / candidate.totalSuara) * 100
                      : 0;

                  const isActive = selectedKecamatanId === kecamatanId;

                  return (
                    <tr
                      key={kecamatanId}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="border-b border-slate-100 px-2 py-2 align-middle sm:px-4 sm:py-3">
                        <p className="line-clamp-2 text-[11px] font-black leading-tight text-slate-950 sm:text-sm">
                          {item.kecamatan_nama}
                        </p>
                      </td>

                      <td className="border-b border-slate-100 px-1.5 py-2 text-center align-middle text-[11px] font-black text-slate-950 sm:px-4 sm:py-3 sm:text-sm">
                        {formatNumber(totalSuara)}
                      </td>

                      <td className="border-b border-slate-100 px-1.5 py-2 text-center align-middle text-[11px] font-black text-slate-950 sm:px-4 sm:py-3 sm:text-sm">
                        {formatPercent(persen)}
                      </td>

                      <td className="border-b border-slate-100 px-1.5 py-2 text-center align-middle sm:px-4 sm:py-3">
                        <button
                          type="button"
                          onClick={() => onSelectKecamatan(kecamatanId)}
                          className={
                            isActive
                              ? "rounded-xl bg-slate-950 px-2 py-1.5 text-[10px] font-black text-white shadow-sm sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs"
                              : "rounded-xl bg-red-600 px-2 py-1.5 text-[10px] font-black text-white shadow-sm transition hover:bg-red-700 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs"
                          }
                        >
                          {isActive ? "Buka" : "TPS"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="bg-slate-950 text-white">
                  <td className="px-2 py-3 text-right text-[11px] font-black sm:px-4 sm:py-4 sm:text-sm">
                    Total
                  </td>

                  <td className="px-1.5 py-3 text-center text-[11px] font-black sm:px-4 sm:py-4 sm:text-sm">
                    {formatNumber(totalRekapKecamatan)}
                  </td>

                  <td className="px-1.5 py-3 text-center text-[11px] font-black sm:px-4 sm:py-4 sm:text-sm">
                    {formatPercent(100)}
                  </td>

                  <td className="px-1.5 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}
      </section>

      {selectedKecamatanId ? (
        <section className="space-y-5">
          <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                  Detail TPS Kandidat
                </p>

                <h3 className="mt-2 wrap-break-word text-2xl font-black text-slate-950">
                  {selectedKecamatan?.kecamatan_nama ?? "Kecamatan"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Detail suara kandidat pada kelurahan dan TPS di kecamatan
                  terpilih.
                </p>
              </div>

              {!isTpsLoading && !tpsErrorMessage && tpsRows.length > 0 ? (
                <button
                  type="button"
                  onClick={handleExportTpsExcel}
                  className="w-fit rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Save Excel
                </button>
              ) : null}
            </div>
          </div>

          {isTpsLoading ? (
            <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-600">
                Memuat detail TPS...
              </p>
            </div>
          ) : null}

          {tpsErrorMessage ? (
            <div className="rounded-4xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-bold text-red-700">
                {tpsErrorMessage}
              </p>
            </div>
          ) : null}

          {!isTpsLoading && !tpsErrorMessage ? (
            <>
              <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl bg-slate-50 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Total Suara
                    </p>

                    <p className="mt-2 text-3xl font-black text-slate-950">
                      {formatNumber(totalSuaraSelectedKecamatan)}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-blue-50 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
                      Kelurahan
                    </p>

                    <p className="mt-2 text-3xl font-black text-blue-700">
                      {formatNumber(kelurahanSummaryList.length)}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
                      TPS
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {formatNumber(totalTpsSelected)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h3 className="text-xl font-black text-slate-950">
                    Rekap Per Kelurahan
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Ringkasan suara kandidat pada kelurahan di kecamatan
                    terpilih.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="min-w-full border-collapse bg-white">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                          No
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                          Kelurahan
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                          TPS
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                          Suara
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {kelurahanSummaryList.map((item, index) => (
                        <tr
                          key={item.kelurahanId}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }
                        >
                          <td className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                            {index + 1}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-950">
                            {item.kelurahanNama}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-center text-sm font-black text-slate-950">
                            {formatNumber(item.totalTps)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-center text-sm font-black text-slate-950">
                            {formatNumber(item.totalSuara)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h3 className="text-xl font-black text-slate-950">
                    Detail Suara Per TPS
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Tabel menampilkan suara kandidat pada setiap TPS.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="min-w-full border-collapse bg-white">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                          No
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                          Kelurahan
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                          TPS
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                          Suara
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {tpsRows.map((row, index) => (
                        <tr
                          key={`${row.tps_id}-${index}`}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }
                        >
                          <td className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                            {index + 1}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-950">
                            {row.kelurahan_nama}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-center text-sm font-black text-slate-950">
                            TPS {row.nomor_tps}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-center text-sm font-black text-slate-950">
                            {formatNumber(toSafeNumber(row.jumlah_suara))}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr className="bg-slate-950 text-white">
                        <td
                          colSpan={3}
                          className="px-4 py-4 text-right text-sm font-black"
                        >
                          Total Suara
                        </td>

                        <td className="px-4 py-4 text-center text-sm font-black">
                          {formatNumber(totalSuaraSelectedKecamatan)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}