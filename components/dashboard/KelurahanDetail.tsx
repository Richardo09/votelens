/* eslint-disable @next/next/no-img-element */

import { Fragment, type ReactNode } from "react";
import { getPartyColor } from "@/lib/dashboard/colors";
import {
  formatNumber,
  formatPercent,
  getCandidateInitials,
  getDisplayPartyName,
} from "@/lib/dashboard/format";
import type {
  KelurahanCardItem,
  KelurahanPartyCardItem,
  KelurahanTopCandidateCardItem,
} from "@/lib/dashboard/types";

type KelurahanDetailProps = {
  kelurahan: KelurahanCardItem;
  partyList?: KelurahanPartyCardItem[] | null;
  topCandidateList?: KelurahanTopCandidateCardItem[] | null;
  isLoading: boolean;
  errorMessage: string;
  openedPartyId: number | null;
  onBack: () => void;
  onOpenPartyTps: (partai: KelurahanPartyCardItem) => void;
  renderPartyTpsDetail?: (partai: KelurahanPartyCardItem) => ReactNode;
};

/**
 * Detail kelurahan berisi grafik partai, top kandidat, rekap partai, dan detail TPS.
 */
export default function KelurahanDetail({
  kelurahan,
  partyList,
  topCandidateList,
  isLoading,
  errorMessage,
  openedPartyId,
  onBack,
  onOpenPartyTps,
  renderPartyTpsDetail,
}: KelurahanDetailProps) {
  const safePartyList = Array.isArray(partyList) ? partyList : [];
  const sortedPartyList = safePartyList
    .slice()
    .sort((a, b) => a.nomorUrut - b.nomorUrut);

  const safeTopCandidateList = Array.isArray(topCandidateList)
    ? topCandidateList
    : [];

  const totalSuaraKelurahan =
    sortedPartyList[0]?.totalSuaraKelurahan ?? kelurahan.totalSuara;

  const maxSuaraPartai = Math.max(
    1,
    ...sortedPartyList.map((partai) => partai.totalSuara)
  );

  const chartHeight = 240;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 sm:text-sm">
            Detail Kelurahan
          </p>

          <h2 className="mt-2 wrap-break-word text-2xl font-black text-slate-950 sm:text-3xl">
            {kelurahan.nama}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Kecamatan {kelurahan.kecamatanNama}
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-fit rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Kembali ke Kelurahan
        </button>
      </div>

      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 sm:text-sm">
              Ringkasan Kelurahan
            </p>

            <h3 className="mt-2 wrap-break-word text-3xl font-black text-slate-950">
              {kelurahan.nama}
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Total suara dihitung dari suara partai murni dan suara kandidat
              di kelurahan ini.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Total Suara
            </p>

            <p className="mt-2 text-3xl font-black text-slate-950">
              {formatNumber(totalSuaraKelurahan)}
            </p>
          </div>

          <div className="rounded-3xl bg-blue-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
              TPS
            </p>

            <p className="mt-2 text-3xl font-black text-blue-700">
              {formatNumber(kelurahan.totalTps)}
            </p>

            <p className="mt-1 text-xs font-semibold text-blue-600">
              Total TPS di kelurahan ini
            </p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-8">
          <p className="text-sm font-semibold text-slate-600">
            Memuat detail kelurahan...
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-4xl border border-red-200 bg-red-50 p-8">
          <p className="text-sm font-bold text-red-700">{errorMessage}</p>
        </div>
      ) : null}

      {!isLoading && !errorMessage ? (
        <>
          <section className="w-full max-w-full overflow-hidden rounded-4xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-blue-600 sm:text-sm">
                  Grafik Kelurahan
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                  Grafik Suara Partai
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Grafik ini hanya menampilkan suara partai pada Kelurahan{" "}
                  {kelurahan.nama}.
                </p>
              </div>

              <div className="shrink-0 rounded-3xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Total Kelurahan
                </p>

                <p className="mt-1 text-lg font-black text-slate-950">
                  {formatNumber(totalSuaraKelurahan)}
                </p>
              </div>
            </div>

            {sortedPartyList.length > 0 ? (
              <>
                <div className="space-y-3 lg:hidden">
                  {sortedPartyList.map((partai) => {
                    const color = getPartyColor({
                      nomorUrut: partai.nomorUrut,
                      namaPartai: partai.namaPartai,
                      singkatanPartai: partai.singkatanPartai,
                    });

                    const percent =
                      totalSuaraKelurahan > 0
                        ? (partai.totalSuara / totalSuaraKelurahan) * 100
                        : 0;

                    const barWidth = Math.max(
                      4,
                      (partai.totalSuara / maxSuaraPartai) * 100
                    );

                    return (
                      <article
                        key={`mobile-kelurahan-chart-${partai.partaiId}`}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="wrap-break-word text-base font-black leading-tight text-slate-950">
                              {partai.nomorUrut}.{" "}
                              {getDisplayPartyName(
                                partai.namaPartai,
                                partai.singkatanPartai
                              )}
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-500">
                              {formatNumber(partai.totalSuara)} suara
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-base font-black text-slate-700">
                              {formatPercent(percent)}
                            </p>

                            <p className="mt-1 text-xs font-black text-blue-600">
                              Rank #{partai.peringkatKelurahan}
                            </p>
                          </div>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden w-full max-w-full overflow-hidden lg:block">
                  <div className="w-full max-w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-6">
                    <div
                      className="grid w-full items-end gap-2 border-b border-slate-200 pb-4 xl:gap-3"
                      style={{
                        height: chartHeight + 84,
                        gridTemplateColumns: `repeat(${sortedPartyList.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {sortedPartyList.map((partai) => {
                        const color = getPartyColor({
                          nomorUrut: partai.nomorUrut,
                          namaPartai: partai.namaPartai,
                          singkatanPartai: partai.singkatanPartai,
                        });

                        const percent =
                          totalSuaraKelurahan > 0
                            ? (partai.totalSuara / totalSuaraKelurahan) * 100
                            : 0;

                        const barHeight = Math.max(
                          18,
                          Math.round(
                            (partai.totalSuara / maxSuaraPartai) * chartHeight
                          )
                        );

                        return (
                          <div
                            key={`desktop-kelurahan-chart-${partai.partaiId}`}
                            className="flex min-w-0 flex-col items-center justify-end"
                          >
                            <p className="mb-1 max-w-full truncate text-center text-[11px] font-black text-slate-700">
                              {formatPercent(percent)}
                            </p>

                            <p className="mb-2 text-[10px] font-black text-blue-600">
                              #{partai.peringkatKelurahan}
                            </p>

                            <div
                              className="w-full max-w-11 rounded-none shadow-md shadow-slate-200"
                              style={{
                                height: barHeight,
                                backgroundColor: color,
                              }}
                            />

                            <div className="mt-3 w-full min-w-0 text-center">
                              <p className="text-sm font-black text-slate-950">
                                {partai.nomorUrut}
                              </p>

                              <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
                                {getDisplayPartyName(
                                  partai.namaPartai,
                                  partai.singkatanPartai
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-600">
                  Data grafik kelurahan belum tersedia.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600 sm:text-sm">
                Top Kandidat
              </p>

              <h3 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                Top 5 Kandidat Se-Kelurahan
              </h3>
            </div>

            {safeTopCandidateList.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {safeTopCandidateList.map((candidate) => (
                  <article
                    key={`kelurahan-top-candidate-${candidate.kandidatId}`}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-2xl bg-slate-950 px-3 py-2 text-white">
                        <p className="text-xs font-black">
                          #{candidate.peringkatKelurahan}
                        </p>
                      </div>

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                        {candidate.logoUrl ? (
                          <img
                            src={candidate.logoUrl}
                            alt={`Logo ${candidate.namaPartai}`}
                            className="max-h-12 max-w-12 object-contain"
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-center">
                      {candidate.fotoUrl ? (
                        <img
                          src={candidate.fotoUrl}
                          alt={`Foto ${candidate.namaKandidat}`}
                          className="max-h-24 max-w-20 object-contain sm:max-h-32"
                        />
                      ) : (
                        <div className="flex h-20 w-16 items-center justify-center rounded-2xl bg-slate-950 text-center">
                          <span className="px-2 text-sm font-black text-white">
                            {getCandidateInitials(candidate.namaKandidat)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-center">
                      <h4 className="mt-1 wrap-break-word text-sm font-black leading-tight text-slate-950">
                        {candidate.noUrutKandidat}. {candidate.namaKandidat}
                      </h4>

                      <p className="mt-1 wrap-break-word text-xs font-bold leading-tight text-blue-600">
                        (
                        {candidate.singkatanPartai
                          ? `${candidate.namaPartai} / ${candidate.singkatanPartai}`
                          : candidate.namaPartai}
                        )
                      </p>

                      <p className="mt-3 text-lg font-black text-slate-950">
                        {formatNumber(candidate.totalSuaraKelurahan)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-600">
                  Data top kandidat kelurahan belum tersedia.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h3 className="text-xl font-black text-slate-950">
                Rekap Partai Per Kelurahan
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Partai diurutkan berdasarkan nomor urut. Peringkat tetap
                menunjukkan posisi partai berdasarkan total suara kelurahan.
              </p>
            </div>

            <div className="space-y-3 lg:hidden">
              {sortedPartyList.map((partai) => {
                const isOpened = openedPartyId === partai.partaiId;

                return (
                  <article
                    key={`mobile-kelurahan-party-${partai.partaiId}`}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white">
                        {partai.logoUrl ? (
                          <img
                            src={partai.logoUrl}
                            alt={`Logo ${partai.namaPartai}`}
                            className="max-h-12 max-w-12 object-contain"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                              Partai {partai.nomorUrut}
                            </p>

                            <h4 className="mt-1 wrap-break-word text-base font-black leading-tight text-slate-950">
                              {partai.namaPartai}
                            </h4>

                            {partai.singkatanPartai ? (
                              <p className="mt-1 text-xs font-bold text-blue-600">
                                {partai.singkatanPartai}
                              </p>
                            ) : null}
                          </div>

                          <div className="shrink-0 rounded-2xl bg-slate-950 px-3 py-2 text-white">
                            <p className="text-xs font-black">
                              Rank #{partai.peringkatKelurahan}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-xs font-bold text-slate-400">
                              Suara Partai
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-950">
                              {formatNumber(partai.suaraPartai)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-xs font-bold text-slate-400">
                              Suara Kandidat
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-950">
                              {formatNumber(partai.suaraKandidat)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-xs font-bold text-slate-400">
                              Total
                            </p>

                            <p className="mt-1 text-base font-black text-slate-950">
                              {formatNumber(partai.totalSuara)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-xs font-bold text-slate-400">
                              Persen
                            </p>

                            <p className="mt-1 text-base font-black text-slate-950">
                              {formatPercent(partai.persenSuara)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenPartyTps(partai)}
                          className={
                            isOpened
                              ? "mt-3 w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm"
                              : "mt-3 w-full rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-red-700"
                          }
                        >
                          {isOpened ? "Dibuka" : "Detail TPS"}
                        </button>
                      </div>
                    </div>

                    {isOpened && renderPartyTpsDetail ? (
                      <div className="mt-4">{renderPartyTpsDetail(partai)}</div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 lg:block">
              <table className="min-w-full border-collapse bg-white">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                      Partai
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
                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                      Peringkat
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedPartyList.map((partai, index) => {
                    const isOpened = openedPartyId === partai.partaiId;

                    return (
                      <Fragment
                        key={`desktop-kelurahan-party-${partai.partaiId}`}
                      >
                        <tr
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }
                        >
                          <td className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-950">
                            {partai.nomorUrut}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                                {partai.logoUrl ? (
                                  <img
                                    src={partai.logoUrl}
                                    alt={`Logo ${partai.namaPartai}`}
                                    className="max-h-11 max-w-11 object-contain"
                                  />
                                ) : null}
                              </div>

                              <div className="min-w-0">
                                <p className="wrap-break-word text-sm font-black text-slate-950">
                                  {partai.namaPartai}
                                </p>

                                {partai.singkatanPartai ? (
                                  <p className="text-xs font-bold text-blue-600">
                                    {partai.singkatanPartai}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-center text-sm font-black text-slate-950">
                            {formatNumber(partai.suaraPartai)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-center text-sm font-black text-slate-950">
                            {formatNumber(partai.suaraKandidat)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-center text-sm font-black text-slate-950">
                            {formatNumber(partai.totalSuara)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-center text-sm font-black text-slate-950">
                            {formatPercent(partai.persenSuara)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-center text-sm font-black text-slate-950">
                            #{partai.peringkatKelurahan}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => onOpenPartyTps(partai)}
                              className={
                                isOpened
                                  ? "rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm"
                                  : "rounded-2xl bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700"
                              }
                            >
                              {isOpened ? "Dibuka" : "Detail TPS"}
                            </button>
                          </td>
                        </tr>

                        {isOpened && renderPartyTpsDetail ? (
                          <tr className="bg-white">
                            <td
                              colSpan={8}
                              className="border-b border-slate-100 p-4"
                            >
                              {renderPartyTpsDetail(partai)}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-950 text-white">
                    <td
                      colSpan={4}
                      className="px-4 py-4 text-right text-sm font-black"
                    >
                      Total Kelurahan
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-black">
                      {formatNumber(totalSuaraKelurahan)}
                    </td>

                    <td colSpan={3} className="px-4 py-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}