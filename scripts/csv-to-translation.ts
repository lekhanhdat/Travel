import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import Papa from 'papaparse';
import dotenv from 'dotenv';

// Configure dotenv to read from Travel/.env
// __dirname is Travel/scripts, so ../.env is Travel/.env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is missing in .env file');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// File Paths
// Script is in Travel/scripts/
// CSVs are in workspace root (Travel/../) = ../../ from scripts
const CSV_LOCATION_PATH = path.resolve(__dirname, '../../Location.csv');
const CSV_FESTIVAL_PATH = path.resolve(__dirname, '../../Festival.csv');

// JSON files are in Travel/src/i18n/locales/en/ = ../src/i18n/locales/en/ from scripts
const JSON_LOCATIONS_PATH = path.resolve(__dirname, '../src/i18n/locales/en/locations.json');
const JSON_FESTIVALS_PATH = path.resolve(__dirname, '../src/i18n/locales/en/festivals.json');

// Interfaces
interface CsvLocation {
  name: string;
  description: string;
  long_description: string;
  address: string;
  opening_hours: string;
  advise: string; // JSON string
  [key: string]: any;
}

interface CsvFestival {
  name: string;
  description: string;
  event_time: string;
  location: string;
  ticket_info: string;
  advise: string; // JSON string
  [key: string]: any;
}

interface JsonLocationEntry {
  name: string;
  description: string;
  long_description?: string;
  address: string;
  opening_hours: string;
  advise: string[];
  [key: string]: any;
}

interface JsonFestivalEntry {
  name: string;
  description: string;
  event_time: string;
  location: string;
  ticket_info: string;
  advise: string[];
  [key: string]: any;
}

// Helper Functions
function readCsv<T>(filePath: string): Promise<T[]> {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as T[]),
      error: (error: any) => reject(error),
    });
  });
}

function readJson(filePath: string): Record<string, any> {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${filePath}`);
}

function parseAdvise(raw: string): string[] {
  try {
    if (!raw) return [];
    // Handle case where CSV parsing might have already unescaped some quotes
    // The CSV data shows: "[""Tip 1"", ""Tip 2""]" which PapaParse should handle as string '["Tip 1", "Tip 2"]'
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [String(raw)];
  } catch (e) {
    // If not JSON, treat as single string
    return raw ? [raw] : [];
  }
}

async function translateText(text: string, context: string): Promise<string> {
  if (!text || !text.trim()) return '';
  
  // Use cached/dummy translation for testing if needed, but here we use real API
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator for a travel app. Translate the following Vietnamese text to English. 
Context: ${context}.
Keep proper nouns, place names, and addresses in their original form if appropriate. 
Return ONLY the translated text.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
    });
    
    return completion.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original
  }
}

async function translateList(items: string[], context: string): Promise<string[]> {
  if (!items || items.length === 0) return [];
  const translated: string[] = [];
  for (const item of items) {
    translated.push(await translateText(item, context));
  }
  return translated;
}

// Main Logic
async function processLocations() {
  console.log('Processing Locations...');
  const csvData = await readCsv<CsvLocation>(CSV_LOCATION_PATH);
  const jsonData = readJson(JSON_LOCATIONS_PATH);
  let updated = false;

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const key = `loc_${i + 1}`; // keys start from loc_1
    
    if (!jsonData[key]) {
      jsonData[key] = {};
    }

    const entry = jsonData[key] as JsonLocationEntry;
    const context = `Location: ${row.name}`;

    // Fields to check and translate
    // name
    if (!entry.name && row.name) {
      process.stdout.write(`Translating name for ${key}... `);
      entry.name = await translateText(row.name, context);
      console.log('Done');
      updated = true;
    }

    // description
    if (!entry.description && row.description) {
      process.stdout.write(`Translating description for ${key}... `);
      entry.description = await translateText(row.description, context);
      console.log('Done');
      updated = true;
    }

    // long_description (might map to description if description is short, but task asks for long_description)
    // Note: existing JSON might not have long_description field, checking if we should add it.
    // The task says "Các trường cần dịch: ... long_description". So we add it.
    if (!entry.long_description && row.long_description) {
      process.stdout.write(`Translating long_description for ${key}... `);
      entry.long_description = await translateText(row.long_description, context);
      console.log('Done');
      updated = true;
    }

    // address
    if (!entry.address && row.address) {
      process.stdout.write(`Translating address for ${key}... `);
      entry.address = await translateText(row.address, context);
      console.log('Done');
      updated = true;
    }

    // opening_hours
    if (!entry.opening_hours && row.opening_hours) {
      // Opening hours usually don't need much translation, but let's be safe
      entry.opening_hours = row.opening_hours; 
      // Sometimes "Thứ 2" etc needs translation.
      if (/[^\d\s:\-]/.test(row.opening_hours)) {
         entry.opening_hours = await translateText(row.opening_hours, context);
      }
      updated = true;
    }

    // advise
    if ((!entry.advise || entry.advise.length === 0) && row.advise) {
      const tips = parseAdvise(row.advise);
      if (tips.length > 0) {
        process.stdout.write(`Translating advise for ${key}... `);
        entry.advise = await translateList(tips, context + ' (Travel Tips)');
        console.log('Done');
        updated = true;
      }
    }
  }

  if (updated) {
    writeJson(JSON_LOCATIONS_PATH, jsonData);
  } else {
    console.log('No updates for Locations.');
  }
}

async function processFestivals() {
  console.log('Processing Festivals...');
  const csvData = await readCsv<CsvFestival>(CSV_FESTIVAL_PATH);
  const jsonData = readJson(JSON_FESTIVALS_PATH);
  let updated = false;

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const key = `fest_${i + 1}`; // keys start from fest_1
    
    if (!jsonData[key]) {
      jsonData[key] = {};
    }

    const entry = jsonData[key] as JsonFestivalEntry;
    const context = `Festival: ${row.name}`;

    // name
    if (!entry.name && row.name) {
      process.stdout.write(`Translating name for ${key}... `);
      entry.name = await translateText(row.name, context);
      console.log('Done');
      updated = true;
    }

    // description
    if (!entry.description && row.description) {
      process.stdout.write(`Translating description for ${key}... `);
      entry.description = await translateText(row.description, context);
      console.log('Done');
      updated = true;
    }

    // event_time
    if (!entry.event_time && row.event_time) {
      process.stdout.write(`Translating event_time for ${key}... `);
      entry.event_time = await translateText(row.event_time, context);
      console.log('Done');
      updated = true;
    }

    // location
    if (!entry.location && row.location) {
      process.stdout.write(`Translating location for ${key}... `);
      entry.location = await translateText(row.location, context);
      console.log('Done');
      updated = true;
    }

    // ticket_info
    if (!entry.ticket_info && row.ticket_info) {
      process.stdout.write(`Translating ticket_info for ${key}... `);
      entry.ticket_info = await translateText(row.ticket_info, context);
      console.log('Done');
      updated = true;
    }

    // advise
    if ((!entry.advise || entry.advise.length === 0) && row.advise) {
      const tips = parseAdvise(row.advise);
      if (tips.length > 0) {
        process.stdout.write(`Translating advise for ${key}... `);
        entry.advise = await translateList(tips, context + ' (Travel Tips)');
        console.log('Done');
        updated = true;
      }
    }
  }

  if (updated) {
    writeJson(JSON_FESTIVALS_PATH, jsonData);
  } else {
    console.log('No updates for Festivals.');
  }
}

async function main() {
  try {
    await processLocations();
    await processFestivals();
    console.log('All translations processed successfully.');
  } catch (error) {
    console.error('Script failed:', error);
  }
}

main();
