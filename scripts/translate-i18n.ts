import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Config
const SOURCE_LANG = 'en';
const TARGET_LANG = 'vi';
const SOURCE_FILE = path.join(process.cwd(), 'src/i18n/locales/en/common.json');
const TARGET_FILE = path.join(process.cwd(), 'src/i18n/locales/vi/common.json');

const BATCH_SIZE = 20;
const MODEL = process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('Missing OPENAI_API_KEY. Set it in your environment before running the script.');
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

type TranslationObject = Record<string, any>;

const readJson = (filePath: string): TranslationObject => {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

const flatten = (obj: TranslationObject, prefix = ''): Record<string, string> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      Object.assign(acc, flatten(value, newKey));
    } else {
      acc[newKey] = String(value);
    }
    return acc;
  }, {} as Record<string, string>);
};

const unflatten = (flat: Record<string, string>): TranslationObject => {
  const result: TranslationObject = {};
  Object.entries(flat).forEach(([key, value]) => {
    const parts = key.split('.');
    let current: TranslationObject = result;
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        current[part] = value;
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  });
  return result;
};

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const translateBatch = async (pairs: Array<{ key: string; text: string }>): Promise<Record<string, string>> => {
  const prompt = `You are a professional translator. Translate the following ${pairs.length} UI strings from ${SOURCE_LANG} to ${TARGET_LANG} for a Da Nang travel app. Preserve meaning, keep tone natural, and DO NOT change the keys. Return JSON with keys unchanged.`;
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: prompt },
    { role: 'user', content: JSON.stringify(pairs.reduce((acc, { key, text }) => ({ ...acc, [key]: text }), {})) },
  ];

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: messages as any,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return JSON.parse(content) as Record<string, string>;
};

const main = async () => {
  const source = readJson(SOURCE_FILE);
  const target = readJson(TARGET_FILE);

  const flatSource = flatten(source);
  const flatTarget = flatten(target);

  const missingEntries = Object.entries(flatSource)
    .filter(([key]) => !flatTarget[key])
    .map(([key, text]) => ({ key, text }));

  if (missingEntries.length === 0) {
    console.log('No new strings to translate. Target file is up to date.');
    return;
  }

  console.log(`Translating ${missingEntries.length} strings in batches of ${BATCH_SIZE}...`);

  const chunks = chunkArray(missingEntries, BATCH_SIZE);
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    console.log(`Translating batch ${index + 1}/${chunks.length}...`);
    const translated = await translateBatch(chunk);
    Object.entries(translated).forEach(([key, value]) => {
      flatTarget[key] = value;
    });
  }

  const merged = unflatten(flatTarget);
  fs.mkdirSync(path.dirname(TARGET_FILE), { recursive: true });
  fs.writeFileSync(TARGET_FILE, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`Saved translations to ${TARGET_FILE}`);
};

main().catch(err => {
  console.error('Translation script failed:', err);
  process.exitCode = 1;
});
