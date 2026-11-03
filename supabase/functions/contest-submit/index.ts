// @ts-nocheck
// ⚠️ FILE DO MÁY TẠO RA từ supabase/functions-src/contest-submit.js — đừng sửa tay.
// Cách dùng: Supabase Dashboard → Edge Functions → Deploy a new function → Via Editor
//   đặt tên "contest-submit", xóa nội dung mẫu, dán TOÀN BỘ file này vào → Deploy.
// supabase/functions-src/contest-submit.js
import { createClient } from "jsr:@supabase/supabase-js@2";

// data/contest.js
var CONTEST = {
  maxEntriesPerRound: 3,
  // số lần nộp mỗi tuần (tính bó cao điểm nhất)
  rareBonusMax: 10,
  // điểm cộng tối đa khi dùng màu hoa hiếm / ít gặp
  rewards: [
    // thưởng khi hết mùa thi (theo hạng)
    { top: 1, coins: 3e3, title: "\u{1F947} Qu\xE1n qu\xE2n" },
    { top: 3, coins: 1800, title: "\u{1F948} \xC1 qu\xE2n" },
    { top: 10, coins: 1e3, title: "\u{1F3C5} Top 10" },
    { topPct: 30, coins: 500, title: "\u{1F31F} Top 30%" },
    { topPct: 100, coins: 150, title: "\u{1F33C} Tham gia" }
  ]
};
var CONTEST_THEMES = [
  { id: "xuan", name: "S\u1EAFc Xu\xE2n r\u1EA1ng r\u1EE1", icon: "\u{1F338}", tone: "pastel", meaning: "joy", min: 5, max: 9 },
  { id: "ha", name: "N\u1EAFng H\u1EA1 ch\xF3i chang", icon: "\u2600\uFE0F", tone: "warm", meaning: "hope", min: 5, max: 9 },
  { id: "thu", name: "Thu d\u1ECBu d\xE0ng", icon: "\u{1F341}", tone: "natural", meaning: "gratitude", min: 5, max: 9 },
  { id: "dong", name: "\u0110\xF4ng \u1EA5m \xE1p", icon: "\u2744\uFE0F", tone: "cool", meaning: "love", min: 5, max: 9 }
];

// data/wrapping.js
var PAPERS = {
  kraft: { name: "Gi\u1EA5y kraft", color: "#d9b48a", tones: ["natural", "warm"], free: true, price: 0 },
  cream: { name: "Gi\u1EA5y kem", color: "#fbefd9", tones: ["pastel", "natural"], price: 6 },
  pink: { name: "Gi\u1EA5y h\u1ED3ng ph\u1EA5n", color: "#f8c6d4", tones: ["pastel", "warm"], price: 8 },
  sky: { name: "Gi\u1EA5y xanh nh\u1EA1t", color: "#bfe0f5", tones: ["cool", "pastel"], price: 8 },
  red: { name: "Gi\u1EA5y \u0111\u1ECF", color: "#e86a6a", tones: ["warm"], price: 10 },
  lilac: { name: "Gi\u1EA5y t\xEDm lilac", color: "#d9c8f5", tones: ["cool", "pastel"], price: 12, unlockLevel: 3 },
  lace: { name: "Gi\u1EA5y ren tr\u1EAFng", color: "#fdfbf7", tones: ["pastel", "cool", "natural"], price: 18, unlockLevel: 5 }
};
var RIBBONS = {
  twine: { name: "D\xE2y \u0111ay", color: "#b48a5a", tones: ["natural"], free: true, price: 0 },
  white: { name: "Ruy b\u0103ng tr\u1EAFng", color: "#ffffff", tones: ["cool", "pastel", "natural"], price: 4 },
  pink: { name: "Ruy b\u0103ng h\u1ED3ng", color: "#f47a93", tones: ["warm", "pastel"], price: 5 },
  purple: { name: "Ruy b\u0103ng t\xEDm", color: "#a674dc", tones: ["cool"], price: 5 },
  gold: { name: "Ruy b\u0103ng v\xE0ng", color: "#f4c430", tones: ["warm"], price: 6 },
  mint: { name: "Ruy b\u0103ng b\u1EA1c h\xE0", color: "#9fe0c4", tones: ["cool", "natural"], price: 8, unlockLevel: 3 },
  velvet: { name: "Ruy b\u0103ng nhung \u0111\u1ECF", color: "#b8354a", tones: ["warm"], price: 14, unlockLevel: 5 }
};

// data/variants.js
var MEANINGS = {
  love: { name: "T\xECnh y\xEAu", icon: "\u{1F497}" },
  gratitude: { name: "Bi\u1EBFt \u01A1n", icon: "\u{1F64F}" },
  friendship: { name: "T\xECnh b\u1EA1n", icon: "\u{1F91D}" },
  respect: { name: "K\xEDnh tr\u1ECDng", icon: "\u{1F393}" },
  joy: { name: "Ni\u1EC1m vui", icon: "\u{1F60A}" },
  hope: { name: "Hy v\u1ECDng", icon: "\u{1F305}" },
  purity: { name: "Trong s\xE1ng", icon: "\u{1F90D}" },
  longing: { name: "Nh\u1EDB nhung", icon: "\u{1F4AD}" },
  apology: { name: "Xin l\u1ED7i", icon: "\u{1F647}" },
  congrats: { name: "Ch\xFAc m\u1EEBng", icon: "\u{1F389}" },
  health: { name: "S\u1EE9c kh\u1ECFe, b\xECnh an", icon: "\u{1F340}" },
  loyalty: { name: "Th\u1EE7y chung", icon: "\u{1F48D}" },
  jealousy: { name: "Ghen tu\xF4ng", icon: "\u{1F612}", negative: true },
  farewell: { name: "Chia ly", icon: "\u{1F940}", negative: true }
};
var VARIANTS = {
  rose: {
    pink: { name: "ph\u1EA5n", petal: "#f47a93", petalDark: "#d9506f", tones: ["warm", "pastel"], meanings: ["gratitude", "joy"], rarity: "common", default: true },
    red: { name: "\u0111\u1ECF", petal: "#e8384f", petalDark: "#b81f37", tones: ["warm"], meanings: ["love"], rarity: "common", breed: [["pink", "pink", 0.2]] },
    white: { name: "tr\u1EAFng", petal: "#fbf6f0", petalDark: "#e9dccd", tones: ["cool", "pastel", "natural"], meanings: ["purity", "respect"], rarity: "common", breed: [["pink", "pink", 0.2]] },
    yellow: { name: "v\xE0ng", petal: "#ffd84d", petalDark: "#f2b31f", tones: ["warm"], meanings: ["friendship", "jealousy"], rarity: "uncommon", breed: [["red", "white", 0.3], ["pink", "white", 0.12]] },
    blue: { name: "xanh lam", petal: "#6fa8f0", petalDark: "#3f7fd1", tones: ["cool"], meanings: ["hope", "longing"], rarity: "rare", breed: [["white", "yellow", 0.07]] }
  },
  tulip: {
    purple: { name: "t\xEDm", petal: "#c79cf2", petalDark: "#a674dc", tones: ["cool", "pastel"], meanings: ["loyalty", "respect"], rarity: "common", default: true },
    red: { name: "\u0111\u1ECF", petal: "#ef5b5b", petalDark: "#c93a3a", tones: ["warm"], meanings: ["love"], rarity: "common", breed: [["purple", "purple", 0.2]] },
    white: { name: "tr\u1EAFng", petal: "#fdfaf4", petalDark: "#ece2d4", tones: ["cool", "pastel", "natural"], meanings: ["apology", "purity"], rarity: "common", breed: [["purple", "purple", 0.2]] },
    yellow: { name: "v\xE0ng", petal: "#ffd65c", petalDark: "#f0b22b", tones: ["warm"], meanings: ["joy", "friendship"], rarity: "uncommon", breed: [["red", "white", 0.3]] },
    black: { name: "\u0111en huy\u1EC1n b\xED", petal: "#4a2f5c", petalDark: "#2b1838", tones: ["cool"], meanings: ["longing", "farewell"], rarity: "rare", breed: [["purple", "red", 0.06]] }
  },
  sunflower: {
    yellow: { name: "v\xE0ng", petal: "#ffd34e", petalDark: "#f4b42a", tones: ["warm", "natural"], meanings: ["hope", "joy"], rarity: "common", default: true },
    orange: { name: "cam", petal: "#ffa64d", petalDark: "#f2862b", tones: ["warm"], meanings: ["congrats", "joy"], rarity: "uncommon", breed: [["yellow", "yellow", 0.25]] },
    red: { name: "\u0111\u1ECF r\u01B0\u1EE3u", petal: "#c4473a", petalDark: "#9c2f26", tones: ["warm"], meanings: ["loyalty", "love"], rarity: "rare", breed: [["orange", "orange", 0.08]] }
  },
  daisy: {
    white: { name: "tr\u1EAFng", petal: "#ffffff", petalDark: "#f1ece2", tones: ["pastel", "natural"], meanings: ["purity", "friendship"], rarity: "common", default: true },
    pink: { name: "h\u1ED3ng", petal: "#ffc4d6", petalDark: "#f5a3bd", tones: ["pastel", "warm"], meanings: ["joy", "gratitude"], rarity: "common", breed: [["white", "white", 0.25]] },
    blue: { name: "xanh thi\xEAn thanh", petal: "#a9d3ff", petalDark: "#7fb6f0", tones: ["cool", "pastel"], meanings: ["hope", "health"], rarity: "rare", breed: [["pink", "white", 0.07]] }
  },
  lavender: {
    purple: { name: "t\xEDm", petal: "#b49be8", petalDark: "#8f74d1", tones: ["cool", "pastel"], meanings: ["loyalty", "longing"], rarity: "common", default: true },
    white: { name: "tr\u1EAFng", petal: "#f4f0fb", petalDark: "#ddd3ee", tones: ["cool", "natural"], meanings: ["health", "purity"], rarity: "uncommon", breed: [["purple", "purple", 0.25]] },
    pink: { name: "h\u1ED3ng", petal: "#f0a6d0", petalDark: "#d77fb1", tones: ["pastel", "warm"], meanings: ["love", "longing"], rarity: "rare", breed: [["purple", "white", 0.08]] }
  },
  hydrangea: {
    blue: { name: "xanh", petal: "#9cc7f2", petalDark: "#b9a3ef", tones: ["cool", "pastel"], meanings: ["gratitude", "apology"], rarity: "common", default: true },
    pink: { name: "h\u1ED3ng", petal: "#f6a9c8", petalDark: "#ee8db5", tones: ["warm", "pastel"], meanings: ["love", "joy"], rarity: "common", breed: [["blue", "blue", 0.25]] },
    purple: { name: "t\xEDm", petal: "#b796e6", petalDark: "#9a74d6", tones: ["cool"], meanings: ["respect", "gratitude"], rarity: "uncommon", breed: [["blue", "pink", 0.35]] },
    white: { name: "tr\u1EAFng", petal: "#f7f7f2", petalDark: "#e4e8e0", tones: ["natural", "pastel"], meanings: ["purity", "congrats"], rarity: "uncommon", breed: [["purple", "pink", 0.25]] },
    mint: { name: "xanh ng\u1ECDc", petal: "#8fe0c8", petalDark: "#62c7a9", tones: ["cool", "natural"], meanings: ["health", "hope"], rarity: "rare", breed: [["white", "blue", 0.07]] }
  },
  // ---------------- GĐ14 ----------------
  cosmos: {
    pink: { name: "h\u1ED3ng", petal: "#f78fb3", petalDark: "#e5679a", tones: ["warm", "pastel"], meanings: ["joy", "friendship"], rarity: "common", default: true },
    white: { name: "tr\u1EAFng", petal: "#ffffff", petalDark: "#f1e8ef", tones: ["pastel", "natural"], meanings: ["purity"], rarity: "common", breed: [["pink", "pink", 0.25]] },
    orange: { name: "cam", petal: "#ffa64d", petalDark: "#f2862b", tones: ["warm", "natural"], meanings: ["congrats", "joy"], rarity: "uncommon", breed: [["pink", "white", 0.2]] },
    chocolate: { name: "s\xF4-c\xF4-la", petal: "#8a3b3b", petalDark: "#6b2a2a", tones: ["warm", "natural"], meanings: ["longing"], rarity: "rare", breed: [["orange", "orange", 0.08]] }
  },
  carnation: {
    pink: { name: "h\u1ED3ng", petal: "#f7a1b8", petalDark: "#e47995", tones: ["warm", "pastel"], meanings: ["gratitude", "love"], rarity: "common", default: true },
    red: { name: "\u0111\u1ECF", petal: "#e33d55", petalDark: "#b9233c", tones: ["warm"], meanings: ["love", "respect"], rarity: "common", breed: [["pink", "pink", 0.22]] },
    white: { name: "tr\u1EAFng", petal: "#ffffff", petalDark: "#ece4e8", tones: ["cool", "pastel", "natural"], meanings: ["purity", "apology"], rarity: "uncommon", breed: [["pink", "red", 0.18]] },
    yellow: { name: "v\xE0ng", petal: "#ffd75e", petalDark: "#f1b830", tones: ["warm"], meanings: ["farewell"], rarity: "uncommon", breed: [["white", "pink", 0.15]] },
    purple: { name: "t\xEDm m\u1ED9ng m\u01A1", petal: "#b48be0", petalDark: "#9168c4", tones: ["cool", "pastel"], meanings: ["longing", "respect"], rarity: "rare", breed: [["white", "red", 0.07]] }
  },
  marigold: {
    orange: { name: "cam", petal: "#ff9f2e", petalDark: "#f27f12", tones: ["warm", "natural"], meanings: ["health", "congrats"], rarity: "common", default: true },
    yellow: { name: "v\xE0ng", petal: "#ffd34e", petalDark: "#f4b42a", tones: ["warm", "natural"], meanings: ["joy", "health"], rarity: "common", breed: [["orange", "orange", 0.25]] },
    red: { name: "\u0111\u1ECF nhung", petal: "#d9472b", petalDark: "#b33018", tones: ["warm"], meanings: ["loyalty", "health"], rarity: "rare", breed: [["orange", "yellow", 0.08]] }
  },
  lily: {
    white: { name: "tr\u1EAFng", petal: "#ffffff", petalDark: "#f3e7f0", tones: ["cool", "pastel", "natural"], meanings: ["purity", "respect"], rarity: "common", default: true },
    pink: { name: "h\u1ED3ng", petal: "#ffb6d0", petalDark: "#f08cb3", tones: ["warm", "pastel"], meanings: ["love", "joy"], rarity: "uncommon", breed: [["white", "white", 0.2]] },
    orange: { name: "cam", petal: "#ffa15c", petalDark: "#f07f34", tones: ["warm"], meanings: ["congrats", "hope"], rarity: "uncommon", breed: [["white", "pink", 0.15]] },
    yellow: { name: "v\xE0ng chanh", petal: "#fff07a", petalDark: "#f5d742", tones: ["warm", "pastel"], meanings: ["joy", "friendship"], rarity: "rare", breed: [["orange", "pink", 0.07]] }
  },
  peony: {
    pink: { name: "h\u1ED3ng ph\u1EA5n", petal: "#f9a8c9", petalDark: "#ec7fab", tones: ["warm", "pastel"], meanings: ["congrats", "joy"], rarity: "common", default: true },
    white: { name: "tr\u1EAFng", petal: "#fff9f5", petalDark: "#f2e4dc", tones: ["pastel", "natural"], meanings: ["purity", "respect"], rarity: "uncommon", breed: [["pink", "pink", 0.18]] },
    red: { name: "\u0111\u1ECF th\u1EAFm", petal: "#d93a5c", petalDark: "#b0213f", tones: ["warm"], meanings: ["love", "congrats"], rarity: "uncommon", breed: [["pink", "pink", 0.15]] },
    coral: { name: "san h\xF4", petal: "#ff8a73", petalDark: "#f2664d", tones: ["warm"], meanings: ["joy", "hope"], rarity: "rare", breed: [["red", "white", 0.07]] }
  },
  orchid: {
    purple: { name: "t\xEDm", petal: "#c98be0", petalDark: "#a865c7", tones: ["cool", "pastel"], meanings: ["love", "respect"], rarity: "common", default: true },
    white: { name: "tr\u1EAFng", petal: "#ffffff", petalDark: "#f0e6f5", tones: ["cool", "pastel", "natural"], meanings: ["purity", "congrats"], rarity: "uncommon", breed: [["purple", "purple", 0.18]] },
    pink: { name: "h\u1ED3ng", petal: "#ff9fcf", petalDark: "#f079b5", tones: ["warm", "pastel"], meanings: ["love", "joy"], rarity: "uncommon", breed: [["purple", "white", 0.15]] },
    yellow: { name: "v\xE0ng ho\xE0ng kim", petal: "#ffd84d", petalDark: "#f2b630", tones: ["warm"], meanings: ["hope", "congrats"], rarity: "rare", breed: [["pink", "white", 0.06]] }
  }
};

// data/flowers.js
var FLOWERS = {
  rose: {
    id: "rose",
    name: "Hoa h\u1ED3ng",
    icon: "\u{1F339}",
    model: "rose",
    growHours: 8,
    waterPerDay: 3,
    fertilizerNeeded: 2,
    seasons: ["xuan", "thu"],
    basePrice: 30,
    seedPrice: 12,
    unlockLevel: 1,
    meaning: "T\xECnh y\xEAu, s\u1EF1 tr\xE2n tr\u1ECDng",
    tones: ["warm"],
    colors: { petal: "#f47a93", petalDark: "#d9506f", stem: "#5fae63", leaf: "#76c27a" }
  },
  tulip: {
    id: "tulip",
    name: "Tulip",
    icon: "\u{1F337}",
    model: "tulip",
    growHours: 5,
    waterPerDay: 2,
    fertilizerNeeded: 1,
    seasons: ["xuan"],
    basePrice: 18,
    seedPrice: 6,
    unlockLevel: 1,
    meaning: "T\xECnh c\u1EA3m ch\xE2n th\xE0nh",
    tones: ["cool", "pastel"],
    colors: { petal: "#c79cf2", petalDark: "#a674dc", stem: "#63b06a", leaf: "#86cc84" }
  },
  sunflower: {
    id: "sunflower",
    name: "H\u01B0\u1EDBng d\u01B0\u01A1ng",
    icon: "\u{1F33B}",
    model: "sunflower",
    tall: true,
    growHours: 10,
    waterPerDay: 2,
    fertilizerNeeded: 1,
    seasons: ["ha", "thu"],
    basePrice: 35,
    seedPrice: 14,
    unlockLevel: 1,
    meaning: "Ni\u1EC1m tin, h\u01B0\u1EDBng v\u1EC1 t\u01B0\u01A1ng lai",
    tones: ["warm", "natural"],
    colors: { petal: "#ffd34e", petalDark: "#f4b42a", center: "#8a5a3b", stem: "#5aa55e", leaf: "#6dbd6f" }
  },
  daisy: {
    id: "daisy",
    name: "C\xFAc h\u1ECDa mi",
    icon: "\u{1F33C}",
    model: "daisy",
    growHours: 4,
    waterPerDay: 2,
    fertilizerNeeded: 1,
    seasons: ["thu", "dong"],
    basePrice: 16,
    seedPrice: 6,
    unlockLevel: 2,
    meaning: "S\u1EF1 trong s\xE1ng, t\xECnh y\xEAu th\u1EA7m l\u1EB7ng",
    tones: ["pastel", "natural"],
    colors: { petal: "#ffffff", petalDark: "#f1ece2", center: "#ffd34e", stem: "#62ad66", leaf: "#7cc47e" }
  },
  lavender: {
    id: "lavender",
    name: "O\u1EA3i h\u01B0\u01A1ng",
    icon: "\u{1F49C}",
    model: "lavender",
    growHours: 7,
    waterPerDay: 1,
    // chịu hạn tốt
    fertilizerNeeded: 1,
    seasons: ["ha"],
    basePrice: 32,
    seedPrice: 13,
    unlockLevel: 4,
    meaning: "S\u1EF1 ch\u1EDD \u0111\u1EE3i, l\xF2ng th\u1EE7y chung",
    tones: ["cool", "pastel"],
    colors: { petal: "#b49be8", petalDark: "#8f74d1", stem: "#7fae8a", leaf: "#9cc7a4" }
  },
  hydrangea: {
    id: "hydrangea",
    name: "C\u1EA9m t\xFA c\u1EA7u",
    icon: "\u{1F4A0}",
    model: "hydrangea",
    growHours: 12,
    waterPerDay: 4,
    // rất khát nước
    fertilizerNeeded: 2,
    seasons: ["xuan", "ha"],
    basePrice: 55,
    seedPrice: 22,
    unlockLevel: 6,
    meaning: "L\xF2ng bi\u1EBFt \u01A1n, s\u1EF1 ch\xE2n th\xE0nh",
    tones: ["cool", "pastel"],
    colors: { petal: "#9cc7f2", petalDark: "#b9a3ef", stem: "#5fa565", leaf: "#6fbb72" }
  },
  // ---------------- GĐ14: 6 loài mới ----------------
  cosmos: {
    id: "cosmos",
    name: "Sao nh\xE1i",
    icon: "\u{1F338}",
    model: "cosmos",
    growHours: 3,
    // lớn rất nhanh, rẻ — hợp để bán sỉ / bó hoa đồng nội
    waterPerDay: 2,
    fertilizerNeeded: 1,
    seasons: ["ha", "thu"],
    basePrice: 12,
    seedPrice: 4,
    unlockLevel: 2,
    meaning: "S\u1EF1 h\u1ED3n nhi\xEAn, ni\u1EC1m vui gi\u1EA3n d\u1ECB",
    tones: ["warm", "natural"],
    colors: { petal: "#f78fb3", petalDark: "#e5679a", center: "#ffd34e", stem: "#6fb66f", leaf: "#8fd18b" }
  },
  carnation: {
    id: "carnation",
    name: "C\u1EA9m ch\u01B0\u1EDBng",
    icon: "\u{1F4AE}",
    model: "carnation",
    growHours: 6,
    waterPerDay: 2,
    fertilizerNeeded: 1,
    seasons: ["xuan", "dong"],
    basePrice: 26,
    seedPrice: 10,
    unlockLevel: 3,
    meaning: "T\xECnh m\u1EB9, l\xF2ng bi\u1EBFt \u01A1n",
    tones: ["warm", "pastel"],
    colors: { petal: "#f7a1b8", petalDark: "#e47995", stem: "#6aa98a", leaf: "#8cbfa6" }
  },
  marigold: {
    id: "marigold",
    name: "C\xFAc v\u1EA1n th\u1ECD",
    icon: "\u{1F3F5}\uFE0F",
    model: "marigold",
    growHours: 6,
    waterPerDay: 2,
    fertilizerNeeded: 1,
    seasons: ["thu", "dong"],
    basePrice: 22,
    seedPrice: 8,
    unlockLevel: 3,
    meaning: "S\u1ED1ng l\xE2u, b\xECnh an",
    tones: ["warm", "natural"],
    colors: { petal: "#ff9f2e", petalDark: "#f27f12", stem: "#5f9e57", leaf: "#77b86a" }
  },
  lily: {
    id: "lily",
    name: "Hoa ly",
    icon: "\u{1FAB7}",
    model: "lily",
    tall: true,
    growHours: 11,
    waterPerDay: 2,
    fertilizerNeeded: 2,
    seasons: ["ha", "thu"],
    basePrice: 60,
    seedPrice: 24,
    unlockLevel: 6,
    meaning: "S\u1EF1 cao qu\xFD, thu\u1EA7n khi\u1EBFt",
    tones: ["cool", "pastel"],
    colors: { petal: "#ffffff", petalDark: "#f3e7f0", center: "#f2b33d", stem: "#5ea765", leaf: "#74bd76" }
  },
  peony: {
    id: "peony",
    name: "M\u1EABu \u0111\u01A1n",
    icon: "\u{1F33A}",
    model: "peony",
    growHours: 14,
    waterPerDay: 3,
    fertilizerNeeded: 2,
    seasons: ["xuan"],
    basePrice: 75,
    seedPrice: 30,
    unlockLevel: 7,
    meaning: "Ph\xFA qu\xFD, h\u1EA1nh ph\xFAc vi\xEAn m\xE3n",
    tones: ["warm", "pastel"],
    colors: { petal: "#f9a8c9", petalDark: "#ec7fab", stem: "#5c9f62", leaf: "#71b672" }
  },
  orchid: {
    id: "orchid",
    name: "Lan h\u1ED3 \u0111i\u1EC7p",
    icon: "\u{1FABB}",
    model: "orchid",
    greenhouseOnly: true,
    growHours: 18,
    waterPerDay: 1,
    fertilizerNeeded: 2,
    seasons: ["xuan", "ha", "thu", "dong"],
    basePrice: 130,
    seedPrice: 50,
    unlockLevel: 8,
    meaning: "Sang tr\u1ECDng, t\xECnh y\xEAu \u0111\u1EB9p",
    tones: ["cool", "pastel"],
    colors: { petal: "#c98be0", petalDark: "#a865c7", center: "#ffd34e", stem: "#4f8f5a", leaf: "#5fa86a" }
  }
};
var FLOWER_IDS = Object.keys(FLOWERS);

// src/systems/variants.js
var DEFAULT_VARIANT = Object.fromEntries(Object.entries(VARIANTS).map(([sp, vs]) => [sp, Object.keys(vs).find((k) => vs[k].default) || Object.keys(vs)[0]]));
function parseVkey(k) {
  const [species, variant] = String(k).split(":");
  return { species, variant: variant || DEFAULT_VARIANT[species], vkey: `${species}:${variant || DEFAULT_VARIANT[species]}` };
}
function parseFlowerKey(k) {
  const [v, q] = String(k).split("|");
  return { ...parseVkey(v), q: +q || 1 };
}
function variantData(species, variant) {
  return VARIANTS[species]?.[variant || DEFAULT_VARIANT[species]] || VARIANTS[species]?.[DEFAULT_VARIANT[species]];
}
var tonesOf = (species, variant) => variantData(species, variant).tones;
var meaningsOf = (species, variant) => variantData(species, variant).meanings;

// src/systems/bouquet.js
var WEIGHTS = { color: 0.3, meaning: 0.3, balance: 0.2, quality: 0.2 };
function hsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}
var hueDist = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
function hueHarmony(colors) {
  const hues = colors.map(hsl).filter((c) => c.s > 0.25 && c.l < 0.92).map((c) => c.h);
  if (hues.length <= 1) return 1;
  const groups = [];
  for (const h of hues) {
    const g = groups.find((x) => hueDist(x, h) <= 35);
    if (!g && g !== 0) groups.push(h);
  }
  if (groups.length === 1) return 1;
  if (groups.length === 2) {
    const d = hueDist(groups[0], groups[1]);
    if (d <= 70) return 0.9;
    if (d >= 150) return 0.85;
    return 0.55;
  }
  if (groups.length === 3) return 0.45;
  return 0.2;
}
function scoreBouquet(req, items, paperId, ribbonId) {
  const total = items.reduce((a, b) => a + b.n, 0);
  const tips = [];
  if (!total) return { parts: { color: 0, meaning: 0, balance: 0, quality: 0 }, score: 0, tips };
  const paper = PAPERS[paperId], ribbon = RIBBONS[ribbonId];
  const inTone = items.filter((it) => tonesOf(it.species, it.variant).includes(req.tone)).reduce((a, b) => a + b.n, 0) / total;
  const harmony = hueHarmony(items.map((it) => variantData(it.species, it.variant).petal));
  const color = 100 * (0.25 * (paper?.tones.includes(req.tone) ? 1 : 0) + 0.15 * (ribbon?.tones.includes(req.tone) ? 1 : 0) + 0.35 * inTone + 0.25 * harmony);
  if (inTone < 0.5) tips.push("Ch\u1ECDn th\xEAm hoa h\u1EE3p t\xF4ng kh\xE1ch th\xEDch");
  if (paper && !paper.tones.includes(req.tone)) tips.push("\u0110\u1ED5i gi\u1EA5y g\xF3i h\u1EE3p t\xF4ng h\u01A1n");
  if (harmony < 0.5) tips.push("B\u1EDBt s\u1ED1 m\xE0u hoa cho \u0111\u1EE1 r\u1ED1i m\u1EAFt");
  const negatives = /* @__PURE__ */ new Set();
  items.forEach((it) => meaningsOf(it.species, it.variant).forEach((m) => {
    if (MEANINGS[m]?.negative && m !== req.meaning) negatives.add(m);
  }));
  let meaning;
  if (req.meaning) {
    const match = items.filter((it) => meaningsOf(it.species, it.variant).includes(req.meaning)).reduce((a, b) => a + b.n, 0) / total;
    meaning = match > 0 ? 35 + 65 * Math.min(1, match / 0.6) : 10;
    if (match === 0) tips.push(`Ch\u01B0a c\xF3 hoa mang \xFD ngh\u0129a "${MEANINGS[req.meaning].name}"`);
  } else meaning = 75;
  if (negatives.size) {
    meaning -= 35 * negatives.size;
    tips.push(`C\xF3 hoa mang \xFD ngh\u0129a kh\xF4ng h\u1EE3p: ${[...negatives].map((m) => MEANINGS[m].name).join(", ")}`);
  }
  meaning = Math.max(0, meaning);
  const bySpecies = {};
  items.forEach((it) => {
    bySpecies[it.species] = (bySpecies[it.species] || 0) + it.n;
  });
  const nSpecies = Object.keys(bySpecies).length;
  const focal = Math.max(...Object.values(bySpecies)) / total;
  let balance = total % 2 === 1 ? 30 : 10;
  if (total % 2 === 0) tips.push("Ng\u01B0\u1EDDi Vi\u1EC7t th\u01B0\u1EDDng t\u1EB7ng hoa s\u1ED1 l\u1EBB (3, 5, 7...)");
  if (nSpecies === 1) balance += 25;
  else if (focal >= 0.4 && focal <= 0.75) balance += 40;
  else {
    balance += 20;
    tips.push("N\xEAn c\xF3 1 lo\xE0i hoa ch\u1EE7 \u0111\u1EA1o, c\xE1c lo\xE0i kh\xE1c \u0111i\u1EC3m xuy\u1EBFt");
  }
  if (nSpecies >= 2 && nSpecies <= 3) balance += 20;
  else if (nSpecies > 3) {
    balance += 5;
    tips.push("Qu\xE1 nhi\u1EC1u lo\xE0i hoa trong m\u1ED9t b\xF3");
  }
  const span = Math.max(1, req.max - req.min);
  balance += 10 * Math.min(1, (total - req.min) / span);
  balance = Math.min(100, balance);
  const qAvg = items.reduce((a, it) => a + it.q * it.n, 0) / total;
  const quality = 100 * ((qAvg - 1) / 2) * 0.85 + 15;
  if (qAvg < 2) tips.push("Hoa ch\u1EA5t l\u01B0\u1EE3ng cao (\u2605\u2605\u2605) s\u1EBD \u0111\u01B0\u1EE3c \u0111i\u1EC3m cao h\u01A1n");
  const parts = { color: Math.round(color), meaning: Math.round(meaning), balance: Math.round(balance), quality: Math.round(quality) };
  const score = Math.round(Object.entries(WEIGHTS).reduce((a, [k, w]) => a + parts[k] * w, 0));
  return { parts, score, tips, qAvg };
}

// src/systems/contest.js
var VN_OFFSET = 7 * 3600 * 1e3;
var DAY = 864e5;
function roundOf(ms = Date.now()) {
  const vn = new Date(ms + VN_OFFSET);
  const dow = (vn.getUTCDay() + 6) % 7;
  const mondayVn = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() - dow);
  const thu = new Date(mondayVn + 3 * DAY);
  const year = thu.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week1Mon = Date.UTC(year, 0, 4 - (jan4.getUTCDay() + 6) % 7);
  const week = Math.round((mondayVn - week1Mon) / (7 * DAY)) + 1;
  const theme = CONTEST_THEMES[(year * 53 + week) % CONTEST_THEMES.length];
  const startsAt = mondayVn - VN_OFFSET;
  return { id: `${year}-W${String(week).padStart(2, "0")}`, theme, startsAt, endsAt: startsAt + 7 * DAY };
}
function contestScore(theme, sel) {
  const items = [];
  for (const [k, n] of Object.entries(sel?.items || {})) {
    if (!/^[a-z]+:[a-z]+\|[1-3]$/.test(k) || !Number.isInteger(n) || n < 0 || n > 20) return { ok: false, reason: "D\u1EEF li\u1EC7u b\xF3 hoa kh\xF4ng h\u1EE3p l\u1EC7" };
    if (!n) continue;
    const f = parseFlowerKey(k);
    if (!VARIANTS[f.species]?.[f.variant]) return { ok: false, reason: "Lo\xE0i hoa kh\xF4ng h\u1EE3p l\u1EC7" };
    items.push({ species: f.species, variant: f.variant, q: f.q, n });
  }
  const total = items.reduce((a, b) => a + b.n, 0);
  if (total < theme.min || total > theme.max) return { ok: false, reason: `B\xF3 hoa c\u1EA7n t\u1EEB ${theme.min} \u0111\u1EBFn ${theme.max} c\xE0nh`, total };
  if (!PAPERS[sel.paper] || !RIBBONS[sel.ribbon]) return { ok: false, reason: "H\xE3y ch\u1ECDn gi\u1EA5y g\xF3i v\xE0 ruy b\u0103ng", total };
  const r = scoreBouquet({ tone: theme.tone, meaning: theme.meaning, min: theme.min, max: theme.max }, items, sel.paper, sel.ribbon);
  const rareN = items.reduce((a, it) => {
    const rar = variantData(it.species, it.variant).rarity;
    return a + it.n * (rar === "rare" ? 1 : rar === "uncommon" ? 0.5 : 0);
  }, 0);
  const rareBonus = Math.round(Math.min(CONTEST.rareBonusMax, rareN / total * CONTEST.rareBonusMax * 2));
  const score = Math.min(110, Math.round(r.score + rareBonus));
  return { ok: true, score, base: r.score, parts: r.parts, tips: r.tips, rareBonus, total };
}

// src/systems/contestServer.js
async function handleContestSubmit({ uid, body, db, now = Date.now() }) {
  const round = roundOf(now);
  if (!body || body.round !== round.id) return { status: 409, error: "M\xF9a thi \u0111\xE3 thay \u0111\u1ED5i, h\xE3y t\u1EA3i l\u1EA1i b\u1EA3ng cu\u1ED9c thi" };
  const sel = { items: body.items || {}, paper: body.paper, ribbon: body.ribbon };
  const r = contestScore(round.theme, sel);
  if (!r.ok) return { status: 400, error: r.reason };
  const used = await db.countEntries(round.id, uid);
  if (used >= CONTEST.maxEntriesPerRound) return { status: 429, error: `M\u1ED7i tu\u1EA7n ch\u1EC9 n\u1ED9p \u0111\u01B0\u1EE3c ${CONTEST.maxEntriesPerRound} b\xF3 hoa` };
  const save = await db.loadSave(uid);
  if (!save) return { status: 400, error: "H\xE3y \u0111\u1ED3ng b\u1ED9 ti\u1EBFn \u0111\u1ED9 l\xEAn m\u1EA1ng tr\u01B0\u1EDBc khi d\u1EF1 thi" };
  for (const [k, n] of Object.entries(sel.items)) {
    if (n > 0 && !((save.inventory?.flowers?.[k] || 0) >= n)) return { status: 400, error: "B\u1EA1n kh\xF4ng c\xF3 \u0111\u1EE7 hoa n\xE0y (theo ti\u1EBFn \u0111\u1ED9 \u0111\xE3 \u0111\u1ED3ng b\u1ED9)" };
  }
  if (!PAPERS[sel.paper].free && !((save.inventory?.papers?.[sel.paper] || 0) >= 1)) return { status: 400, error: "B\u1EA1n kh\xF4ng c\xF3 gi\u1EA5y g\xF3i n\xE0y" };
  if (!RIBBONS[sel.ribbon].free && !((save.inventory?.ribbons?.[sel.ribbon] || 0) >= 1)) return { status: 400, error: "B\u1EA1n kh\xF4ng c\xF3 ruy b\u0103ng n\xE0y" };
  await db.insertEntry({ round: round.id, user_id: uid, score: r.score, entry: { items: sel.items, paper: sel.paper, ribbon: sel.ribbon, parts: r.parts, rareBonus: r.rareBonus } });
  await db.upsertBest(round.id, uid, r.score);
  const rank = await db.rank(round.id, uid);
  return { status: 200, data: { score: r.score, base: r.base, parts: r.parts, rareBonus: r.rareBonus, entries: used + 1, ...rank } };
}

// supabase/functions-src/contest-submit.js
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
var reply = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: userData, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !userData?.user) return reply(401, { error: "H\xE3y \u0111\u0103ng nh\u1EADp l\u1EA1i" });
  const uid = userData.user.id;
  let body;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7" });
  }
  const db = {
    async loadSave(id) {
      const { data } = await admin.from("saves").select("data").eq("user_id", id).maybeSingle();
      return data?.data || null;
    },
    async countEntries(round, id) {
      const { count } = await admin.from("contest_entries").select("id", { count: "exact", head: true }).eq("round", round).eq("user_id", id);
      return count || 0;
    },
    async insertEntry(row) {
      const { error } = await admin.from("contest_entries").insert(row);
      if (error) throw error;
    },
    async upsertBest(round, id, score) {
      const { data } = await admin.from("contest_best").select("best").eq("round", round).eq("user_id", id).maybeSingle();
      if (!data) await admin.from("contest_best").insert({ round, user_id: id, best: score });
      else if (score > data.best) await admin.from("contest_best").update({ best: score, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("round", round).eq("user_id", id);
    },
    async rank(round, id) {
      const { data } = await admin.rpc("contest_rank", { p_round: round, uid: id });
      return data || {};
    }
  };
  try {
    const r = await handleContestSubmit({ uid, body, db });
    return r.status === 200 ? reply(200, r.data) : reply(r.status, { error: r.error });
  } catch (e) {
    console.error(e);
    return reply(500, { error: "M\xE1y ch\u1EE7 g\u1EB7p l\u1ED7i, th\u1EED l\u1EA1i sau" });
  }
});
