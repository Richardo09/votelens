import type { CandidateCardItem, PartyCardItem } from "@/lib/dashboard/types";
import CandidateCard from "./CandidateCard";

type CandidateSectionProps = {
  selectedParty: PartyCardItem | null;
  candidateList: CandidateCardItem[];
  onBackToParties: () => void;
  onOpenCandidateDetail: (candidate: CandidateCardItem) => void;
};

/**
 * Section daftar kandidat dari partai yang dipilih.
 */
export default function CandidateSection({
  selectedParty,
  candidateList,
  onBackToParties,
  onOpenCandidateDetail,
}: CandidateSectionProps) {
  if (!selectedParty) {
    return (
      <section className="rounded-4xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-xl font-black text-slate-950">
          Pilih partai terlebih dahulu.
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Klik tombol Kandidat pada card partai untuk melihat daftar kandidat
          partai tersebut.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">
            Kandidat Partai
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Kandidat ditampilkan berdasarkan nomor urut kandidat pada partai
            yang dipilih.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToParties}
          className="w-fit rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Kembali ke Partai
        </button>
      </div>

      <div className="rounded-4xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 sm:text-sm">
          Partai Dipilih
        </p>

        <h3 className="mt-2 wrap-break-word text-2xl font-black text-blue-950">
          {selectedParty.singkatan
            ? `${selectedParty.nama} (${selectedParty.singkatan})`
            : selectedParty.nama}
        </h3>
      </div>

      {candidateList.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {candidateList.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onOpenDetail={onOpenCandidateDetail}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-4xl border border-slate-200 bg-white p-8 text-center">
          <h3 className="text-lg font-black text-slate-950">
            Kandidat belum tersedia.
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Belum ada data kandidat untuk partai ini pada dapil aktif.
          </p>
        </div>
      )}
    </section>
  );
}