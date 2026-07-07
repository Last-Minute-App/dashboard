import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const dashboardRoot = resolve(scriptDir, "..");
const workspaceRoot = resolve(dashboardRoot, "..");
const mobileRoot = resolve(workspaceRoot, "mobile-app");
const basePath = process.env.EXPO_PUBLIC_WEB_BASE_PATH || "/dashboard";

if (!existsSync(join(mobileRoot, "package.json"))) {
  throw new Error(
    `Expected mobile app at ${mobileRoot}. Run this from the combined workspace or publish mobile-app directly.`
  );
}

const build = spawnSync("npm", ["run", "build:pwa"], {
  cwd: mobileRoot,
  env: {
    ...process.env,
    EXPO_PUBLIC_WEB_BASE_PATH: basePath,
  },
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (build.error) {
  throw build.error;
}

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const source = resolve(mobileRoot, "dist-pwa");
const target = resolve(dashboardRoot, "dist");
const safeDashboardPrefix = dashboardRoot.endsWith(sep) ? dashboardRoot : `${dashboardRoot}${sep}`;

if (!target.startsWith(safeDashboardPrefix)) {
  throw new Error(`Refusing to remove ${target} because it is outside ${dashboardRoot}.`);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

const indexHtml = join(target, "index.html");
if (existsSync(indexHtml)) {
  cpSync(indexHtml, join(target, "404.html"));
}

console.log(`Synced mobile PWA to ${target} with base path ${basePath}.`);
