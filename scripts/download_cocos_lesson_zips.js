#!/usr/bin/env node

/**
 * Download Cocos lesson ZIPs listed in a CSV column named cocos_lesson_id.
 *
 * Usage:
 *   node scripts/download_cocos_lesson_zips.js /path/to/lessons.csv ./downloads/cocos-lessons
 */

const fs = require('node:fs/promises');
const path = require('node:path');

const R2_BASE_URL = 'https://pub-9d27d46558f64e93a979827424d3e766.r2.dev';
const CONCURRENCY = 5;

const [csvPath, outputDirectory = 'downloads/cocos-lessons'] = process.argv.slice(2);

if (!csvPath) {
  console.error('Usage: node scripts/download_cocos_lesson_zips.js <csv-path> [output-directory]');
  process.exit(1);
}

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

async function getLessonIds() {
  const csv = await fs.readFile(csvPath, 'utf8');
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  const header = parseCsvLine(lines.shift() ?? '');
  const idColumn = header.indexOf('cocos_lesson_id');
  if (idColumn === -1) {
    throw new Error('CSV must have a cocos_lesson_id column');
  }

  return [...new Set(lines.map(parseCsvLine).map((row) => row[idColumn]?.trim()).filter(Boolean))]
    .filter((id) => /^[a-zA-Z0-9_-]+$/.test(id));
}

async function download(id) {
  const destination = path.join(outputDirectory, `${id}.zip`);
  try {
    await fs.access(destination);
    console.log(`SKIP ${id}.zip already exists`);
    return null;
  } catch {
    // File does not exist yet.
  }

  const url = `${R2_BASE_URL}/${encodeURIComponent(id)}.zip`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  await fs.writeFile(destination, Buffer.from(await response.arrayBuffer()));
  console.log(`OK   ${id}.zip`);
  return null;
}

async function main() {
  const ids = await getLessonIds();
  await fs.mkdir(outputDirectory, { recursive: true });
  console.log(`Downloading ${ids.length} lesson ZIPs to ${outputDirectory}`);

  const failures = [];
  for (let index = 0; index < ids.length; index += CONCURRENCY) {
    const batch = ids.slice(index, index + CONCURRENCY);
    await Promise.all(batch.map(async (id) => {
      try {
        await download(id);
      } catch (error) {
        failures.push({ id, error: error instanceof Error ? error.message : String(error) });
        console.error(`FAIL ${id}.zip`);
      }
    }));
  }

  if (failures.length) {
    await fs.writeFile(
      path.join(outputDirectory, 'failed-downloads.json'),
      `${JSON.stringify(failures, null, 2)}\n`,
    );
    console.error(`${failures.length} downloads failed; see failed-downloads.json`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
