import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PartyRecord = {
  id: number;
  nomor_urut: number;
  nama: string;
  singkatan: string | null;
  logo_path: string | null;
};

type CandidateRecord = {
  id: number;
  dapil_id: number;
  partai_id: number;
  no_urut: number;
  nama: string;
  foto_path: string | null;
};

type PartyVoteRecord = {
  partai_id: number;
  jumlah_suara: number;
};

type CandidateVoteRecord = {
  kandidat_id: number;
  jumlah_suara: number;
};

type DapilRecord = {
  id: number;
  kode: string;
  nama: string;
  jumlah_kursi: number | null;
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

type AreaSummary = {
  totalKecamatan: number;
  totalKelurahan: number;
  totalTps: number;
};

/**
 * Mengambil konfigurasi Supabase untuk kebutuhan API admin.
 *
 * Project ini menggunakan publishable key sebagai public client key.
 * Fallback ke anon key tetap disediakan agar kompatibel jika konfigurasi lama
 * masih dipakai di environment lain.
 */
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabasePublicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabasePublicKey || !supabaseServiceRoleKey) {
    throw new Error("Konfigurasi Supabase admin belum lengkap.");
  }

  return {
    supabaseUrl,
    supabasePublicKey,
    supabaseServiceRoleKey,
  };
}

/**
 * Mengubah error menjadi pesan yang aman untuk dikirim ke client.
 */
function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan saat memuat data dashboard admin.";
}

/**
 * Mengambil bearer token dari header Authorization.
 */
function getBearerToken(request: NextRequest) {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.replace("Bearer ", "").trim();
}

/**
 * Mengubah nilai database menjadi number yang aman.
 */
function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

/**
 * Memecah array menjadi beberapa batch agar query `.in()` tetap stabil.
 */
function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

/**
 * Mengambil seluruh baris dari query Supabase agar tidak terpotong limit default.
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
      throw new Error(response.error.message ?? "Gagal memuat data.");
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
 * Memastikan request berasal dari user yang memiliki role admin.
 */
async function validateAdminRequest(request: NextRequest) {
  const { supabaseUrl, supabasePublicKey, supabaseServiceRoleKey } =
    getSupabaseConfig();

  const accessToken = getBearerToken(request);

  if (!accessToken) {
    throw new Error("Token login tidak ditemukan.");
  }

  const authClient = createClient(supabaseUrl, supabasePublicKey);

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userData, error: userError } =
    await authClient.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new Error("Sesi login tidak valid.");
  }

  const { data: profileData, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profileData) {
    throw new Error("Profile admin tidak ditemukan.");
  }

  if (profileData.role !== "admin") {
    throw new Error("Akses ditolak. Hanya admin yang boleh melihat data ini.");
  }

  return adminClient;
}

/**
 * Mengambil ringkasan wilayah berdasarkan dapil yang dipilih.
 *
 * Data wilayah yang belum lengkap tidak dianggap error. Jika dapil belum
 * memiliki kecamatan, kelurahan, atau TPS, nilai ringkasan dikembalikan sebagai 0.
 */
async function getAreaSummary(
  adminClient: Awaited<ReturnType<typeof validateAdminRequest>>,
  dapilId: number
): Promise<AreaSummary> {
  const kelurahanRows = await fetchAllRows<{
    id: number;
    kecamatan_id: number | null;
  }>(
    adminClient
      .from("kelurahan")
      .select("id, kecamatan_id")
      .eq("dapil_id", dapilId)
  );

  const kecamatanIdSet = new Set<number>();

  kelurahanRows.forEach((kelurahan) => {
    const kecamatanId = toNumber(kelurahan.kecamatan_id);

    if (kecamatanId > 0) {
      kecamatanIdSet.add(kecamatanId);
    }
  });

  const kelurahanIdList = kelurahanRows.map((kelurahan) => {
    return toNumber(kelurahan.id);
  });

  const kelurahanChunks = chunkArray(kelurahanIdList, 500);

  let totalTps = 0;

  for (const kelurahanChunk of kelurahanChunks) {
    if (kelurahanChunk.length === 0) {
      continue;
    }

    const { count, error } = await adminClient
      .from("tps")
      .select("id", { count: "exact", head: true })
      .in("kelurahan_id", kelurahanChunk);

    if (error) {
      throw new Error(error.message);
    }

    totalTps += count ?? 0;
  }

  return {
    totalKecamatan: kecamatanIdSet.size,
    totalKelurahan: kelurahanRows.length,
    totalTps,
  };
}

/**
 * Menyusun rekap partai dan kandidat berdasarkan dapil aktif.
 *
 * Seluruh perhitungan dibatasi pada dapil yang dipilih. Dapil lain yang belum
 * lengkap tidak memengaruhi hasil dashboard admin.
 */
function buildDashboardSummary(params: {
  partyList: PartyRecord[];
  candidateList: CandidateRecord[];
  partyVoteList: PartyVoteRecord[];
  candidateVoteList: CandidateVoteRecord[];
}) {
  const candidateCountByParty = new Map<number, number>();
  const partyVoteMap = new Map<number, number>();
  const candidateVoteMap = new Map<number, number>();
  const candidateVoteByParty = new Map<number, number>();
  const partyMap = new Map<number, PartyRecord>();

  params.partyList.forEach((party) => {
    partyMap.set(toNumber(party.id), party);
  });

  params.candidateList.forEach((candidate) => {
    const partaiId = toNumber(candidate.partai_id);

    candidateCountByParty.set(
      partaiId,
      (candidateCountByParty.get(partaiId) ?? 0) + 1
    );
  });

  params.partyVoteList.forEach((vote) => {
    const partaiId = toNumber(vote.partai_id);
    const jumlahSuara = toNumber(vote.jumlah_suara);

    partyVoteMap.set(partaiId, (partyVoteMap.get(partaiId) ?? 0) + jumlahSuara);
  });

  params.candidateVoteList.forEach((vote) => {
    const kandidatId = toNumber(vote.kandidat_id);
    const jumlahSuara = toNumber(vote.jumlah_suara);

    candidateVoteMap.set(
      kandidatId,
      (candidateVoteMap.get(kandidatId) ?? 0) + jumlahSuara
    );
  });

  params.candidateList.forEach((candidate) => {
    const partaiId = toNumber(candidate.partai_id);
    const kandidatId = toNumber(candidate.id);
    const totalSuaraKandidat = candidateVoteMap.get(kandidatId) ?? 0;

    candidateVoteByParty.set(
      partaiId,
      (candidateVoteByParty.get(partaiId) ?? 0) + totalSuaraKandidat
    );
  });

  const totalSeluruhSuara = params.partyList.reduce((total, party) => {
    const partaiId = toNumber(party.id);
    const suaraPartai = partyVoteMap.get(partaiId) ?? 0;
    const suaraKandidat = candidateVoteByParty.get(partaiId) ?? 0;

    return total + suaraPartai + suaraKandidat;
  }, 0);

  const partySummaryList: AdminPartySummary[] = params.partyList.map((party) => {
    const partaiId = toNumber(party.id);
    const suaraPartai = partyVoteMap.get(partaiId) ?? 0;
    const suaraKandidat = candidateVoteByParty.get(partaiId) ?? 0;
    const totalSuara = suaraPartai + suaraKandidat;

    return {
      partaiId,
      nomorUrut: toNumber(party.nomor_urut),
      namaPartai: party.nama,
      singkatanPartai: party.singkatan,
      logoPath: party.logo_path,
      jumlahKandidat: candidateCountByParty.get(partaiId) ?? 0,
      suaraPartai,
      suaraKandidat,
      totalSuara,
      persenSuara:
        totalSeluruhSuara > 0 ? (totalSuara / totalSeluruhSuara) * 100 : 0,
    };
  });

  const candidateSummaryList: AdminCandidateSummary[] = params.candidateList
    .map((candidate) => {
      const partaiId = toNumber(candidate.partai_id);
      const kandidatId = toNumber(candidate.id);
      const party = partyMap.get(partaiId);

      return {
        kandidatId,
        partaiId,
        nomorUrutPartai: toNumber(party?.nomor_urut),
        namaPartai: party?.nama ?? "-",
        singkatanPartai: party?.singkatan ?? null,
        noUrutKandidat: toNumber(candidate.no_urut),
        namaKandidat: candidate.nama,
        fotoPath: candidate.foto_path,
        totalSuara: candidateVoteMap.get(kandidatId) ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.totalSuara !== a.totalSuara) {
        return b.totalSuara - a.totalSuara;
      }

      if (a.nomorUrutPartai !== b.nomorUrutPartai) {
        return a.nomorUrutPartai - b.nomorUrutPartai;
      }

      return a.noUrutKandidat - b.noUrutKandidat;
    });

  return {
    totalSeluruhSuara,
    partySummaryList,
    candidateSummaryList,
  };
}

/**
 * Mengembalikan data dashboard admin berdasarkan dapil yang dipilih.
 */
export async function GET(request: NextRequest) {
  try {
    const adminClient = await validateAdminRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const dapilId = Number(searchParams.get("dapilId"));

    if (!Number.isInteger(dapilId) || dapilId <= 0) {
      throw new Error("Dapil wajib dipilih.");
    }

    const { data: dapilData, error: dapilError } = await adminClient
      .from("dapil")
      .select("id, kode, nama, jumlah_kursi")
      .eq("id", dapilId)
      .single();

    if (dapilError || !dapilData) {
      throw new Error("Dapil yang dipilih tidak ditemukan.");
    }

    const [
      partyList,
      candidateList,
      partyVoteList,
      candidateVoteList,
      areaSummary,
    ] = await Promise.all([
      fetchAllRows<PartyRecord>(
        adminClient
          .from("partai")
          .select("id, nomor_urut, nama, singkatan, logo_path")
          .order("nomor_urut", { ascending: true })
      ),

      fetchAllRows<CandidateRecord>(
        adminClient
          .from("kandidat")
          .select("id, dapil_id, partai_id, no_urut, nama, foto_path")
          .eq("dapil_id", dapilId)
          .order("partai_id", { ascending: true })
          .order("no_urut", { ascending: true })
      ),

      fetchAllRows<PartyVoteRecord>(
        adminClient
          .from("suara_partai_kelurahan")
          .select("partai_id, jumlah_suara")
          .eq("dapil_id", dapilId)
      ),

      fetchAllRows<CandidateVoteRecord>(
        adminClient
          .from("suara_kandidat_tps")
          .select("kandidat_id, jumlah_suara")
          .eq("dapil_id", dapilId)
      ),

      getAreaSummary(adminClient, dapilId),
    ]);

    const dashboardSummary = buildDashboardSummary({
      partyList,
      candidateList,
      partyVoteList,
      candidateVoteList,
    });

    return NextResponse.json({
      success: true,
      dapil: dapilData as DapilRecord,
      areaSummary,
      totalSeluruhSuara: dashboardSummary.totalSeluruhSuara,
      partySummaryList: dashboardSummary.partySummaryList,
      candidateSummaryList: dashboardSummary.candidateSummaryList,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      {
        status: 400,
      }
    );
  }
}