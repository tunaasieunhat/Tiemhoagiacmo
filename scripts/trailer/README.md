# Quay trailer ~60 giây

Quay từng khung hình bằng Playwright với "đồng hồ ảo" (`harness.js` thay requestAnimationFrame / performance.now /
setTimeout) nên video mượt 30 khung/giây dù máy vẽ chậm. Chữ giới thiệu là lớp HTML phủ lên game.

```bash
npm run dev -- --port 5197            # cửa sổ khác
cd scripts/trailer && node rec.cjs    # ra frames/*.jpg (~35 phút trên máy không có GPU)
ffmpeg -framerate 30 -i frames/f%05d.jpg -t 61 -i ../../public/audio/where-the-petals-sway.mp3 \
  -filter_complex "[1:a]afade=t=in:d=1.2,afade=t=out:st=57.5:d=3[a]" -map 0:v -map "[a]" \
  -c:v libx264 -crf 21 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart -shortest trailer.mp4
```

- Sửa cảnh / chữ / thời lượng: `scenes.cjs` (mỗi cảnh: `dur`, `setup`, `window.__dir` chạy mỗi khung).
- Xem thử nhanh: `DSF=1 EVERY=10 node rec.cjs` (lưu 1/10 khung); bắt đầu từ 1 cảnh: `FROM=van-may`.
