/* eslint-disable @next/next/no-img-element */

import { formatNumber, getCandidateInitials } from "@/lib/dashboard/format";
import type { KecamatanCardItem } from "@/lib/dashboard/types";

type KecamatanCardProps = {
  kecamatan: KecamatanCardItem;
  onOpenDetail: (kecamatan: KecamatanCardItem) => void;
};

/**
 * Card ringkasan kecamatan pada dapil aktif.
 */
export default function KecamatanCard({
  kecamatan,
  onOpenDetail,
}: KecamatanCardProps) {
  const kandidatPartaiLabel = kecamatan.kandidatUnggul?.namaPartai
    ? kecamatan.kandidatUnggul.singkatanPartai
      ? `${kecamatan.kandidatUnggul.namaPartai} (${kecamatan.kandidatUnggul.singkatanPartai})`
      : kecamatan.kandidatUnggul.namaPartai
    : null;

  return (
    <article className="group rounded-4xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200 sm:p-6">
      {/* Mobile dibuat lebih padat agar nyaman saat scroll. */}
      <div className="block sm:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Kecamatan
            </p>

            <h3 className="mt-2 wrap-break-word text-xl font-black leading-tight text-slate-950">
              {kecamatan.nama}
            </h3>
          </div>

          <div className="shrink-0 rounded-3xl bg-slate-950 px-4 py-2.5 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              TPS
            </p>

            <p className="mt-1 text-lg font-black">
              {formatNumber(kecamatan.totalTps)}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Total Suara
          </p>

          <p className="mt-1 text-2xl font-black text-slate-950">
            {formatNumber(kecamatan.totalSuara)}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs font-bold text-slate-400">Kel.</p>

            <p className="mt-1 text-base font-black text-slate-950">
              {formatNumber(kecamatan.totalKelurahan)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs font-bold text-slate-400">Partai</p>

            <p className="mt-1 text-base font-black text-slate-950">
              {formatNumber(kecamatan.suaraPartai)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs font-bold text-slate-400">Kandidat</p>

            <p className="mt-1 text-base font-black text-slate-950">
              {formatNumber(kecamatan.suaraKandidat)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Partai Unggul
            </p>

            {kecamatan.partaiUnggul ? (
              <div className="mt-3">
                <div className="mb-2 flex h-12 items-center justify-center">
                  {kecamatan.partaiUnggul.logoUrl ? (
                    <img
                      src={kecamatan.partaiUnggul.logoUrl}
                      alt={`Logo ${kecamatan.partaiUnggul.nama}`}
                      className="max-h-12 max-w-16 object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                      {kecamatan.partaiUnggul.nomorUrut}
                    </div>
                  )}
                </div>

                <p className="wrap-break-word text-center text-xs font-black leading-tight text-slate-950">
                  {kecamatan.partaiUnggul.nomorUrut}.{" "}
                  {kecamatan.partaiUnggul.singkatan ??
                    kecamatan.partaiUnggul.nama}
                </p>

                <p className="mt-1 text-center text-xs font-semibold text-slate-500">
                  {formatNumber(kecamatan.partaiUnggul.totalSuara)} suara
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

            {kecamatan.kandidatUnggul ? (
              <div className="mt-3">
                <div className="mb-2 flex h-14 items-center justify-center bg-slate-50">
                  {kecamatan.kandidatUnggul.fotoUrl ? (
                    <img
                      src={kecamatan.kandidatUnggul.fotoUrl}
                      alt={`Foto ${kecamatan.kandidatUnggul.nama}`}
                      className="max-h-14 max-w-12 object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                      {getCandidateInitials(kecamatan.kandidatUnggul.nama)}
                    </div>
                  )}
                </div>

                <p className="wrap-break-word text-center text-xs font-black leading-tight text-slate-950">
                  {kecamatan.kandidatUnggul.noUrut}.{" "}
                  {kecamatan.kandidatUnggul.nama}
                </p>

                {kandidatPartaiLabel ? (
                  <p className="mt-1 wrap-break-word text-center text-xs font-bold leading-tight text-blue-600">
                    ({kandidatPartaiLabel})
                  </p>
                ) : null}

                <p className="mt-1 text-center text-xs font-semibold text-slate-500">
                  {formatNumber(kecamatan.kandidatUnggul.totalSuara)} suara
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
          onClick={() => onOpenDetail(kecamatan)}
          className="mt-3 w-full rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
        >
          Detail Kecamatan
        </button>
      </div>

      {/* Tablet dan desktop tetap memakai layout luas. */}
      <div className="hidden sm:block">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Kecamatan
            </p>

            <h3 className="mt-2 wrap-break-word text-2xl font-black leading-tight text-slate-950">
              {kecamatan.nama}
            </h3>
          </div>

          <div className="shrink-0 rounded-3xl bg-slate-950 px-4 py-3 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              TPS
            </p>

            <p className="mt-1 text-xl font-black">
              {formatNumber(kecamatan.totalTps)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-50 px-5 py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Total Suara
          </p>

          <p className="mt-2 text-4xl font-black text-slate-950">
            {formatNumber(kecamatan.totalSuara)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-bold text-slate-400">Kelurahan</p>

            <p className="mt-2 text-xl font-black text-slate-950">
              {formatNumber(kecamatan.totalKelurahan)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-bold text-slate-400">Partai</p>

            <p className="mt-2 text-xl font-black text-slate-950">
              {formatNumber(kecamatan.suaraPartai)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-bold text-slate-400">Kandidat</p>

            <p className="mt-2 text-xl font-black text-slate-950">
              {formatNumber(kecamatan.suaraKandidat)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Partai Unggul
            </p>

            {kecamatan.partaiUnggul ? (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                  {kecamatan.partaiUnggul.logoUrl ? (
                    <img
                      src={kecamatan.partaiUnggul.logoUrl}
                      alt={`Logo ${kecamatan.partaiUnggul.nama}`}
                      className="max-h-14 max-w-14 object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                      {kecamatan.partaiUnggul.nomorUrut}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="wrap-break-word text-sm font-black leading-tight text-slate-950">
                    {kecamatan.partaiUnggul.nomorUrut}.{" "}
                    {kecamatan.partaiUnggul.singkatan ??
                      kecamatan.partaiUnggul.nama}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatNumber(kecamatan.partaiUnggul.totalSuara)} suara
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
              Top Kandidat Se-Kecamatan
            </p>

            {kecamatan.kandidatUnggul ? (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-14 shrink-0 items-center justify-center bg-slate-50">
                  {kecamatan.kandidatUnggul.fotoUrl ? (
                    <img
                      src={kecamatan.kandidatUnggul.fotoUrl}
                      alt={`Foto ${kecamatan.kandidatUnggul.nama}`}
                      className="max-h-16 max-w-14 object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                      {getCandidateInitials(kecamatan.kandidatUnggul.nama)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="wrap-break-word text-sm font-black leading-tight text-slate-950">
                    {kecamatan.kandidatUnggul.noUrut}.{" "}
                    {kecamatan.kandidatUnggul.nama}
                  </p>

                  {kandidatPartaiLabel ? (
                    <p className="mt-1 wrap-break-word text-xs font-bold leading-tight text-blue-600">
                      ({kandidatPartaiLabel})
                    </p>
                  ) : null}

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatNumber(kecamatan.kandidatUnggul.totalSuara)} suara
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
          onClick={() => onOpenDetail(kecamatan)}
          className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Detail Kecamatan
        </button>
      </div>
    </article>
  );
}