import type { NumberLike } from "./types";

/**
 * Mengubah data angka dari database menjadi number yang aman.
 */
export function toSafeNumber(value: NumberLike | null | undefined) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

/**
 * Format angka sesuai penulisan Indonesia.
 */
export function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

/**
 * Format persentase untuk grafik dan ringkasan suara.
 */
export function formatPercent(value: number) {
  return `${value.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })}%`;
}

/**
 * Mengambil nama pendek partai untuk label grafik.
 */
export function getDisplayPartyName(
  namaPartai: string,
  singkatanPartai?: string | null
) {
  if (singkatanPartai && singkatanPartai.trim()) {
    return singkatanPartai.trim();
  }

  return namaPartai;
}

/**
 * Menggabungkan nama partai dan singkatan untuk tampilan lengkap.
 */
export function getFullPartyName(
  namaPartai: string,
  singkatanPartai?: string | null
) {
  if (singkatanPartai && singkatanPartai.trim()) {
    return `${namaPartai} (${singkatanPartai})`;
  }

  return namaPartai;
}

/**
 * Membuat inisial kandidat ketika foto belum tersedia.
 */
export function getCandidateInitials(candidateName: string) {
  return candidateName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * Membuat inisial partai ketika logo belum tersedia.
 */
export function getPartyInitials(namaPartai: string, singkatan?: string | null) {
  if (singkatan && singkatan.trim()) {
    return singkatan.trim().slice(0, 4).toUpperCase();
  }

  return namaPartai
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * Membentuk URL file publik dari Supabase Storage.
 */
export function getPublicFileUrl(
  filePath: string | null,
  fallbackBucket?: string
) {
  if (!filePath) {
    return null;
  }

  const cleanFilePath = filePath.trim();

  if (!cleanFilePath) {
    return null;
  }

  if (
    cleanFilePath.startsWith("http://") ||
    cleanFilePath.startsWith("https://") ||
    cleanFilePath.startsWith("data:")
  ) {
    return cleanFilePath;
  }

  if (cleanFilePath.startsWith("/")) {
    return cleanFilePath;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return cleanFilePath;
  }

  let normalizedPath = cleanFilePath.replace(/^\/+/, "");

  normalizedPath = normalizedPath.replace(
    /^storage\/v1\/object\/public\//,
    ""
  );

  if (fallbackBucket && !normalizedPath.startsWith(`${fallbackBucket}/`)) {
    return `${supabaseUrl}/storage/v1/object/public/${fallbackBucket}/${normalizedPath}`;
  }

  return `${supabaseUrl}/storage/v1/object/public/${normalizedPath}`;
}

/**
 * Mengambil URL logo partai dari bucket party-logos.
 */
export function getPartyLogoUrl(logoPath: string | null) {
  return getPublicFileUrl(logoPath, "party-logos");
}

/**
 * Mengambil URL foto kandidat dari path yang tersimpan.
 */
export function getCandidatePhotoUrl(photoPath: string | null) {
  return getPublicFileUrl(photoPath);
}

/**
 * Membersihkan nama file export agar aman diunduh.
 */
export function slugifyFileName(value: string) {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return cleaned || "votelens-export";
}

/**
 * Membatasi panjang teks agar tidak merusak layout.
 */
export function limitText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}