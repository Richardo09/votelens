import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type DapilRecord = {
  id: number;
  kode: string;
  nama: string;
  jumlah_kursi: number | null;
};

type KecamatanRecord = {
  id: number;
  nama: string;
};

type KelurahanRecord = {
  id: number;
  nama: string;
  dapil_id: number;
  kecamatan_id: number | null;
};

type TpsRecord = {
  id: number;
  kelurahan_id: number;
};

type PartyVoteRecord = {
  kelurahan_id: number;
  jumlah_suara: number;
};

type CandidateVoteRecord = {
  kelurahan_id: number;
  jumlah_suara: number;
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

/**
 * Mengambil konfigurasi Supabase untuk kebutuhan API admin.
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

  return "Terjadi kesalahan saat memuat data kecamatan admin.";
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
 * Memastikan request berasal dari user dengan role admin.
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
 * Mengambil data TPS berdasarkan daftar kelurahan.
 */
async function getTpsRowsByKelurahan(
  adminClient: Awaited<ReturnType<typeof validateAdminRequest>>,
  kelurahanIdList: number[]
) {
  const tpsRows: TpsRecord[] = [];
  const kelurahanChunks = chunkArray(kelurahanIdList, 500);

  for (const kelurahanChunk of kelurahanChunks) {
    if (kelurahanChunk.length === 0) {
      continue;
    }

    const rows = await fetchAllRows<TpsRecord>(
      adminClient
        .from("tps")
        .select("id, kelurahan_id")
        .in("kelurahan_id", kelurahanChunk)
    );

    tpsRows.push(...rows);
  }

  return tpsRows;
}

/**
 * Menyusun rekap kecamatan dari data wilayah dan suara dapil aktif.
 */
function buildKecamatanSummary(params: {
  kecamatanList: KecamatanRecord[];
  kelurahanList: KelurahanRecord[];
  tpsList: TpsRecord[];
  partyVoteList: PartyVoteRecord[];
  candidateVoteList: CandidateVoteRecord[];
}) {
  const kecamatanMap = new Map<number, KecamatanRecord>();
  const kelurahanToKecamatanMap = new Map<number, number>();

  const kelurahanCountMap = new Map<number, number>();
  const tpsCountMap = new Map<number, number>();
  const partyVoteMap = new Map<number, number>();
  const candidateVoteMap = new Map<number, number>();

  params.kecamatanList.forEach((kecamatan) => {
    kecamatanMap.set(toNumber(kecamatan.id), kecamatan);
  });

  params.kelurahanList.forEach((kelurahan) => {
    const kelurahanId = toNumber(kelurahan.id);
    const kecamatanId = toNumber(kelurahan.kecamatan_id);

    if (kelurahanId <= 0 || kecamatanId <= 0) {
      return;
    }

    kelurahanToKecamatanMap.set(kelurahanId, kecamatanId);

    kelurahanCountMap.set(
      kecamatanId,
      (kelurahanCountMap.get(kecamatanId) ?? 0) + 1
    );
  });

  params.tpsList.forEach((tps) => {
    const kelurahanId = toNumber(tps.kelurahan_id);
    const kecamatanId = kelurahanToKecamatanMap.get(kelurahanId);

    if (!kecamatanId) {
      return;
    }

    tpsCountMap.set(kecamatanId, (tpsCountMap.get(kecamatanId) ?? 0) + 1);
  });

  params.partyVoteList.forEach((vote) => {
    const kelurahanId = toNumber(vote.kelurahan_id);
    const kecamatanId = kelurahanToKecamatanMap.get(kelurahanId);
    const jumlahSuara = toNumber(vote.jumlah_suara);

    if (!kecamatanId) {
      return;
    }

    partyVoteMap.set(
      kecamatanId,
      (partyVoteMap.get(kecamatanId) ?? 0) + jumlahSuara
    );
  });

  params.candidateVoteList.forEach((vote) => {
    const kelurahanId = toNumber(vote.kelurahan_id);
    const kecamatanId = kelurahanToKecamatanMap.get(kelurahanId);
    const jumlahSuara = toNumber(vote.jumlah_suara);

    if (!kecamatanId) {
      return;
    }

    candidateVoteMap.set(
      kecamatanId,
      (candidateVoteMap.get(kecamatanId) ?? 0) + jumlahSuara
    );
  });

  const summaryList: AdminKecamatanSummary[] = Array.from(
    kecamatanMap.values()
  ).map((kecamatan) => {
    const kecamatanId = toNumber(kecamatan.id);
    const suaraPartai = partyVoteMap.get(kecamatanId) ?? 0;
    const suaraKandidat = candidateVoteMap.get(kecamatanId) ?? 0;
    const totalSuara = suaraPartai + suaraKandidat;

    return {
      kecamatanId,
      namaKecamatan: kecamatan.nama,
      totalKelurahan: kelurahanCountMap.get(kecamatanId) ?? 0,
      totalTps: tpsCountMap.get(kecamatanId) ?? 0,
      suaraPartai,
      suaraKandidat,
      totalSuara,
      persenSuara: 0,
    };
  });

  const totalSemuaKecamatan = summaryList.reduce((total, kecamatan) => {
    return total + kecamatan.totalSuara;
  }, 0);

  return summaryList
    .map((kecamatan) => {
      return {
        ...kecamatan,
        persenSuara:
          totalSemuaKecamatan > 0
            ? (kecamatan.totalSuara / totalSemuaKecamatan) * 100
            : 0,
      };
    })
    .sort((a, b) => {
      return a.namaKecamatan.localeCompare(b.namaKecamatan);
    });
}

/**
 * Mengembalikan rekap kecamatan berdasarkan dapil yang dipilih admin.
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

    const kelurahanList = await fetchAllRows<KelurahanRecord>(
      adminClient
        .from("kelurahan")
        .select("id, nama, dapil_id, kecamatan_id")
        .eq("dapil_id", dapilId)
        .order("nama", { ascending: true })
    );

    const kecamatanIdList = Array.from(
      new Set(
        kelurahanList
          .map((kelurahan) => toNumber(kelurahan.kecamatan_id))
          .filter((kecamatanId) => kecamatanId > 0)
      )
    );

    let kecamatanList: KecamatanRecord[] = [];

    if (kecamatanIdList.length > 0) {
      kecamatanList = await fetchAllRows<KecamatanRecord>(
        adminClient
          .from("kecamatan")
          .select("id, nama")
          .in("id", kecamatanIdList)
          .order("nama", { ascending: true })
      );
    }

    const kelurahanIdList = kelurahanList.map((kelurahan) => {
      return toNumber(kelurahan.id);
    });

    const [tpsList, partyVoteList, candidateVoteList] = await Promise.all([
      getTpsRowsByKelurahan(adminClient, kelurahanIdList),

      fetchAllRows<PartyVoteRecord>(
        adminClient
          .from("suara_partai_kelurahan")
          .select("kelurahan_id, jumlah_suara")
          .eq("dapil_id", dapilId)
      ),

      fetchAllRows<CandidateVoteRecord>(
        adminClient
          .from("suara_kandidat_tps")
          .select("kelurahan_id, jumlah_suara")
          .eq("dapil_id", dapilId)
      ),
    ]);

    const kecamatanSummaryList = buildKecamatanSummary({
      kecamatanList,
      kelurahanList,
      tpsList,
      partyVoteList,
      candidateVoteList,
    });

    const totalSuara = kecamatanSummaryList.reduce((total, kecamatan) => {
      return total + kecamatan.totalSuara;
    }, 0);

    return NextResponse.json({
      success: true,
      dapil: dapilData as DapilRecord,
      totalSuara,
      kecamatanSummaryList,
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