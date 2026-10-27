# ENVIRONMENT (checked 2026-10-24)

| Item | Found | Notes |
|---|---|---|
| OS | Windows 11 Pro 10.0.26200 | Git Bash + PowerShell |
| CPU | Intel Core i7-1165G7 (4 cores / 8 threads, 2.8 GHz) | |
| GPU | Intel Iris Xe (integrated) | WebGL via Chrome ANGLE works headless (`--gl=angle`); about 1–4 s per 1080p 3D frame |
| RAM | 15.6 GB | shared by the GPU; parallel still renders limited to one per builder |
| Disk free (C:) | ~30 GB | |
| Node / npm | v24.15.0 / 11.12.1 | bun 1.4.2 also present (not used) |
| Remotion | 4.0.538 (+ @remotion/three, @react-three/fiber 9.8.2, three 0.186.1, React 19.1.1) | installed from npm |
| ffmpeg / ffprobe | 9.0.2 (gyan.dev full build) | encode, loudnorm, ebur128, blackdetect/freezedetect |
| Chrome | Google Chrome (system) | Remotion's headless shell also downloaded on first render |
| Python | 3.12.10 with numpy, scipy, soundfile, librosa, PIL, opencv, faster-whisper | audio synthesis, mixing, alignment, QA |
| yt-dlp | present | reference video downloaded for analysis only (kept in the scratchpad, not in the project) |
| Speech-to-text | faster-whisper (local, CPU) | ElevenLabs Scribe also reachable but the account has no credits |
| TTS | **ElevenLabs: key valid but quota exhausted (8 of 40,000 credits left; one master take needs ~327).** Local: Piper installed (`piper-tts` 1.8.0, no Hindi voice downloaded); Windows SAPI has only English voices (Hazel, Zira). Microsoft Edge neural TTS (`edge-tts` 7.3.1, online, free) works with `hi-IN-MadhurNeural`. | the scratch guide voice uses edge-tts; final voice needs ElevenLabs credits or a human recording |
| Blender | not installed | not needed: all 3D is procedural Three.js |
| whisper.cpp | not installed | faster-whisper used instead for alignment |
| Network | YouTube 200, kimi.ai 200, kimi.com docs 200, Google Fonts 200, npm registry 200 | |
| Kimi account / API key | none | so no authentic Kimi footage (no category A shots) |

## Licences of the stack
- Remotion is source-available under the Remotion License: free for individuals, non-profits and for-profit companies with up
  to 3 employees; larger companies need a company licence (https://www.remotion.dev/license). **Flag for the user:** if
  TechpeTrek is run by a company with more than 3 employees, a Remotion company licence is required before commercial use.
- three.js (MIT), React (MIT), @react-three/fiber (MIT), numpy/scipy/soundfile (BSD), ffmpeg (LGPL/GPL build, used as a tool).
- Fonts: SIL Open Font License 1.1 (see ASSET_SOURCES.md).

## Plan sizing that follows from this
1080p master at 30 fps first (3D frames are GPU-bound on Iris Xe); 4K / 60 fps only if time allows after QA. No paid
generators, no cloud rendering.
