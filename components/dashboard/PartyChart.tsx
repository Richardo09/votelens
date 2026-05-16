import { getPartyColor } from "@/lib/dashboard/colors";
import {
  formatNumber,
  formatPercent,
  getDisplayPartyName,
} from "@/lib/dashboard/format";
import type { PartyCardItem } from "@/lib/dashboard/types";

type PartyChartProps = {
  partyList: PartyCardItem[];
};

/**
 * Grafik suara partai untuk tampilan desktop dan mobile.
 */
export default function PartyChart({ partyList }: PartyChartProps) {
  const totalSuara = partyList.reduce((total, partai) => {
    return total + partai.totalSuara;
  }, 0);

  const maxSuara = Math.max(
    1,
    ...partyList.map((partai) => partai.totalSuara)
  );

  const chartHeight = 240;

  if (partyList.length === 0) {
    return (
      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          Grafik Suara Partai
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Data partai belum tersedia.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-full overflow-hidden rounded-4xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 sm:text-sm">
            Grafik Dapil
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
            Grafik Suara Partai
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Total suara dihitung dari suara partai dan suara kandidat pada dapil
            aktif.
          </p>
        </div>

        <div className="shrink-0 rounded-3xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Total Suara
          </p>

          <p className="mt-1 text-lg font-black text-slate-950">
            {formatNumber(totalSuara)}
          </p>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {partyList.map((partai) => {
          const color = getPartyColor({
            nomorUrut: partai.nomorUrut,
            namaPartai: partai.nama,
            singkatanPartai: partai.singkatan,
          });

          const percent =
            totalSuara > 0 ? (partai.totalSuara / totalSuara) * 100 : 0;

          const barWidth = Math.max(4, (partai.totalSuara / maxSuara) * 100);

          return (
            <article
              key={partai.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="wrap-break-word text-base font-black leading-tight text-slate-950">
                    {partai.nomorUrut}.{" "}
                    {getDisplayPartyName(partai.nama, partai.singkatan)}
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {formatNumber(partai.totalSuara)} suara
                  </p>
                </div>

                <p className="shrink-0 text-base font-black text-slate-700">
                  {formatPercent(percent)}
                </p>
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
              gridTemplateColumns: `repeat(${partyList.length}, minmax(0, 1fr))`,
            }}
          >
            {partyList.map((partai) => {
              const color = getPartyColor({
                nomorUrut: partai.nomorUrut,
                namaPartai: partai.nama,
                singkatanPartai: partai.singkatan,
              });

              const percent =
                totalSuara > 0 ? (partai.totalSuara / totalSuara) * 100 : 0;

              const barHeight = Math.max(
                18,
                Math.round((partai.totalSuara / maxSuara) * chartHeight)
              );

              return (
                <div
                  key={partai.id}
                  className="flex min-w-0 flex-col items-center justify-end"
                  title={`${partai.nomorUrut}. ${partai.nama}: ${formatNumber(
                    partai.totalSuara
                  )} suara`}
                >
                  <p className="mb-2 max-w-full truncate text-center text-[11px] font-black text-slate-700">
                    {formatPercent(percent)}
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
                      {getDisplayPartyName(partai.nama, partai.singkatan)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid w-full grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {partyList.map((partai) => {
              const color = getPartyColor({
                nomorUrut: partai.nomorUrut,
                namaPartai: partai.nama,
                singkatanPartai: partai.singkatan,
              });

              return (
                <div
                  key={`legend-${partai.id}`}
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className="mt-1 h-4 w-4 shrink-0 rounded-none"
                      style={{ backgroundColor: color }}
                    />

                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-950">
                        {partai.nomorUrut}.{" "}
                        {getDisplayPartyName(partai.nama, partai.singkatan)}
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {formatNumber(partai.totalSuara)} suara
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}