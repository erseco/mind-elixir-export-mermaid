// Check the exporter's compatibility with another Mind Elixir release.
// Keep package.json and package-lock.json untouched; change only local node_modules.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "mind-elixir-version": { type: "string" },
    advisory: { type: "boolean", default: false },
  },
});
const requested = values["mind-elixir-version"];
const advisory = values.advisory;

if (!requested) {
  console.error(
    "Usage: npm run test:compat -- --mind-elixir-version VERSION [--advisory]",
  );
  process.exit(1);
}

/** Parse an npm-style version without regular expressions or dynamic indexing. */
function parseVersion(version) {
  if (typeof version !== "string" || version.length > 100) return null;
  const [core, ...suffixParts] = version.split("-");
  const [major, minor, patch, ...extra] = core.split(".");
  if (extra.length > 0) return null;

  const parts = [major, minor, patch];
  if (
    parts.some(
      (part) =>
        !part ||
        !Number.isSafeInteger(Number(part)) ||
        String(Number(part)) !== part,
    )
  ) {
    return null;
  }

  const suffix = suffixParts.join("-");
  if (
    suffixParts.length > 0 &&
    (!suffix ||
      !Array.from(suffix).every((char) =>
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.-".includes(
          char,
        ),
      ))
  ) {
    return null;
  }

  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease: suffixParts.length > 0,
  };
}

function npm(args, capture = false) {
  return execFileSync("npm", args, {
    ...(capture ? { encoding: "utf8" } : { stdio: "inherit" }),
  });
}

function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  return (
    left.major - right.major ||
    left.minor - right.minor ||
    left.patch - right.patch
  );
}

function resolveVersion(spec) {
  if (spec === "latest") {
    // The latest dist-tag may point to a prerelease; select the newest stable.
    const all = JSON.parse(
      npm(["view", "mind-elixir", "versions", "--json"], true),
    );
    const versions = (Array.isArray(all) ? all : [all])
      .filter((version) => parseVersion(version)?.prerelease === false)
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
  if (!parseVersion(version)) {
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
