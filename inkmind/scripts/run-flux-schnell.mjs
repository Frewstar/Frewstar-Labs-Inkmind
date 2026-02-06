/**
 * Run black-forest-labs/flux-schnell via Replicate.
 * Requires: REPLICATE_API_TOKEN in .env.local (or env).
 * Run from project root: node scripts/run-flux-schnell.mjs
 */
import { config } from "dotenv";
import { writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Replicate from "replicate";

// Load .env.local from project root (inkmind/)
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const replicate = new Replicate();

const input = {
  prompt:
    'black forest gateau cake spelling out the words "FLUX SCHNELL", tasty, food photography, dynamic shot',
};

console.log("Running black-forest-labs/flux-schnell...");
const output = await replicate.run("black-forest-labs/flux-schnell", {
  input,
});

const outList = Array.isArray(output) ? output : [output];

for (const [index, item] of Object.entries(outList)) {
  const name = `output_${index}.webp`;
  let data;
  if (item == null) continue;
  if (typeof item.url === "function") {
    console.log("URL:", item.url());
    const res = await fetch(item.toString());
    data = Buffer.from(await res.arrayBuffer());
  } else if (typeof item === "string") {
    console.log("URL:", item);
    const res = await fetch(item);
    data = Buffer.from(await res.arrayBuffer());
  } else {
    data = item;
  }
  await writeFile(name, data);
  console.log("Wrote", name);
}
