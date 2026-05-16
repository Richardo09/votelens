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

type KelurahanOption = {
  id: number;
  nama: string;
  dapil_id: number;
  kecamatan_id: number | null;
};

type PartyOption = {
  id: number;
  nomor_urut: number;
  nama: string;
  singkatan: string | null;
};

type CandidateRecord = {
  id: number;
  dapil_id: number;
  partai_id: number;
  no_urut: number;
  nama: string;
};

type TpsRecord = {
  id: number;
  kelurahan_id: number;
  nomor_tps: number;
};

type CandidateVoteRecord = {
  tps_id: number;
  kandidat_id: number;
  jumlah_suara: number;
};

type PartyVoteRecord = {
  jumlah_suara: number;
};

type AdminApiResponse = {
  success: boolean;
  message: string;
  savedCandidateRows?: number;
  savedPartyVote?: number;
};

type VoteMatrix = Record<number, Record<number, string>>;

/**
 * Mengubah nilai menjadi angka yang aman untuk perhitungan suara.
 */
function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

/**
 * Mengelola input suara partai dan kandidat per TPS untuk admin.
 */
export default function AdminVoteInputManagement() {
  const [dapilList, setDapilList] = useState<DapilOption[]>([]);
  const [kecamatanList, setKecamatanList] = useState<KecamatanOption[]>([]);
  const [kelurahanList, setKelurahanList] = useState<KelurahanOption[]>([]);
  const [partyList, setPartyList] = useState<PartyOption[]>([]);
  const [candidateList, setCandidateList] = useState<CandidateRecord[]>([]);
  const [tpsList, setTpsList] = useState<TpsRecord[]>([]);

  const [selectedDapilId, setSelectedDapilId] = useState("");
  const [selectedKecamatanId, setSelectedKecamatanId] = useState("");
  const [selectedKelurahanId, setSelectedKelurahanId] = useState("");
  const [selectedPartaiId, setSelectedPartaiId] = useState("");

  const [suaraPartai, setSuaraPartai] = useState("");
  const [voteMatrix, setVoteMatrix] = useState<VoteMatrix>({});

  const [isMasterLoading, setIsMasterLoading] = useState(true);
  const [isAreaLoading, setIsAreaLoading] = useState(false);
  const [isVoteLoading, setIsVoteLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

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
   * Memuat daftar dapil dan partai sebagai data awal form input suara.
   */
  const loadMasterData = useCallback(async () => {
    const supabase = getSupabaseClient();

    const [dapilResponse, partyResponse] = await Promise.all([
      supabase
        .from("dapil")
        .select("id, kode, nama")
        .order("id", { ascending: true }),

      supabase
        .from("partai")
        .select("id, nomor_urut, nama, singkatan")
        .order("nomor_urut", { ascending: true }),
    ]);

    if (dapilResponse.error) {
      throw new Error(dapilResponse.error.message);
    }

    if (partyResponse.error) {
      throw new Error(partyResponse.error.message);
    }

    const dapilRows = (dapilResponse.data as DapilOption[]) ?? [];
    const partyRows = (partyResponse.data as PartyOption[]) ?? [];

    setDapilList(dapilRows);
    setPartyList(partyRows);

    setSelectedDapilId((current) => {
      return current || (dapilRows[0] ? String(dapilRows[0].id) : "");
    });

    setSelectedPartaiId((current) => {
      return current || (partyRows[0] ? String(partyRows[0].id) : "");
    });
  }, []);

  /**
   * Memuat daftar kecamatan dan kelurahan berdasarkan dapil aktif.
   */
  const loadAreaData = useCallback(async (dapilId: string) => {
    if (!dapilId) {
      setKecamatanList([]);
      setKelurahanList([]);
      setSelectedKecamatanId("");
      setSelectedKelurahanId("");
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

      const kelurahanRows = (kelurahanData as KelurahanOption[]) ?? [];

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

      const firstKecamatanId = kecamatanRows[0]
        ? String(kecamatanRows[0].id)
        : "";

      const firstKelurahan = firstKecamatanId
        ? kelurahanRows.find((kelurahan) => {
            return kelurahan.kecamatan_id === Number(firstKecamatanId);
          })
        : kelurahanRows[0];

      setKecamatanList(kecamatanRows);
      setKelurahanList(kelurahanRows);
      setSelectedKecamatanId(firstKecamatanId);
      setSelectedKelurahanId(firstKelurahan ? String(firstKelurahan.id) : "");
      setErrorMessage("");
    } finally {
      setIsAreaLoading(false);
    }
  }, []);

  /**
   * Memuat TPS, kandidat, dan suara yang sudah tersimpan.
   */
  const loadVoteData = useCallback(async () => {
    if (!selectedDapilId || !selectedKelurahanId || !selectedPartaiId) {
      setCandidateList([]);
      setTpsList([]);
      setSuaraPartai("");
      setVoteMatrix({});
      return;
    }

    const supabase = getSupabaseClient();

    setIsVoteLoading(true);

    try {
      const [
        candidateResponse,
        tpsResponse,
        partyVoteResponse,
        candidateVoteResponse,
      ] = await Promise.all([
        supabase
          .from("kandidat")
          .select("id, dapil_id, partai_id, no_urut, nama")
          .eq("dapil_id", Number(selectedDapilId))
          .eq("partai_id", Number(selectedPartaiId))
          .order("no_urut", { ascending: true }),

        supabase
          .from("tps")
          .select("id, kelurahan_id, nomor_tps")
          .eq("kelurahan_id", Number(selectedKelurahanId))
          .order("nomor_tps", { ascending: true }),

        supabase
          .from("suara_partai_kelurahan")
          .select("jumlah_suara")
          .eq("dapil_id", Number(selectedDapilId))
          .eq("kelurahan_id", Number(selectedKelurahanId))
          .eq("partai_id", Number(selectedPartaiId)),

        supabase
          .from("suara_kandidat_tps")
          .select("tps_id, kandidat_id, jumlah_suara")
          .eq("dapil_id", Number(selectedDapilId))
          .eq("kelurahan_id", Number(selectedKelurahanId)),
      ]);

      if (candidateResponse.error) {
        throw new Error(candidateResponse.error.message);
      }

      if (tpsResponse.error) {
        throw new Error(tpsResponse.error.message);
      }

      if (partyVoteResponse.error) {
        throw new Error(partyVoteResponse.error.message);
      }

      if (candidateVoteResponse.error) {
        throw new Error(candidateVoteResponse.error.message);
      }

      const candidateRows = (candidateResponse.data as CandidateRecord[]) ?? [];
      const tpsRows = (tpsResponse.data as TpsRecord[]) ?? [];
      const partyVoteRows = (partyVoteResponse.data as PartyVoteRecord[]) ?? [];
      const candidateVoteRows =
        (candidateVoteResponse.data as CandidateVoteRecord[]) ?? [];

      const candidateIdSet = new Set(
        candidateRows.map((candidate) => candidate.id)
      );

      const nextMatrix: VoteMatrix = {};

      candidateRows.forEach((candidate) => {
        nextMatrix[candidate.id] = {};

        tpsRows.forEach((tps) => {
          nextMatrix[candidate.id][tps.id] = "";
        });
      });

      candidateVoteRows.forEach((vote) => {
        if (!candidateIdSet.has(Number(vote.kandidat_id))) {
          return;
        }

        if (!nextMatrix[vote.kandidat_id]) {
          nextMatrix[vote.kandidat_id] = {};
        }

        nextMatrix[vote.kandidat_id][vote.tps_id] = String(
          toNumber(vote.jumlah_suara)
        );
      });

      const totalPartyVote = partyVoteRows.reduce((total, row) => {
        return total + toNumber(row.jumlah_suara);
      }, 0);

      setCandidateList(candidateRows);
      setTpsList(tpsRows);
      setVoteMatrix(nextMatrix);
      setSuaraPartai(totalPartyVote > 0 ? String(totalPartyVote) : "");
      setErrorMessage("");
    } finally {
      setIsVoteLoading(false);
    }
  }, [selectedDapilId, selectedKelurahanId, selectedPartaiId]);

  /**
   * Memuat data master saat modul pertama kali dibuka.
   *
   * Pemanggilan dijadwalkan melalui timer agar tidak dianggap sebagai setState
   * langsung di dalam effect oleh aturan lint React.
   */
  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      async function loadInitialData() {
        try {
          await loadMasterData();

          if (!isMounted) {
            return;
          }

          setErrorMessage("");
        } catch (error) {
          if (!isMounted) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Gagal memuat data awal input suara.";

          setErrorMessage(message);
        } finally {
          if (isMounted) {
            setIsMasterLoading(false);
          }
        }
      }

      void loadInitialData();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadMasterData]);

  /**
   * Memuat ulang wilayah saat dapil aktif berubah.
   *
   * Timer digunakan agar proses pembaruan state tidak berjalan langsung pada
   * fase effect utama.
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
   * Memuat ulang suara saat pilihan dapil, kelurahan, atau partai berubah.
   *
   * Timer digunakan untuk memenuhi aturan react-hooks/set-state-in-effect dan
   * menjaga proses pemuatan tetap terpisah dari fase render/effect utama.
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadVoteData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadVoteData]);

  /**
   * Mengubah nilai suara kandidat pada satu TPS.
   */
  function handleChangeCandidateVote(
    kandidatId: number,
    tpsId: number,
    value: string
  ) {
    const cleanValue = value.replace(/[^\d]/g, "");

    setVoteMatrix((current) => {
      return {
        ...current,
        [kandidatId]: {
          ...(current[kandidatId] ?? {}),
          [tpsId]: cleanValue,
        },
      };
    });
  }

  /**
   * Menyimpan seluruh suara partai dan kandidat pada pilihan aktif.
   */
  async function handleSaveVotes() {
    setIsSubmitting(true);
    setErrorMessage("");
    setActionMessage("");

    try {
      const accessToken = await getAccessToken();

      const kandidatVotes = candidateList.flatMap((candidate) => {
        return tpsList.map((tps) => {
          return {
            kandidatId: candidate.id,
            tpsId: tps.id,
            jumlahSuara: toNumber(voteMatrix[candidate.id]?.[tps.id] ?? 0),
          };
        });
      });

      const response = await fetch("/api/admin/votes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dapilId: Number(selectedDapilId),
          kelurahanId: Number(selectedKelurahanId),
          partaiId: Number(selectedPartaiId),
          suaraPartai: toNumber(suaraPartai),
          kandidatVotes,
        }),
      });

      const result = (await response.json()) as AdminApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan data suara.");
      }

      await loadVoteData();
      setActionMessage(result.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan data suara.";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedDapil = useMemo(() => {
    return (
      dapilList.find((dapil) => dapil.id === Number(selectedDapilId)) ?? null
    );
  }, [dapilList, selectedDapilId]);

  const selectedPartai = useMemo(() => {
    return (
      partyList.find((partai) => partai.id === Number(selectedPartaiId)) ?? null
    );
  }, [partyList, selectedPartaiId]);

  const filteredKelurahanList = useMemo(() => {
    if (!selectedKecamatanId) {
      return kelurahanList;
    }

    return kelurahanList.filter((kelurahan) => {
      return kelurahan.kecamatan_id === Number(selectedKecamatanId);
    });
  }, [kelurahanList, selectedKecamatanId]);

  const candidateTotalMap = useMemo(() => {
    const totalMap = new Map<number, number>();

    candidateList.forEach((candidate) => {
      const total = tpsList.reduce((sum, tps) => {
        return sum + toNumber(voteMatrix[candidate.id]?.[tps.id] ?? 0);
      }, 0);

      totalMap.set(candidate.id, total);
    });

    return totalMap;
  }, [candidateList, tpsList, voteMatrix]);

  const tpsTotalMap = useMemo(() => {
    const totalMap = new Map<number, number>();

    tpsList.forEach((tps) => {
      const total = candidateList.reduce((sum, candidate) => {
        return sum + toNumber(voteMatrix[candidate.id]?.[tps.id] ?? 0);
      }, 0);

      totalMap.set(tps.id, total);
    });

    return totalMap;
  }, [candidateList, tpsList, voteMatrix]);

  const totalSuaraKandidat = useMemo(() => {
    return candidateList.reduce((total, candidate) => {
      return total + (candidateTotalMap.get(candidate.id) ?? 0);
    }, 0);
  }, [candidateList, candidateTotalMap]);

  const totalSuaraPartai = toNumber(suaraPartai);
  const totalKeseluruhan = totalSuaraPartai + totalSuaraKandidat;

  if (isMasterLoading) {
    return (
      <section className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-600">
          Memuat modul input suara...
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
          <p className="text-sm font-bold text-emerald-700">{actionMessage}</p>
        </section>
      ) : null}

      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Input Suara
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Input Suara Partai dan Kandidat
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pilih dapil, kecamatan, kelurahan, dan partai. Baris Suara Partai
              selalu berada di posisi paling atas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveVotes}
            disabled={isSubmitting || isVoteLoading || candidateList.length === 0}
            className="w-fit rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Suara"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Dapil
            </label>

            <select
              value={selectedDapilId}
              onChange={(event) => {
                setSelectedDapilId(event.target.value);
                setActionMessage("");
              }}
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
              onChange={(event) => {
                const nextKecamatanId = event.target.value;

                const nextKelurahan = kelurahanList.find((kelurahan) => {
                  return kelurahan.kecamatan_id === Number(nextKecamatanId);
                });

                setSelectedKecamatanId(nextKecamatanId);
                setSelectedKelurahanId(
                  nextKelurahan ? String(nextKelurahan.id) : ""
                );
                setActionMessage("");
              }}
              disabled={isAreaLoading}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {kecamatanList.map((kecamatan) => (
                <option key={kecamatan.id} value={kecamatan.id}>
                  {kecamatan.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Kelurahan
            </label>

            <select
              value={selectedKelurahanId}
              onChange={(event) => {
                setSelectedKelurahanId(event.target.value);
                setActionMessage("");
              }}
              disabled={isAreaLoading}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {filteredKelurahanList.map((kelurahan) => (
                <option key={kelurahan.id} value={kelurahan.id}>
                  {kelurahan.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Partai
            </label>

            <select
              value={selectedPartaiId}
              onChange={(event) => {
                setSelectedPartaiId(event.target.value);
                setActionMessage("");
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950"
            >
              {partyList.map((partai) => (
                <option key={partai.id} value={partai.id}>
                  {partai.nomor_urut}. {partai.nama}
                  {partai.singkatan ? ` (${partai.singkatan})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Dapil
          </p>

          <p className="mt-2 text-lg font-black text-slate-950">
            {selectedDapil?.kode ?? "-"}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-600">
            {selectedDapil?.nama ?? "-"}
          </p>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            Partai
          </p>

          <p className="mt-2 text-lg font-black text-slate-950">
            {selectedPartai
              ? `${selectedPartai.nomor_urut}. ${selectedPartai.nama}`
              : "-"}
          </p>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            Kandidat
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {candidateList.length}
          </p>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-300">
            Total Suara
          </p>

          <p className="mt-2 text-3xl font-black">{totalKeseluruhan}</p>
        </article>
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h3 className="text-xl font-black text-slate-950">
            Tabel Input Suara
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Suara Partai berada di baris pertama. Suara kandidat diisi per TPS.
            Geser tabel ke kanan untuk melihat seluruh TPS.
          </p>
        </div>

        {isVoteLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-600">
              Memuat data suara...
            </p>
          </div>
        ) : null}

        {!isVoteLoading && candidateList.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Belum ada kandidat pada partai dan dapil yang dipilih.
            </p>
          </div>
        ) : null}

        {!isVoteLoading && candidateList.length > 0 ? (
          <div className="max-w-full overflow-auto rounded-3xl border border-slate-200">
            <table className="min-w-max border-collapse bg-white">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="sticky left-0 top-0 z-40 w-56 bg-slate-950 px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide sm:w-72 sm:px-4 sm:text-xs">
                    Nama / Jenis Suara
                  </th>

                  {tpsList.map((tps) => (
                    <th
                      key={tps.id}
                      className="sticky top-0 z-30 min-w-20 bg-slate-950 px-3 py-3 text-center text-[10px] font-black uppercase tracking-wide sm:min-w-24 sm:px-4 sm:text-xs"
                    >
                      TPS {tps.nomor_tps}
                    </th>
                  ))}

                  <th className="sticky top-0 z-30 min-w-28 bg-slate-950 px-3 py-3 text-center text-[10px] font-black uppercase tracking-wide sm:px-4 sm:text-xs">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className="bg-blue-50">
                  <td className="sticky left-0 z-20 border-b border-blue-100 bg-blue-50 px-3 py-3 sm:px-4">
                    <p className="text-[11px] font-black leading-tight text-blue-800 sm:text-sm">
                      Suara Partai
                    </p>
                  </td>

                  {tpsList.map((tps) => (
                    <td
                      key={`suara-partai-empty-${tps.id}`}
                      className="border-b border-blue-100 px-3 py-3 text-center text-sm font-black text-blue-800 sm:px-4"
                    >
                      -
                    </td>
                  ))}

                  <td className="border-b border-blue-100 px-3 py-3 text-center sm:px-4">
                    <input
                      value={suaraPartai}
                      onChange={(event) => {
                        setSuaraPartai(
                          event.target.value.replace(/[^\d]/g, "")
                        );
                      }}
                      placeholder="0"
                      className="w-20 rounded-xl border border-blue-200 bg-white px-3 py-2 text-center text-sm font-black text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-blue-600"
                    />
                  </td>
                </tr>

                {candidateList.map((candidate, index) => (
                  <tr
                    key={candidate.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="sticky left-0 z-20 border-b border-slate-100 bg-inherit px-3 py-3 sm:px-4">
                      <p className="text-[11px] font-black leading-tight text-slate-950 sm:text-sm">
                        {candidate.no_urut}. {candidate.nama}
                      </p>
                    </td>

                    {tpsList.map((tps) => (
                      <td
                        key={`${candidate.id}-${tps.id}`}
                        className="border-b border-slate-100 px-2 py-2 text-center sm:px-3"
                      >
                        <input
                          value={voteMatrix[candidate.id]?.[tps.id] ?? ""}
                          onChange={(event) =>
                            handleChangeCandidateVote(
                              candidate.id,
                              tps.id,
                              event.target.value
                            )
                          }
                          placeholder="0"
                          className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm font-black text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-slate-950"
                        />
                      </td>
                    ))}

                    <td className="border-b border-slate-100 px-3 py-3 text-center text-sm font-black text-slate-950 sm:px-4">
                      {candidateTotalMap.get(candidate.id) ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-slate-950 text-white">
                  <td className="sticky left-0 z-20 bg-slate-950 px-3 py-3 text-right text-xs font-black sm:px-4 sm:text-sm">
                    Total Kandidat per TPS
                  </td>

                  {tpsList.map((tps) => (
                    <td
                      key={`tps-total-${tps.id}`}
                      className="px-3 py-3 text-center text-xs font-black sm:px-4 sm:text-sm"
                    >
                      {tpsTotalMap.get(tps.id) ?? 0}
                    </td>
                  ))}

                  <td className="px-3 py-3 text-center text-xs font-black sm:px-4 sm:text-sm">
                    {totalSuaraKandidat}
                  </td>
                </tr>

                <tr className="bg-slate-900 text-white">
                  <td className="sticky left-0 z-20 bg-slate-900 px-3 py-3 text-right text-xs font-black sm:px-4 sm:text-sm">
                    Total Keseluruhan
                  </td>

                  {tpsList.map((tps) => (
                    <td
                      key={`overall-empty-${tps.id}`}
                      className="px-3 py-3 text-center text-xs font-black sm:px-4 sm:text-sm"
                    >
                      -
                    </td>
                  ))}

                  <td className="px-3 py-3 text-center text-xs font-black sm:px-4 sm:text-sm">
                    {totalKeseluruhan}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}
      </section>
    </section>
  );
}