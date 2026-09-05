export function getScrollIndicator({ scrollHeight, clientHeight, scrollTop, trackHeight }) {
  const maxScroll = scrollHeight - clientHeight;
  const isScrollable = maxScroll > 1 && clientHeight > 0 && trackHeight > 0;
  if (!isScrollable) {
    return { isScrollable: false, thumbHeight: 0, thumbOffset: 0 };
  }

  const thumbHeight = Math.min(trackHeight, Math.max((clientHeight / scrollHeight) * trackHeight, 24));
  // Clamp elastic overscroll on touch devices and keep the thumb inside its track.
  const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
  return { isScrollable, thumbHeight, thumbOffset: progress * (trackHeight - thumbHeight) };
}
