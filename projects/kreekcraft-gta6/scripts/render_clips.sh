#!/usr/bin/env bash
# Render postable clips: 1080x1920 30 fps H.264 yuv420p BT.709, AAC 48 kHz, two-pass loudnorm -14 LUFS / -1.5 dBTP.
#   bash scripts/render_clips.sh k1-bank k2-roof ...
set -e
cd "$(dirname "$0")/.."
npx remotion bundle src/index.ts --out-dir out/bundle >/dev/null
mkdir -p out/clips
for c in "$@"; do
  npx remotion render out/bundle "$c" "out/clips/raw_$c.mp4" --concurrency 3 --codec h264 --crf 18 --audio-codec aac --log error
  J=$(ffmpeg -hide_banner -nostats -i "out/clips/raw_$c.mp4" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | python -c "import sys,json;s=sys.stdin.read();m=json.loads(s[s.rindex('{'):s.rindex('}')+1]);print(f\"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}\")")
  ffmpeg -loglevel error -y -i "out/clips/raw_$c.mp4" -vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -crf 18 -preset medium -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
    -af "loudnorm=I=-14:TP=-1.5:LRA=11:$J:linear=true" -ar 48000 -c:a aac -b:a 192k -movflags +faststart "out/clips/kreek_$c.mp4"
  rm "out/clips/raw_$c.mp4"
  echo "done $c"
done
