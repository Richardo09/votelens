import { getSupabaseClient } from "@/lib/supabase";
import type {
  CandidateKecamatanSummaryItem,
  CandidateTpsDetailItem,
  DashboardData,
  DapilItem,
  ElectedCandidateItem,
  KecamatanPartaiKandidatKelurahanItem,
  KecamatanPartaiKelurahanTpsItem,
  KecamatanPartySummaryItem,
  KecamatanTopCandidateItem,
  KelurahanPartySummaryItem,
  KelurahanSummaryItem,
  KelurahanTopCandidateItem,
  UserProfile,
} from "./types";

/**
 * Mengambil pesan error dari response Supabase agar pesan error tetap konsisten.
 */
function getErrorMessage(error: { message?: string } | null | undefined) {
  return error?.message ?? "Terjadi kesalahan saat memuat data.";
}

/**
 * Mengubah nilai database menjadi number yang aman.
 */
function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

/**
 * Membuat key unik gabungan TPS dan kandidat.
 */
function createTpsCandidateKey(tpsId: number, kandidatId: number) {
  return `${tpsId}-${kandidatId}`;
}

/**
 * Mengambil seluruh data Supabase secara bertahap.
 *
 * Supabase/PostgREST biasanya membatasi hasil select sekitar 1000 baris.
 * Dengan helper ini, data besar seperti 90 TPS x banyak kandidat tidak akan
 * terpotong di tengah.
 */
async function fetchAllRows<T>(
  queryBuilder: {
    range: (from: number, to: number) => unknown;
  },
  batchSize = 1000
): Promise<T[]> {
  const allRows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + batchSize - 1;

    const response = (await queryBuilder.range(from, to)) as {
      data: T[] | null;
      error: { message?: string } | null;
    };

    if (response.error) {
      throw new Error(getErrorMessage(response.error));
    }

    const rows = response.data ?? [];
    allRows.push(...rows);

    if (rows.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  return allRows;
}

/**
 * Memuat data utama dashboard berdasarkan user yang sedang login.
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, nama, role, dapil_id")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profileData) {
    throw new Error("Profile user tidak ditemukan.");
  }

  const profile = profileData as UserProfile;

  if (!profile.dapil_id) {
    throw new Error("User ini belum memiliki akses dapil.");
  }

  const { data: dapilData, error: dapilError } = await supabase
    .from("dapil")
    .select("id, kode, nama, jumlah_kursi")
    .eq("id", profile.dapil_id)
    .single();

  if (dapilError || !dapilData) {
    throw new Error("Data dapil user tidak ditemukan.");
  }

  const dapil = dapilData as DapilItem;
  const jumlahKursi = dapil.jumlah_kursi ?? 12;

  const [
    partaiResponse,
    partySummaryResponse,
    candidateSummaryResponse,
    electionStatusResponse,
    kecamatanSummaryResponse,
    electedCandidateResponse,
  ] = await Promise.all([
    supabase
      .from("partai")
      .select("id, nomor_urut, nama, singkatan, logo_path")
      .order("nomor_urut", { ascending: true }),

    supabase.rpc("votelens_party_summary_for_current_user"),

    supabase.rpc("votelens_candidate_summary_for_current_user"),

    supabase.rpc("votelens_sainte_lague_status_for_current_user"),

    supabase.rpc("votelens_kecamatan_summary_for_current_user"),

    supabase.rpc("votelens_elected_candidates_ordered_for_current_user", {
      target_total_kursi: jumlahKursi,
    }),
  ]);

  if (partaiResponse.error) {
    throw new Error(getErrorMessage(partaiResponse.error));
  }

  if (partySummaryResponse.error) {
    throw new Error(getErrorMessage(partySummaryResponse.error));
  }

  if (candidateSummaryResponse.error) {
    throw new Error(getErrorMessage(candidateSummaryResponse.error));
  }

  if (electionStatusResponse.error) {
    throw new Error(getErrorMessage(electionStatusResponse.error));
  }

  if (kecamatanSummaryResponse.error) {
    throw new Error(getErrorMessage(kecamatanSummaryResponse.error));
  }

  if (electedCandidateResponse.error) {
    throw new Error(getErrorMessage(electedCandidateResponse.error));
  }

  return {
    profile,
    dapil,
    partaiList: partaiResponse.data ?? [],
    partySummaryList: partySummaryResponse.data ?? [],
    candidateSummaryList: candidateSummaryResponse.data ?? [],
    electionStatusList: electionStatusResponse.data ?? [],
    kecamatanSummaryList: kecamatanSummaryResponse.data ?? [],
    electedCandidateList:
      (electedCandidateResponse.data as ElectedCandidateItem[]) ?? [],
  };
}

/**
 * Memuat rekap partai pada satu kecamatan.
 */
export async function fetchKecamatanPartySummary(
  kecamatanId: number
): Promise<KecamatanPartySummaryItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "votelens_kecamatan_party_summary_for_current_user",
    {
      target_kecamatan_id: kecamatanId,
    }
  );

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data as KecamatanPartySummaryItem[]) ?? [];
}

/**
 * Memuat top kandidat perorangan pada satu kecamatan.
 */
export async function fetchKecamatanTopCandidates(params: {
  kecamatanId: number;
  limit?: number;
}): Promise<KecamatanTopCandidateItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "votelens_kecamatan_top_candidates_for_current_user",
    {
      target_kecamatan_id: params.kecamatanId,
      target_limit: params.limit ?? 5,
    }
  );

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data as KecamatanTopCandidateItem[]) ?? [];
}

/**
 * Memuat daftar kelurahan berdasarkan kecamatan yang dipilih.
 */
export async function fetchKelurahanSummaryByKecamatan(
  kecamatanId: number
): Promise<KelurahanSummaryItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "votelens_kelurahan_summary_by_kecamatan_for_current_user",
    {
      target_kecamatan_id: kecamatanId,
    }
  );

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data as KelurahanSummaryItem[]) ?? [];
}

/**
 * Memuat rekap partai pada satu kelurahan.
 */
export async function fetchKelurahanPartySummary(
  kelurahanId: number
): Promise<KelurahanPartySummaryItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "votelens_kelurahan_party_summary_for_current_user",
    {
      target_kelurahan_id: kelurahanId,
    }
  );

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data as KelurahanPartySummaryItem[]) ?? [];
}

/**
 * Memuat top kandidat perorangan pada satu kelurahan.
 */
export async function fetchKelurahanTopCandidates(params: {
  kelurahanId: number;
  limit?: number;
}): Promise<KelurahanTopCandidateItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "votelens_kelurahan_top_candidates_for_current_user",
    {
      target_kelurahan_id: params.kelurahanId,
      target_limit: params.limit ?? 5,
    }
  );

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data as KelurahanTopCandidateItem[]) ?? [];
}

/**
 * Memuat rekap suara kandidat berdasarkan kecamatan untuk satu kandidat.
 */
export async function fetchCandidateKecamatanSummary(
  kandidatId: number
): Promise<CandidateKecamatanSummaryItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "votelens_candidate_kecamatan_summary_for_current_user",
    {
      target_kandidat_id: kandidatId,
    }
  );

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data as CandidateKecamatanSummaryItem[]) ?? [];
}

/**
 * Memuat detail suara kandidat per TPS dalam satu kecamatan.
 */
export async function fetchCandidateTpsByKecamatan(params: {
  kandidatId: number;
  kecamatanId: number;
}): Promise<CandidateTpsDetailItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "votelens_candidate_tps_detail_by_kecamatan_for_current_user",
    {
      target_kandidat_id: params.kandidatId,
      target_kecamatan_id: params.kecamatanId,
    }
  );

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data as CandidateTpsDetailItem[]) ?? [];
}

/**
 * Memuat detail kandidat partai per kelurahan dalam satu kecamatan.
 */
export async function fetchPartyKelurahanDetail(params: {
  kecamatanId: number;
  partaiId: number;
}): Promise<KecamatanPartaiKandidatKelurahanItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "votelens_kecamatan_partai_kandidat_kelurahan_for_current_user",
    {
      target_kecamatan_id: params.kecamatanId,
      target_partai_id: params.partaiId,
    }
  );

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data as KecamatanPartaiKandidatKelurahanItem[]) ?? [];
}

/**
 * Memuat detail TPS untuk partai pada satu kelurahan.
 *
 * Logika ini membaca langsung berdasarkan:
 * - partai yang dipilih
 * - kelurahan yang dipilih
 *
 * Data TPS diambil dari master TPS kelurahan tersebut.
 * Data suara diambil dari suara_kandidat_tps dengan pagination agar tidak
 * terpotong saat jumlah baris lebih dari 1000.
 */
export async function fetchPartyKelurahanTpsDetail(params: {
  kecamatanId: number;
  partaiId: number;
  kelurahanId: number;
}): Promise<KecamatanPartaiKelurahanTpsItem[]> {
  const supabase = getSupabaseClient();

  const { data: kelurahanData, error: kelurahanError } = await supabase
    .from("kelurahan")
    .select("id, nama, dapil_id, kecamatan_id")
    .eq("id", params.kelurahanId)
    .single();

  if (kelurahanError || !kelurahanData) {
    throw new Error("Data kelurahan tidak ditemukan.");
  }

  const { data: kecamatanData, error: kecamatanError } = await supabase
    .from("kecamatan")
    .select("id, nama")
    .eq("id", kelurahanData.kecamatan_id)
    .single();

  if (kecamatanError || !kecamatanData) {
    throw new Error("Data kecamatan kelurahan tidak ditemukan.");
  }

  const { data: partaiData, error: partaiError } = await supabase
    .from("partai")
    .select("id, nomor_urut, nama, singkatan, logo_path")
    .eq("id", params.partaiId)
    .single();

  if (partaiError || !partaiData) {
    throw new Error("Data partai tidak ditemukan.");
  }

  const { data: kandidatData, error: kandidatError } = await supabase
    .from("kandidat")
    .select("id, no_urut, nama, foto_path, partai_id, dapil_id")
    .eq("dapil_id", kelurahanData.dapil_id)
    .eq("partai_id", params.partaiId)
    .order("no_urut", { ascending: true });

  if (kandidatError) {
    throw new Error(getErrorMessage(kandidatError));
  }

  const kandidatList = kandidatData ?? [];

  if (kandidatList.length === 0) {
    return [];
  }

  const { data: tpsData, error: tpsError } = await supabase
    .from("tps")
    .select("id, nomor_tps, kelurahan_id")
    .eq("kelurahan_id", params.kelurahanId)
    .order("nomor_tps", { ascending: true });

  if (tpsError) {
    throw new Error(getErrorMessage(tpsError));
  }

  const tpsList = tpsData ?? [];
  const kandidatIdList = kandidatList.map((kandidat) => kandidat.id);

  const suaraKandidatRows = await fetchAllRows<{
    tps_id: number | string | null;
    kandidat_id: number | string | null;
    jumlah_suara: number | string | null;
    dapil_id: number | string | null;
    kelurahan_id: number | string | null;
  }>(
    supabase
      .from("suara_kandidat_tps")
      .select("tps_id, kandidat_id, jumlah_suara, dapil_id, kelurahan_id")
      .eq("dapil_id", kelurahanData.dapil_id)
      .eq("kelurahan_id", params.kelurahanId)
      .in("kandidat_id", kandidatIdList)
      .order("tps_id", { ascending: true })
      .order("kandidat_id", { ascending: true })
  );

  const suaraPartaiRows = await fetchAllRows<{
    jumlah_suara: number | string | null;
    dapil_id: number | string | null;
    kelurahan_id: number | string | null;
    partai_id: number | string | null;
  }>(
    supabase
      .from("suara_partai_kelurahan")
      .select("jumlah_suara, dapil_id, kelurahan_id, partai_id")
      .eq("dapil_id", kelurahanData.dapil_id)
      .eq("kelurahan_id", params.kelurahanId)
      .eq("partai_id", params.partaiId)
  );

  const suaraMap = new Map<string, number>();
  const candidateTotalMap = new Map<number, number>();
  const tpsTotalMap = new Map<number, number>();

  suaraKandidatRows.forEach((row) => {
    const tpsId = toNumber(row.tps_id);
    const kandidatId = toNumber(row.kandidat_id);
    const jumlahSuara = toNumber(row.jumlah_suara);
    const key = createTpsCandidateKey(tpsId, kandidatId);

    suaraMap.set(key, (suaraMap.get(key) ?? 0) + jumlahSuara);
    candidateTotalMap.set(
      kandidatId,
      (candidateTotalMap.get(kandidatId) ?? 0) + jumlahSuara
    );
    tpsTotalMap.set(tpsId, (tpsTotalMap.get(tpsId) ?? 0) + jumlahSuara);
  });

  const totalSuaraKandidatKelurahan = Array.from(
    candidateTotalMap.values()
  ).reduce((total, jumlahSuara) => {
    return total + jumlahSuara;
  }, 0);

  const suaraPartaiMurniKelurahan = suaraPartaiRows.reduce((total, row) => {
    return total + toNumber(row.jumlah_suara);
  }, 0);

  const totalSuaraPartaiKelurahan =
    totalSuaraKandidatKelurahan + suaraPartaiMurniKelurahan;

  const rankMap = new Map<number, number>();

  kandidatList
    .slice()
    .sort((a, b) => {
      const candidateAId = toNumber(a.id);
      const candidateBId = toNumber(b.id);
      const totalA = candidateTotalMap.get(candidateAId) ?? 0;
      const totalB = candidateTotalMap.get(candidateBId) ?? 0;

      if (totalB !== totalA) {
        return totalB - totalA;
      }

      return toNumber(a.no_urut) - toNumber(b.no_urut);
    })
    .forEach((kandidat, index) => {
      rankMap.set(toNumber(kandidat.id), index + 1);
    });

  const rows: KecamatanPartaiKelurahanTpsItem[] = [];

  tpsList.forEach((tps) => {
    kandidatList.forEach((kandidat) => {
      const tpsId = toNumber(tps.id);
      const kandidatId = toNumber(kandidat.id);

      rows.push({
        kecamatan_id: toNumber(kecamatanData.id),
        kecamatan_nama: String(kecamatanData.nama),
        kelurahan_id: toNumber(kelurahanData.id),
        kelurahan_nama: String(kelurahanData.nama),
        tps_id: tpsId,
        nomor_tps: toNumber(tps.nomor_tps),

        partai_id: toNumber(partaiData.id),
        nomor_urut_partai: toNumber(partaiData.nomor_urut),
        nama_partai: String(partaiData.nama),
        singkatan_partai: partaiData.singkatan,
        logo_path: partaiData.logo_path,

        kandidat_id: kandidatId,
        no_urut_kandidat: toNumber(kandidat.no_urut),
        nama_kandidat: String(kandidat.nama),
        foto_path: kandidat.foto_path,

        jumlah_suara:
          suaraMap.get(createTpsCandidateKey(tpsId, kandidatId)) ?? 0,
        total_suara_tps_partai: tpsTotalMap.get(tpsId) ?? 0,
        total_suara_kandidat_kelurahan: totalSuaraKandidatKelurahan,
        suara_partai_murni_kelurahan: suaraPartaiMurniKelurahan,
        total_suara_partai_kelurahan: totalSuaraPartaiKelurahan,
        peringkat_kandidat_partai_kelurahan: rankMap.get(kandidatId) ?? 0,
      });
    });
  });

  return rows;
}