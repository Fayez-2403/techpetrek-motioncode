// Scene registry: one component per scene id in SCENE_TIMINGS (the ids come from voScript.json "scene").
// Scenes read the global frame themselves (useCurrentFrame) and take their cues from spoken words (wf).
import React from 'react';
import { Hook, Reveal } from './HookReveal';
import { Engine, Powers } from './PowersEngine';
import { Demo, Mcp } from './McpDemo';
import { Cta, Privacy } from './PrivacyCta';

export interface SceneProps { f: number; n: number; id: string }

export const SCENES: Record<string, React.FC<SceneProps>> = {
  hook: Hook, reveal: Reveal, powers: Powers, engine: Engine, mcp: Mcp, demo: Demo, privacy: Privacy, cta: Cta,
};
export const sceneFor = (id: string): React.FC<SceneProps> => {
  const S = SCENES[id];
  if (!S) throw new Error(`no scene component for "${id}"`);
  return S;
};
