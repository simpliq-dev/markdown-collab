import { createHash } from "node:crypto";
import {
  cp,
  copyFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8")
);
const version = packageJson.version;
const sourceVsix = path.join(root, `${packageJson.name}-${version}.vsix`);
const releaseRoot = path.join(root, "release");
const kitName = `markdown-collab-${version}-kit`;
const outputDir = path.join(releaseRoot, kitName);
const brandedVsixName = `markdown-collab-${version}.vsix`;

if (
  path.dirname(outputDir) !== releaseRoot ||
  !path.basename(outputDir).startsWith("markdown-collab-")
) {
  throw new Error("Refusing to write outside the Markdown Collab release folder.");
}

await stat(sourceVsix);
await mkdir(releaseRoot, { recursive: true });
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const outputVsix = path.join(outputDir, brandedVsixName);
await copyFile(sourceVsix, outputVsix);
await mkdir(path.join(outputDir, "skills"), { recursive: true });
await cp(
  path.join(root, "skills", "markdown-collab"),
  path.join(outputDir, "skills", "markdown-collab"),
  { recursive: true }
);

const vsixBytes = await readFile(outputVsix);
const sha256 = createHash("sha256").update(vsixBytes).digest("hex");
const readmeTemplate = await readFile(
  path.join(releaseRoot, "TEST-KIT-README.md"),
  "utf8"
);
const readme = readmeTemplate
  .replaceAll("{{VERSION}}", version)
  .replaceAll("{{VSIX_NAME}}", brandedVsixName)
  .replaceAll("{{SHA256}}", sha256);

await writeFile(path.join(outputDir, "README.md"), readme, "utf8");
await writeFile(
  path.join(outputDir, "SHA256SUMS.txt"),
  `${sha256}  ${brandedVsixName}\n`,
  "utf8"
);

console.log(`Created ${path.relative(root, outputDir)}`);
