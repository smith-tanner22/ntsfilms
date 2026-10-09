import fs from "node:fs/promises";
import path from "node:path";

const blockingCategories = new Set(["FILMING", "OTHER"]);
const outputPath = path.join("json", "availability.json");

function unfoldIcsLines(icsText) {
  return icsText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .reduce((lines, line) => {
      if (/^[ \t]/.test(line) && lines.length) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line);
      }
      return lines;
    }, []);
}

function parseProperty(line) {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }

  const rawName = line.slice(0, separatorIndex);
  const value = line.slice(separatorIndex + 1);
  const [name, ...paramParts] = rawName.split(";");
  const params = Object.fromEntries(
    paramParts.map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.toUpperCase(), rest.join("=")];
    })
  );

  return {
    name: name.toUpperCase(),
    params,
    value
  };
}

function parseEvents(icsText) {
  const lines = unfoldIcsLines(icsText);
  const events = [];
  let currentEvent = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      currentEvent = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (currentEvent) {
        events.push(currentEvent);
      }
      currentEvent = null;
      continue;
    }

    if (!currentEvent) {
      continue;
    }

    const property = parseProperty(line);
    if (!property) {
      continue;
    }

    if (property.name === "DTSTART" || property.name === "DTEND") {
      currentEvent[property.name] = {
        value: property.value,
        isDateOnly: property.params.VALUE === "DATE"
      };
      continue;
    }

    if (property.name === "CATEGORIES") {
      currentEvent.categories = property.value
        .split(",")
        .map((category) => category.trim().toUpperCase())
        .filter(Boolean);
    }
  }

  return events;
}

function dateFromIcsValue(field) {
  if (!field?.value) {
    return null;
  }

  const match = field.value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function stableAvailabilityShape(availability) {
  return JSON.stringify({
    timezone: availability.timezone,
    blockingCategories: availability.blockingCategories,
    unavailableDates: availability.unavailableDates,
    categoryCounts: availability.categoryCounts
  });
}

function eventDates(event) {
  const start = dateFromIcsValue(event.DTSTART);
  if (!start) {
    return [];
  }

  const end = dateFromIcsValue(event.DTEND);
  const dates = [];

  if (!end) {
    return [formatDate(start)];
  }

  const exclusiveEnd = event.DTEND.isDateOnly ? end : addDays(end, 1);

  for (let date = start; date < exclusiveEnd; date = addDays(date, 1)) {
    dates.push(formatDate(date));
  }

  return dates;
}

async function readCalendarFeed() {
  if (process.env.ICS_PATH) {
    return fs.readFile(process.env.ICS_PATH, "utf8");
  }

  if (!process.env.CALENDAR_FEED_URL) {
    throw new Error("Set CALENDAR_FEED_URL or ICS_PATH before running generate-availability.mjs.");
  }

  const response = await fetch(process.env.CALENDAR_FEED_URL);
  if (!response.ok) {
    throw new Error(`Calendar feed request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

const icsText = await readCalendarFeed();
const events = parseEvents(icsText);
const unavailableDates = new Set();
const categoryCounts = {};

for (const event of events) {
  for (const category of event.categories || []) {
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  }

  const blocksDate = (event.categories || []).some((category) => blockingCategories.has(category));
  if (!blocksDate) {
    continue;
  }

  for (const date of eventDates(event)) {
    unavailableDates.add(date);
  }
}

const availability = {
  generatedAt: new Date().toISOString(),
  timezone: "America/Phoenix",
  blockingCategories: [...blockingCategories],
  unavailableDates: [...unavailableDates].sort(),
  categoryCounts: Object.fromEntries(Object.entries(categoryCounts).sort(([a], [b]) => a.localeCompare(b)))
};

try {
  const existingAvailability = JSON.parse(await fs.readFile(outputPath, "utf8"));
  if (stableAvailabilityShape(existingAvailability) === stableAvailabilityShape(availability)) {
    availability.generatedAt = existingAvailability.generatedAt;
  }
} catch {
  // The file may not exist yet. In that case, write a fresh generatedAt timestamp.
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(availability, null, 2)}\n`);

console.log(`Wrote ${availability.unavailableDates.length} unavailable dates to ${outputPath}.`);
