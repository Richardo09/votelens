import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type CandidateVoteInput = {
  kandidatId?: number;
  tpsId?: number;
  jumlahSuara?: number;
};

type SaveVotesBody = {
  dapilId?: number;
  kelurahanId?: number;
  partaiId?: number;
  suaraPartai?: number;
  kandidatVotes?: CandidateVoteInput[];
};

/**
 * Mengambil konfigurasi Supabase untuk operasi admin.
 */
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error("Konfigurasi Supabase admin belum lengkap.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
  };
}

/**
 * Mengubah error menjadi pesan yang aman untuk client.
 */
function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan pada server admin suara.";
}

/**
 * Mengambil token login dari header Authorization.
 */
function getBearerToken(request: NextRequest) {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.replace("Bearer ", "").trim();
}

/**
 * Mengubah nilai menjadi angka bulat yang valid.
 */
function validateInteger(value: unknown, fieldName: string, allowZero = false) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue)) {
    throw new Error(`${fieldName} wajib berupa angka bulat.`);
  }

  if (allowZero ? numberValue < 0 : numberValue <= 0) {
    throw new Error(
      allowZero
        ? `${fieldName} tidak boleh kurang dari 0.`
        : `${fieldName} wajib lebih dari 0.`
    );
  }

  return numberValue;
}

/**
 * Memecah data menjadi batch agar proses insert tetap stabil.
 */
function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

/**
 * Memastikan request berasal dari user dengan role admin.
 */
async function validateAdminRequest(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } =
    getSupabaseConfig();

  const accessToken = getBearerToken(request);

  if (!accessToken) {
    throw new Error("Token login tidak ditemukan.");
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey);

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
    throw new Error("Akses ditolak. Hanya admin yang boleh melakukan aksi ini.");
  }

  return adminClient;
}

/**
 * Menyimpan suara partai murni dan suara kandidat pada satu kelurahan.
 *
 * Sumber simpan:
 * - Suara partai murni disimpan ke suara_partai_kelurahan.
 * - Suara kandidat per TPS disimpan ke suara_kandidat_tps.
 */
export async function POST(request: NextRequest) {
  try {
    const adminClient = await validateAdminRequest(request);
    const body = (await request.json()) as SaveVotesBody;

    const dapilId = validateInteger(body.dapilId, "Dapil ID");
    const kelurahanId = validateInteger(body.kelurahanId, "Kelurahan ID");
    const partaiId = validateInteger(body.partaiId, "Partai ID");
    const suaraPartai = validateInteger(
      body.suaraPartai ?? 0,
      "Suara partai",
      true
    );
    const kandidatVotes = Array.isArray(body.kandidatVotes)
      ? body.kandidatVotes
      : [];

    const { data: kelurahanData, error: kelurahanError } = await adminClient
      .from("kelurahan")
      .select("id, dapil_id")
      .eq("id", kelurahanId)
      .single();

    if (kelurahanError || !kelurahanData) {
      throw new Error("Kelurahan yang dipilih tidak ditemukan.");
    }

    if (Number(kelurahanData.dapil_id) !== dapilId) {
      throw new Error("Kelurahan tidak sesuai dengan dapil yang dipilih.");
    }

    const { data: partaiData, error: partaiError } = await adminClient
      .from("partai")
      .select("id")
      .eq("id", partaiId)
      .single();

    if (partaiError || !partaiData) {
      throw new Error("Partai yang dipilih tidak ditemukan.");
    }

    const { data: kandidatData, error: kandidatError } = await adminClient
      .from("kandidat")
      .select("id")
      .eq("dapil_id", dapilId)
      .eq("partai_id", partaiId);

    if (kandidatError) {
      throw new Error(kandidatError.message);
    }

    const kandidatIdSet = new Set(
      ((kandidatData as Array<{ id: number }>) ?? []).map((item) =>
        Number(item.id)
      )
    );

    const { data: tpsData, error: tpsError } = await adminClient
      .from("tps")
      .select("id")
      .eq("kelurahan_id", kelurahanId);

    if (tpsError) {
      throw new Error(tpsError.message);
    }

    const tpsIdSet = new Set(
      ((tpsData as Array<{ id: number }>) ?? []).map((item) => Number(item.id))
    );

    const normalizedVotes = kandidatVotes.map((vote) => {
      const kandidatId = validateInteger(vote.kandidatId, "Kandidat ID");
      const tpsId = validateInteger(vote.tpsId, "TPS ID");
      const jumlahSuara = validateInteger(
        vote.jumlahSuara ?? 0,
        "Jumlah suara kandidat",
        true
      );

      if (!kandidatIdSet.has(kandidatId)) {
        throw new Error("Ada kandidat yang tidak sesuai dengan partai/dapil.");
      }

      if (!tpsIdSet.has(tpsId)) {
        throw new Error("Ada TPS yang tidak sesuai dengan kelurahan.");
      }

      return {
        dapil_id: dapilId,
        kelurahan_id: kelurahanId,
        tps_id: tpsId,
        kandidat_id: kandidatId,
        jumlah_suara: jumlahSuara,
      };
    });

    const kandidatIdList = Array.from(kandidatIdSet);

    if (kandidatIdList.length > 0) {
      const { error: deleteCandidateVotesError } = await adminClient
        .from("suara_kandidat_tps")
        .delete()
        .eq("dapil_id", dapilId)
        .eq("kelurahan_id", kelurahanId)
        .in("kandidat_id", kandidatIdList);

      if (deleteCandidateVotesError) {
        throw new Error(deleteCandidateVotesError.message);
      }
    }

    const candidateVotesToInsert = normalizedVotes.filter((vote) => {
      return vote.jumlah_suara > 0;
    });

    const candidateVoteChunks = chunkArray(candidateVotesToInsert, 500);

    for (const candidateVoteChunk of candidateVoteChunks) {
      const { error: insertCandidateVotesError } = await adminClient
        .from("suara_kandidat_tps")
        .insert(candidateVoteChunk);

      if (insertCandidateVotesError) {
        throw new Error(insertCandidateVotesError.message);
      }
    }

    const { error: deletePartyVoteError } = await adminClient
      .from("suara_partai_kelurahan")
      .delete()
      .eq("dapil_id", dapilId)
      .eq("kelurahan_id", kelurahanId)
      .eq("partai_id", partaiId);

    if (deletePartyVoteError) {
      throw new Error(deletePartyVoteError.message);
    }

    if (suaraPartai > 0) {
      const { error: insertPartyVoteError } = await adminClient
        .from("suara_partai_kelurahan")
        .insert({
          dapil_id: dapilId,
          kelurahan_id: kelurahanId,
          partai_id: partaiId,
          jumlah_suara: suaraPartai,
        });

      if (insertPartyVoteError) {
        throw new Error(insertPartyVoteError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data suara berhasil disimpan.",
      savedCandidateRows: candidateVotesToInsert.length,
      savedPartyVote: suaraPartai,
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