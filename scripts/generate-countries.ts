// scripts/generate-countries.ts
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const res = await fetch('https://date.nager.at/api/v3/AvailableCountries');
  if (!res.ok) throw new Error('Failed to fetch countries');
  const countries = await res.json();
  const fileContent = `// This file is auto-generated. Do not edit manually.\nexport const availableCountries = ${JSON.stringify(countries, null, 2)};\n`;
  const outPath = path.resolve(__dirname, '../src/countries.ts');
  fs.writeFileSync(outPath, fileContent);
  console.log('countries.ts generated successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
