"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import AdminKecamatanDetailPanel from "./AdminKecamatanDetailPanel";

type DapilOption = {
  id: number;
  kode: string;
  nama: string;
  jumlah_kursi: number | null;
};

type AreaSummary = {
  totalKecamatan: number;
  totalKelurahan: number;
  totalTps: number;
};

type AdminPartySummary = {
  partaiId: number;
  nomorUrut: number;
  namaPartai: string;
  singkatanPartai: string | null;
  logoPath: string | null;
  jumlahKandidat: number;
  suaraPartai: number;
  suaraKandidat: number;
  totalSuara: number;
  persenSuara: number;
};

type AdminCandidateSummary = {
  kandidatId: number;
  partaiId: number;
  nomorUrutPartai: number;
  namaPartai: string;
  singkatanPartai: string | null;
  noUrutKandidat: number;
  namaKandidat: string;
  fotoPath: string | null;
  totalSuara: number;
};

type AdminDashboardData = {
  success: boolean;
  message?: string;
  dapil: DapilOption;
  areaSummary: AreaSummary;
  totalSeluruhSuara: number;
  partySummaryList: AdminPartySummary[];
  candidateSummaryList: AdminCandidateSummary[];
};

type AdminKecamatanSummary = {
  kecamatanId: number;
  namaKecamatan: string;
  totalKelurahan: number;
  totalTps: number;
  suaraPartai: number;
  suaraKandidat: number;
  totalSuara: number;
  persenSuara: number;
};

type AdminKecamatanData = {
  success: boolean;
  message?: string;
  dapil: DapilOption;
  totalSuara: number;
  kecamatanSummaryList: AdminKecamatanSummary[];
};

type SainteLagueQuotient = {
  partaiId: number;
  nomorUrutPartai: number;
  kursiPartaiKe: number;
  totalSuaraPartai: number;
  quotient: number;
};

type ElectedCandidate = AdminCandidateSummary & {
  peringkatKursi: number;
  kursiPartaiKe: number;
  totalSuaraPartai: number;
  quotient: number;
};

/**
 * Mengubah angka ke format lokal Indonesia.
 */
function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * Mengubah nilai persentase ke format tampilan ringkas.
 */
function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

/**
 * Menampilkan dashboard admin berdasarkan dapil yang dipilih.
 */
export default function AdminDapilDataSection() {
  const [dapilList, setDapilList] = useState<DapilOption[]>([]);
  const [selectedDapilId, setSelectedDapilId] = useState("");

  const [dashboardData, setDashboardData] =
    useState<AdminDashboardData | null>(null);

  const [kecamatanData, setKecamatanData] =
    useState<AdminKecamatanData | null>(null);

  const [selectedKecamatan, setSelectedKecamatan] =
    useState<AdminKecamatanSummary | null>(null);

  const [isDapilLoading, setIsDapilLoading] = useState(true);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isKecamatanLoading, setIsKecamatanLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [kecamatanErrorMessage, setKecamatanErrorMessage] = useState("");

  /**
   * Mengambil access token admin aktif untuk request server admin.
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
   * Memuat daftar dapil yang tersedia.
   *
   * Timer digunakan agar proses yang memicu pembaruan state tidak dipanggil
   * langsung pada fase effect utama.
   */
  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      async function loadDapilList() {
        const supabase = getSupabaseClient();

        try {
          const { data, error } = await supabase
            .from("dapil")
            .select("id, kode, nama, jumlah_kursi")
            .order("id", { ascending: true });

          if (error) {
            throw new Error(error.message);
          }

          if (!isMounted) {
            return;
          }

          const rows = (data as DapilOption[]) ?? [];

          setDapilList(rows);
          setSelectedDapilId(rows[0] ? String(rows[0].id) : "");
          setErrorMessage("");
        } catch (error) {
          if (!isMounted) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Gagal memuat daftar dapil.";

          setErrorMessage(message);
        } finally {
          if (isMounted) {
            setIsDapilLoading(false);
          }
        }
      }

      void loadDapilList();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  /**
   * Memuat dashboard utama berdasarkan dapil aktif.
   *
   * Rekap kecamatan tidak dimuat otomatis agar proses pergantian dapil tetap
   * cepat. Admin dapat memuat rekap kecamatan secara terpisah melalui tombol.
   */
  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      async function loadDashboardData() {
        if (!selectedDapilId) {
          if (!isMounted) {
            return;
          }

          setDashboardData(null);
          setKecamatanData(null);
          setSelectedKecamatan(null);
          return;
        }

        setIsDashboardLoading(true);
        setDashboardData(null);
        setKecamatanData(null);
        setSelectedKecamatan(null);
        setErrorMessage("");
        setKecamatanErrorMessage("");

        try {
          const accessToken = await getAccessToken();

          const response = await fetch(
            `/api/admin/dashboard?dapilId=${selectedDapilId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const result = (await response.json()) as AdminDashboardData;

          if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal memuat dashboard admin.");
          }

          if (!isMounted) {
            return;
          }

          setDashboardData(result);
          setErrorMessage("");
        } catch (error) {
          if (!isMounted) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Gagal memuat dashboard admin.";

          setDashboardData(null);
          setErrorMessage(message);
        } finally {
          if (isMounted) {
            setIsDashboardLoading(false);
          }
        }
      }

      void loadDashboardData();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [selectedDapilId]);

  /**
   * Memuat rekap kecamatan hanya saat diminta oleh admin.
   */
  async function handleLoadKecamatanData() {
    if (!selectedDapilId) {
      return;
    }

    setIsKecamatanLoading(true);
    setKecamatanErrorMessage("");
    setSelectedKecamatan(null);

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `/api/admin/kecamatan?dapilId=${selectedDapilId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = (await response.json()) as AdminKecamatanData;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memuat rekap kecamatan.");
      }

      setKecamatanData(result);
      setKecamatanErrorMessage("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memuat rekap kecamatan.";

      setKecamatanData(null);
      setKecamatanErrorMessage(message);
    } finally {
      setIsKecamatanLoading(false);
    }
  }

  /**
   * Mengurutkan partai berdasarkan nomor urut resmi.
   */
  const sortedPartyList = useMemo(() => {
    return (dashboardData?.partySummaryList ?? []).slice().sort((a, b) => {
      return a.nomorUrut - b.nomorUrut;
    });
  }, [dashboardData]);

  /**
   * Mengurutkan kecamatan berdasarkan nama.
   */
  const sortedKecamatanList = useMemo(() => {
    return (kecamatanData?.kecamatanSummaryList ?? []).slice().sort((a, b) => {
      return a.namaKecamatan.localeCompare(b.namaKecamatan);
    });
  }, [kecamatanData]);

  /**
   * Menghitung kandidat terpilih menggunakan metode Sainte-Laguë.
   */
  const electedCandidateList = useMemo<ElectedCandidate[]>(() => {
    if (!dashboardData) {
      return [];
    }

    const totalSeat = dashboardData.dapil.jumlah_kursi ?? 0;

    if (totalSeat <= 0) {
      return [];
    }

    const quotientList: SainteLagueQuotient[] = [];

    sortedPartyList.forEach((party) => {
      if (party.totalSuara <= 0) {
        return;
      }

      for (let seatIndex = 0; seatIndex < totalSeat; seatIndex += 1) {
        const divisor = seatIndex * 2 + 1;

        quotientList.push({
          partaiId: party.partaiId,
          nomorUrutPartai: party.nomorUrut,
          kursiPartaiKe: seatIndex + 1,
          totalSuaraPartai: party.totalSuara,
          quotient: party.totalSuara / divisor,
        });
      }
    });

    const winningQuotientList = quotientList
      .sort((a, b) => {
        if (b.quotient !== a.quotient) {
          return b.quotient - a.quotient;
        }

        return a.nomorUrutPartai - b.nomorUrutPartai;
      })
      .slice(0, totalSeat);

    const candidateByPartyMap = new Map<number, AdminCandidateSummary[]>();

    dashboardData.candidateSummaryList.forEach((candidate) => {
      const currentList = candidateByPartyMap.get(candidate.partaiId) ?? [];

      currentList.push(candidate);
      candidateByPartyMap.set(candidate.partaiId, currentList);
    });

    candidateByPartyMap.forEach((candidateList, partaiId) => {
      candidateByPartyMap.set(
        partaiId,
        candidateList.slice().sort((a, b) => {
          if (b.totalSuara !== a.totalSuara) {
            return b.totalSuara - a.totalSuara;
          }

          return a.noUrutKandidat - b.noUrutKandidat;
        })
      );
    });

    const selectedCandidateCountByParty = new Map<number, number>();

    return winningQuotientList
      .map((winner, index) => {
        const selectedCount =
          selectedCandidateCountByParty.get(winner.partaiId) ?? 0;

        const candidateList = candidateByPartyMap.get(winner.partaiId) ?? [];
        const candidate = candidateList[selectedCount];

        selectedCandidateCountByParty.set(winner.partaiId, selectedCount + 1);

        if (!candidate) {
          return null;
        }

        return {
          ...candidate,
          peringkatKursi: index + 1,
          kursiPartaiKe: winner.kursiPartaiKe,
          totalSuaraPartai: winner.totalSuaraPartai,
          quotient: winner.quotient,
        };
      })
      .filter((candidate): candidate is ElectedCandidate => {
        return candidate !== null;
      });
  }, [dashboardData, sortedPartyList]);

  const maxPartyVote = useMemo(() => {
    return Math.max(
      1,
      ...sortedPartyList.map((party) => {
        return party.totalSuara;
      })
    );
  }, [sortedPartyList]);

  const maxKecamatanVote = useMemo(() => {
    return Math.max(
      1,
      ...sortedKecamatanList.map((kecamatan) => {
        return kecamatan.totalSuara;
      })
    );
  }, [sortedKecamatanList]);

  if (isDapilLoading) {
    return (
      <section className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-600">
          Memuat daftar dapil...
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

      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Data Semua Dapil
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Dashboard Dapil Admin
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Admin dapat memilih dapil secara bebas untuk melihat rekap partai,
              hasil Sainte-Laguë, wilayah, dan total suara.
            </p>
          </div>

          <div className="lg:min-w-90">
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
        </div>
      </section>

      {isDashboardLoading ? (
        <section className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-600">
            Memuat data dashboard dapil...
          </p>
        </section>
      ) : null}

      {!isDashboardLoading && dashboardData ? (
        <>
          <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                  Dapil Terpilih
                </p>

                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  {dashboardData.dapil.kode} - {dashboardData.dapil.nama}
                </h3>

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Jumlah kursi: {dashboardData.dapil.jumlah_kursi ?? "-"}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                  Total Suara
                </p>

                <p className="mt-1 text-3xl font-black">
                  {formatNumber(dashboardData.totalSeluruhSuara)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Partai
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {formatNumber(sortedPartyList.length)}
                </p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Kandidat
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {formatNumber(dashboardData.candidateSummaryList.length)}
                </p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Kecamatan
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {formatNumber(dashboardData.areaSummary.totalKecamatan)}
                </p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Kelurahan
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {formatNumber(dashboardData.areaSummary.totalKelurahan)}
                </p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                  TPS
                </p>

                <p className="mt-2 text-3xl font-black">
                  {formatNumber(dashboardData.areaSummary.totalTps)}
                </p>
              </article>
            </div>
          </section>

          <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                Rekap Partai
              </p>

              <h3 className="mt-2 text-2xl font-black text-slate-950">
                Perolehan Suara Partai
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Total suara partai merupakan gabungan suara partai murni dan
                suara seluruh kandidat pada dapil aktif.
              </p>
            </div>

            <div className="space-y-3 lg:hidden">
              {sortedPartyList.map((party) => {
                const width = Math.max(
                  4,
                  (party.totalSuara / maxPartyVote) * 100
                );

                return (
                  <article
                    key={party.partaiId}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                          Partai {party.nomorUrut}
                        </p>

                        <h4 className="mt-1 wrap-break-word text-base font-black text-slate-950">
                          {party.namaPartai}
                        </h4>

                        {party.singkatanPartai ? (
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {party.singkatanPartai}
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-lg font-black text-slate-950">
                          {formatNumber(party.totalSuara)}
                        </p>

                        <p className="text-xs font-bold text-blue-600">
                          {formatPercent(party.persenSuara)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-slate-950"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-white px-3 py-2">
                        <p className="text-xs font-bold text-slate-400">
                          Partai
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatNumber(party.suaraPartai)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-3 py-2">
                        <p className="text-xs font-bold text-slate-400">
                          Kandidat
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatNumber(party.suaraKandidat)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-3 py-2">
                        <p className="text-xs font-bold text-slate-400">
                          Caleg
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatNumber(party.jumlahKandidat)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
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
                      Kandidat
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
                  </tr>
                </thead>

                <tbody>
                  {sortedPartyList.map((party, index) => (
                    <tr
                      key={party.partaiId}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="text-sm font-black text-slate-950">
                          {party.nomorUrut}
                        </p>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="text-sm font-black text-slate-950">
                          {party.namaPartai}
                        </p>

                        {party.singkatanPartai ? (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {party.singkatanPartai}
                          </p>
                        ) : null}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                        {formatNumber(party.jumlahKandidat)}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                        {formatNumber(party.suaraPartai)}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                        {formatNumber(party.suaraKandidat)}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                        {formatNumber(party.totalSuara)}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                        {formatPercent(party.persenSuara)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                  Rekap Kecamatan
                </p>

                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  Perolehan Suara per Kecamatan
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Rekap kecamatan dimuat terpisah agar pergantian dapil tetap
                  cepat dan tidak membaca data besar sebelum diperlukan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  void handleLoadKecamatanData();
                }}
                disabled={isKecamatanLoading}
                className="w-fit rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isKecamatanLoading
                  ? "Memuat..."
                  : kecamatanData
                    ? "Muat Ulang Rekap Kecamatan"
                    : "Muat Rekap Kecamatan"}
              </button>
            </div>

            {kecamatanErrorMessage ? (
              <section className="mb-5 rounded-4xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-bold text-red-700">
                  {kecamatanErrorMessage}
                </p>
              </section>
            ) : null}

            {!kecamatanData && !isKecamatanLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Rekap kecamatan belum dimuat. Klik tombol Muat Rekap
                  Kecamatan untuk melihat detail per kecamatan.
                </p>
              </div>
            ) : null}

            {kecamatanData ? (
              <>
                <div className="space-y-3 lg:hidden">
                  {sortedKecamatanList.map((kecamatan) => {
                    const width = Math.max(
                      4,
                      (kecamatan.totalSuara / maxKecamatanVote) * 100
                    );

                    return (
                      <article
                        key={kecamatan.kecamatanId}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                              Kecamatan
                            </p>

                            <h4 className="mt-1 wrap-break-word text-base font-black text-slate-950">
                              {kecamatan.namaKecamatan}
                            </h4>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-lg font-black text-slate-950">
                              {formatNumber(kecamatan.totalSuara)}
                            </p>

                            <p className="text-xs font-bold text-blue-600">
                              {formatPercent(kecamatan.persenSuara)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-slate-950"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-xs font-bold text-slate-400">
                              Kelurahan
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-950">
                              {formatNumber(kecamatan.totalKelurahan)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-xs font-bold text-slate-400">
                              TPS
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-950">
                              {formatNumber(kecamatan.totalTps)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-xs font-bold text-slate-400">
                              Partai
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-950">
                              {formatNumber(kecamatan.suaraPartai)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-xs font-bold text-slate-400">
                              Kandidat
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-950">
                              {formatNumber(kecamatan.suaraKandidat)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedKecamatan(kecamatan)}
                          className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                        >
                          Detail
                        </button>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
                  <table className="min-w-full border-collapse bg-white">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                          Kecamatan
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                          Kelurahan
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                          TPS
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
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {sortedKecamatanList.map((kecamatan, index) => (
                        <tr
                          key={kecamatan.kecamatanId}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }
                        >
                          <td className="border-b border-slate-100 px-4 py-4">
                            <p className="text-sm font-black text-slate-950">
                              {kecamatan.namaKecamatan}
                            </p>
                          </td>

                          <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                            {formatNumber(kecamatan.totalKelurahan)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                            {formatNumber(kecamatan.totalTps)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                            {formatNumber(kecamatan.suaraPartai)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                            {formatNumber(kecamatan.suaraKandidat)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                            {formatNumber(kecamatan.totalSuara)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-4 text-center text-sm font-black text-slate-950">
                            {formatPercent(kecamatan.persenSuara)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedKecamatan(kecamatan)}
                              className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {sortedKecamatanList.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      Belum ada data kecamatan pada dapil ini.
                    </p>
                  </div>
                ) : null}

                {selectedKecamatan ? (
                  <div className="mt-5">
                    <AdminKecamatanDetailPanel
                      dapilId={Number(selectedDapilId)}
                      kecamatanId={selectedKecamatan.kecamatanId}
                      onClose={() => setSelectedKecamatan(null)}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </section>

          <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                Hasil Sainte-Laguë
              </p>

              <h3 className="mt-2 text-2xl font-black text-slate-950">
                Kandidat Terpilih Sementara
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Kursi dihitung dari total suara partai menggunakan metode
                Sainte-Laguë. Kandidat terpilih diambil dari suara tertinggi di
                masing-masing partai pemenang kursi.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {electedCandidateList.map((candidate) => (
                <article
                  key={`${candidate.partaiId}-${candidate.kandidatId}-${candidate.peringkatKursi}`}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                      Kursi #{candidate.peringkatKursi}
                    </span>

                    <span className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-blue-700">
                      Partai {candidate.nomorUrutPartai}
                    </span>
                  </div>

                  <h4 className="mt-4 wrap-break-word text-sm font-black leading-tight text-slate-950">
                    {candidate.noUrutKandidat}. {candidate.namaKandidat}
                  </h4>

                  <p className="mt-2 wrap-break-word text-xs font-bold leading-tight text-slate-500">
                    {candidate.namaPartai}
                    {candidate.singkatanPartai
                      ? ` (${candidate.singkatanPartai})`
                      : ""}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-white px-3 py-2">
                      <p className="text-xs font-bold text-slate-400">
                        Suara Caleg
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-950">
                        {formatNumber(candidate.totalSuara)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-3 py-2">
                      <p className="text-xs font-bold text-slate-400">
                        Kursi Partai
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-950">
                        Ke-{candidate.kursiPartaiKe}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-white px-3 py-2">
                    <p className="text-xs font-bold text-slate-400">
                      Nilai Sainte-Laguë
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-950">
                      {formatNumber(Math.round(candidate.quotient))}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {electedCandidateList.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Belum ada hasil Sainte-Laguë untuk dapil ini.
                </p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );
}