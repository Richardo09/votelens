/* eslint-disable @next/next/no-img-element */

import { getPartyColor, getReadableTextColor } from "@/lib/dashboard/colors";
import {
  formatNumber,
  getCandidateInitials,
  getDisplayPartyName,
  getPartyInitials,
} from "@/lib/dashboard/format";
import type { ElectedCandidateCardItem } from "@/lib/dashboard/types";

type ElectedCandidateCardProps = {
  candidate: ElectedCandidateCardItem;
};

/**
 * Card kandidat terpilih berdasarkan urutan kursi Sainte-Laguë.
 */
export default function ElectedCandidateCard({
  candidate,
}: ElectedCandidateCardProps) {
  const partyColor = getPartyColor({
    nomorUrut: candidate.nomorUrutPartai,
    namaPartai: candidate.namaPartai,
    singkatanPartai: candidate.singkatanPartai,
  });

  const textColor = getReadableTextColor(partyColor);

  return (
    <article className="flex min-h-full flex-col rounded-4xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl text-center shadow-lg shadow-slate-200"
          style={{
            backgroundColor: partyColor,
            color: textColor,
          }}
        >
          <span className="text-xl font-black">
            #{candidate.urutanKursi}
          </span>
        </div>

        <div className="min-w-0 text-right">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Kursi Sainte-Laguë
          </p>

          <p className="mt-1 text-sm font-black text-slate-950">
            Pembagi {candidate.angkaPembagi}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Nilai: {formatNumber(candidate.nilaiSainteLague)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center">
          {candidate.logoUrl ? (
            <img
              src={candidate.logoUrl}
              alt={`Logo ${candidate.namaPartai}`}
              className="max-h-14 max-w-14 object-contain"
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-xs font-black"
              style={{
                backgroundColor: partyColor,
                color: textColor,
              }}
            >
              {getPartyInitials(
                candidate.namaPartai,
                candidate.singkatanPartai
              )}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Partai
          </p>

          <h3 className="mt-1 wrap-break-word text-sm font-black leading-tight text-slate-950">
            {candidate.nomorUrutPartai}.{" "}
            {getDisplayPartyName(
              candidate.namaPartai,
              candidate.singkatanPartai
            )}
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Total partai: {formatNumber(candidate.totalSuaraPartai)} suara
          </p>
        </div>
      </div>

      <div className="mt-7 flex justify-center">
        {candidate.fotoUrl ? (
          <img
            src={candidate.fotoUrl}
            alt={`Foto ${candidate.namaKandidat}`}
            className="max-h-80 w-full max-w-52 object-contain"
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
          Kandidat Terpilih
        </p>

        <p className="mt-1 text-3xl font-black text-slate-950">
          {candidate.noUrutKandidat}
        </p>

        <h3 className="mt-2 wrap-break-word text-xl font-black leading-tight text-slate-950">
          {candidate.namaKandidat}
        </h3>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs font-bold text-slate-400">Suara Kandidat</p>

          <p className="mt-2 text-lg font-black text-slate-950">
            {formatNumber(candidate.totalSuaraKandidat)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs font-bold text-slate-400">Peringkat Partai</p>

          <p className="mt-2 text-lg font-black text-slate-950">
            #{candidate.peringkatKandidatPartai}
          </p>
        </div>
      </div>
    </article>
  );
}