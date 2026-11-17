import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { reelApi } from './reel/reel';
import { finalApi } from './reel/final';
import './ui/styles.css';

// ?reel=1: capture mode for the product reel (UI hidden, scripted shots; see src/reel/reel.ts). ?reel=final: the final reel
// (src/reel/final.ts). ?uireel=final: the same reel's builder shot, with the UI showing.
const q = new URLSearchParams(location.search);
if (q.has('reel')) { document.documentElement.classList.add('reel-mode'); (window as unknown as { __reel: unknown }).__reel = q.get('reel') === 'final' ? finalApi : reelApi; }
else if (q.get('uireel') === 'final') (window as unknown as { __reel: unknown }).__reel = finalApi;
createRoot(document.getElementById('root')!).render(<App />);
