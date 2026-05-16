/* eslint-disable @next/next/no-img-element */

import { formatNumber, getCandidateInitials } from "@/lib/dashboard/format";
import type { KelurahanCardItem } from "@/lib/dashboard/types";

type KelurahanCardProps = {
  kelurahan: KelurahanCardItem;
  onOpenDetail: (kelurahan: KelurahanCardItem) => void;
};

/**
 * Card ringkasan kelurahan berdasarkan kecamatan yang dipilih.
 */
export default function KelurahanCard({
  kelurahan,
  onOpenDetail,
}: KelurahanCardProps) {
  const kandidatPartaiLabel = kelurahan.kandidatUnggul?.namaPartai
    ? kelurahan.kandidatUnggul.singkatanPartai
      ? `${kelurahan.kandidatUnggul.namaPartai} (${kelurahan.kandidatUnggul.singkatanPartai})`
      : kelurahan.kandidatUnggul.namaPartai
    : null;

  return (
    <article className="group rounded-4xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200 sm:p-6">
      {/* Mobile dibuat padat agar daftar kelurahan tetap nyaman dibaca. */}
      <div className="block sm:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Kelurahan
            </p>

            <h3 className="mt-2 wrap-break-word text-xl font-black leading-tight text-slate-950">
              {kelurahan.nama}
            </h3>

            <p className="mt-1 wrap-break-word text-xs font-bold text-slate-500">
              {kelurahan.kecamatanNama}
            </p>
          </div>

          <div className="shrink-0 rounded-3xl bg-slate-950 px-4 py-2.5 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              TPS
            </p>

            <p className="mt-1 text-lg font-black">
              {formatNumber(kelurahan.totalTps)}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Total Suara
          </p>

          <p className="mt-1 text-2xl font-black text-slate-950">
            {formatNumber(kelurahan.totalSuara)}
          </p>
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <p className="text-xs font-bold text-slate-400">Suara Kandidat</p>

          <p className="mt-1 text-base font-black text-slate-950">
            {formatNumber(kelurahan.suaraKandidat)}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Partai Unggul
            </p>

            {kelurahan.partaiUnggul ? (
              <div className="mt-3">
                <div className="mb-2 flex h-12 items-center justify-center">
                  {kelurahan.partaiUnggul.logoUrl ? (
                    <img
                      src={kelurahan.partaiUnggul.logoUrl}
                      alt={`Logo ${kelurahan.partaiUnggul.nama}`}
                      className="max-h-12 max-w-16 object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                      {kelurahan.partaiUnggul.nomorUrut}
                    </div>
                  )}
                </div>

                <p className="wrap-break-word text-center text-xs font-black leading-tight text-slate-950">
                  {kelurahan.partaiUnggul.nomorUrut}.{" "}
                  {kelurahan.partaiUnggul.singkatan ??
                    kelurahan.partaiUnggul.nama}
                </p>

                <p className="mt-1 text-center text-xs font-semibold text-slate-500">
                  {formatNumber(kelurahan.partaiUnggul.totalSuara)} suara
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Belum ada data.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Top Kandidat
            </p>

            {kelurahan.kandidatUnggul ? (
              <div className="mt-3">
                <div className="mb-2 flex h-14 items-center justify-center bg-slate-50">
                  {kelurahan.kandidatUnggul.fotoUrl ? (
                    <img
                      src={kelurahan.kandidatUnggul.fotoUrl}
                      alt={`Foto ${kelurahan.kandidatUnggul.nama}`}
                      className="max-h-14 max-w-12 object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                      {getCandidateInitials(kelurahan.kandidatUnggul.nama)}
                    </div>
                  )}
                </div>

                <p className="wrap-break-word text-center text-xs font-black leading-tight text-slate-950">
                  {kelurahan.kandidatUnggul.noUrut}.{" "}
                  {kelurahan.kandidatUnggul.nama}
                </p>

                {kandidatPartaiLabel ? (
                  <p className="mt-1 wrap-break-word text-center text-xs font-bold leading-tight text-blue-600">
                    ({kandidatPartaiLabel})
                  </p>
                ) : null}

                <p className="mt-1 text-center text-xs font-semibold text-slate-500">
                  {formatNumber(kelurahan.kandidatUnggul.totalSuara)} suara
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Belum ada data.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetail(kelurahan)}
          className="mt-3 w-full rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
        >
          Detail Kelurahan
        </button>
      </div>

      {/* Tablet dan desktop memakai layout lebih luas. */}
      <div className="hidden sm:block">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Kelurahan
            </p>

            <h3 className="mt-2 wrap-break-word text-2xl font-black leading-tight text-slate-950">
              {kelurahan.nama}
            </h3>

            <p className="mt-1 wrap-break-word text-sm font-bold text-slate-500">
              Kecamatan {kelurahan.kecamatanNama}
            </p>
          </div>

          <div className="shrink-0 rounded-3xl bg-slate-950 px-4 py-3 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              TPS
            </p>

            <p className="mt-1 text-xl font-black">
              {formatNumber(kelurahan.totalTps)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-50 px-5 py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Total Suara
          </p>

          <p className="mt-2 text-4xl font-black text-slate-950">
            {formatNumber(kelurahan.totalSuara)}
          </p>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs font-bold text-slate-400">Suara Kandidat</p>

          <p className="mt-2 text-xl font-black text-slate-950">
            {formatNumber(kelurahan.suaraKandidat)}
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Partai Unggul
            </p>

            {kelurahan.partaiUnggul ? (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                  {kelurahan.partaiUnggul.logoUrl ? (
                    <img
                      src={kelurahan.partaiUnggul.logoUrl}
                      alt={`Logo ${kelurahan.partaiUnggul.nama}`}
                      className="max-h-14 max-w-14 object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                      {kelurahan.partaiUnggul.nomorUrut}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="wrap-break-word text-sm font-black leading-tight text-slate-950">
                    {kelurahan.partaiUnggul.nomorUrut}.{" "}
                    {kelurahan.partaiUnggul.singkatan ??
                      kelurahan.partaiUnggul.nama}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatNumber(kelurahan.partaiUnggul.totalSuara)} suara
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Belum ada data.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Top Kandidat Se-Kelurahan
            </p>

            {kelurahan.kandidatUnggul ? (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-14 shrink-0 items-center justify-center bg-slate-50">
                  {kelurahan.kandidatUnggul.fotoUrl ? (
                    <img
                      src={kelurahan.kandidatUnggul.fotoUrl}
                      alt={`Foto ${kelurahan.kandidatUnggul.nama}`}
                      className="max-h-16 max-w-14 object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                      {getCandidateInitials(kelurahan.kandidatUnggul.nama)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="wrap-break-word text-sm font-black leading-tight text-slate-950">
                    {kelurahan.kandidatUnggul.noUrut}.{" "}
                    {kelurahan.kandidatUnggul.nama}
                  </p>

                  {kandidatPartaiLabel ? (
                    <p className="mt-1 wrap-break-word text-xs font-bold leading-tight text-blue-600">
                      ({kandidatPartaiLabel})
                    </p>
                  ) : null}

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatNumber(kelurahan.kandidatUnggul.totalSuara)} suara
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Belum ada data.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetail(kelurahan)}
          className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Detail Kelurahan
        </button>
      </div>
    </article>
  );
}