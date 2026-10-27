// Registry of media-window animations (ids used in src/data/mediaPlan.json). Each is ILLUSTRATIVE and original.
import type React from 'react';
import type { MediaProps } from './types';
import { EnvCards } from './EnvCards';
import { BuildBreak } from './BuildBreak';
import { PoisonedPackage } from './PoisonedPackage';
import { AiKeyVault } from './AiKeyVault';
import { IndiaMap } from './IndiaMap';
import { PromptInjection } from './PromptInjection';
import { AgentSwarm } from './AgentSwarm';
import { ChecklistKey } from './ChecklistKey';
import { ChecklistShield } from './ChecklistShield';
import { ChecklistApproval } from './ChecklistApproval';
import { ChecklistLogs } from './ChecklistLogs';

export const MEDIA: Record<string, React.FC<MediaProps>> = {
  envCards: EnvCards, buildBreak: BuildBreak, aiKeyVault: AiKeyVault,
  indiaMap: IndiaMap, promptInjection: PromptInjection, agentSwarm: AgentSwarm,
  checklistKey: ChecklistKey, checklistShield: ChecklistShield,
  checklistApproval: ChecklistApproval, checklistLogs: ChecklistLogs,
  poisonedPackage: PoisonedPackage,
};
