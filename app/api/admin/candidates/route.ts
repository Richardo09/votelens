import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type CandidatePayload = {
  kandidatId?: number;
  dapilId?: number;
  partaiId?: number;
  noUrut?: number;
  nama?: string;
  fotoPath?: string | null;
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

  return "Terjadi kesalahan pada server admin kandidat.";
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
 * Memastikan dapil tersedia.
 */
async function ensureDapilExists(
  adminClient: Awaited<ReturnType<typeof validateAdminRequest>>,
  dapilId: number
) {
  const { data, error } = await adminClient
    .from("dapil")
    .select("id")
    .eq("id", dapilId)
    .single();

  if (error || !data) {
    throw new Error("Dapil yang dipilih tidak ditemukan.");
  }
}

/**
 * Memastikan partai tersedia.
 */
async function ensurePartaiExists(
  adminClient: Awaited<ReturnType<typeof validateAdminRequest>>,
  partaiId: number
) {
  const { data, error } = await adminClient
    .from("partai")
    .select("id")
    .eq("id", partaiId)
    .single();

  if (error || !data) {
    throw new Error("Partai yang dipilih tidak ditemukan.");
  }
}

/**
 * Memastikan nomor urut kandidat tidak kosong dan valid.
 */
function validateCandidateNumber(noUrut: unknown) {
  const numberValue = Number(noUrut);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error("Nomor urut kandidat wajib berupa angka lebih dari 0.");
  }

  return numberValue;
}

/**
 * Membuat kandidat baru pada dapil dan partai yang dipilih.
 */
export async function POST(request: NextRequest) {
  try {
    const adminClient = await validateAdminRequest(request);
    const body = (await request.json()) as CandidatePayload;

    const dapilId = Number(body.dapilId);
    const partaiId = Number(body.partaiId);
    const noUrut = validateCandidateNumber(body.noUrut);
    const nama = body.nama?.trim();
    const fotoPath = body.fotoPath?.trim() || null;

    if (!dapilId) {
      throw new Error("Dapil wajib dipilih.");
    }

    if (!partaiId) {
      throw new Error("Partai wajib dipilih.");
    }

    if (!nama) {
      throw new Error("Nama kandidat wajib diisi.");
    }

    await ensureDapilExists(adminClient, dapilId);
    await ensurePartaiExists(adminClient, partaiId);

    const { data: duplicateCandidate, error: duplicateError } =
      await adminClient
        .from("kandidat")
        .select("id")
        .eq("dapil_id", dapilId)
        .eq("partai_id", partaiId)
        .eq("no_urut", noUrut)
        .maybeSingle();

    if (duplicateError) {
      throw new Error(duplicateError.message);
    }

    if (duplicateCandidate) {
      throw new Error(
        "Nomor urut kandidat sudah digunakan pada partai dan dapil ini."
      );
    }

    const { data, error } = await adminClient
      .from("kandidat")
      .insert({
        dapil_id: dapilId,
        partai_id: partaiId,
        no_urut: noUrut,
        nama,
        foto_path: fotoPath,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Gagal menambahkan kandidat.");
    }

    return NextResponse.json({
      success: true,
      message: "Kandidat berhasil ditambahkan.",
      kandidatId: data.id,
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

/**
 * Memperbarui data kandidat.
 */
export async function PATCH(request: NextRequest) {
  try {
    const adminClient = await validateAdminRequest(request);
    const body = (await request.json()) as CandidatePayload;

    const kandidatId = Number(body.kandidatId);
    const dapilId = Number(body.dapilId);
    const partaiId = Number(body.partaiId);
    const noUrut = validateCandidateNumber(body.noUrut);
    const nama = body.nama?.trim();
    const fotoPath = body.fotoPath?.trim() || null;

    if (!kandidatId) {
      throw new Error("Kandidat ID wajib dikirim.");
    }

    if (!dapilId) {
      throw new Error("Dapil wajib dipilih.");
    }

    if (!partaiId) {
      throw new Error("Partai wajib dipilih.");
    }

    if (!nama) {
      throw new Error("Nama kandidat wajib diisi.");
    }

    await ensureDapilExists(adminClient, dapilId);
    await ensurePartaiExists(adminClient, partaiId);

    const { data: duplicateCandidate, error: duplicateError } =
      await adminClient
        .from("kandidat")
        .select("id")
        .eq("dapil_id", dapilId)
        .eq("partai_id", partaiId)
        .eq("no_urut", noUrut)
        .neq("id", kandidatId)
        .maybeSingle();

    if (duplicateError) {
      throw new Error(duplicateError.message);
    }

    if (duplicateCandidate) {
      throw new Error(
        "Nomor urut kandidat sudah digunakan pada partai dan dapil ini."
      );
    }

    const { error } = await adminClient
      .from("kandidat")
      .update({
        dapil_id: dapilId,
        partai_id: partaiId,
        no_urut: noUrut,
        nama,
        foto_path: fotoPath,
      })
      .eq("id", kandidatId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Kandidat berhasil diperbarui.",
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

/**
 * Menghapus kandidat berdasarkan ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminClient = await validateAdminRequest(request);
    const body = (await request.json()) as CandidatePayload;

    const kandidatId = Number(body.kandidatId);

    if (!kandidatId) {
      throw new Error("Kandidat ID wajib dikirim.");
    }

    const { error } = await adminClient
      .from("kandidat")
      .delete()
      .eq("id", kandidatId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Kandidat berhasil dihapus.",
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