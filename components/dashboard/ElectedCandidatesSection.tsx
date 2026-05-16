import type { ElectedCandidateCardItem } from "@/lib/dashboard/types";
import ElectedCandidateCard from "./ElectedCandidateCard";

type ElectedCandidatesSectionProps = {
  candidateList: ElectedCandidateCardItem[];
};

/**
 * Section kandidat terpilih sesuai urutan kursi Sainte-Laguë.
 */
export default function ElectedCandidatesSection({
  candidateList,
}: ElectedCandidatesSectionProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-slate-950">
          Kandidat Terpilih
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Kandidat ditampilkan berdasarkan urutan kursi hasil metode
          Sainte-Laguë pada dapil aktif.
        </p>
      </div>

      {candidateList.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {candidateList.map((candidate) => (
            <ElectedCandidateCard
              key={`${candidate.urutanKursi}-${candidate.kandidatId}`}
              candidate={candidate}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-4xl border border-slate-200 bg-white p-8 text-center">
          <h3 className="text-lg font-black text-slate-950">
            Kandidat terpilih belum tersedia.
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Data akan tampil setelah perhitungan kursi Sainte-Laguë berhasil
            dimuat.
          </p>
        </div>
      )}
    </section>
  );
}