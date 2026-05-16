import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type UpdateTpsBody = {
  kelurahanId?: number;
  jumlahTps?: number;
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

  return "Terjadi kesalahan pada server admin TPS.";
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
 * Memvalidasi jumlah TPS yang dikirim dari client.
 */
function validateJumlahTps(value: unknown) {
  const jumlahTps = Number(value);

  if (!Number.isInteger(jumlahTps) || jumlahTps < 0) {
    throw new Error("Jumlah TPS wajib berupa angka bulat minimal 0.");
  }

  if (jumlahTps > 999) {
    throw new Error("Jumlah TPS terlalu besar. Maksimal 999 TPS.");
  }

  return jumlahTps;
}

/**
 * Mengatur jumlah TPS pada satu kelurahan.
 *
 * Jika jumlah baru lebih besar, sistem menambahkan TPS yang belum ada.
 * Jika jumlah baru lebih kecil, sistem menghapus TPS dengan nomor di atas jumlah baru.
 */
export async function PATCH(request: NextRequest) {
  try {
    const adminClient = await validateAdminRequest(request);
    const body = (await request.json()) as UpdateTpsBody;

    const kelurahanId = Number(body.kelurahanId);
    const jumlahTps = validateJumlahTps(body.jumlahTps);

    if (!kelurahanId) {
      throw new Error("Kelurahan wajib dipilih.");
    }

    const { data: kelurahanData, error: kelurahanError } = await adminClient
      .from("kelurahan")
      .select("id, nama")
      .eq("id", kelurahanId)
      .single();

    if (kelurahanError || !kelurahanData) {
      throw new Error("Kelurahan yang dipilih tidak ditemukan.");
    }

    const { data: existingTpsData, error: existingTpsError } = await adminClient
      .from("tps")
      .select("id, nomor_tps, kelurahan_id")
      .eq("kelurahan_id", kelurahanId)
      .order("nomor_tps", { ascending: true });

    if (existingTpsError) {
      throw new Error(existingTpsError.message);
    }

    const existingTpsList = existingTpsData ?? [];
    const existingNomorSet = new Set<number>();

    existingTpsList.forEach((tps) => {
      existingNomorSet.add(Number(tps.nomor_tps));
    });

    const targetNomorSet = new Set<number>();

    for (let nomorTps = 1; nomorTps <= jumlahTps; nomorTps += 1) {
      targetNomorSet.add(nomorTps);
    }

    const tpsToInsert: Array<{
      kelurahan_id: number;
      nomor_tps: number;
    }> = [];

    targetNomorSet.forEach((nomorTps) => {
      if (!existingNomorSet.has(nomorTps)) {
        tpsToInsert.push({
          kelurahan_id: kelurahanId,
          nomor_tps: nomorTps,
        });
      }
    });

    const tpsIdToDelete = existingTpsList
      .filter((tps) => !targetNomorSet.has(Number(tps.nomor_tps)))
      .map((tps) => Number(tps.id));

    if (tpsIdToDelete.length > 0) {
      const { error: deleteError } = await adminClient
        .from("tps")
        .delete()
        .in("id", tpsIdToDelete);

      if (deleteError) {
        throw new Error(
          "Gagal mengurangi jumlah TPS. Pastikan TPS yang dihapus belum memiliki data suara."
        );
      }
    }

    if (tpsToInsert.length > 0) {
      const { error: insertError } = await adminClient
        .from("tps")
        .insert(tpsToInsert);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Jumlah TPS ${kelurahanData.nama} berhasil diatur menjadi ${jumlahTps}.`,
      jumlahTps,
      inserted: tpsToInsert.length,
      deleted: tpsIdToDelete.length,
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