import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { installReel } from './reel/ReelMode';
import { useStore } from './store';
import { viz } from './world/viz';
import { vclock } from './world/clock';

// test hooks for Playwright (scripts/shots.ts, tests/e2e): read-only access to the same store the UI uses
(window as any).__bx = { useStore, viz, vclock, probe: {} as Record<string, [number, number]> };

if (new URLSearchParams(location.search).has('reel')) installReel();
createRoot(document.getElementById('root')!).render(<App />);
