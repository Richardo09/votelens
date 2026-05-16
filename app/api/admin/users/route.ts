import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type UserRole = "admin" | "user";

type CreateUserBody = {
  email?: string;
  password?: string;
  nama?: string;
  role?: UserRole;
  dapilId?: number | null;
};

type UpdateUserBody = {
  userId?: string;
  nama?: string | null;
  role?: UserRole;
  dapilId?: number | null;
};

type DeleteUserBody = {
  userId?: string;
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

  return "Terjadi kesalahan pada server admin.";
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
 * Memastikan role yang dikirim sesuai dengan role sistem.
 */
function validateRole(role: unknown): UserRole {
  if (role === "admin" || role === "user") {
    return role;
  }

  throw new Error("Role user tidak valid.");
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
    .select("id, email, role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profileData) {
    throw new Error("Profile admin tidak ditemukan.");
  }

  if (profileData.role !== "admin") {
    throw new Error("Akses ditolak. Hanya admin yang boleh melakukan aksi ini.");
  }

  return {
    adminClient,
    adminUserId: userData.user.id,
  };
}

/**
 * Memastikan dapil yang dipilih tersedia di database.
 */
async function ensureDapilExists(
  adminClient: Awaited<ReturnType<typeof validateAdminRequest>>["adminClient"],
  dapilId: number | null
) {
  if (dapilId === null) {
    return;
  }

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
 * Membuat user baru melalui Supabase Auth dan menyimpan profile aksesnya.
 */
export async function POST(request: NextRequest) {
  try {
    const { adminClient } = await validateAdminRequest(request);
    const body = (await request.json()) as CreateUserBody;

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const nama = body.nama?.trim() || null;
    const role = validateRole(body.role ?? "user");
    const dapilId = body.dapilId ?? null;

    if (!email) {
      throw new Error("Email user wajib diisi.");
    }

    if (!password || password.length < 6) {
      throw new Error("Password minimal 6 karakter.");
    }

    await ensureDapilExists(adminClient, dapilId);

    const { data: createdUserData, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nama,
        },
      });

    if (createUserError || !createdUserData.user) {
      throw new Error(createUserError?.message ?? "Gagal membuat user baru.");
    }

    const newUserId = createdUserData.user.id;

    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: newUserId,
        email,
        nama,
        role,
        dapil_id: dapilId,
      },
      {
        onConflict: "id",
      }
    );

    if (profileError) {
      await adminClient.auth.admin.deleteUser(newUserId);
      throw new Error(profileError.message);
    }

    return NextResponse.json({
      success: true,
      message: "User berhasil ditambahkan.",
      userId: newUserId,
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
 * Memperbarui nama, role, dan akses dapil user.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { adminClient, adminUserId } = await validateAdminRequest(request);
    const body = (await request.json()) as UpdateUserBody;

    const userId = body.userId?.trim();
    const nama = body.nama?.trim() || null;
    const role = validateRole(body.role);
    const dapilId = body.dapilId ?? null;

    if (!userId) {
      throw new Error("User ID wajib dikirim.");
    }

    if (userId === adminUserId && role !== "admin") {
      throw new Error("Admin tidak boleh menurunkan role akunnya sendiri.");
    }

    await ensureDapilExists(adminClient, dapilId);

    const { data: existingProfile, error: existingProfileError } =
      await adminClient
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

    if (existingProfileError || !existingProfile) {
      throw new Error("Profile user yang akan diubah tidak ditemukan.");
    }

    const { error: updateProfileError } = await adminClient
      .from("profiles")
      .update({
        nama,
        role,
        dapil_id: dapilId,
      })
      .eq("id", userId);

    if (updateProfileError) {
      throw new Error(updateProfileError.message);
    }

    const { error: updateAuthError } =
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          nama,
        },
      });

    if (updateAuthError) {
      throw new Error(updateAuthError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Data user berhasil diperbarui.",
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
 * Menghapus user dari Supabase Auth dan tabel profiles.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { adminClient, adminUserId } = await validateAdminRequest(request);
    const body = (await request.json()) as DeleteUserBody;

    const userId = body.userId?.trim();

    if (!userId) {
      throw new Error("User ID wajib dikirim.");
    }

    if (userId === adminUserId) {
      throw new Error("Admin tidak boleh menghapus akun sendiri.");
    }

    const { error: deleteAuthError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      throw new Error(deleteAuthError.message);
    }

    const { error: deleteProfileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (deleteProfileError) {
      throw new Error(deleteProfileError.message);
    }

    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus.",
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