// The visual clock for decoration that is not sim state (trace pulses, idle spins). In the app it follows the frame clock;
// in reel capture mode it is set from the reel time, so every captured frame is a pure function of t.
export const vclock = { t: 0 };
