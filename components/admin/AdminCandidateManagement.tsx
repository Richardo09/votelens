"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type DapilOption = {
  id: number;
  kode: string;
  nama: string;
  jumlah_kursi: number | null;
};

type PartyOption = {
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

type CandidateRow = CandidateRecord & {
  partaiLabel: string;
  dapilLabel: string;
};

type AdminApiResponse = {
  success: boolean;
  message: string;
  kandidatId?: number;
};

/**
 * Mengelola data kandidat berdasarkan dapil dan partai.
 */
export default function AdminCandidateManagement() {
  const [dapilList, setDapilList] = useState<DapilOption[]>([]);
  const [partyList, setPartyList] = useState<PartyOption[]>([]);
  const [candidateList, setCandidateList] = useState<CandidateRecord[]>([]);

  const [selectedDapilId, setSelectedDapilId] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isCandidateLoading, setIsCandidateLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCandidateId, setDeletingCandidateId] = useState<number | null>(
    null
  );

  const [editingCandidate, setEditingCandidate] =
    useState<CandidateRecord | null>(null);

  const [formPartyId, setFormPartyId] = useState("");
  const [formNoUrut, setFormNoUrut] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhotoPath, setFormPhotoPath] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  /**
   * Memuat daftar dapil dan partai sebagai data utama form kandidat.
   */
  const loadMasterData = useCallback(async () => {
    const supabase = getSupabaseClient();

    const [dapilResponse, partyResponse] = await Promise.all([
      supabase
        .from("dapil")
        .select("id, kode, nama, jumlah_kursi")
        .order("id", { ascending: true }),

      supabase
        .from("partai")
        .select("id, nomor_urut, nama, singkatan, logo_path")
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

    setFormPartyId((current) => {
      return current || (partyRows[0] ? String(partyRows[0].id) : "");
    });
  }, []);

  /**
   * Memuat daftar kandidat berdasarkan dapil aktif.
   */
  const loadCandidateData = useCallback(async (dapilId: string) => {
    if (!dapilId) {
      setCandidateList([]);
      return;
    }

    const supabase = getSupabaseClient();

    setIsCandidateLoading(true);

    try {
      const { data, error } = await supabase
        .from("kandidat")
        .select("id, dapil_id, partai_id, no_urut, nama, foto_path")
        .eq("dapil_id", Number(dapilId))
        .order("partai_id", { ascending: true })
        .order("no_urut", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      setCandidateList((data as CandidateRecord[]) ?? []);
      setErrorMessage("");
    } finally {
      setIsCandidateLoading(false);
    }
  }, []);

  /**
   * Memuat data awal modul kandidat.
   *
   * Timer digunakan agar proses yang memicu pembaruan state tidak dipanggil
   * langsung pada fase effect utama.
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
              : "Gagal memuat data master kandidat.";

          setErrorMessage(message);
        } finally {
          if (isMounted) {
            setIsLoading(false);
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
   * Memuat ulang kandidat setiap kali dapil aktif berubah.
   *
   * Timer digunakan agar fungsi yang berisi setState tidak dianggap sebagai
   * pembaruan state langsung di dalam effect.
   */
  useEffect(() => {
    if (!selectedDapilId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadCandidateData(selectedDapilId);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadCandidateData, selectedDapilId]);

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
   * Mengosongkan form kandidat.
   */
  function resetForm() {
    setEditingCandidate(null);
    setFormPartyId(partyList[0] ? String(partyList[0].id) : "");
    setFormNoUrut("");
    setFormName("");
    setFormPhotoPath("");
  }

  /**
   * Membuka form tambah kandidat.
   */
  function openCreateForm() {
    resetForm();
    setIsFormOpen(true);
    setErrorMessage("");
    setActionMessage("");
  }

  /**
   * Membuka form edit kandidat.
   */
  function openEditForm(candidate: CandidateRecord) {
    setEditingCandidate(candidate);
    setFormPartyId(String(candidate.partai_id));
    setFormNoUrut(String(candidate.no_urut));
    setFormName(candidate.nama);
    setFormPhotoPath(candidate.foto_path ?? "");
    setIsFormOpen(true);
    setErrorMessage("");
    setActionMessage("");
  }

  /**
   * Menutup form kandidat.
   */
  function closeForm() {
    resetForm();
    setIsFormOpen(false);
  }

  /**
   * Menyimpan kandidat baru atau memperbarui kandidat yang sedang diedit.
   */
  async function handleSubmitCandidate() {
    setIsSubmitting(true);
    setErrorMessage("");
    setActionMessage("");

    try {
      const accessToken = await getAccessToken();
      const isEditMode = Boolean(editingCandidate);

      const response = await fetch("/api/admin/candidates", {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kandidatId: editingCandidate?.id,
          dapilId: Number(selectedDapilId),
          partaiId: Number(formPartyId),
          noUrut: Number(formNoUrut),
          nama: formName,
          fotoPath: formPhotoPath || null,
        }),
      });

      const result = (await response.json()) as AdminApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan kandidat.");
      }

      await loadCandidateData(selectedDapilId);
      closeForm();
      setActionMessage(result.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan kandidat.";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Menghapus kandidat berdasarkan ID.
   */
  async function handleDeleteCandidate(candidate: CandidateRecord) {
    const confirmed = window.confirm(
      `Hapus kandidat ${candidate.nama}? Aksi ini tidak bisa dibatalkan.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingCandidateId(candidate.id);
    setErrorMessage("");
    setActionMessage("");

    try {
      const accessToken = await getAccessToken();

      const response = await fetch("/api/admin/candidates", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kandidatId: candidate.id,
        }),
      });

      const result = (await response.json()) as AdminApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus kandidat.");
      }

      await loadCandidateData(selectedDapilId);

      if (editingCandidate?.id === candidate.id) {
        closeForm();
      }

      setActionMessage(result.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus kandidat.";

      setErrorMessage(message);
    } finally {
      setDeletingCandidateId(null);
    }
  }

  /**
   * Menggabungkan kandidat dengan label dapil dan partai.
   */
  const candidateRowList = useMemo<CandidateRow[]>(() => {
    const dapilMap = new Map<number, DapilOption>();
    const partyMap = new Map<number, PartyOption>();

    dapilList.forEach((dapil) => {
      dapilMap.set(dapil.id, dapil);
    });

    partyList.forEach((party) => {
      partyMap.set(party.id, party);
    });

    return candidateList.map((candidate) => {
      const dapil = dapilMap.get(candidate.dapil_id);
      const party = partyMap.get(candidate.partai_id);

      return {
        ...candidate,
        dapilLabel: dapil ? `${dapil.kode} - ${dapil.nama}` : "-",
        partaiLabel: party
          ? `${party.nomor_urut}. ${party.nama}${
              party.singkatan ? ` (${party.singkatan})` : ""
            }`
          : "-",
      };
    });
  }, [candidateList, dapilList, partyList]);

  /**
   * Menerapkan filter partai dan pencarian kandidat.
   */
  const filteredCandidateList = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return candidateRowList.filter((candidate) => {
      const matchesParty =
        selectedPartyId === "all" ||
        candidate.partai_id === Number(selectedPartyId);

      const matchesKeyword =
        !keyword ||
        candidate.nama.toLowerCase().includes(keyword) ||
        candidate.partaiLabel.toLowerCase().includes(keyword);

      return matchesParty && matchesKeyword;
    });
  }, [candidateRowList, searchKeyword, selectedPartyId]);

  const selectedDapil = useMemo(() => {
    return (
      dapilList.find((dapil) => dapil.id === Number(selectedDapilId)) ?? null
    );
  }, [dapilList, selectedDapilId]);

  if (isLoading) {
    return (
      <section className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-600">
          Memuat data kandidat...
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
          <p className="text-sm font-bold text-emerald-700">
            {actionMessage}
          </p>
        </section>
      ) : null}

      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Input Kandidat
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Kelola Kandidat per Dapil
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pilih dapil, pilih partai, lalu tambahkan atau ubah kandidat.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="w-fit rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
          >
            Tambah Kandidat
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Dapil
            </label>

            <select
              value={selectedDapilId}
              onChange={(event) => {
                setSelectedDapilId(event.target.value);
                closeForm();
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
              Filter Partai
            </label>

            <select
              value={selectedPartyId}
              onChange={(event) => setSelectedPartyId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="all">Semua Partai</option>

              {partyList.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.nomor_urut}. {party.nama}
                  {party.singkatan ? ` (${party.singkatan})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Cari Kandidat
            </label>

            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Nama kandidat atau partai..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
            />
          </div>
        </div>
      </section>

      {selectedDapil ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Dapil Aktif
            </p>

            <p className="mt-2 text-lg font-black text-slate-950">
              {selectedDapil.kode}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              {selectedDapil.nama}
            </p>
          </article>

          <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Kursi
            </p>

            <p className="mt-2 text-3xl font-black text-slate-950">
              {selectedDapil.jumlah_kursi ?? "-"}
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
              Hasil Filter
            </p>

            <p className="mt-2 text-3xl font-black">
              {filteredCandidateList.length}
            </p>
          </article>
        </section>
      ) : null}

      {isFormOpen ? (
        <section className="rounded-4xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                {editingCandidate ? "Edit Kandidat" : "Tambah Kandidat"}
              </p>

              <h3 className="mt-2 text-xl font-black text-slate-950">
                {editingCandidate
                  ? "Perbarui Data Kandidat"
                  : "Form Kandidat Baru"}
              </h3>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="w-fit rounded-2xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Tutup
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                Partai
              </label>

              <select
                value={formPartyId}
                onChange={(event) => setFormPartyId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950"
              >
                {partyList.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.nomor_urut}. {party.nama}
                    {party.singkatan ? ` (${party.singkatan})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                Nomor Urut Kandidat
              </label>

              <input
                value={formNoUrut}
                onChange={(event) => setFormNoUrut(event.target.value)}
                placeholder="Contoh: 1"
                type="number"
                min={1}
                className="mt-2 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                Nama Kandidat
              </label>

              <input
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder="Nama lengkap kandidat"
                className="mt-2 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                Foto Path
              </label>

              <input
                value={formPhotoPath}
                onChange={(event) => setFormPhotoPath(event.target.value)}
                placeholder="Opsional, contoh: kandidat/nama-file.png"
                className="mt-2 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
              />

              <p className="mt-2 text-xs font-semibold text-slate-500">
                Untuk tahap awal, field ini menerima path foto dari storage.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmitCandidate}
              disabled={isSubmitting}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Menyimpan..."
                : editingCandidate
                  ? "Simpan Perubahan"
                  : "Simpan Kandidat"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h3 className="text-xl font-black text-slate-950">
            Daftar Kandidat
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Kandidat ditampilkan berdasarkan dapil aktif dan dapat difilter
            berdasarkan partai.
          </p>
        </div>

        {isCandidateLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-600">
              Memuat kandidat...
            </p>
          </div>
        ) : null}

        {!isCandidateLoading ? (
          <>
            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
              <table className="min-w-full border-collapse bg-white">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                      No
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                      Kandidat
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                      Partai
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                      Foto Path
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCandidateList.map((candidate, index) => (
                    <tr
                      key={candidate.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="text-sm font-black text-slate-950">
                          {candidate.no_urut}
                        </p>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="text-sm font-black text-slate-950">
                          {candidate.nama}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {candidate.dapilLabel}
                        </p>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="text-sm font-bold text-slate-700">
                          {candidate.partaiLabel}
                        </p>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="max-w-xs truncate text-sm font-semibold text-slate-600">
                          {candidate.foto_path ?? "-"}
                        </p>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(candidate)}
                            className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCandidate(candidate)}
                            disabled={deletingCandidateId === candidate.id}
                            className="rounded-2xl bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingCandidateId === candidate.id
                              ? "Menghapus..."
                              : "Hapus"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {filteredCandidateList.map((candidate) => (
                <article
                  key={candidate.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                        No. {candidate.no_urut}
                      </p>

                      <h4 className="mt-1 wrap-break-word text-base font-black text-slate-950">
                        {candidate.nama}
                      </h4>

                      <p className="mt-2 text-sm font-bold text-slate-700">
                        {candidate.partaiLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Foto Path
                    </p>

                    <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-600">
                      {candidate.foto_path ?? "-"}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(candidate)}
                      className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCandidate(candidate)}
                      disabled={deletingCandidateId === candidate.id}
                      className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingCandidateId === candidate.id
                        ? "Menghapus..."
                        : "Hapus"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filteredCandidateList.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Belum ada kandidat yang cocok dengan filter.
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </section>
  );
}