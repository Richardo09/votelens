/**
 * Tipe tab utama pada dashboard user.
 */
export type TabKey = "partai" | "kecamatan" | "kelurahan" | "kandidat-terpilih";

export type UserRole = "admin" | "user";

export type NumberLike = number | string;

/**
 * Data profil user yang dipakai untuk mengunci akses dapil.
 */
export type UserProfile = {
  id: string;
  email: string;
  nama: string | null;
  role: UserRole;
  dapil_id: number | null;
};

/**
 * Data dapil aktif milik user.
 */
export type DapilItem = {
  id: number;
  kode: string;
  nama: string;
  jumlah_kursi?: number | null;
};

/**
 * Data master partai.
 */
export type PartaiItem = {
  id: number;
  nomor_urut: number;
  nama: string;
  singkatan: string | null;
  logo_path: string | null;
};

/**
 * Ringkasan suara partai dari RPC Supabase.
 */
export type PartySummaryItem = {
  partai_id: NumberLike;
  jumlah_kandidat: NumberLike;
  suara_partai: NumberLike;
  suara_kandidat: NumberLike;
  total_suara: NumberLike;
};

/**
 * Ringkasan suara kandidat untuk card kandidat.
 */
export type CandidateSummaryItem = {
  kandidat_id: NumberLike;
  partai_id: NumberLike;
  no_urut: number;
  nama: string;
  foto_path: string | null;
  total_suara: NumberLike;
  kelurahan_tertinggi_id: NumberLike | null;
  kelurahan_tertinggi_nama: string | null;
  suara_kelurahan_tertinggi: NumberLike;
  persen_kelurahan_tertinggi: NumberLike;
  kelurahan_terendah_id: NumberLike | null;
  kelurahan_terendah_nama: string | null;
  suara_kelurahan_terendah: NumberLike;
  persen_kelurahan_terendah: NumberLike;
};

/**
 * Status kandidat berdasarkan alokasi kursi Sainte-Laguë.
 */
export type ElectionStatusItem = {
  kandidat_id: NumberLike;
  partai_id: NumberLike;
  kursi_partai: number;
  peringkat_kandidat: number;
  status_terpilih: boolean;
};

/**
 * Ringkasan setiap kecamatan pada dapil aktif.
 */
export type KecamatanSummaryItem = {
  kecamatan_id: NumberLike;
  kecamatan_nama: string;
  total_kelurahan: NumberLike;
  total_tps: NumberLike;
  suara_partai: NumberLike;
  suara_kandidat: NumberLike;
  total_suara: NumberLike;

  partai_unggul_id: NumberLike | null;
  partai_unggul_nomor_urut: number | null;
  partai_unggul_nama: string | null;
  partai_unggul_singkatan: string | null;
  partai_unggul_logo_path: string | null;
  partai_unggul_total_suara: NumberLike;

  kandidat_unggul_id: NumberLike | null;
  kandidat_unggul_no_urut: number | null;
  kandidat_unggul_nama: string | null;
  kandidat_unggul_foto_path: string | null;
  kandidat_unggul_total_suara: NumberLike;
};

/**
 * Kandidat top 5 dalam satu kecamatan.
 */
export type KecamatanTopCandidateItem = {
  kecamatan_id: NumberLike;
  kecamatan_nama: string;

  kandidat_id: NumberLike;
  no_urut_kandidat: number;
  nama_kandidat: string;
  foto_path: string | null;

  partai_id: NumberLike;
  nomor_urut_partai: number;
  nama_partai: string;
  singkatan_partai: string | null;
  logo_path: string | null;

  total_suara_kecamatan: NumberLike;
  peringkat_kecamatan: number;
};

/**
 * Ringkasan partai dalam satu kecamatan.
 */
export type KecamatanPartySummaryItem = {
  kecamatan_id: NumberLike;
  kecamatan_nama: string;
  partai_id: NumberLike;
  nomor_urut: number;
  nama_partai: string;
  singkatan_partai: string | null;
  logo_path: string | null;
  jumlah_kandidat: NumberLike;
  suara_partai: NumberLike;
  suara_kandidat: NumberLike;
  total_suara: NumberLike;
  total_suara_kecamatan: NumberLike;
  persen_suara: NumberLike;
  peringkat_kecamatan: number;
};

/**
 * Ringkasan kelurahan berdasarkan kecamatan yang dipilih.
 */
export type KelurahanSummaryItem = {
  kelurahan_id: NumberLike;
  kelurahan_nama: string;
  kecamatan_id: NumberLike;
  kecamatan_nama: string;
  total_tps: NumberLike;
  suara_kandidat: NumberLike;
  total_suara: NumberLike;

  partai_unggul_id: NumberLike | null;
  partai_unggul_nomor_urut: number | null;
  partai_unggul_nama: string | null;
  partai_unggul_singkatan: string | null;
  partai_unggul_logo_path: string | null;
  partai_unggul_total_suara: NumberLike;

  kandidat_unggul_id: NumberLike | null;
  kandidat_unggul_no_urut: number | null;
  kandidat_unggul_nama: string | null;
  kandidat_unggul_foto_path: string | null;
  kandidat_unggul_partai_id: NumberLike | null;
  kandidat_unggul_partai_nama: string | null;
  kandidat_unggul_partai_singkatan: string | null;
  kandidat_unggul_total_suara: NumberLike;
};

/**
 * Ringkasan partai dalam satu kelurahan.
 */
export type KelurahanPartySummaryItem = {
  kelurahan_id: NumberLike;
  kelurahan_nama: string;
  kecamatan_id: NumberLike;
  kecamatan_nama: string;

  partai_id: NumberLike;
  nomor_urut: number;
  nama_partai: string;
  singkatan_partai: string | null;
  logo_path: string | null;

  jumlah_kandidat: NumberLike;
  suara_partai: NumberLike;
  suara_kandidat: NumberLike;
  total_suara: NumberLike;
  total_suara_kelurahan: NumberLike;
  persen_suara: NumberLike;
  peringkat_kelurahan: number;
};

/**
 * Kandidat top 5 dalam satu kelurahan.
 */
export type KelurahanTopCandidateItem = {
  kelurahan_id: NumberLike;
  kelurahan_nama: string;
  kecamatan_id: NumberLike;
  kecamatan_nama: string;

  kandidat_id: NumberLike;
  no_urut_kandidat: number;
  nama_kandidat: string;
  foto_path: string | null;

  partai_id: NumberLike;
  nomor_urut_partai: number;
  nama_partai: string;
  singkatan_partai: string | null;
  logo_path: string | null;

  total_suara_kelurahan: NumberLike;
  peringkat_kelurahan: number;
};

/**
 * Ringkasan suara kandidat per kecamatan.
 */
export type CandidateKecamatanSummaryItem = {
  kandidat_id: NumberLike;
  partai_id: NumberLike;
  kecamatan_id: NumberLike;
  kecamatan_nama: string;
  total_kelurahan: NumberLike;
  total_tps: NumberLike;
  total_suara: NumberLike;
};

/**
 * Detail suara kandidat per TPS.
 */
export type CandidateTpsDetailItem = {
  kandidat_id: NumberLike;
  partai_id: NumberLike;
  kecamatan_id: NumberLike;
  kecamatan_nama: string;
  kelurahan_id: NumberLike;
  kelurahan_nama: string;
  tps_id: NumberLike;
  nomor_tps: number;
  jumlah_suara: NumberLike;
};

/**
 * Detail kandidat partai per kelurahan dalam satu kecamatan.
 */
export type KecamatanPartaiKandidatKelurahanItem = {
  kecamatan_id: NumberLike;
  kecamatan_nama: string;
  partai_id: NumberLike;
  nomor_urut_partai: number;
  nama_partai: string;
  singkatan_partai: string | null;
  logo_path: string | null;

  kandidat_id: NumberLike;
  no_urut_kandidat: number;
  nama_kandidat: string;
  foto_path: string | null;

  kelurahan_id: NumberLike;
  kelurahan_nama: string;
  suara_kelurahan: NumberLike;
  total_suara_kandidat: NumberLike;
  peringkat_kandidat_partai_kecamatan: number;
};

/**
 * Detail suara kandidat partai per TPS dalam satu kelurahan.
 */
export type KecamatanPartaiKelurahanTpsItem = {
  kecamatan_id: NumberLike;
  kecamatan_nama: string;
  kelurahan_id: NumberLike;
  kelurahan_nama: string;
  tps_id: NumberLike;
  nomor_tps: number;

  partai_id: NumberLike;
  nomor_urut_partai: number;
  nama_partai: string;
  singkatan_partai: string | null;
  logo_path: string | null;

  kandidat_id: NumberLike;
  no_urut_kandidat: number;
  nama_kandidat: string;
  foto_path: string | null;

  jumlah_suara: NumberLike;
  total_suara_tps_partai: NumberLike;
  total_suara_kandidat_kelurahan: NumberLike;
  suara_partai_murni_kelurahan: NumberLike;
  total_suara_partai_kelurahan: NumberLike;
  peringkat_kandidat_partai_kelurahan: number;
};

/**
 * Kandidat terpilih sesuai urutan kursi Sainte-Laguë.
 */
export type ElectedCandidateItem = {
  urutan_kursi: number;
  partai_id: NumberLike;
  nomor_urut_partai: number;
  nama_partai: string;
  singkatan_partai: string | null;
  logo_path: string | null;
  total_suara_partai: NumberLike;
  angka_pembagi: number;
  nilai_sainte_lague: NumberLike;

  kandidat_id: NumberLike;
  no_urut_kandidat: number;
  nama_kandidat: string;
  foto_path: string | null;
  total_suara_kandidat: NumberLike;
  peringkat_kandidat_partai: number;
};

/**
 * Data partai yang sudah siap dipakai komponen UI.
 */
export type PartyCardItem = {
  id: number;
  nomorUrut: number;
  nama: string;
  singkatan: string | null;
  logoUrl: string | null;
  jumlahKandidat: number;
  jumlahKandidatTerpilih: number;
  suaraPartai: number;
  suaraKandidat: number;
  totalSuara: number;
  peringkat: number;
  kursiPartai: number;
};

/**
 * Data kandidat yang sudah siap dipakai komponen UI.
 */
export type CandidateCardItem = {
  id: number;
  partaiId: number;
  nomorUrutPartai: number;
  namaPartai: string;
  singkatanPartai: string | null;
  logoPartaiUrl: string | null;
  nomorUrutKandidat: number;
  namaKandidat: string;
  fotoUrl: string | null;
  totalSuara: number;
  kelurahanTertinggi: string;
  suaraKelurahanTertinggi: number;
  persenKelurahanTertinggi: number;
  kelurahanTerendah: string;
  suaraKelurahanTerendah: number;
  persenKelurahanTerendah: number;
  kursiPartai: number;
  peringkatKandidat: number;
  statusTerpilih: boolean;
};

/**
 * Data kecamatan yang sudah dirapikan untuk card UI.
 */
export type KecamatanCardItem = {
  id: number;
  nama: string;
  totalKelurahan: number;
  totalTps: number;
  suaraPartai: number;
  suaraKandidat: number;
  totalSuara: number;
  partaiUnggul: {
    id: number;
    nomorUrut: number;
    nama: string;
    singkatan: string | null;
    logoUrl: string | null;
    totalSuara: number;
  } | null;
  kandidatUnggul: {
    id: number;
    noUrut: number;
    nama: string;
    fotoUrl: string | null;
    totalSuara: number;
    namaPartai?: string | null;
    singkatanPartai?: string | null;
  } | null;
};

/**
 * Data kelurahan yang sudah dirapikan untuk card UI.
 */
export type KelurahanCardItem = {
  id: number;
  nama: string;
  kecamatanId: number;
  kecamatanNama: string;
  totalTps: number;
  suaraKandidat: number;
  totalSuara: number;
  partaiUnggul: {
    id: number;
    nomorUrut: number;
    nama: string;
    singkatan: string | null;
    logoUrl: string | null;
    totalSuara: number;
  } | null;
  kandidatUnggul: {
    id: number;
    noUrut: number;
    nama: string;
    fotoUrl: string | null;
    totalSuara: number;
    partaiId: number | null;
    namaPartai: string | null;
    singkatanPartai: string | null;
  } | null;
};

/**
 * Data partai pada detail kecamatan.
 */
export type KecamatanPartyCardItem = {
  kecamatanId: number;
  kecamatanNama: string;
  partaiId: number;
  nomorUrut: number;
  namaPartai: string;
  singkatanPartai: string | null;
  logoUrl: string | null;
  jumlahKandidat: number;
  suaraPartai: number;
  suaraKandidat: number;
  totalSuara: number;
  totalSuaraKecamatan: number;
  persenSuara: number;
  peringkatKecamatan: number;
};

/**
 * Data partai pada detail kelurahan.
 */
export type KelurahanPartyCardItem = {
  kelurahanId: number;
  kelurahanNama: string;
  kecamatanId: number;
  kecamatanNama: string;

  partaiId: number;
  nomorUrut: number;
  namaPartai: string;
  singkatanPartai: string | null;
  logoUrl: string | null;

  jumlahKandidat: number;
  suaraPartai: number;
  suaraKandidat: number;
  totalSuara: number;
  totalSuaraKelurahan: number;
  persenSuara: number;
  peringkatKelurahan: number;
};

/**
 * Data top kandidat kecamatan yang siap dipakai UI.
 */
export type KecamatanTopCandidateCardItem = {
  kecamatanId: number;
  kecamatanNama: string;

  kandidatId: number;
  noUrutKandidat: number;
  namaKandidat: string;
  fotoUrl: string | null;

  partaiId: number;
  nomorUrutPartai: number;
  namaPartai: string;
  singkatanPartai: string | null;
  logoUrl: string | null;

  totalSuaraKecamatan: number;
  peringkatKecamatan: number;
};

/**
 * Data top kandidat kelurahan yang siap dipakai UI.
 */
export type KelurahanTopCandidateCardItem = {
  kelurahanId: number;
  kelurahanNama: string;
  kecamatanId: number;
  kecamatanNama: string;

  kandidatId: number;
  noUrutKandidat: number;
  namaKandidat: string;
  fotoUrl: string | null;

  partaiId: number;
  nomorUrutPartai: number;
  namaPartai: string;
  singkatanPartai: string | null;
  logoUrl: string | null;

  totalSuaraKelurahan: number;
  peringkatKelurahan: number;
};

/**
 * Baris tabel kandidat x kelurahan.
 */
export type PartyKelurahanMatrixRow = {
  kandidatId: number;
  noUrutKandidat: number;
  namaKandidat: string;
  fotoUrl: string | null;
  totalSuaraKandidat: number;
  peringkatKandidat: number;
  suaraPerKelurahan: Record<number, number>;
};

export type KelurahanColumn = {
  id: number;
  nama: string;
};

/**
 * Baris tabel TPS x kandidat.
 */
export type KelurahanTpsMatrixRow = {
  tpsId: number;
  nomorTps: number;
  suaraPerKandidat: Record<number, number>;
};

export type ElectedCandidateCardItem = {
  urutanKursi: number;
  partaiId: number;
  nomorUrutPartai: number;
  namaPartai: string;
  singkatanPartai: string | null;
  logoUrl: string | null;
  totalSuaraPartai: number;
  angkaPembagi: number;
  nilaiSainteLague: number;
  kandidatId: number;
  noUrutKandidat: number;
  namaKandidat: string;
  fotoUrl: string | null;
  totalSuaraKandidat: number;
  peringkatKandidatPartai: number;
};

/**
 * Paket data awal yang dibutuhkan dashboard.
 */
export type DashboardData = {
  profile: UserProfile;
  dapil: DapilItem;
  partaiList: PartaiItem[];
  partySummaryList: PartySummaryItem[];
  candidateSummaryList: CandidateSummaryItem[];
  electionStatusList: ElectionStatusItem[];
  kecamatanSummaryList: KecamatanSummaryItem[];
  electedCandidateList: ElectedCandidateItem[];
};