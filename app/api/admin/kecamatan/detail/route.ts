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

type AdminKelurahanSummary = {
  kelurahanId: number;
  namaKelurahan: string;
  totalTps: number;
  suaraPartai: number;
  suaraKandidat: number;
  totalSuara: number;
  persenSuara: number;
};

/**
 * Mengambil konfigurasi Supabase untuk kebutuhan API admin.
 *
 * Publishable key dipakai untuk validasi token user aktif, sedangkan service
 * role key dipakai untuk membaca data lintas dapil secara aman di server.
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

  return "Terjadi kesalahan saat memuat detail kecamatan admin.";
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
 * Mengubah nilai database menjadi angka yang aman dipakai untuk perhitungan.
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
 * Mengambil seluruh baris dari query Supabase agar tidak terkena limit default.
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
 * Mengambil daftar TPS dari sekumpulan kelurahan dalam satu kecamatan.
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
 * Menyusun rekap kelurahan untuk satu kecamatan aktif.
 */
function buildKelurahanSummary(params: {
  kelurahanList: KelurahanRecord[];
  tpsList: TpsRecord[];
  partyVoteList: PartyVoteRecord[];
  candidateVoteList: CandidateVoteRecord[];
}) {
  const tpsCountMap = new Map<number, number>();
  const partyVoteMap = new Map<number, number>();
  const candidateVoteMap = new Map<number, number>();

  params.tpsList.forEach((tps) => {
    const kelurahanId = toNumber(tps.kelurahan_id);

    if (kelurahanId <= 0) {
      return;
    }

    tpsCountMap.set(kelurahanId, (tpsCountMap.get(kelurahanId) ?? 0) + 1);
  });

  params.partyVoteList.forEach((vote) => {
    const kelurahanId = toNumber(vote.kelurahan_id);
    const jumlahSuara = toNumber(vote.jumlah_suara);

    if (kelurahanId <= 0) {
      return;
    }

    partyVoteMap.set(
      kelurahanId,
      (partyVoteMap.get(kelurahanId) ?? 0) + jumlahSuara
    );
  });

  params.candidateVoteList.forEach((vote) => {
    const kelurahanId = toNumber(vote.kelurahan_id);
    const jumlahSuara = toNumber(vote.jumlah_suara);

    if (kelurahanId <= 0) {
      return;
    }

    candidateVoteMap.set(
      kelurahanId,
      (candidateVoteMap.get(kelurahanId) ?? 0) + jumlahSuara
    );
  });

  const summaryList: AdminKelurahanSummary[] = params.kelurahanList.map(
    (kelurahan) => {
      const kelurahanId = toNumber(kelurahan.id);
      const suaraPartai = partyVoteMap.get(kelurahanId) ?? 0;
      const suaraKandidat = candidateVoteMap.get(kelurahanId) ?? 0;
      const totalSuara = suaraPartai + suaraKandidat;

      return {
        kelurahanId,
        namaKelurahan: kelurahan.nama,
        totalTps: tpsCountMap.get(kelurahanId) ?? 0,
        suaraPartai,
        suaraKandidat,
        totalSuara,
        persenSuara: 0,
      };
    }
  );

  const totalSuaraKecamatan = summaryList.reduce((total, kelurahan) => {
    return total + kelurahan.totalSuara;
  }, 0);

  return summaryList
    .map((kelurahan) => {
      return {
        ...kelurahan,
        persenSuara:
          totalSuaraKecamatan > 0
            ? (kelurahan.totalSuara / totalSuaraKecamatan) * 100
            : 0,
      };
    })
    .sort((a, b) => {
      return a.namaKelurahan.localeCompare(b.namaKelurahan);
    });
}

/**
 * Mengembalikan detail kecamatan admin berisi rekap seluruh kelurahan.
 */
export async function GET(request: NextRequest) {
  try {
    const adminClient = await validateAdminRequest(request);
    const searchParams = request.nextUrl.searchParams;

    const dapilId = Number(searchParams.get("dapilId"));
    const kecamatanId = Number(searchParams.get("kecamatanId"));

    if (!Number.isInteger(dapilId) || dapilId <= 0) {
      throw new Error("Dapil wajib dipilih.");
    }

    if (!Number.isInteger(kecamatanId) || kecamatanId <= 0) {
      throw new Error("Kecamatan wajib dipilih.");
    }

    const [{ data: dapilData, error: dapilError }, { data: kecamatanData, error: kecamatanError }] =
      await Promise.all([
        adminClient
          .from("dapil")
          .select("id, kode, nama, jumlah_kursi")
          .eq("id", dapilId)
          .single(),

        adminClient
          .from("kecamatan")
          .select("id, nama")
          .eq("id", kecamatanId)
          .single(),
      ]);

    if (dapilError || !dapilData) {
      throw new Error("Dapil yang dipilih tidak ditemukan.");
    }

    if (kecamatanError || !kecamatanData) {
      throw new Error("Kecamatan yang dipilih tidak ditemukan.");
    }

    const kelurahanList = await fetchAllRows<KelurahanRecord>(
      adminClient
        .from("kelurahan")
        .select("id, nama, dapil_id, kecamatan_id")
        .eq("dapil_id", dapilId)
        .eq("kecamatan_id", kecamatanId)
        .order("nama", { ascending: true })
    );

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
          .in("kelurahan_id", kelurahanIdList)
      ),

      fetchAllRows<CandidateVoteRecord>(
        adminClient
          .from("suara_kandidat_tps")
          .select("kelurahan_id, jumlah_suara")
          .eq("dapil_id", dapilId)
          .in("kelurahan_id", kelurahanIdList)
      ),
    ]);

    const kelurahanSummaryList = buildKelurahanSummary({
      kelurahanList,
      tpsList,
      partyVoteList,
      candidateVoteList,
    });

    const totalSuara = kelurahanSummaryList.reduce((total, kelurahan) => {
      return total + kelurahan.totalSuara;
    }, 0);

    const totalTps = kelurahanSummaryList.reduce((total, kelurahan) => {
      return total + kelurahan.totalTps;
    }, 0);

    return NextResponse.json({
      success: true,
      dapil: dapilData as DapilRecord,
      kecamatan: kecamatanData as KecamatanRecord,
      totalKelurahan: kelurahanSummaryList.length,
      totalTps,
      totalSuara,
      kelurahanSummaryList,
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
