// WebArchive is a local-only, Git-ignored backup of externally hosted images.
export function archivePathFor(remoteUrl) {
  if (!/^https?:\/\//i.test(remoteUrl ?? "")) return null;
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(remoteUrl)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const pathname = new URL(remoteUrl).pathname;
  const extension = /\.(png|gif|webp|jpe?g)$/i.exec(pathname)?.[1]?.toLowerCase();
  const suffix = extension === "jpeg" ? "jpg" : extension ?? "jpg";
  return `/WebArchive/external/${hash.toString(16).padStart(8, "0")}.${suffix}`;
}

export function useArchiveOnError(image, onUnavailable = () => {}) {
  const archivePath = archivePathFor(image.src);
  let triedArchive = false;
  return () => {
    if (archivePath && !triedArchive) {
      triedArchive = true;
      image.src = archivePath;
    } else onUnavailable();
  };
}
