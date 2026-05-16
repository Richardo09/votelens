"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchCandidateKecamatanSummary,
  fetchCandidateTpsByKecamatan,
  fetchDashboardData,
  fetchKecamatanPartySummary,
  fetchKecamatanTopCandidates,
  fetchKelurahanPartySummary,
  fetchKelurahanSummaryByKecamatan,
  fetchKelurahanTopCandidates,
  fetchPartyKelurahanDetail,
  fetchPartyKelurahanTpsDetail,
} from "@/lib/dashboard/api";
import {
  mapCandidateCards,
  mapElectedCandidateCards,
  mapKecamatanCards,
  mapKecamatanPartyCards,
  mapKecamatanTopCandidateCards,
  mapKelurahanCards,
  mapKelurahanPartyCards,
  mapKelurahanTopCandidateCards,
  mapPartyCards,
} from "@/lib/dashboard/mappers";
import type {
  CandidateCardItem,
  CandidateKecamatanSummaryItem,
  CandidateTpsDetailItem,
  DashboardData,
  KecamatanCardItem,
  KecamatanPartaiKandidatKelurahanItem,
  KecamatanPartaiKelurahanTpsItem,
  KecamatanPartyCardItem,
  KecamatanTopCandidateCardItem,
  KelurahanCardItem,
  KelurahanColumn,
  KelurahanPartyCardItem,
  KelurahanTopCandidateCardItem,
  PartyCardItem,
  TabKey,
} from "@/lib/dashboard/types";
import CandidateDetail from "./CandidateDetail";
import CandidateSection from "./CandidateSection";
import DashboardHeader from "./DashboardHeader";
import DashboardMobileMenu from "./DashboardMobileMenu";
import DashboardTabs from "./DashboardTabs";
import ElectedCandidatesSection from "./ElectedCandidatesSection";
import KecamatanDetail from "./KecamatanDetail";
import KecamatanSection from "./KecamatanSection";
import KelurahanDetail from "./KelurahanDetail";
import KelurahanSection from "./KelurahanSection";
import KelurahanTpsDetail from "./KelurahanTpsDetail";
import PartyDetailInline from "./PartyDetailInline";
import PartySection from "./PartySection";

type SelectedKelurahanTpsDetail = {
  partai: KecamatanPartyCardItem;
  kelurahan: KelurahanColumn;
};

/**
 * Mengatur state utama, perpindahan tab, dan alur data dashboard.
 */
export default function DashboardShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("partai");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardErrorMessage, setDashboardErrorMessage] = useState("");

  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [selectedCandidateDetail, setSelectedCandidateDetail] =
    useState<CandidateCardItem | null>(null);

  const [candidateKecamatanSummaryList, setCandidateKecamatanSummaryList] =
    useState<CandidateKecamatanSummaryItem[]>([]);
  const [candidateTpsRows, setCandidateTpsRows] = useState<
    CandidateTpsDetailItem[]
  >([]);
  const [selectedCandidateKecamatanId, setSelectedCandidateKecamatanId] =
    useState<number | null>(null);
  const [isCandidateSummaryLoading, setIsCandidateSummaryLoading] =
    useState(false);
  const [isCandidateTpsLoading, setIsCandidateTpsLoading] = useState(false);
  const [candidateSummaryErrorMessage, setCandidateSummaryErrorMessage] =
    useState("");
  const [candidateTpsErrorMessage, setCandidateTpsErrorMessage] = useState("");

  const [selectedKecamatanDetail, setSelectedKecamatanDetail] =
    useState<KecamatanCardItem | null>(null);
  const [kecamatanPartySummaryList, setKecamatanPartySummaryList] = useState<
    KecamatanPartyCardItem[]
  >([]);
  const [kecamatanTopCandidateList, setKecamatanTopCandidateList] = useState<
    KecamatanTopCandidateCardItem[]
  >([]);
  const [isKecamatanDetailLoading, setIsKecamatanDetailLoading] =
    useState(false);
  const [kecamatanDetailErrorMessage, setKecamatanDetailErrorMessage] =
    useState("");

  const [openedKecamatanParty, setOpenedKecamatanParty] =
    useState<KecamatanPartyCardItem | null>(null);
  const [partyKelurahanRows, setPartyKelurahanRows] = useState<
    KecamatanPartaiKandidatKelurahanItem[]
  >([]);
  const [isPartyDetailLoading, setIsPartyDetailLoading] = useState(false);
  const [partyDetailErrorMessage, setPartyDetailErrorMessage] = useState("");

  const [selectedKelurahanTpsDetail, setSelectedKelurahanTpsDetail] =
    useState<SelectedKelurahanTpsDetail | null>(null);
  const [kelurahanTpsRows, setKelurahanTpsRows] = useState<
    KecamatanPartaiKelurahanTpsItem[]
  >([]);
  const [isKelurahanTpsLoading, setIsKelurahanTpsLoading] = useState(false);
  const [kelurahanTpsErrorMessage, setKelurahanTpsErrorMessage] = useState("");

  const [selectedKelurahanKecamatanId, setSelectedKelurahanKecamatanId] =
    useState<number | null>(null);
  const [kelurahanCardList, setKelurahanCardList] = useState<
    KelurahanCardItem[]
  >([]);
  const [isKelurahanListLoading, setIsKelurahanListLoading] = useState(false);
  const [kelurahanListErrorMessage, setKelurahanListErrorMessage] =
    useState("");

  const [selectedKelurahanDetail, setSelectedKelurahanDetail] =
    useState<KelurahanCardItem | null>(null);
  const [kelurahanPartySummaryList, setKelurahanPartySummaryList] = useState<
    KelurahanPartyCardItem[]
  >([]);
  const [kelurahanTopCandidateList, setKelurahanTopCandidateList] = useState<
    KelurahanTopCandidateCardItem[]
  >([]);
  const [openedKelurahanParty, setOpenedKelurahanParty] =
    useState<KelurahanPartyCardItem | null>(null);
  const [isKelurahanDetailLoading, setIsKelurahanDetailLoading] =
    useState(false);
  const [kelurahanDetailErrorMessage, setKelurahanDetailErrorMessage] =
    useState("");

  const partyCardList = useMemo(() => {
    if (!dashboardData) {
      return [];
    }

    return mapPartyCards({
      partaiList: dashboardData.partaiList,
      partySummaryList: dashboardData.partySummaryList,
      electionStatusList: dashboardData.electionStatusList,
    });
  }, [dashboardData]);

  const selectedParty = useMemo(() => {
    if (!selectedPartyId) {
      return null;
    }

    return partyCardList.find((partai) => partai.id === selectedPartyId) ?? null;
  }, [partyCardList, selectedPartyId]);

  const candidateCardList = useMemo(() => {
    if (!dashboardData || !selectedParty) {
      return [];
    }

    return mapCandidateCards({
      selectedParty,
      candidateSummaryList: dashboardData.candidateSummaryList,
      electionStatusList: dashboardData.electionStatusList,
    });
  }, [dashboardData, selectedParty]);

  const kecamatanCardList = useMemo(() => {
    if (!dashboardData) {
      return [];
    }

    return mapKecamatanCards(dashboardData.kecamatanSummaryList, {
      candidateSummaryList: dashboardData.candidateSummaryList,
      partaiList: dashboardData.partaiList,
    });
  }, [dashboardData]);

  const electedCandidateCardList = useMemo(() => {
    if (!dashboardData) {
      return [];
    }

    return mapElectedCandidateCards(dashboardData.electedCandidateList);
  }, [dashboardData]);

  /**
   * Mengatur perpindahan tab dan membersihkan state detail yang tidak dipakai.
   */
  function handleChangeTab(tab: TabKey) {
    setActiveTab(tab);

    if (tab !== "partai") {
      resetPartyFlow();
    }

    if (tab !== "kecamatan") {
      resetKecamatanFlow();
    }

    if (tab !== "kelurahan") {
      resetKelurahanFlow();
    }
  }

  /**
   * Membersihkan alur Partai dan Detail Kandidat.
   */
  function resetPartyFlow() {
    setSelectedPartyId(null);
    setSelectedCandidateDetail(null);
    setCandidateKecamatanSummaryList([]);
    setCandidateTpsRows([]);
    setSelectedCandidateKecamatanId(null);
    setCandidateSummaryErrorMessage("");
    setCandidateTpsErrorMessage("");
  }

  /**
   * Membersihkan alur Kecamatan sampai Detail TPS.
   */
  function resetKecamatanFlow() {
    setSelectedKecamatanDetail(null);
    setKecamatanPartySummaryList([]);
    setKecamatanTopCandidateList([]);
    setKecamatanDetailErrorMessage("");
    setOpenedKecamatanParty(null);
    setPartyKelurahanRows([]);
    setPartyDetailErrorMessage("");
    setSelectedKelurahanTpsDetail(null);
    setKelurahanTpsRows([]);
    setKelurahanTpsErrorMessage("");
  }

  /**
   * Membersihkan alur Kelurahan sampai Detail TPS.
   */
  function resetKelurahanFlow() {
    setSelectedKelurahanKecamatanId(null);
    setKelurahanCardList([]);
    setKelurahanListErrorMessage("");
    setSelectedKelurahanDetail(null);
    setKelurahanPartySummaryList([]);
    setKelurahanTopCandidateList([]);
    setOpenedKelurahanParty(null);
    setKelurahanDetailErrorMessage("");
    setKelurahanTpsRows([]);
    setKelurahanTpsErrorMessage("");
  }

  /**
   * Membuka daftar kandidat berdasarkan partai yang dipilih.
   */
  function handleOpenCandidates(partai: PartyCardItem) {
    setActiveTab("partai");
    setSelectedPartyId(partai.id);
    setSelectedCandidateDetail(null);
    setCandidateKecamatanSummaryList([]);
    setCandidateTpsRows([]);
    setSelectedCandidateKecamatanId(null);
  }

  /**
   * Membuka detail suara kandidat.
   */
  async function handleOpenCandidateDetail(candidate: CandidateCardItem) {
    setSelectedCandidateDetail(candidate);
    setCandidateKecamatanSummaryList([]);
    setCandidateTpsRows([]);
    setSelectedCandidateKecamatanId(null);
    setCandidateSummaryErrorMessage("");
    setCandidateTpsErrorMessage("");
    setIsCandidateSummaryLoading(true);

    try {
      const rows = await fetchCandidateKecamatanSummary(candidate.id);
      setCandidateKecamatanSummaryList(rows);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memuat rekap kecamatan kandidat.";

      setCandidateSummaryErrorMessage(message);
    } finally {
      setIsCandidateSummaryLoading(false);
    }
  }

  /**
   * Membuka detail TPS kandidat pada kecamatan tertentu.
   */
  async function handleSelectCandidateKecamatan(kecamatanId: number) {
    if (!selectedCandidateDetail) {
      return;
    }

    setSelectedCandidateKecamatanId(kecamatanId);
    setCandidateTpsRows([]);
    setCandidateTpsErrorMessage("");
    setIsCandidateTpsLoading(true);

    try {
      const rows = await fetchCandidateTpsByKecamatan({
        kandidatId: selectedCandidateDetail.id,
        kecamatanId,
      });

      setCandidateTpsRows(rows);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memuat detail TPS kandidat.";

      setCandidateTpsErrorMessage(message);
    } finally {
      setIsCandidateTpsLoading(false);
    }
  }

  /**
   * Membuka detail kecamatan dan memuat grafik partai serta top kandidat.
   */
  async function handleOpenKecamatanDetail(kecamatan: KecamatanCardItem) {
    setActiveTab("kecamatan");
    setSelectedKecamatanDetail(kecamatan);
    setKecamatanPartySummaryList([]);
    setKecamatanTopCandidateList([]);
    setKecamatanDetailErrorMessage("");
    setOpenedKecamatanParty(null);
    setPartyKelurahanRows([]);
    setPartyDetailErrorMessage("");
    setSelectedKelurahanTpsDetail(null);
    setKelurahanTpsRows([]);
    setKelurahanTpsErrorMessage("");
    setIsKecamatanDetailLoading(true);

    try {
      const [partyRows, topCandidateRows] = await Promise.all([
        fetchKecamatanPartySummary(kecamatan.id),
        fetchKecamatanTopCandidates({
          kecamatanId: kecamatan.id,
          limit: 5,
        }),
      ]);

      setKecamatanPartySummaryList(mapKecamatanPartyCards(partyRows));
      setKecamatanTopCandidateList(
        mapKecamatanTopCandidateCards(topCandidateRows)
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memuat detail kecamatan.";

      setKecamatanDetailErrorMessage(message);
    } finally {
      setIsKecamatanDetailLoading(false);
    }
  }

  /**
   * Membuka detail partai pada kecamatan aktif.
   */
  async function handleOpenPartyDetail(partai: KecamatanPartyCardItem) {
    if (!selectedKecamatanDetail) {
      return;
    }

    setOpenedKecamatanParty(partai);
    setPartyKelurahanRows([]);
    setPartyDetailErrorMessage("");
    setSelectedKelurahanTpsDetail(null);
    setKelurahanTpsRows([]);
    setKelurahanTpsErrorMessage("");
    setIsPartyDetailLoading(true);

    try {
      const rows = await fetchPartyKelurahanDetail({
        kecamatanId: selectedKecamatanDetail.id,
        partaiId: partai.partaiId,
      });

      setPartyKelurahanRows(rows);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat detail partai.";

      setPartyDetailErrorMessage(message);
    } finally {
      setIsPartyDetailLoading(false);
    }
  }

  /**
   * Membuka detail TPS dari tabel detail kecamatan.
   */
  async function handleOpenKelurahanTpsDetail(kelurahan: KelurahanColumn) {
    if (!selectedKecamatanDetail || !openedKecamatanParty) {
      return;
    }

    setSelectedKelurahanTpsDetail({
      partai: openedKecamatanParty,
      kelurahan,
    });
    setKelurahanTpsRows([]);
    setKelurahanTpsErrorMessage("");
    setIsKelurahanTpsLoading(true);

    try {
      const rows = await fetchPartyKelurahanTpsDetail({
        kecamatanId: selectedKecamatanDetail.id,
        partaiId: openedKecamatanParty.partaiId,
        kelurahanId: kelurahan.id,
      });

      setKelurahanTpsRows(rows);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memuat detail TPS kelurahan.";

      setKelurahanTpsErrorMessage(message);
    } finally {
      setIsKelurahanTpsLoading(false);
    }
  }

  /**
   * Memuat daftar kelurahan berdasarkan kecamatan yang dipilih.
   */
  async function handleSelectKelurahanKecamatan(kecamatan: KecamatanCardItem) {
    setSelectedKelurahanKecamatanId(kecamatan.id);
    setKelurahanCardList([]);
    setKelurahanListErrorMessage("");
    setSelectedKelurahanDetail(null);
    setKelurahanPartySummaryList([]);
    setKelurahanTopCandidateList([]);
    setOpenedKelurahanParty(null);
    setKelurahanDetailErrorMessage("");
    setKelurahanTpsRows([]);
    setKelurahanTpsErrorMessage("");
    setIsKelurahanListLoading(true);

    try {
      const rows = await fetchKelurahanSummaryByKecamatan(kecamatan.id);
      setKelurahanCardList(mapKelurahanCards(rows));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memuat daftar kelurahan.";

      setKelurahanListErrorMessage(message);
    } finally {
      setIsKelurahanListLoading(false);
    }
  }

  /**
   * Membuka detail kelurahan dan memuat grafik partai serta top kandidat.
   */
  async function handleOpenKelurahanDetail(kelurahan: KelurahanCardItem) {
    setSelectedKelurahanDetail(kelurahan);
    setKelurahanPartySummaryList([]);
    setKelurahanTopCandidateList([]);
    setOpenedKelurahanParty(null);
    setKelurahanTpsRows([]);
    setKelurahanTpsErrorMessage("");
    setKelurahanDetailErrorMessage("");
    setIsKelurahanDetailLoading(true);

    try {
      const [partyRows, topCandidateRows] = await Promise.all([
        fetchKelurahanPartySummary(kelurahan.id),
        fetchKelurahanTopCandidates({
          kelurahanId: kelurahan.id,
          limit: 5,
        }),
      ]);

      setKelurahanPartySummaryList(mapKelurahanPartyCards(partyRows));
      setKelurahanTopCandidateList(
        mapKelurahanTopCandidateCards(topCandidateRows)
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memuat detail kelurahan.";

      setKelurahanDetailErrorMessage(message);
    } finally {
      setIsKelurahanDetailLoading(false);
    }
  }

  /**
   * Membuka detail TPS partai pada kelurahan aktif.
   */
  async function handleOpenKelurahanPartyTps(partai: KelurahanPartyCardItem) {
    if (!selectedKelurahanDetail) {
      return;
    }

    setOpenedKelurahanParty(partai);
    setKelurahanTpsRows([]);
    setKelurahanTpsErrorMessage("");
    setIsKelurahanTpsLoading(true);

    try {
      const rows = await fetchPartyKelurahanTpsDetail({
        kecamatanId: partai.kecamatanId,
        partaiId: partai.partaiId,
        kelurahanId: partai.kelurahanId,
      });

      setKelurahanTpsRows(rows);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memuat detail TPS kelurahan.";

      setKelurahanTpsErrorMessage(message);
    } finally {
      setIsKelurahanTpsLoading(false);
    }
  }

  /**
   * Mengubah data partai kelurahan agar kompatibel dengan komponen Detail TPS.
   */
  function adaptKelurahanPartyToKecamatanParty(
    partai: KelurahanPartyCardItem
  ): KecamatanPartyCardItem {
    return {
      kecamatanId: partai.kecamatanId,
      kecamatanNama: partai.kecamatanNama,
      partaiId: partai.partaiId,
      nomorUrut: partai.nomorUrut,
      namaPartai: partai.namaPartai,
      singkatanPartai: partai.singkatanPartai,
      logoUrl: partai.logoUrl,
      jumlahKandidat: partai.jumlahKandidat,
      suaraPartai: partai.suaraPartai,
      suaraKandidat: partai.suaraKandidat,
      totalSuara: partai.totalSuara,
      totalSuaraKecamatan: partai.totalSuaraKelurahan,
      persenSuara: partai.persenSuara,
      peringkatKecamatan: partai.peringkatKelurahan,
    };
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialDashboardData() {
      try {
        const data = await fetchDashboardData();

        if (!isMounted) {
          return;
        }

        setDashboardData(data);
        setDashboardErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Gagal memuat dashboard.";

        setDashboardErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsDashboardLoading(false);
        }
      }
    }

    void loadInitialDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const profile = dashboardData?.profile ?? null;
  const dapil = dashboardData?.dapil ?? null;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <DashboardHeader profile={profile} dapil={dapil} />

      {!isDashboardLoading && !dashboardErrorMessage ? (
        <>
          <DashboardMobileMenu
            activeTab={activeTab}
            onChangeTab={handleChangeTab}
          />
          <DashboardTabs activeTab={activeTab} onChangeTab={handleChangeTab} />
        </>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {isDashboardLoading ? (
          <div className="rounded-4xl border border-slate-200 bg-slate-50 p-8">
            <p className="text-sm font-semibold text-slate-600">
              Memuat dashboard...
            </p>
          </div>
        ) : null}

        {dashboardErrorMessage ? (
          <div className="rounded-4xl border border-red-200 bg-red-50 p-8">
            <p className="text-sm font-bold text-red-700">
              {dashboardErrorMessage}
            </p>
          </div>
        ) : null}

        {!isDashboardLoading && !dashboardErrorMessage && dashboardData ? (
          <>
            {activeTab === "partai" ? (
              <>
                {selectedCandidateDetail ? (
                  <CandidateDetail
                    candidate={selectedCandidateDetail}
                    kecamatanSummaryList={candidateKecamatanSummaryList}
                    tpsRows={candidateTpsRows}
                    selectedKecamatanId={selectedCandidateKecamatanId}
                    isSummaryLoading={isCandidateSummaryLoading}
                    isTpsLoading={isCandidateTpsLoading}
                    summaryErrorMessage={candidateSummaryErrorMessage}
                    tpsErrorMessage={candidateTpsErrorMessage}
                    onBack={() => {
                      setSelectedCandidateDetail(null);
                      setCandidateKecamatanSummaryList([]);
                      setCandidateTpsRows([]);
                      setSelectedCandidateKecamatanId(null);
                    }}
                    onSelectKecamatan={handleSelectCandidateKecamatan}
                  />
                ) : selectedParty ? (
                  <CandidateSection
                    selectedParty={selectedParty}
                    candidateList={candidateCardList}
                    onBackToParties={() => {
                      setSelectedPartyId(null);
                      setSelectedCandidateDetail(null);
                    }}
                    onOpenCandidateDetail={handleOpenCandidateDetail}
                  />
                ) : (
                  <PartySection
                    partyList={partyCardList}
                    onOpenCandidates={handleOpenCandidates}
                  />
                )}
              </>
            ) : null}

            {activeTab === "kecamatan" ? (
              <>
                {selectedKelurahanTpsDetail ? (
                  <KelurahanTpsDetail
                    partai={selectedKelurahanTpsDetail.partai}
                    kelurahan={selectedKelurahanTpsDetail.kelurahan}
                    detailRows={kelurahanTpsRows}
                    isLoading={isKelurahanTpsLoading}
                    errorMessage={kelurahanTpsErrorMessage}
                    onBack={() => {
                      setSelectedKelurahanTpsDetail(null);
                      setKelurahanTpsRows([]);
                      setKelurahanTpsErrorMessage("");
                    }}
                  />
                ) : selectedKecamatanDetail ? (
                  <KecamatanDetail
                    kecamatan={selectedKecamatanDetail}
                    partyList={kecamatanPartySummaryList}
                    topCandidateList={kecamatanTopCandidateList}
                    isLoading={isKecamatanDetailLoading}
                    errorMessage={kecamatanDetailErrorMessage}
                    openedPartyId={openedKecamatanParty?.partaiId ?? null}
                    onBack={resetKecamatanFlow}
                    onOpenPartyDetail={handleOpenPartyDetail}
                    renderPartyDetail={(partai: KecamatanPartyCardItem) => (
                      <PartyDetailInline
                        partai={partai}
                        detailRows={partyKelurahanRows}
                        isLoading={isPartyDetailLoading}
                        errorMessage={partyDetailErrorMessage}
                        onOpenKelurahan={handleOpenKelurahanTpsDetail}
                      />
                    )}
                  />
                ) : (
                  <KecamatanSection
                    kecamatanList={kecamatanCardList}
                    onOpenDetail={handleOpenKecamatanDetail}
                  />
                )}
              </>
            ) : null}

            {activeTab === "kelurahan" ? (
              <>
                {selectedKelurahanDetail ? (
                  <KelurahanDetail
                    kelurahan={selectedKelurahanDetail}
                    partyList={kelurahanPartySummaryList}
                    topCandidateList={kelurahanTopCandidateList}
                    isLoading={isKelurahanDetailLoading}
                    errorMessage={kelurahanDetailErrorMessage}
                    openedPartyId={openedKelurahanParty?.partaiId ?? null}
                    onBack={() => {
                      setSelectedKelurahanDetail(null);
                      setKelurahanPartySummaryList([]);
                      setKelurahanTopCandidateList([]);
                      setOpenedKelurahanParty(null);
                      setKelurahanTpsRows([]);
                      setKelurahanTpsErrorMessage("");
                      setKelurahanDetailErrorMessage("");
                    }}
                    onOpenPartyTps={handleOpenKelurahanPartyTps}
                    renderPartyTpsDetail={(partai: KelurahanPartyCardItem) => (
                      <KelurahanTpsDetail
                        partai={adaptKelurahanPartyToKecamatanParty(partai)}
                        kelurahan={{
                          id: selectedKelurahanDetail.id,
                          nama: selectedKelurahanDetail.nama,
                        }}
                        detailRows={kelurahanTpsRows}
                        isLoading={isKelurahanTpsLoading}
                        errorMessage={kelurahanTpsErrorMessage}
                        onBack={() => {
                          setOpenedKelurahanParty(null);
                          setKelurahanTpsRows([]);
                          setKelurahanTpsErrorMessage("");
                        }}
                      />
                    )}
                  />
                ) : (
                  <KelurahanSection
                    kecamatanList={kecamatanCardList}
                    kelurahanList={kelurahanCardList}
                    selectedKecamatanId={selectedKelurahanKecamatanId}
                    isLoading={isKelurahanListLoading}
                    errorMessage={kelurahanListErrorMessage}
                    onSelectKecamatan={handleSelectKelurahanKecamatan}
                    onOpenDetail={handleOpenKelurahanDetail}
                  />
                )}
              </>
            ) : null}

            {activeTab === "kandidat-terpilih" ? (
              <ElectedCandidatesSection
                candidateList={electedCandidateCardList}
              />
            ) : null}
          </>
        ) : null}
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-center">
          <p className="text-sm font-semibold text-slate-500">
            © Richardo Bram Barus
          </p>
        </div>
      </footer>
    </main>
  );
}