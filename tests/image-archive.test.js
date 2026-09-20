import test from "node:test";
import assert from "node:assert/strict";
import { archivePathFor, useArchiveOnError } from "../src/image-archive.js";

test("archive path is stable for a remote image and keeps its extension", () => {
  const url = "https://example.com/photos/BN%209479.JPG";
  assert.match(archivePathFor(url), /^\/WebArchive\/external\/[0-9a-f]{8}\.jpg$/);
  assert.equal(archivePathFor(url), archivePathFor(url));
});

test("failed remote image tries archive once before showing source fallback", () => {
  const image = { src: "https://example.com/photo.jpg" };
  let failed = 0;
  const handleError = useArchiveOnError(image, () => { failed += 1; });
  handleError();
  assert.equal(image.src, archivePathFor("https://example.com/photo.jpg"));
  assert.equal(failed, 0);
  handleError();
  assert.equal(failed, 1);
});
