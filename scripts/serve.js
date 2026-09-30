import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(process.cwd());
const displayHost = "localhost";
const port = Number(process.env.PORT || 8000);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

async function handleRequest(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, `http://${displayHost}:${port}`).pathname);
  const relative = normalize(pathname).replace(/^\/+/, "");
  let file = join(root, relative || "index.html");
  if (file !== root && !file.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    await stat(file);
  } catch {
    if (/^\/railroads\/[^/]+\/?$/.test(pathname)) file = join(root, "index.html");
    else {
      response.writeHead(404).end("Not found");
      return;
    }
  }
  response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(response);
}

let listeningServers = 0;
const reportReady = () => {
  listeningServers += 1;
  if (listeningServers === 2) console.log(`American Diesel Roster: http://${displayHost}:${port}`);
};

createServer(handleRequest).listen(port, "127.0.0.1", reportReady);
createServer(handleRequest).listen({ port, host: "::1", ipv6Only: true }, reportReady);
