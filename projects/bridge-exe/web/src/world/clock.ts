// The visual clock. In the app it follows real time; in the reel it is set by seek(t), so drifting mist, water and
// arcade debris are pure functions of t. Engineering numbers never read this clock.
export const vclock = { t: 0, live: true };
