import type { PartyCardItem } from "@/lib/dashboard/types";
import PartyCard from "./PartyCard";
import PartyChart from "./PartyChart";

type PartySectionProps = {
  partyList: PartyCardItem[];
  onOpenCandidates: (partai: PartyCardItem) => void;
};

/**
 * Section utama untuk grafik dan daftar partai.
 */
export default function PartySection({
  partyList,
  onOpenCandidates,
}: PartySectionProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-slate-950">Partai</h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Lihat total suara partai, suara kandidat, peringkat, dan akses daftar
          kandidat pada dapil aktif.
        </p>
      </div>

      <PartyChart partyList={partyList} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {partyList.map((partai) => (
          <PartyCard
            key={partai.id}
            partai={partai}
            onOpenCandidates={onOpenCandidates}
          />
        ))}
      </div>
    </section>
  );
}