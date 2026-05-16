import type {
  KecamatanCardItem,
  KelurahanCardItem,
} from "@/lib/dashboard/types";
import KelurahanCard from "./KelurahanCard";

type KelurahanSectionProps = {
  kecamatanList: KecamatanCardItem[];
  kelurahanList: KelurahanCardItem[];
  selectedKecamatanId: number | null;
  isLoading: boolean;
  errorMessage: string;
  onSelectKecamatan: (kecamatan: KecamatanCardItem) => void;
  onOpenDetail: (kelurahan: KelurahanCardItem) => void;
};

/**
 * Halaman daftar kelurahan dengan pilihan kecamatan terlebih dahulu.
 */
export default function KelurahanSection({
  kecamatanList,
  kelurahanList,
  selectedKecamatanId,
  isLoading,
  errorMessage,
  onSelectKecamatan,
  onOpenDetail,
}: KelurahanSectionProps) {
  const selectedKecamatan =
    kecamatanList.find((kecamatan) => kecamatan.id === selectedKecamatanId) ??
    null;

  return (
    <section className="space-y-5">
      <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600 sm:text-sm">
              Kelurahan
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              Pilih Kecamatan
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pilih kecamatan terlebih dahulu agar daftar kelurahan tidak
              terlalu banyak dan tetap mudah dibaca.
            </p>
          </div>

          {selectedKecamatan ? (
            <div className="rounded-3xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Kecamatan Aktif
              </p>

              <p className="mt-1 wrap-break-word text-lg font-black text-slate-950">
                {selectedKecamatan.nama}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kecamatanList.map((kecamatan) => {
            const isSelected = selectedKecamatanId === kecamatan.id;

            return (
              <button
                key={kecamatan.id}
                type="button"
                onClick={() => onSelectKecamatan(kecamatan)}
                className={
                  isSelected
                    ? "rounded-3xl border border-slate-950 bg-slate-950 px-4 py-3 text-left text-white shadow-lg shadow-slate-200 transition"
                    : "rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200"
                }
              >
                <p
                  className={
                    isSelected
                      ? "text-xs font-black uppercase tracking-widest text-slate-300"
                      : "text-xs font-black uppercase tracking-widest text-blue-600"
                  }
                >
                  Kecamatan
                </p>

                <p className="mt-2 wrap-break-word text-sm font-black leading-tight">
                  {kecamatan.nama}
                </p>

                <p
                  className={
                    isSelected
                      ? "mt-2 text-xs font-semibold text-slate-300"
                      : "mt-2 text-xs font-semibold text-slate-500"
                  }
                >
                  {kecamatan.totalKelurahan} kelurahan
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {!selectedKecamatanId ? (
        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-8 text-center">
          <h3 className="text-xl font-black text-slate-950">
            Belum ada kecamatan dipilih.
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Klik salah satu kecamatan di atas untuk membuka daftar kelurahan.
          </p>
        </div>
      ) : null}

      {selectedKecamatanId && isLoading ? (
        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-8">
          <p className="text-sm font-semibold text-slate-600">
            Memuat daftar kelurahan...
          </p>
        </div>
      ) : null}

      {selectedKecamatanId && errorMessage ? (
        <div className="rounded-4xl border border-red-200 bg-red-50 p-8">
          <p className="text-sm font-bold text-red-700">{errorMessage}</p>
        </div>
      ) : null}

      {selectedKecamatanId && !isLoading && !errorMessage ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                Daftar Kelurahan
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Menampilkan kelurahan pada Kecamatan{" "}
                {selectedKecamatan?.nama ?? "-"}.
              </p>
            </div>

            <div className="w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
              {kelurahanList.length} kelurahan
            </div>
          </div>

          {kelurahanList.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {kelurahanList.map((kelurahan) => (
                <KelurahanCard
                  key={kelurahan.id}
                  kelurahan={kelurahan}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-4xl border border-slate-200 bg-slate-50 p-8 text-center">
              <h3 className="text-xl font-black text-slate-950">
                Data kelurahan belum tersedia.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Belum ada data kelurahan untuk kecamatan ini.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}