// Phiên bản game: lấy từ package.json lúc build (vite.config.js). Tăng "version" trong package.json mỗi lần phát hành.
/* global __APP_VERSION__, __BUILD_ID__ */
export const GAME_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0-dev';
export const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
export const GAME_STAGE = 'Giai đoạn 20A';
