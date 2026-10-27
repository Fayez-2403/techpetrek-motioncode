// V3 showcase: a 90.0 s music-only reel. Bars 0-1 are an upright "rotate your phone" card; from bar 2 the 16:9 film plays
// rotated 90° clockwise inside the 9:16 frame, so it fills the screen once the viewer turns the phone. Every cut is on a
// downbeat of the 120 BPM score (src/v3/timeline.json). A landscape (16:9) render of the same film is also registered.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { FrameOverride } from '../lib/layout';
import { loadFonts } from '../styles/typography';
import { Grain } from '../components/Backdrop';
import { ImpossibleHook } from '../scenes/ImpossibleHook';
import { SHOTS, V3, type ShotId, type V3Props } from './lib';
import { V3Intro } from './scenes/V3Intro';
import { SkyFlight } from './scenes/SkyFlight';
import { BoardRider } from './scenes/BoardRider';
import { SkyDuel } from './scenes/SkyDuel';
import { RaceCircuit } from './scenes/RaceCircuit';
import { ZombieSurvival } from './scenes/ZombieSurvival';
import { RooftopParkour } from './scenes/RooftopParkour';
import { ArchitectureSim } from './scenes/ArchitectureSim';
import { FutureCity } from './scenes/FutureCity';
import { Town3D } from './scenes/Town3D';
import { StudioView } from './scenes/StudioView';
import { Website3D } from './scenes/Website3D';
import { WebsiteScroll } from './scenes/WebsiteScroll';
import { ArtWebsite } from './scenes/ArtWebsite';
import { StoryWeb } from './scenes/StoryWeb';
import { InteractiveArt } from './scenes/InteractiveArt';
import { V3Finale } from './scenes/V3Finale';

loadFonts();

const Title: React.FC<V3Props> = ({ dur }) => <ImpossibleHook dur={dur} variant="reel" />;

export const V3_SCENES: Record<ShotId, React.FC<V3Props>> = {
  intro: ({ dur }) => <V3Intro dur={dur} landscape />, title: Title, skyFlight: SkyFlight, boardRider: BoardRider, skyDuel: SkyDuel,
  raceCircuit: RaceCircuit, zombieSurvival: ZombieSurvival, rooftopParkour: RooftopParkour, architectureSim: ArchitectureSim,
  futureCity: FutureCity, town3d: Town3D, studioView: StudioView, website3d: Website3D, websiteScroll: WebsiteScroll,
  artWebsite: ArtWebsite, storyWeb: StoryWeb, interactiveArt: InteractiveArt, finale: V3Finale,
};

/** the 16:9 film (all shots; in the rotated reel the intro shot is replaced by the upright card) */
const Landscape: React.FC<{ skipIntro?: boolean }> = ({ skipIntro }) => (
  <AbsoluteFill style={{ background: '#03050B', width: V3.w, height: V3.h }}>
    {SHOTS.filter((s) => !(skipIntro && s.id === 'intro')).map((s) => {
      const Comp = V3_SCENES[s.id as ShotId];
      return <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id}><Comp dur={s.durationInFrames} /></Sequence>;
    })}
    <Grain opacity={0.045} />
  </AbsoluteFill>
);

export const KimiShowcaseV3: React.FC = () => {
  const intro = SHOTS[0];
  return (
    <AbsoluteFill style={{ background: '#03050B' }}>
      <div style={{ position: 'absolute', width: V3.w, height: V3.h, left: (1080 - V3.w) / 2, top: (1920 - V3.h) / 2, transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}>
        <FrameOverride width={V3.w} height={V3.h}><Landscape skipIntro /></FrameOverride>
      </div>
      <Sequence from={0} durationInFrames={intro.durationInFrames}><V3Intro dur={intro.durationInFrames} /></Sequence>
      <Audio src={staticFile('audio/music_v3.wav')} />
    </AbsoluteFill>
  );
};

export const KimiShowcaseV3Landscape: React.FC = () => (
  <AbsoluteFill><Landscape /><Audio src={staticFile('audio/music_v3.wav')} /></AbsoluteFill>
);

/** one shot alone at 16:9 (for stills) */
export const V3Shot: React.FC<{ id: ShotId }> = ({ id }) => {
  const s = SHOTS.find((x) => x.id === id)!;
  const Comp = V3_SCENES[id];
  return <AbsoluteFill style={{ background: '#03050B' }}><Comp dur={s.durationInFrames} /><Grain opacity={0.045} /></AbsoluteFill>;
};
