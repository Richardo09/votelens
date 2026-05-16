/* eslint-disable @next/next/no-img-element */

import { getPartyColor, getReadableTextColor } from "@/lib/dashboard/colors";
import { formatNumber, getPartyInitials } from "@/lib/dashboard/format";
import type { PartyCardItem } from "@/lib/dashboard/types";

type PartyCardProps = {
  partai: PartyCardItem;
  onOpenCandidates: (partai: PartyCardItem) => void;
};

/**
 * Card partai pada tab Partai.
 */
export default function PartyCard({
  partai,
  onOpenCandidates,
}: PartyCardProps) {
  const partyColor = getPartyColor({
    nomorUrut: partai.nomorUrut,
    namaPartai: partai.nama,
    singkatanPartai: partai.singkatan,
  });

  const textColor = getReadableTextColor(partyColor);

  return (
    <article className="group flex min-h-full flex-col rounded-4xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            No Urut
          </p>

          <p className="mt-1 text-4xl font-black text-slate-950">
            {partai.nomorUrut}
          </p>
        </div>

        <div className="min-w-0 text-right">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Partai
          </p>

          <h3 className="mt-1 wrap-break-word text-lg font-black leading-tight text-slate-950">
            {partai.nama}
          </h3>

          {partai.singkatan ? (
            <p className="mt-1 text-sm font-bold text-blue-600">
              {partai.singkatan}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center py-7">
        {partai.logoUrl ? (
          <img
            src={partai.logoUrl}
            alt={`Logo ${partai.nama}`}
            className="max-h-32 max-w-44 object-contain transition group-hover:scale-105 sm:max-h-36"
          />
        ) : (
          <div
            className="flex h-28 w-28 items-center justify-center rounded-3xl text-center shadow-xl shadow-slate-200 transition group-hover:scale-105"
            style={{
              backgroundColor: partyColor,
              color: textColor,
            }}
          >
            <span className="px-3 text-2xl font-black">
              {getPartyInitials(partai.nama, partai.singkatan)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto space-y-4">
        <div className="rounded-3xl bg-slate-50 px-5 py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Total Suara
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {formatNumber(partai.totalSuara)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-bold text-slate-400">Suara Partai</p>

            <p className="mt-2 text-lg font-black text-slate-950">
              {formatNumber(partai.suaraPartai)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-bold text-slate-400">Suara Kandidat</p>

            <p className="mt-2 text-lg font-black text-slate-950">
              {formatNumber(partai.suaraKandidat)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-bold text-slate-400">Peringkat</p>

            <p className="mt-2 text-xl font-black text-slate-950">
              #{partai.peringkat}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-bold text-slate-400">Kursi</p>

            <p className="mt-2 text-xl font-black text-slate-950">
              {formatNumber(partai.kursiPartai)}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs font-bold text-slate-400">
            Kandidat Terpilih
          </p>

          <p className="mt-2 text-sm font-black text-slate-950">
            {formatNumber(partai.jumlahKandidatTerpilih)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenCandidates(partai)}
          className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-100 transition hover:-translate-y-0.5 hover:bg-red-700"
        >
          Kandidat
        </button>
      </div>
    </article>
  );
}