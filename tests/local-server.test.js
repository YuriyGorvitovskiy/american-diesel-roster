import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import test from "node:test";

import * as dataModule from "../src/data.js";

const root = new URL("..", import.meta.url);

async function availablePort() {
  const ipv6Probe = createServer();
  ipv6Probe.listen({ port: 0, host: "::1", ipv6Only: true });
  await once(ipv6Probe, "listening");
  const { port } = ipv6Probe.address();

  const ipv4Probe = createServer();
  ipv4Probe.listen(port, "127.0.0.1");
  await once(ipv4Probe, "listening");
  await Promise.all([ipv4Probe, ipv6Probe].map((probe) => new Promise((resolve, reject) => {
    probe.close((error) => error ? reject(error) : resolve());
  })));
  return port;
}

test("load failures direct users to the server that supports bookmarkable routes", () => {
  assert.equal(
    dataModule.localServerHelp?.(),
    "Unable to load roster data. Run npm start from the repository root and reload this page.",
  );
});

test("local server owns localhost across address families and limits the railroad fallback", async () => {
  const port = await availablePort();
  const child = spawn(process.execPath, ["scripts/serve.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await once(child.stdout, "data", { signal: AbortSignal.timeout(5_000) });
    for (const host of ["127.0.0.1", "[::1]"]) {
      const deepLink = await fetch(`http://${host}:${port}/railroads/gcsf`);
      assert.equal(deepLink.status, 200);
      assert.match(await deepLink.text(), /<main id="page-content">/);
    }

    const missingAsset = await fetch(`http://127.0.0.1:${port}/railroads/gcsf/missing.js`);
    assert.equal(missingAsset.status, 404);
  } finally {
    if (child.exitCode === null) {
      child.kill();
      await once(child, "exit");
    }
  }
});
