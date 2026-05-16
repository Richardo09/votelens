import type { KecamatanCardItem } from "@/lib/dashboard/types";
import KecamatanCard from "./KecamatanCard";

type KecamatanSectionProps = {
  kecamatanList: KecamatanCardItem[];
  onOpenDetail: (kecamatan: KecamatanCardItem) => void;
};

/**
 * Section daftar kecamatan pada dapil aktif.
 */
export default function KecamatanSection({
  kecamatanList,
  onOpenDetail,
}: KecamatanSectionProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-slate-950">Kecamatan</h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Ringkasan suara tiap kecamatan, termasuk partai unggul dan top
          kandidat se-kecamatan.
        </p>
      </div>

      {kecamatanList.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {kecamatanList.map((kecamatan) => (
            <KecamatanCard
              key={kecamatan.id}
              kecamatan={kecamatan}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-4xl border border-slate-200 bg-white p-8 text-center">
          <h3 className="text-lg font-black text-slate-950">
            Data kecamatan belum tersedia.
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pastikan data kelurahan, TPS, dan suara pada dapil aktif sudah
            terisi.
          </p>
        </div>
      )}
    </section>
  );
}