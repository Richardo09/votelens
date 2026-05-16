import {
  getCandidatePhotoUrl,
  getPartyLogoUrl,
  toSafeNumber,
} from "./format";
import type {
  CandidateCardItem,
  CandidateSummaryItem,
  ElectedCandidateCardItem,
  ElectedCandidateItem,
  ElectionStatusItem,
  KecamatanCardItem,
  KecamatanPartaiKandidatKelurahanItem,
  KecamatanPartaiKelurahanTpsItem,
  KecamatanPartyCardItem,
  KecamatanPartySummaryItem,
  KecamatanSummaryItem,
  KecamatanTopCandidateCardItem,
  KecamatanTopCandidateItem,
  KelurahanCardItem,
  KelurahanColumn,
  KelurahanPartyCardItem,
  KelurahanPartySummaryItem,
  KelurahanSummaryItem,
  KelurahanTopCandidateCardItem,
  KelurahanTopCandidateItem,
  KelurahanTpsMatrixRow,
  PartaiItem,
  PartyCardItem,
  PartyKelurahanMatrixRow,
  PartySummaryItem,
} from "./types";

export type PartyKelurahanMatrixResult = {
  kelurahanColumns: KelurahanColumn[];
  candidateRows: PartyKelurahanMatrixRow[];
  totalSuaraKandidat: number;
};

export type KelurahanTpsMatrixResult = {
  kandidatColumns: Array<{
    id: number;
    noUrut: number;
    nama: string;
  }>;
  tpsRows: KelurahanTpsMatrixRow[];
  totalSuaraKandidat: number;
  suaraPartaiMurni: number;
  totalSuaraPartai: number;
};

/**
 * Membuat map status kandidat agar pencarian status lebih cepat.
 */
function createElectionStatusMap(electionStatusList: ElectionStatusItem[]) {
  const statusMap = new Map<number, ElectionStatusItem>();

  electionStatusList.forEach((status) => {
    statusMap.set(Number(status.kandidat_id), status);
  });

  return statusMap;
}

/**
 * Menyiapkan data card partai dari data mentah dashboard.
 */
export function mapPartyCards(params: {
  partaiList: PartaiItem[];
  partySummaryList: PartySummaryItem[];
  electionStatusList: ElectionStatusItem[];
}): PartyCardItem[] {
  const summaryMap = new Map<number, PartySummaryItem>();
  const electedCountMap = new Map<number, number>();
  const kursiPartaiMap = new Map<number, number>();

  params.partySummaryList.forEach((summary) => {
    summaryMap.set(Number(summary.partai_id), summary);
  });

  params.electionStatusList.forEach((status) => {
    const partaiId = Number(status.partai_id);

    kursiPartaiMap.set(partaiId, status.kursi_partai);

    if (status.status_terpilih) {
      electedCountMap.set(partaiId, (electedCountMap.get(partaiId) ?? 0) + 1);
    }
  });

  const baseList = params.partaiList
    .map((partai) => {
      const summary = summaryMap.get(partai.id);

      return {
        id: partai.id,
        nomorUrut: partai.nomor_urut,
        nama: partai.nama,
        singkatan: partai.singkatan,
        logoUrl: getPartyLogoUrl(partai.logo_path),
        jumlahKandidat: toSafeNumber(summary?.jumlah_kandidat),
        jumlahKandidatTerpilih: electedCountMap.get(partai.id) ?? 0,
        suaraPartai: toSafeNumber(summary?.suara_partai),
        suaraKandidat: toSafeNumber(summary?.suara_kandidat),
        totalSuara: toSafeNumber(summary?.total_suara),
        peringkat: 0,
        kursiPartai: kursiPartaiMap.get(partai.id) ?? 0,
      };
    })
    .filter((partai) => partai.jumlahKandidat > 0 || partai.totalSuara > 0);

  const rankList = [...baseList].sort((a, b) => {
    if (b.totalSuara !== a.totalSuara) {
      return b.totalSuara - a.totalSuara;
    }

    return a.nomorUrut - b.nomorUrut;
  });

  const rankMap = new Map<number, number>();

  rankList.forEach((partai, index) => {
    rankMap.set(partai.id, index + 1);
  });

  return baseList
    .map((partai) => ({
      ...partai,
      peringkat: rankMap.get(partai.id) ?? 0,
    }))
    .sort((a, b) => a.nomorUrut - b.nomorUrut);
}

/**
 * Menyiapkan data kandidat berdasarkan partai yang sedang dipilih.
 */
export function mapCandidateCards(params: {
  selectedParty: PartyCardItem;
  candidateSummaryList: CandidateSummaryItem[];
  electionStatusList: ElectionStatusItem[];
}): CandidateCardItem[] {
  const statusMap = createElectionStatusMap(params.electionStatusList);

  return params.candidateSummaryList
    .filter((candidate) => Number(candidate.partai_id) === params.selectedParty.id)
    .map((candidate) => {
      const electionStatus = statusMap.get(Number(candidate.kandidat_id));

      return {
        id: Number(candidate.kandidat_id),
        partaiId: Number(candidate.partai_id),
        nomorUrutPartai: params.selectedParty.nomorUrut,
        namaPartai: params.selectedParty.nama,
        singkatanPartai: params.selectedParty.singkatan,
        logoPartaiUrl: params.selectedParty.logoUrl,
        nomorUrutKandidat: candidate.no_urut,
        namaKandidat: candidate.nama,
        fotoUrl: getCandidatePhotoUrl(candidate.foto_path),
        totalSuara: toSafeNumber(candidate.total_suara),
        kelurahanTertinggi: candidate.kelurahan_tertinggi_nama ?? "-",
        suaraKelurahanTertinggi: toSafeNumber(
          candidate.suara_kelurahan_tertinggi
        ),
        persenKelurahanTertinggi: toSafeNumber(
          candidate.persen_kelurahan_tertinggi
        ),
        kelurahanTerendah: candidate.kelurahan_terendah_nama ?? "-",
        suaraKelurahanTerendah: toSafeNumber(
          candidate.suara_kelurahan_terendah
        ),
        persenKelurahanTerendah: toSafeNumber(
          candidate.persen_kelurahan_terendah
        ),
        kursiPartai: electionStatus?.kursi_partai ?? 0,
        peringkatKandidat: electionStatus?.peringkat_kandidat ?? 0,
        statusTerpilih: electionStatus?.status_terpilih ?? false,
      };
    })
    .sort((a, b) => a.nomorUrutKandidat - b.nomorUrutKandidat);
}

/**
 * Menyiapkan data card kecamatan untuk tab kecamatan.
 */
export function mapKecamatanCards(
  kecamatanSummaryList: KecamatanSummaryItem[],
  options?: {
    candidateSummaryList?: CandidateSummaryItem[];
    partaiList?: PartaiItem[];
  }
): KecamatanCardItem[] {
  const partaiMap = new Map<number, PartaiItem>();
  const kandidatPartaiMap = new Map<number, PartaiItem>();

  options?.partaiList?.forEach((partai) => {
    partaiMap.set(partai.id, partai);
  });

  options?.candidateSummaryList?.forEach((candidate) => {
    const partai = partaiMap.get(Number(candidate.partai_id));

    if (partai) {
      kandidatPartaiMap.set(Number(candidate.kandidat_id), partai);
    }
  });

  return kecamatanSummaryList.map((kecamatan) => {
    const partaiUnggulId = kecamatan.partai_unggul_id
      ? Number(kecamatan.partai_unggul_id)
      : 0;

    const kandidatUnggulId = kecamatan.kandidat_unggul_id
      ? Number(kecamatan.kandidat_unggul_id)
      : 0;

    const kandidatPartai = kandidatPartaiMap.get(kandidatUnggulId);

    return {
      id: Number(kecamatan.kecamatan_id),
      nama: kecamatan.kecamatan_nama,
      totalKelurahan: toSafeNumber(kecamatan.total_kelurahan),
      totalTps: toSafeNumber(kecamatan.total_tps),
      suaraPartai: toSafeNumber(kecamatan.suara_partai),
      suaraKandidat: toSafeNumber(kecamatan.suara_kandidat),
      totalSuara: toSafeNumber(kecamatan.total_suara),
      partaiUnggul: partaiUnggulId
        ? {
            id: partaiUnggulId,
            nomorUrut: kecamatan.partai_unggul_nomor_urut ?? 0,
            nama: kecamatan.partai_unggul_nama ?? "-",
            singkatan: kecamatan.partai_unggul_singkatan,
            logoUrl: getPartyLogoUrl(kecamatan.partai_unggul_logo_path),
            totalSuara: toSafeNumber(kecamatan.partai_unggul_total_suara),
          }
        : null,
      kandidatUnggul: kandidatUnggulId
        ? {
            id: kandidatUnggulId,
            noUrut: kecamatan.kandidat_unggul_no_urut ?? 0,
            nama: kecamatan.kandidat_unggul_nama ?? "-",
            fotoUrl: getCandidatePhotoUrl(kecamatan.kandidat_unggul_foto_path),
            totalSuara: toSafeNumber(kecamatan.kandidat_unggul_total_suara),
            namaPartai: kandidatPartai?.nama ?? null,
            singkatanPartai: kandidatPartai?.singkatan ?? null,
          }
        : null,
    };
  });
}

/**
 * Menyiapkan data card kelurahan berdasarkan kecamatan yang dipilih.
 */
export function mapKelurahanCards(
  kelurahanSummaryList: KelurahanSummaryItem[]
): KelurahanCardItem[] {
  return kelurahanSummaryList.map((kelurahan) => {
    const partaiUnggulId = kelurahan.partai_unggul_id
      ? Number(kelurahan.partai_unggul_id)
      : 0;

    const kandidatUnggulId = kelurahan.kandidat_unggul_id
      ? Number(kelurahan.kandidat_unggul_id)
      : 0;

    return {
      id: Number(kelurahan.kelurahan_id),
      nama: kelurahan.kelurahan_nama,
      kecamatanId: Number(kelurahan.kecamatan_id),
      kecamatanNama: kelurahan.kecamatan_nama,
      totalTps: toSafeNumber(kelurahan.total_tps),
      suaraKandidat: toSafeNumber(kelurahan.suara_kandidat),
      totalSuara: toSafeNumber(kelurahan.total_suara),
      partaiUnggul: partaiUnggulId
        ? {
            id: partaiUnggulId,
            nomorUrut: kelurahan.partai_unggul_nomor_urut ?? 0,
            nama: kelurahan.partai_unggul_nama ?? "-",
            singkatan: kelurahan.partai_unggul_singkatan,
            logoUrl: getPartyLogoUrl(kelurahan.partai_unggul_logo_path),
            totalSuara: toSafeNumber(kelurahan.partai_unggul_total_suara),
          }
        : null,
      kandidatUnggul: kandidatUnggulId
        ? {
            id: kandidatUnggulId,
            noUrut: kelurahan.kandidat_unggul_no_urut ?? 0,
            nama: kelurahan.kandidat_unggul_nama ?? "-",
            fotoUrl: getCandidatePhotoUrl(kelurahan.kandidat_unggul_foto_path),
            totalSuara: toSafeNumber(kelurahan.kandidat_unggul_total_suara),
            partaiId: kelurahan.kandidat_unggul_partai_id
              ? Number(kelurahan.kandidat_unggul_partai_id)
              : null,
            namaPartai: kelurahan.kandidat_unggul_partai_nama,
            singkatanPartai: kelurahan.kandidat_unggul_partai_singkatan,
          }
        : null,
    };
  });
}

/**
 * Menyiapkan rekap partai di dalam detail kecamatan.
 */
export function mapKecamatanPartyCards(
  kecamatanPartySummaryList: KecamatanPartySummaryItem[]
): KecamatanPartyCardItem[] {
  return kecamatanPartySummaryList.map((item) => ({
    kecamatanId: Number(item.kecamatan_id),
    kecamatanNama: item.kecamatan_nama,
    partaiId: Number(item.partai_id),
    nomorUrut: item.nomor_urut,
    namaPartai: item.nama_partai,
    singkatanPartai: item.singkatan_partai,
    logoUrl: getPartyLogoUrl(item.logo_path),
    jumlahKandidat: toSafeNumber(item.jumlah_kandidat),
    suaraPartai: toSafeNumber(item.suara_partai),
    suaraKandidat: toSafeNumber(item.suara_kandidat),
    totalSuara: toSafeNumber(item.total_suara),
    totalSuaraKecamatan: toSafeNumber(item.total_suara_kecamatan),
    persenSuara: toSafeNumber(item.persen_suara),
    peringkatKecamatan: item.peringkat_kecamatan,
  }));
}

/**
 * Menyiapkan rekap partai di dalam detail kelurahan.
 */
export function mapKelurahanPartyCards(
  kelurahanPartySummaryList: KelurahanPartySummaryItem[]
): KelurahanPartyCardItem[] {
  return kelurahanPartySummaryList.map((item) => ({
    kelurahanId: Number(item.kelurahan_id),
    kelurahanNama: item.kelurahan_nama,
    kecamatanId: Number(item.kecamatan_id),
    kecamatanNama: item.kecamatan_nama,

    partaiId: Number(item.partai_id),
    nomorUrut: item.nomor_urut,
    namaPartai: item.nama_partai,
    singkatanPartai: item.singkatan_partai,
    logoUrl: getPartyLogoUrl(item.logo_path),

    jumlahKandidat: toSafeNumber(item.jumlah_kandidat),
    suaraPartai: toSafeNumber(item.suara_partai),
    suaraKandidat: toSafeNumber(item.suara_kandidat),
    totalSuara: toSafeNumber(item.total_suara),
    totalSuaraKelurahan: toSafeNumber(item.total_suara_kelurahan),
    persenSuara: toSafeNumber(item.persen_suara),
    peringkatKelurahan: item.peringkat_kelurahan,
  }));
}

/**
 * Menyiapkan top kandidat perorangan di detail kecamatan.
 */
export function mapKecamatanTopCandidateCards(
  topCandidateList: KecamatanTopCandidateItem[]
): KecamatanTopCandidateCardItem[] {
  return topCandidateList.map((candidate) => ({
    kecamatanId: Number(candidate.kecamatan_id),
    kecamatanNama: candidate.kecamatan_nama,

    kandidatId: Number(candidate.kandidat_id),
    noUrutKandidat: candidate.no_urut_kandidat,
    namaKandidat: candidate.nama_kandidat,
    fotoUrl: getCandidatePhotoUrl(candidate.foto_path),

    partaiId: Number(candidate.partai_id),
    nomorUrutPartai: candidate.nomor_urut_partai,
    namaPartai: candidate.nama_partai,
    singkatanPartai: candidate.singkatan_partai,
    logoUrl: getPartyLogoUrl(candidate.logo_path),

    totalSuaraKecamatan: toSafeNumber(candidate.total_suara_kecamatan),
    peringkatKecamatan: candidate.peringkat_kecamatan,
  }));
}

/**
 * Menyiapkan top kandidat perorangan di detail kelurahan.
 */
export function mapKelurahanTopCandidateCards(
  topCandidateList: KelurahanTopCandidateItem[]
): KelurahanTopCandidateCardItem[] {
  return topCandidateList.map((candidate) => ({
    kelurahanId: Number(candidate.kelurahan_id),
    kelurahanNama: candidate.kelurahan_nama,
    kecamatanId: Number(candidate.kecamatan_id),
    kecamatanNama: candidate.kecamatan_nama,

    kandidatId: Number(candidate.kandidat_id),
    noUrutKandidat: candidate.no_urut_kandidat,
    namaKandidat: candidate.nama_kandidat,
    fotoUrl: getCandidatePhotoUrl(candidate.foto_path),

    partaiId: Number(candidate.partai_id),
    nomorUrutPartai: candidate.nomor_urut_partai,
    namaPartai: candidate.nama_partai,
    singkatanPartai: candidate.singkatan_partai,
    logoUrl: getPartyLogoUrl(candidate.logo_path),

    totalSuaraKelurahan: toSafeNumber(candidate.total_suara_kelurahan),
    peringkatKelurahan: candidate.peringkat_kelurahan,
  }));
}

/**
 * Menyiapkan card kandidat terpilih berdasarkan urutan kursi.
 */
export function mapElectedCandidateCards(
  electedCandidateList: ElectedCandidateItem[]
): ElectedCandidateCardItem[] {
  return electedCandidateList.map((item) => ({
    urutanKursi: item.urutan_kursi,
    partaiId: Number(item.partai_id),
    nomorUrutPartai: item.nomor_urut_partai,
    namaPartai: item.nama_partai,
    singkatanPartai: item.singkatan_partai,
    logoUrl: getPartyLogoUrl(item.logo_path),
    totalSuaraPartai: toSafeNumber(item.total_suara_partai),
    angkaPembagi: item.angka_pembagi,
    nilaiSainteLague: toSafeNumber(item.nilai_sainte_lague),
    kandidatId: Number(item.kandidat_id),
    noUrutKandidat: item.no_urut_kandidat,
    namaKandidat: item.nama_kandidat,
    fotoUrl: getCandidatePhotoUrl(item.foto_path),
    totalSuaraKandidat: toSafeNumber(item.total_suara_kandidat),
    peringkatKandidatPartai: item.peringkat_kandidat_partai,
  }));
}

/**
 * Membentuk tabel kandidat x kelurahan untuk detail partai.
 */
export function buildPartyKelurahanMatrix(
  rows: KecamatanPartaiKandidatKelurahanItem[]
): PartyKelurahanMatrixResult {
  const kelurahanMap = new Map<number, KelurahanColumn>();
  const candidateMap = new Map<number, PartyKelurahanMatrixRow>();

  rows.forEach((row) => {
    const kelurahanId = Number(row.kelurahan_id);
    const kandidatId = Number(row.kandidat_id);

    kelurahanMap.set(kelurahanId, {
      id: kelurahanId,
      nama: row.kelurahan_nama,
    });

    const current = candidateMap.get(kandidatId);

    if (current) {
      current.suaraPerKelurahan[kelurahanId] = toSafeNumber(
        row.suara_kelurahan
      );
      return;
    }

    candidateMap.set(kandidatId, {
      kandidatId,
      noUrutKandidat: row.no_urut_kandidat,
      namaKandidat: row.nama_kandidat,
      fotoUrl: getCandidatePhotoUrl(row.foto_path),
      totalSuaraKandidat: toSafeNumber(row.total_suara_kandidat),
      peringkatKandidat: row.peringkat_kandidat_partai_kecamatan,
      suaraPerKelurahan: {
        [kelurahanId]: toSafeNumber(row.suara_kelurahan),
      },
    });
  });

  const kelurahanColumns = Array.from(kelurahanMap.values()).sort((a, b) =>
    a.nama.localeCompare(b.nama)
  );

  const candidateRows = Array.from(candidateMap.values()).sort(
    (a, b) => a.noUrutKandidat - b.noUrutKandidat
  );

  const totalSuaraKandidat = candidateRows.reduce((total, candidate) => {
    return total + candidate.totalSuaraKandidat;
  }, 0);

  return {
    kelurahanColumns,
    candidateRows,
    totalSuaraKandidat,
  };
}

/**
 * Membentuk tabel TPS x kandidat untuk detail kelurahan.
 */
export function buildKelurahanTpsMatrix(
  rows: KecamatanPartaiKelurahanTpsItem[]
): KelurahanTpsMatrixResult {
  const kandidatMap = new Map<
    number,
    {
      id: number;
      noUrut: number;
      nama: string;
    }
  >();

  const tpsMap = new Map<number, KelurahanTpsMatrixRow>();

  rows.forEach((row) => {
    const kandidatId = Number(row.kandidat_id);
    const tpsId = Number(row.tps_id);

    kandidatMap.set(kandidatId, {
      id: kandidatId,
      noUrut: row.no_urut_kandidat,
      nama: row.nama_kandidat,
    });

    const current = tpsMap.get(tpsId);

    if (current) {
      current.suaraPerKandidat[kandidatId] = toSafeNumber(row.jumlah_suara);
      return;
    }

    tpsMap.set(tpsId, {
      tpsId,
      nomorTps: row.nomor_tps,
      suaraPerKandidat: {
        [kandidatId]: toSafeNumber(row.jumlah_suara),
      },
    });
  });

  const kandidatColumns = Array.from(kandidatMap.values()).sort(
    (a, b) => a.noUrut - b.noUrut
  );

  const tpsRows = Array.from(tpsMap.values()).sort(
    (a, b) => a.nomorTps - b.nomorTps
  );

  const firstRow = rows[0];

  return {
    kandidatColumns,
    tpsRows,
    totalSuaraKandidat: toSafeNumber(
      firstRow?.total_suara_kandidat_kelurahan
    ),
    suaraPartaiMurni: toSafeNumber(firstRow?.suara_partai_murni_kelurahan),
    totalSuaraPartai: toSafeNumber(firstRow?.total_suara_partai_kelurahan),
  };
}