import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

interface Location {
  id?: string | number;
  name: string;
  description?: string;
  address?: string;
  advise?: string | string[];
  opening_hours?: string;
  price_level?: number;
}

interface Festival {
  id?: string | number;
  name: string;
  description?: string;
  event_time?: string;
  location?: string;
  ticket_info?: string;
  advise?: string | string[];
  price_level?: number;
}

type SupportedType = 'loc' | 'fest';

type Locale = 'en' | 'vi';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(rootDir, '..', 'data');
const localesDir = path.resolve(rootDir, 'src', 'i18n', 'locales');

function generateKey(type: SupportedType, id: string | number): string {
  return `${type}_${id}`;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function normalizeId(entity: { id?: string | number }, index: number) {
  return entity.id ?? index + 1;
}

async function translateText(text: string, target: Locale): Promise<string> {
  if (!text) return '';
  if (target === 'vi') return text;

  const prompt = `Translate the following Vietnamese travel content to ${target.toUpperCase()}. Keep proper nouns, addresses, and time ranges intact. Return only the translated text.\n\n${text}`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a professional travel content translator.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
  });

  return res.choices[0]?.message?.content?.trim() ?? text;
}

async function translateValue(value: unknown, target: Locale): Promise<unknown> {
  if (Array.isArray(value)) {
    const items = await Promise.all(value.map(v => translateText(String(v), target)));
    return items;
  }
  if (typeof value === 'string') {
    return translateText(value, target);
  }
  return value;
}

async function translateLocations() {
  const raw = JSON.parse(fs.readFileSync(path.join(dataDir, 'danang_locations.json'), 'utf8')) as Location[];

  const enOutput: Record<string, Record<string, unknown>> = {};
  const viOutput: Record<string, Record<string, unknown>> = {};

  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i];
    const id = normalizeId(item, i);
    const key = generateKey('loc', id);

    const fields: (keyof Location)[] = ['name', 'description', 'address', 'advise', 'opening_hours', 'price_level'];

    const viEntry: Record<string, unknown> = {};
    for (const f of fields) {
      const val = item[f];
      if (val !== undefined) viEntry[f] = val;
    }
    viOutput[key] = viEntry;

    const enEntry: Record<string, unknown> = {};
    for (const f of fields) {
      const val = item[f];
      if (val === undefined) continue;
      enEntry[f] = await translateValue(val, 'en');
    }
    enOutput[key] = enEntry;
  }

  writeLocale('locations', 'vi', viOutput);
  writeLocale('locations', 'en', enOutput);
}

async function translateFestivals() {
  const raw = JSON.parse(fs.readFileSync(path.join(dataDir, 'danang_festivals.json'), 'utf8')) as Festival[];

  const enOutput: Record<string, Record<string, unknown>> = {};
  const viOutput: Record<string, Record<string, unknown>> = {};

  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i];
    const id = normalizeId(item, i);
    const key = generateKey('fest', id);

    const fields: (keyof Festival)[] = ['name', 'description', 'event_time', 'location', 'ticket_info', 'advise', 'price_level'];

    const viEntry: Record<string, unknown> = {};
    for (const f of fields) {
      const val = item[f];
      if (val !== undefined) viEntry[f] = val;
    }
    viOutput[key] = viEntry;

    const enEntry: Record<string, unknown> = {};
    for (const f of fields) {
      const val = item[f];
      if (val === undefined) continue;
      enEntry[f] = await translateValue(val, 'en');
    }
    enOutput[key] = enEntry;
  }

  writeLocale('festivals', 'vi', viOutput);
  writeLocale('festivals', 'en', enOutput);
}

function writeLocale(namespace: 'locations' | 'festivals', lang: Locale, payload: Record<string, unknown>) {
  const targetDir = path.join(localesDir, lang);
  ensureDir(targetDir);
  const outPath = path.join(targetDir, `${namespace}.json`);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is missing. Exiting without translation.');
    return;
  }

  await translateLocations();
  await translateFestivals();
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
