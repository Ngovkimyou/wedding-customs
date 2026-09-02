import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const nextOutputDirectories = [".next", ".next-dev"];

for (const directory of nextOutputDirectories) {
  const outputPath = resolve(process.cwd(), directory);
  await rm(outputPath, { force: true, recursive: true });
  console.log(`Removed Next.js output: ${outputPath}`);
}
