// Đồng hồ game. Thời gian lưu dưới dạng "tổng số phút game" (số thực).
export const MIN_PER_DAY = 1440;

export function clockOf(totalMinutes) {
  const day = Math.floor(totalMinutes / MIN_PER_DAY) + 1;
  const minOfDay = totalMinutes - (day - 1) * MIN_PER_DAY;
  const hour = Math.floor(minOfDay / 60);
  const minute = Math.floor(minOfDay % 60);
  return { day, hour, minute, hourFloat: minOfDay / 60 };
}

export function formatClock(totalMinutes) {
  const c = clockOf(totalMinutes);
  return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;
}

export function periodName(hourFloat) {
  if (hourFloat < 5) return 'Đêm khuya';
  if (hourFloat < 7) return 'Bình minh';
  if (hourFloat < 11) return 'Buổi sáng';
  if (hourFloat < 14) return 'Buổi trưa';
  if (hourFloat < 17.5) return 'Buổi chiều';
  if (hourFloat < 19.5) return 'Hoàng hôn';
  return 'Buổi tối';
}

export function isNight(hourFloat) {
  return hourFloat < 5.5 || hourFloat >= 19;
}

/** Định dạng số phút game thành chữ dễ đọc: "2 giờ 15 phút" */
export function formatDuration(minutes) {
  minutes = Math.max(0, Math.ceil(minutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} giờ ${m} phút`;
  if (h) return `${h} giờ`;
  return `${m} phút`;
}
