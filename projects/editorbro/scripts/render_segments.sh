#!/usr/bin/env bash
# Robust final render: video-only segments of SEG frames (each retried up to 4 times, so a network blip that kills
# Chrome's local video fetches only costs one segment), joined without re-encoding, then the mix muxed on top,
# then the yuv420p / bt709 pass. Usage: bash scripts/render_segments.sh <out.mp4> <mix.wav> [SEG]
set -u
OUT="$1"; MIX="$2"; SEG="${3:-600}"
cd "$(dirname "$0")/.."
TOTAL=$(python -c "import json;print(json.load(open('SCENE_TIMINGS.v3.json',encoding='utf-8'))['variants']['reel']['durationInFrames'])")
TMP=out/seg_v3; mkdir -p "$TMP"; : > "$TMP/list.txt"
for ((a = 0; a < TOTAL; a += SEG)); do
  b=$((a + SEG - 1)); [ $b -ge $TOTAL ] && b=$((TOTAL - 1))
  f="$TMP/seg_$(printf %05d $a).mp4"
  for try in 1 2 3 4; do
    [ -s "$f" ] && break
    npx remotion render out/bundle Reel "$f" --frames=$a-$b --muted --codec=h264 --crf=16 --gl=angle --concurrency=3 --log=error > "$TMP/log_$a.txt" 2>&1 \
      && echo "segment $a-$b ok (try $try)" || { echo "segment $a-$b failed (try $try)"; rm -f "$f"; }
  done
  [ -s "$f" ] || { echo "segment $a-$b gave up"; exit 1; }
  echo "file '$(basename "$f")'" >> "$TMP/list.txt"
done
ffmpeg -v error -y -f concat -safe 0 -i "$TMP/list.txt" -i "$MIX" -map 0:v -map 1:a \
  -vf "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p" -c:v libx264 -crf 16 -preset slow \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT" \
  && echo "-> $OUT"
