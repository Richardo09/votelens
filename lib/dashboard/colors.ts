type PartyColorInput = {
  nomorUrut: number;
  namaPartai?: string | null;
  singkatanPartai?: string | null;
};

/**
 * Mengambil warna partai berdasarkan nomor urut dan nama partai.
 */
export function getPartyColor(input: PartyColorInput) {
  const nomorUrut = input.nomorUrut;
  const nama = `${input.namaPartai ?? ""} ${
    input.singkatanPartai ?? ""
  }`.toLowerCase();

  if (nomorUrut === 1 || nama.includes("pkb")) return "#007A3D";
  if (nomorUrut === 2 || nama.includes("gerindra")) return "#8B0000";
  if (nomorUrut === 3 || nama.includes("pdi") || nama.includes("perjuangan")) {
    return "#FF0000";
  }
  if (nomorUrut === 4 || nama.includes("golkar")) return "#FFD700";
  if (nomorUrut === 5 || nama.includes("nasdem")) return "#1E1E78";
  if (nomorUrut === 6 || nama.includes("buruh")) return "#FF7A00";
  if (nomorUrut === 7 || nama.includes("gelora")) return "#00BFFF";
  if (nomorUrut === 8 || nama.includes("pks")) return "#F37021";
  if (nomorUrut === 9 || nama.includes("pkn")) return "#ED1C24";
  if (nomorUrut === 10 || nama.includes("hanura")) return "#F5A400";
  if (nomorUrut === 11 || nama.includes("garuda")) return "#002B49";
  if (nomorUrut === 12 || nama.includes("pan")) return "#005BAA";
  if (
    nomorUrut === 13 ||
    nama.includes("bulan bintang") ||
    nama.includes("pbb")
  ) {
    return "#004225";
  }
  if (nomorUrut === 14 || nama.includes("demokrat")) return "#0055A4";
  if (nomorUrut === 15 || nama.includes("psi")) return "#F32735";
  if (nomorUrut === 16 || nama.includes("perindo")) return "#2D3E8F";
  if (nomorUrut === 17 || nama.includes("ppp")) return "#008000";
  if (nomorUrut === 24 || nama.includes("ummat")) return "#111111";

  return "#475569";
}

/**
 * Menentukan warna teks yang aman di atas warna partai.
 */
export function getReadableTextColor(hexColor: string) {
  const normalized = hexColor.replace("#", "");

  if (normalized.length !== 6) {
    return "#ffffff";
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? "#020617" : "#ffffff";
}

/**
 * Membuat warna latar lembut dari warna utama partai.
 */
export function getPartySoftBackground(hexColor: string) {
  return `${hexColor}14`;
}