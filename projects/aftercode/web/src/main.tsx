import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { reelApi } from './reel/reel';
import './ui/styles.css';

// ?reel=1: capture mode for the product reel (UI hidden, scripted shots; see src/reel/reel.ts)
if (new URLSearchParams(location.search).has('reel')) { document.documentElement.classList.add('reel-mode'); (window as unknown as { __reel: unknown }).__reel = reelApi; }
createRoot(document.getElementById('root')!).render(<App />);
