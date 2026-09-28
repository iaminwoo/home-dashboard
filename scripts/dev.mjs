import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

function isPrivateIpv4(address) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;

  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}

function interfacePriority(name) {
  const normalized = name.toLowerCase();
  if (/^(en0|en1)$/.test(normalized) || /wi-?fi|wireless/.test(normalized)) return 0;
  if (/bridge|docker|utun|vmnet|vbox/.test(normalized)) return 20;
  return 10;
}

function findLanIp() {
  const candidates = Object.entries(networkInterfaces())
    .flatMap(([name, addresses]) => (addresses ?? []).map((address) => ({ name, address })))
    .filter(({ address }) => address.family === "IPv4" && !address.internal && !address.address.startsWith("169.254."))
    .map(({ name, address }) => ({
      address: address.address,
      priority: (isPrivateIpv4(address.address) ? 0 : 100) + interfacePriority(name),
    }))
    .sort((left, right) => left.priority - right.priority || left.address.localeCompare(right.address));

  return candidates[0]?.address;
}

function readPort(args) {
  const portIndex = args.findIndex((argument) => argument === "--port" || argument === "-p");
  if (portIndex !== -1 && args[portIndex + 1]) return args[portIndex + 1];

  const inlinePort = args.find((argument) => argument.startsWith("--port="));
  return inlinePort?.slice("--port=".length) ?? process.env.PORT ?? "3000";
}

function withoutPortArguments(args) {
  return args.filter((argument, index) => {
    const previous = args[index - 1];
    return argument !== "--port"
      && argument !== "-p"
      && previous !== "--port"
      && previous !== "-p"
      && !argument.startsWith("--port=");
  });
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(preferredPort) {
  for (let port = preferredPort; port < preferredPort + 100; port += 1) {
    if (await isPortAvailable(port)) return port;
  }

  throw new Error(`${preferredPort}번 포트부터 사용 가능한 개발 서버 포트를 찾지 못했습니다.`);
}

const nextArguments = process.argv.slice(2);
const lanIp = findLanIp();
const requestedPort = Number(readPort(nextArguments));
const port = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort < 65_536
  ? await findAvailablePort(requestedPort)
  : await findAvailablePort(3000);
const forwardedArguments = [...withoutPortArguments(nextArguments), "--port", String(port)];

if (lanIp) {
  console.log(`LAN IP: ${lanIp}`);
  console.log(`모바일 접속 주소: http://${lanIp}:${port}`);
} else {
  console.warn("LAN IP를 찾지 못했습니다.");
  console.warn("localhost에서는 개발 서버를 사용할 수 있지만 다른 기기에서는 접속하지 못할 수 있습니다.");
}

const nextBinary = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const child = spawn(process.execPath, [nextBinary, "dev", "--hostname", "0.0.0.0", ...forwardedArguments], {
  env: { ...process.env, ...(lanIp ? { DEV_LAN_IP: lanIp } : {}) },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error("Next.js 개발 서버를 시작하지 못했습니다.", error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
