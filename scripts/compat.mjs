// Check the exporter's compatibility with another Mind Elixir release.
// Keep package.json and package-lock.json untouched; change only local node_modules.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const versionFlag = args.indexOf("--mind-elixir-version");
const requested = args[versionFlag + 1];
const advisory = args.includes("--advisory");

if (versionFlag === -1 || !requested || requested.startsWith("--")) {
  console.error(
    "Usage: npm run test:compat -- --mind-elixir-version <latest|next|version> [--advisory]",
  );
  process.exit(1);
}

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function npm(args, capture = false) {
  return execFileSync("npm", args, {
    ...(capture ? { encoding: "utf8" } : { stdio: "inherit" }),
  });
}

function compareVersions(a, b) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const delta = left[i] - right[i];
    if (delta !== 0) return delta;
  }
  return 0;
}

function resolveVersion(spec) {
  if (spec === "latest") {
    // The latest dist-tag may point to a prerelease; select the newest stable.
    const all = JSON.parse(
      npm(["view", "mind-elixir", "versions", "--json"], true),
    );
    const versions = (Array.isArray(all) ? all : [all])
      .filter(
        (version) =>
          typeof version === "string" && /^\d+\.\d+\.\d+$/.test(version),
      )
      .sort(compareVersions);
    if (versions.length === 0) {
      throw new Error("No stable Mind Elixir version found");
    }
    return versions.at(-1);
  }
  if (spec === "next") {
    const tags = JSON.parse(
      npm(["view", "mind-elixir", "dist-tags", "--json"], true),
    );
    if (typeof tags.next !== "string") {
      throw new Error("No Mind Elixir next dist-tag found");
    }
    return tags.next;
  }
  return spec;
}

try {
  const version = resolveVersion(requested);
  if (!SEMVER.test(version)) {
    throw new Error(`Invalid Mind Elixir version: ${version}`);
  }
  console.log(`Checking Mind Elixir ${version} (requested: ${requested})`);
  npm([
    "install",
    "--no-save",
    "--package-lock=false",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    `mind-elixir@${version}`,
  ]);
  const installed = JSON.parse(
    readFileSync("node_modules/mind-elixir/package.json", "utf8"),
  ).version;
  if (installed !== version) {
    throw new Error(`Expected Mind Elixir ${version}, installed ${installed}`);
  }
  // Existing tests exercise the actual types, example data and Pele output.
  npm(["run", "check"]);
  console.log(`Mind Elixir ${version} compatibility check passed`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  if (advisory) {
    console.warn("Advisory only: compatibility failure does not block CI");
  } else {
    process.exitCode = 1;
  }
}
