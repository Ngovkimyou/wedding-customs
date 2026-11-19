import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const musicControlSource = await readFile(
  new URL("../components/MusicControl.js", import.meta.url),
  "utf8",
);

test("archive reveal and restored session state do not start music automatically", () => {
  assert.doesNotMatch(musicControlSource, /ARCHIVE_READY_EVENT/u);
  assert.doesNotMatch(musicControlSource, /savedState\.wasPlaying/u);
  assert.match(musicControlSource, /onClick=\{togglePlayback\}/u);
});

test("choosing a soundtrack does not start paused music", () => {
  const selectionStart = musicControlSource.indexOf("const selectPlaylist =");
  const selectionEnd = musicControlSource.indexOf("const handleMusicChoiceKeyDown", selectionStart);
  const selectionSource = musicControlSource.slice(selectionStart, selectionEnd);

  assert.match(
    selectionSource,
    /const shouldContinuePlayback = hasUserStarted \|\| Boolean\(audio && !audio\.paused\)/u,
  );
  assert.match(selectionSource, /if \(shouldContinuePlayback\) \{[\s\S]*?audio\.play\(\)/u);
});
