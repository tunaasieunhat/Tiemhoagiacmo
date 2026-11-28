// =============================================================
//  ⛰️ ĐỊA HÌNH ĐẶC BIỆT (0.29) — vách đá có thác nước, cột đá giữa biển, vòm đá, cụm đá bazan
//  Dựng trong src/render/terrain.js. Vị trí đặt ở chỗ trống (rừng / mép biển), không đè lên công trình hay điểm cốt truyện.
//  kind: cliff (vách đá + thác) | stack (cột đá giữa biển) | arch (vòm đá) | basalt (cụm cột đá lục giác)
//  x, z: tâm · r: bán kính · h: chiều cao · face: hướng thác chảy (độ, 0 = về phía nam +z, 90 = phía đông +x)
// =============================================================

export const TERRAIN = [
  // Đảo chính — rừng tây nam: "Thác Mây" đổ xuống hồ nhỏ, nhìn về phía camera
  { id: 'thac_may', kind: 'cliff', name: 'Thác Mây', x: -24, z: 26, r: 4.2, h: 3.4, face: 45, pool: 2.0 },
  { id: 'doi_nho', kind: 'cliff', x: -29.5, z: 29, r: 2.3, h: 1.5 }, // gò đá nhỏ cạnh thác, không có thác
  // Mũi Én — cột đá & vòm đá ngoài khơi phía đông nam
  { id: 'en_stack1', kind: 'stack', x: 75, z: 13, r: 1.6, h: 5.2 },
  { id: 'en_stack2', kind: 'stack', x: 71, z: 19, r: 1.1, h: 3.6 },
  { id: 'en_stack3', kind: 'stack', x: 78.5, z: 7, r: 0.8, h: 2.4 },
  { id: 'en_arch', kind: 'arch', x: 63, z: 20.5, r: 1.2, h: 4.2, face: 10, span: 4.2 },
  // Cồn Lặng — cụm cột đá lục giác ven bờ tây & tây nam
  { id: 'co_basalt1', kind: 'basalt', x: -53, z: 3, r: 2.2, h: 2.6 },
  { id: 'co_basalt2', kind: 'basalt', x: -49.5, z: 14.5, r: 1.6, h: 1.8 },
  // Đảo chính — mỏm đá ngoài khơi phía tây bắc (gần cầu sang Ngàn Hương)
  { id: 'main_stack', kind: 'stack', x: -33, z: -14, r: 1.3, h: 3.8 },
];

// Màu đá / cỏ
export const TERRAIN_COLORS = {
  rock: ['#b9a898', '#a8968a', '#c4b4a4'],
  rockDark: ['#7d7680', '#6c6672', '#8a8490'], // đá bazan
  grass: '#9bd38a',
  water: '#9fdcf0',
  foam: '#ffffff',
};
