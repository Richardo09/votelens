"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type DapilOption = {
  id: number;
  kode: string;
  nama: string;
};

type KecamatanOption = {
  id: number;
  nama: string;
};

type KelurahanRecord = {
  id: number;
  nama: string;
  dapil_id: number;
  kecamatan_id: number | null;
};

type KelurahanRow = KelurahanRecord & {
  kecamatanNama: string;
  jumlahTps: number;
};

type TpsRecord = {
  id: number;
  kelurahan_id: number;
  nomor_tps: number;
};

type AdminApiResponse = {
  success: boolean;
  message: string;
  jumlahTps?: number;
  inserted?: number;
  deleted?: number;
};

/**
 * Memecah data menjadi beberapa batch agar query tetap stabil.
 */
function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

/**
 * Mengubah nilai database menjadi angka yang aman.
 */
function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

/**
 * Mengelola jumlah TPS berdasarkan dapil, kecamatan, dan kelurahan.
 */
export default function AdminTpsManagement() {
  const [dapilList, setDapilList] = useState<DapilOption[]>([]);
  const [kecamatanList, setKecamatanList] = useState<KecamatanOption[]>([]);
  const [kelurahanList, setKelurahanList] = useState<KelurahanRecord[]>([]);
  const [tpsList, setTpsList] = useState<TpsRecord[]>([]);

  const [selectedDapilId, setSelectedDapilId] = useState("");
  const [selectedKecamatanId, setSelectedKecamatanId] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [editingKelurahan, setEditingKelurahan] =
    useState<KelurahanRow | null>(null);
  const [formJumlahTps, setFormJumlahTps] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isAreaLoading, setIsAreaLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  /**
   * Memuat daftar dapil yang tersedia untuk admin.
   */
  const loadDapilList = useCallback(async () => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("dapil")
      .select("id, kode, nama")
      .order("id", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data as DapilOption[]) ?? [];

    setDapilList(rows);
    setSelectedDapilId((current) => {
      return current || (rows[0] ? String(rows[0].id) : "");
    });
  }, []);

  /**
   * Memuat kelurahan, kecamatan, dan TPS berdasarkan dapil aktif.
   */
  const loadAreaData = useCallback(async (dapilId: string) => {
    if (!dapilId) {
      setKecamatanList([]);
      setKelurahanList([]);
      setTpsList([]);
      return;
    }

    const supabase = getSupabaseClient();

    setIsAreaLoading(true);

    try {
      const { data: kelurahanData, error: kelurahanError } = await supabase
        .from("kelurahan")
        .select("id, nama, dapil_id, kecamatan_id")
        .eq("dapil_id", Number(dapilId))
        .order("nama", { ascending: true });

      if (kelurahanError) {
        throw new Error(kelurahanError.message);
      }

      const kelurahanRows = (kelurahanData as KelurahanRecord[]) ?? [];

      const kecamatanIdList = Array.from(
        new Set(
          kelurahanRows
            .map((kelurahan) => kelurahan.kecamatan_id)
            .filter((id): id is number => Boolean(id))
        )
      );

      let kecamatanRows: KecamatanOption[] = [];

      if (kecamatanIdList.length > 0) {
        const { data: kecamatanData, error: kecamatanError } = await supabase
          .from("kecamatan")
          .select("id, nama")
          .in("id", kecamatanIdList)
          .order("nama", { ascending: true });

        if (kecamatanError) {
          throw new Error(kecamatanError.message);
        }

        kecamatanRows = (kecamatanData as KecamatanOption[]) ?? [];
      }

      const kelurahanIdList = kelurahanRows.map((kelurahan) => kelurahan.id);
      const kelurahanChunks = chunkArray(kelurahanIdList, 500);
      const tpsRows: TpsRecord[] = [];

      for (const kelurahanChunk of kelurahanChunks) {
        if (kelurahanChunk.length === 0) {
          continue;
        }

        const { data: tpsData, error: tpsError } = await supabase
          .from("tps")
          .select("id, kelurahan_id, nomor_tps")
          .in("kelurahan_id", kelurahanChunk)
          .order("kelurahan_id", { ascending: true })
          .order("nomor_tps", { ascending: true });

        if (tpsError) {
          throw new Error(tpsError.message);
        }

        tpsRows.push(...((tpsData as TpsRecord[]) ?? []));
      }

      setKecamatanList(kecamatanRows);
      setKelurahanList(kelurahanRows);
      setTpsList(tpsRows);
      setSelectedKecamatanId("all");
      setEditingKelurahan(null);
      setFormJumlahTps("");
      setErrorMessage("");
    } finally {
      setIsAreaLoading(false);
    }
  }, []);

  /**
   * Memuat data awal modul TPS.
   *
   * Proses dijadwalkan melalui timer agar pembaruan state tidak berjalan
   * langsung pada fase effect utama.
   */
  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      async function loadInitialData() {
        try {
          await loadDapilList();

          if (!isMounted) {
            return;
          }

          setErrorMessage("");
        } catch (error) {
          if (!isMounted) {
            return;
          }

          const message =
            error instanceof Error ? error.message : "Gagal memuat data dapil.";

          setErrorMessage(message);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      void loadInitialData();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadDapilList]);

  /**
   * Memuat ulang area saat dapil aktif berubah.
   *
   * Timer digunakan agar pemanggilan fungsi yang berisi setState tidak dianggap
   * sebagai pembaruan state langsung di dalam effect.
   */
  useEffect(() => {
    if (!selectedDapilId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadAreaData(selectedDapilId);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadAreaData, selectedDapilId]);

  /**
   * Mengambil access token admin aktif untuk request API.
   */
  async function getAccessToken() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
      throw new Error("Sesi login admin tidak ditemukan.");
    }

    return data.session.access_token;
  }

  /**
   * Membuka form pengaturan jumlah TPS pada kelurahan tertentu.
   */
  function openEditForm(kelurahan: KelurahanRow) {
    setEditingKelurahan(kelurahan);
    setFormJumlahTps(String(kelurahan.jumlahTps));
    setErrorMessage("");
    setActionMessage("");
  }

  /**
   * Menutup form pengaturan jumlah TPS.
   */
  function closeEditForm() {
    setEditingKelurahan(null);
    setFormJumlahTps("");
  }

  /**
   * Menyimpan perubahan jumlah TPS pada kelurahan aktif.
   */
  async function handleUpdateJumlahTps() {
    if (!editingKelurahan) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setActionMessage("");

    try {
      const accessToken = await getAccessToken();

      const response = await fetch("/api/admin/tps", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kelurahanId: editingKelurahan.id,
          jumlahTps: Number(formJumlahTps),
        }),
      });

      const result = (await response.json()) as AdminApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memperbarui jumlah TPS.");
      }

      await loadAreaData(selectedDapilId);
      closeEditForm();
      setActionMessage(result.message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memperbarui jumlah TPS.";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Menggabungkan data kelurahan dengan nama kecamatan dan jumlah TPS aktif.
   */
  const kelurahanRowList = useMemo<KelurahanRow[]>(() => {
    const kecamatanMap = new Map<number, KecamatanOption>();
    const tpsCountMap = new Map<number, number>();

    kecamatanList.forEach((kecamatan) => {
      kecamatanMap.set(kecamatan.id, kecamatan);
    });

    tpsList.forEach((tps) => {
      const kelurahanId = toNumber(tps.kelurahan_id);

      tpsCountMap.set(kelurahanId, (tpsCountMap.get(kelurahanId) ?? 0) + 1);
    });

    return kelurahanList
      .map((kelurahan) => {
        const kecamatan = kelurahan.kecamatan_id
          ? kecamatanMap.get(kelurahan.kecamatan_id)
          : null;

        return {
          ...kelurahan,
          kecamatanNama: kecamatan?.nama ?? "Tanpa kecamatan",
          jumlahTps: tpsCountMap.get(kelurahan.id) ?? 0,
        };
      })
      .sort((a, b) => {
        const kecamatanCompare = a.kecamatanNama.localeCompare(
          b.kecamatanNama
        );

        if (kecamatanCompare !== 0) {
          return kecamatanCompare;
        }

        return a.nama.localeCompare(b.nama);
      });
  }, [kecamatanList, kelurahanList, tpsList]);

  /**
   * Menerapkan filter kecamatan dan pencarian kelurahan.
   */
  const filteredKelurahanList = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return kelurahanRowList.filter((kelurahan) => {
      const matchesKecamatan =
        selectedKecamatanId === "all" ||
        kelurahan.kecamatan_id === Number(selectedKecamatanId);

      const matchesKeyword =
        !keyword ||
        kelurahan.nama.toLowerCase().includes(keyword) ||
        kelurahan.kecamatanNama.toLowerCase().includes(keyword);

      return matchesKecamatan && matchesKeyword;
    });
  }, [kelurahanRowList, searchKeyword, selectedKecamatanId]);

  const selectedDapil = useMemo(() => {
    return (
      dapilList.find((dapil) => dapil.id === Number(selectedDapilId)) ?? null
    );
  }, [dapilList, selectedDapilId]);

  const totalTps = useMemo(() => {
    return kelurahanRowList.reduce((total, kelurahan) => {
      return total + kelurahan.jumlahTps;
    }, 0);
  }, [kelurahanRowList]);

  if (isLoading) {
    return (
      <section className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-600">
          Memuat data TPS...
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {errorMessage ? (
        <section className="rounded-4xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-red-700">{errorMessage}</p>
        </section>
      ) : null}

      {actionMessage ? (
        <section className="rounded-4xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-bold text-emerald-700">
            {actionMessage}
          </p>
        </section>
      ) : null}

      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Jumlah TPS
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Kelola TPS per Kelurahan
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Admin dapat mengatur jumlah TPS pada setiap kelurahan berdasarkan
              dapil aktif.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs font-black uppercase tracking-widest text-slate-300">
              Total TPS
            </p>

            <p className="mt-1 text-3xl font-black">{totalTps}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Dapil
            </label>

            <select
              value={selectedDapilId}
              onChange={(event) => setSelectedDapilId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950"
            >
              {dapilList.map((dapil) => (
                <option key={dapil.id} value={dapil.id}>
                  {dapil.kode} - {dapil.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Kecamatan
            </label>

            <select
              value={selectedKecamatanId}
              onChange={(event) => setSelectedKecamatanId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="all">Semua Kecamatan</option>

              {kecamatanList.map((kecamatan) => (
                <option key={kecamatan.id} value={kecamatan.id}>
                  {kecamatan.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Cari Kelurahan
            </label>

            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Nama kelurahan atau kecamatan..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
            />
          </div>
        </div>
      </section>

      {selectedDapil ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Dapil Aktif
            </p>

            <p className="mt-2 text-lg font-black text-slate-950">
              {selectedDapil.kode}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              {selectedDapil.nama}
            </p>
          </article>

          <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Kecamatan
            </p>

            <p className="mt-2 text-3xl font-black text-slate-950">
              {kecamatanList.length}
            </p>
          </article>

          <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Kelurahan
            </p>

            <p className="mt-2 text-3xl font-black text-slate-950">
              {kelurahanRowList.length}
            </p>
          </article>

          <article className="rounded-4xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-300">
              Hasil Filter
            </p>

            <p className="mt-2 text-3xl font-black">
              {filteredKelurahanList.length}
            </p>
          </article>
        </section>
      ) : null}

      {editingKelurahan ? (
        <section className="rounded-4xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                Edit Jumlah TPS
              </p>

              <h3 className="mt-2 text-xl font-black text-slate-950">
                {editingKelurahan.nama}
              </h3>

              <p className="mt-1 text-sm font-semibold text-slate-600">
                Kecamatan {editingKelurahan.kecamatanNama}
              </p>
            </div>

            <button
              type="button"
              onClick={closeEditForm}
              className="w-fit rounded-2xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Tutup
            </button>
          </div>

          <div className="mt-5 max-w-sm">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Jumlah TPS
            </label>

            <input
              value={formJumlahTps}
              onChange={(event) => setFormJumlahTps(event.target.value)}
              type="number"
              min={0}
              max={999}
              placeholder="Contoh: 90"
              className="mt-2 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleUpdateJumlahTps}
              disabled={isSubmitting}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Jumlah TPS"}
            </button>

            <button
              type="button"
              onClick={() =>
                setFormJumlahTps(String(editingKelurahan.jumlahTps))
              }
              disabled={isSubmitting}
              className="rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h3 className="text-xl font-black text-slate-950">
            Daftar Kelurahan
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Setiap kelurahan menampilkan jumlah TPS aktif berdasarkan tabel
            master TPS.
          </p>
        </div>

        {isAreaLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-600">
              Memuat data wilayah...
            </p>
          </div>
        ) : null}

        {!isAreaLoading ? (
          <>
            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
              <table className="min-w-full border-collapse bg-white">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                      Kecamatan
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                      Kelurahan
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                      TPS
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredKelurahanList.map((kelurahan, index) => (
                    <tr
                      key={kelurahan.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="text-sm font-bold text-slate-700">
                          {kelurahan.kecamatanNama}
                        </p>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="text-sm font-black text-slate-950">
                          {kelurahan.nama}
                        </p>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center">
                        <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
                          {kelurahan.jumlahTps}
                        </span>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => openEditForm(kelurahan)}
                          className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                        >
                          Edit TPS
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {filteredKelurahanList.map((kelurahan) => (
                <article
                  key={kelurahan.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                    {kelurahan.kecamatanNama}
                  </p>

                  <h4 className="mt-2 wrap-break-word text-base font-black text-slate-950">
                    {kelurahan.nama}
                  </h4>

                  <div className="mt-4 rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Jumlah TPS
                    </p>

                    <p className="mt-1 text-2xl font-black text-slate-950">
                      {kelurahan.jumlahTps}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditForm(kelurahan)}
                    className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Edit TPS
                  </button>
                </article>
              ))}
            </div>

            {filteredKelurahanList.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Tidak ada kelurahan yang cocok dengan filter.
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </section>
  );
}