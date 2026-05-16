/* eslint-disable @next/next/no-img-element */

import {
  formatNumber,
  formatPercent,
  getCandidateInitials,
} from "@/lib/dashboard/format";
import type { CandidateCardItem } from "@/lib/dashboard/types";

type CandidateCardProps = {
  candidate: CandidateCardItem;
  onOpenDetail: (candidate: CandidateCardItem) => void;
};

/**
 * Card kandidat dengan layout mobile yang lebih ringkas.
 */
export default function CandidateCard({
  candidate,
  onOpenDetail,
}: CandidateCardProps) {
  const statusLabel = candidate.statusTerpilih ? "Terpilih" : "Tidak Terpilih";

  const statusClass = candidate.statusTerpilih
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";

  return (
    <article className="group flex min-h-full flex-col rounded-4xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200 sm:p-6">
      {/* Mobile: informasi tetap lengkap, tapi disusun melebar agar tidak terlalu panjang. */}
      <div className="block sm:hidden">
        <div className="flex gap-4">
          <div className="flex w-24 shrink-0 flex-col items-center">
            {candidate.fotoUrl ? (
              <img
                src={candidate.fotoUrl}
                alt={`Foto ${candidate.namaKandidat}`}
                className="max-h-36 w-full object-contain"
              />
            ) : (
              <div className="flex aspect-3/4 w-full items-center justify-center rounded-3xl bg-slate-950 text-center">
                <span className="px-3 text-xl font-black text-white">
                  {getCandidateInitials(candidate.namaKandidat)}
                </span>
              </div>
            )}

            <p className="mt-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
              No. {candidate.nomorUrutKandidat}
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                  Partai {candidate.nomorUrutPartai}
                </p>

                <p className="mt-1 wrap-break-word text-xs font-bold text-slate-500">
                  {candidate.singkatanPartai ?? candidate.namaPartai}
                </p>

                <h3 className="mt-2 wrap-break-word text-base font-black leading-tight text-slate-950">
                  {candidate.namaKandidat}
                </h3>
              </div>

              {candidate.logoPartaiUrl ? (
                <img
                  src={candidate.logoPartaiUrl}
                  alt={`Logo ${candidate.namaPartai}`}
                  className="max-h-10 max-w-11 shrink-0 object-contain"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-slate-950" />
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 px-3 py-2">
                <p className="text-xs font-bold text-slate-400">Total</p>
                <p className="mt-1 text-base font-black text-slate-950">
                  {formatNumber(candidate.totalSuara)}
                </p>
              </div>

              <div className={`rounded-2xl border px-3 py-2 ${statusClass}`}>
                <p className="text-xs font-bold">Status</p>
                <p className="mt-1 text-sm font-black">{statusLabel}</p>
              </div>
            </div>

            <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-bold text-slate-400">
                Peringkat Internal
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">
                #{candidate.peringkatKandidat || "-"} dari{" "}
                {candidate.kursiPartai} kursi
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs font-bold text-slate-400">
              Kelurahan Suara Terbanyak
            </p>

            <p className="mt-1 wrap-break-word text-sm font-black text-slate-950">
              {candidate.kelurahanTertinggi}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {formatNumber(candidate.suaraKelurahanTertinggi)} suara ·{" "}
              {formatPercent(candidate.persenKelurahanTertinggi)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs font-bold text-slate-400">
              Kelurahan Suara Terendah
            </p>

            <p className="mt-1 wrap-break-word text-sm font-black text-slate-950">
              {candidate.kelurahanTerendah}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {formatNumber(candidate.suaraKelurahanTerendah)} suara ·{" "}
              {formatPercent(candidate.persenKelurahanTerendah)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenDetail(candidate)}
            className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-100 transition hover:bg-red-700"
          >
            Detail
          </button>
        </div>
      </div>

      {/* Tablet dan desktop: layout penuh. */}
      <div className="hidden min-h-full flex-col sm:flex">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Partai
            </p>

            <p className="mt-1 text-3xl font-black text-slate-950">
              {candidate.nomorUrutPartai}
            </p>
          </div>

          <div className="flex shrink-0 items-start justify-center">
            {candidate.logoPartaiUrl ? (
              <img
                src={candidate.logoPartaiUrl}
                alt={`Logo ${candidate.namaPartai}`}
                className="max-h-14 max-w-16 object-contain"
              />
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-slate-950" />
            )}
          </div>

          <div className="min-w-0 text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Nama Partai
            </p>

            <h3 className="mt-1 wrap-break-word text-base font-black leading-tight text-slate-950">
              {candidate.namaPartai}
            </h3>

            {candidate.singkatanPartai ? (
              <p className="mt-1 text-sm font-bold text-blue-600">
                {candidate.singkatanPartai}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-7 flex justify-center">
          {candidate.fotoUrl ? (
            <img
              src={candidate.fotoUrl}
              alt={`Foto ${candidate.namaKandidat}`}
              className="max-h-80 w-full max-w-52 object-contain transition group-hover:scale-105"
            />
          ) : (
            <div className="flex aspect-3/4 w-full max-w-52 items-center justify-center rounded-3xl bg-slate-950 text-center shadow-xl shadow-slate-200">
              <span className="px-4 text-3xl font-black text-white">
                {getCandidateInitials(candidate.namaKandidat)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            No Urut Kandidat
          </p>

          <p className="mt-1 text-3xl font-black text-slate-950">
            {candidate.nomorUrutKandidat}
          </p>

          <h3 className="mt-2 wrap-break-word text-xl font-black leading-tight text-slate-950">
            {candidate.namaKandidat}
          </h3>
        </div>

        <div className="mt-6 flex flex-1 flex-col space-y-4">
          <div className="rounded-3xl bg-slate-50 px-5 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Total Suara
            </p>

            <p className="mt-2 text-3xl font-black text-slate-950">
              {formatNumber(candidate.totalSuara)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-bold text-slate-400">
              Kelurahan Suara Terbanyak
            </p>

            <p className="mt-2 wrap-break-word text-sm font-black text-slate-950">
              {candidate.kelurahanTertinggi}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {formatNumber(candidate.suaraKelurahanTertinggi)} suara ·{" "}
              {formatPercent(candidate.persenKelurahanTertinggi)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-bold text-slate-400">
              Kelurahan Suara Terendah
            </p>

            <p className="mt-2 wrap-break-word text-sm font-black text-slate-950">
              {candidate.kelurahanTerendah}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {formatNumber(candidate.suaraKelurahanTerendah)} suara ·{" "}
              {formatPercent(candidate.persenKelurahanTerendah)}
            </p>
          </div>

          <div
            className={
              candidate.statusTerpilih
                ? "rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4"
                : "rounded-3xl border border-red-200 bg-red-50 px-4 py-4"
            }
          >
            <p
              className={
                candidate.statusTerpilih
                  ? "text-xs font-bold text-emerald-600"
                  : "text-xs font-bold text-red-600"
              }
            >
              Status
            </p>

            <p
              className={
                candidate.statusTerpilih
                  ? "mt-2 text-sm font-black text-emerald-700"
                  : "mt-2 text-sm font-black text-red-700"
              }
            >
              {statusLabel}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Peringkat internal partai: #{candidate.peringkatKandidat || "-"}{" "}
              dari {candidate.kursiPartai} kursi
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenDetail(candidate)}
            className="mt-auto w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-100 transition hover:-translate-y-0.5 hover:bg-red-700"
          >
            Detail
          </button>
        </div>
      </div>
    </article>
  );
}