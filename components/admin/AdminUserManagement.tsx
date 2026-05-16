"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type AdminRole = "admin" | "user";

type AdminUserProfile = {
  id: string;
  email: string;
  nama: string | null;
  role: AdminRole;
  dapil_id: number | null;
};

type DapilOption = {
  id: number;
  kode: string;
  nama: string;
};

type UserRow = AdminUserProfile & {
  dapilLabel: string;
};

type AdminApiResponse = {
  success: boolean;
  message: string;
  userId?: string;
};

/**
 * Mengelola user, role, akses dapil, pembuatan user, dan penghapusan user.
 */
export default function AdminUserManagement() {
  const [userList, setUserList] = useState<AdminUserProfile[]>([]);
  const [dapilList, setDapilList] = useState<DapilOption[]>([]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AdminRole>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<AdminRole>("user");
  const [newUserDapilId, setNewUserDapilId] = useState("");

  const [editingUser, setEditingUser] = useState<AdminUserProfile | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserRole, setEditUserRole] = useState<AdminRole>("user");
  const [editUserDapilId, setEditUserDapilId] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  /**
   * Memuat ulang data user dan dapil dari database.
   */
  const loadUserManagementData = useCallback(async () => {
    const supabase = getSupabaseClient();

    const [profileResponse, dapilResponse] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, nama, role, dapil_id")
        .order("email", { ascending: true }),

      supabase.from("dapil").select("id, kode, nama").order("id", {
        ascending: true,
      }),
    ]);

    if (profileResponse.error) {
      throw new Error(profileResponse.error.message);
    }

    if (dapilResponse.error) {
      throw new Error(dapilResponse.error.message);
    }

    setUserList((profileResponse.data as AdminUserProfile[]) ?? []);
    setDapilList((dapilResponse.data as DapilOption[]) ?? []);
  }, []);

  /**
   * Memuat data awal saat komponen dibuka.
   */
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        await loadUserManagementData();

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
            : "Gagal memuat data user management.";

        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [loadUserManagementData]);

  /**
   * Mengambil access token admin aktif untuk request API admin.
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
   * Mengosongkan form tambah user.
   */
  function resetCreateForm() {
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserName("");
    setNewUserRole("user");
    setNewUserDapilId("");
  }

  /**
   * Membuka form edit berdasarkan user yang dipilih.
   */
  function openEditForm(user: AdminUserProfile) {
    setEditingUser(user);
    setEditUserName(user.nama ?? "");
    setEditUserRole(user.role);
    setEditUserDapilId(user.dapil_id ? String(user.dapil_id) : "");
    setErrorMessage("");
    setActionMessage("");
  }

  /**
   * Menutup form edit user.
   */
  function closeEditForm() {
    setEditingUser(null);
    setEditUserName("");
    setEditUserRole("user");
    setEditUserDapilId("");
  }

  /**
   * Menambahkan user baru melalui API admin.
   */
  async function handleCreateUser() {
    setIsSubmitting(true);
    setErrorMessage("");
    setActionMessage("");

    try {
      const accessToken = await getAccessToken();

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          nama: newUserName,
          role: newUserRole,
          dapilId: newUserDapilId ? Number(newUserDapilId) : null,
        }),
      });

      const result = (await response.json()) as AdminApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menambahkan user.");
      }

      await loadUserManagementData();
      resetCreateForm();
      setIsCreateFormOpen(false);
      setActionMessage(result.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menambahkan user.";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Memperbarui nama, role, dan akses dapil user.
   */
  async function handleUpdateUser() {
    if (!editingUser) {
      return;
    }

    setIsUpdating(true);
    setErrorMessage("");
    setActionMessage("");

    try {
      const accessToken = await getAccessToken();

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: editingUser.id,
          nama: editUserName,
          role: editUserRole,
          dapilId: editUserDapilId ? Number(editUserDapilId) : null,
        }),
      });

      const result = (await response.json()) as AdminApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memperbarui user.");
      }

      await loadUserManagementData();
      closeEditForm();
      setActionMessage(result.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memperbarui user.";

      setErrorMessage(message);
    } finally {
      setIsUpdating(false);
    }
  }

  /**
   * Menghapus user dari Supabase Auth dan tabel profile.
   */
  async function handleDeleteUser(user: AdminUserProfile) {
    const confirmed = window.confirm(
      `Hapus user ${user.email}? Aksi ini tidak bisa dibatalkan.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingUserId(user.id);
    setErrorMessage("");
    setActionMessage("");

    try {
      const accessToken = await getAccessToken();

      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const result = (await response.json()) as AdminApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus user.");
      }

      await loadUserManagementData();

      if (editingUser?.id === user.id) {
        closeEditForm();
      }

      setActionMessage(result.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus user.";

      setErrorMessage(message);
    } finally {
      setDeletingUserId(null);
    }
  }

  /**
   * Menggabungkan data user dengan label dapil.
   */
  const userRowList = useMemo<UserRow[]>(() => {
    const dapilMap = new Map<number, DapilOption>();

    dapilList.forEach((dapil) => {
      dapilMap.set(dapil.id, dapil);
    });

    return userList.map((user) => {
      const dapil = user.dapil_id ? dapilMap.get(user.dapil_id) : null;

      return {
        ...user,
        dapilLabel: dapil ? `${dapil.kode} - ${dapil.nama}` : "Belum diatur",
      };
    });
  }, [userList, dapilList]);

  /**
   * Menerapkan pencarian dan filter role pada daftar user.
   */
  const filteredUserList = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return userRowList.filter((user) => {
      const matchesKeyword =
        !keyword ||
        user.email.toLowerCase().includes(keyword) ||
        (user.nama ?? "").toLowerCase().includes(keyword) ||
        user.dapilLabel.toLowerCase().includes(keyword);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesKeyword && matchesRole;
    });
  }, [roleFilter, searchKeyword, userRowList]);

  const totalAdmin = userList.filter((user) => user.role === "admin").length;
  const totalUser = userList.filter((user) => user.role === "user").length;

  if (isLoading) {
    return (
      <section className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-600">
          Memuat data user...
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

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Total User
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {userList.length}
          </p>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            Admin
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {totalAdmin}
          </p>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            User Biasa
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {totalUser}
          </p>
        </article>
      </div>

      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              User Management
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Daftar User
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Admin dapat menambahkan user, menghapus user, serta mengubah role
              dan akses dapil.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateFormOpen((current) => !current)}
            className="w-fit rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
          >
            {isCreateFormOpen ? "Tutup Form" : "Tambah User"}
          </button>
        </div>

        {isCreateFormOpen ? (
          <section className="mt-5 rounded-4xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <h3 className="text-lg font-black text-slate-950">
              Tambah User Baru
            </h3>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Nama
                </label>

                <input
                  value={newUserName}
                  onChange={(event) => setNewUserName(event.target.value)}
                  placeholder="Nama user"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Email
                </label>

                <input
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                  placeholder="email@example.com"
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Password
                </label>

                <input
                  value={newUserPassword}
                  onChange={(event) => setNewUserPassword(event.target.value)}
                  placeholder="Minimal 6 karakter"
                  type="password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Role
                </label>

                <select
                  value={newUserRole}
                  onChange={(event) =>
                    setNewUserRole(event.target.value as AdminRole)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Akses Dapil
                </label>

                <select
                  value={newUserDapilId}
                  onChange={(event) => setNewUserDapilId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950"
                >
                  <option value="">Tanpa dapil</option>
                  {dapilList.map((dapil) => (
                    <option key={dapil.id} value={dapil.id}>
                      {dapil.kode} - {dapil.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={isSubmitting}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan User"}
              </button>

              <button
                type="button"
                onClick={resetCreateForm}
                disabled={isSubmitting}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset
              </button>
            </div>
          </section>
        ) : null}

        {editingUser ? (
          <section className="mt-5 rounded-4xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
            <h3 className="text-lg font-black text-slate-950">
              Edit User
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              {editingUser.email}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Nama
                </label>

                <input
                  value={editUserName}
                  onChange={(event) => setEditUserName(event.target.value)}
                  placeholder="Nama user"
                  className="mt-2 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Role
                </label>

                <select
                  value={editUserRole}
                  onChange={(event) =>
                    setEditUserRole(event.target.value as AdminRole)
                  }
                  className="mt-2 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Akses Dapil
                </label>

                <select
                  value={editUserDapilId}
                  onChange={(event) => setEditUserDapilId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950"
                >
                  <option value="">Tanpa dapil</option>
                  {dapilList.map((dapil) => (
                    <option key={dapil.id} value={dapil.id}>
                      {dapil.kode} - {dapil.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              </button>

              <button
                type="button"
                onClick={closeEditForm}
                disabled={isUpdating}
                className="rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>
            </div>
          </section>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
          <input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="Cari nama, email, atau dapil..."
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
          />

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as "all" | AdminRole)
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full border-collapse bg-white">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                    User
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                    Email
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                    Role
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                    Akses Dapil
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUserList.map((user, index) => (
                  <tr
                    key={user.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="border-b border-slate-100 px-4 py-4">
                      <p className="text-sm font-black text-slate-950">
                        {user.nama ?? "Tanpa nama"}
                      </p>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-600">
                        {user.email}
                      </p>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4 text-center">
                      <span
                        className={
                          user.role === "admin"
                            ? "inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-widest text-white"
                            : "inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-700"
                        }
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4">
                      <p className="text-sm font-bold text-slate-700">
                        {user.dapilLabel}
                      </p>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(user)}
                          className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deletingUserId === user.id}
                          className="rounded-2xl bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingUserId === user.id ? "Menghapus..." : "Hapus"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 bg-slate-50 p-3 lg:hidden">
            {filteredUserList.map((user) => (
              <article
                key={user.id}
                className="rounded-3xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="wrap-break-word text-base font-black text-slate-950">
                      {user.nama ?? "Tanpa nama"}
                    </p>

                    <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-600">
                      {user.email}
                    </p>
                  </div>

                  <span
                    className={
                      user.role === "admin"
                        ? "shrink-0 rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-widest text-white"
                        : "shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-700"
                    }
                  >
                    {user.role}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Akses Dapil
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-950">
                    {user.dapilLabel}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(user)}
                    className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user)}
                    disabled={deletingUserId === user.id}
                    className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingUserId === user.id ? "Menghapus..." : "Hapus"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {filteredUserList.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Tidak ada user yang cocok dengan filter.
            </p>
          </div>
        ) : null}
      </section>
    </section>
  );
}