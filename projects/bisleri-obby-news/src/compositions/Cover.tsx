// Cover: the "QA FAILED" moment over the obby run (a real frame of the reel).
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Overlay } from '../news/Overlay';
import { ev } from '../tl';

export const Cover: React.FC = () => <AbsoluteFill style={{ background: '#5EC8F5' }}><Overlay t={ev('qaFail') + 0.4} /></AbsoluteFill>;
