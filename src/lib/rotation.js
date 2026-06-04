// Training-day rotation. The program is a fixed sequence (Push → Pull → Legs →
// Upper); after the last day it wraps back to the first. `currentDayIdx` is the
// persisted "next workout to do" cursor — it advances here on each saved
// session and resets to 0 on "start week over". Rotation is by sequence
// position, independent of weekday.
export function nextDayIdx(idx, len) {
  return (idx + 1) % len;
}
