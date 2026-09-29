/**
 * Deterministic daily-rotation engine.
 *
 * Four asserted properties are guaranteed here:
 *   - Deterministic: the same (date, CURRICULUM_VERSION) always composes to the
 *     same bytes and hash. No randomness, no clock reads beyond the input date.
 *   - Complete:     within any rolling 7 days, all four modules appear as a
 *     primary item (Mon→M1, Tue/Fri→M2, Wed/Sat→M3, Thu→M4, Sun→digest).
 *   - Cacheable:    an edition is a pure function of its date; change is detected
 *     by comparing the sha256 hash.
 *   - Human in the loop: this code only reads static curriculum text; it never
 *     authors ethics content at request time.
 */

import { createHash } from 'node:crypto';
import {
  CURRICULUM_VERSION,
  MODULE_META,
  M1_HUMANITY_GOALS,
  M2_CORE_PRINCIPLES,
  M3_CASE_STUDIES,
  M4_CODE_OF_CONDUCT,
  type CurriculumItem,
  type ModuleId,
} from './curriculum.js';

/** Epoch for the deterministic day counter (curriculum v1 start). */
const EPOCH = Date.UTC(2026, 0, 1); // 2026-01-01 UTC

const MODULE_ARRAYS: Record<ModuleId, CurriculumItem[]> = {
  m1: M1_HUMANITY_GOALS,
  m2: M2_CORE_PRINCIPLES,
  m3: M3_CASE_STUDIES,
  m4: M4_CODE_OF_CONDUCT,
};

export interface EditionItem {
  module: ModuleId;
  label: string;
  name: string;
  item: CurriculumItem;
}

export interface Edition {
  date: string; // YYYY-MM-DD (input date, normalized to UTC date)
  weekday: number; // 0=Sun .. 6=Sat
  isDigest: boolean;
  primary: EditionItem | null;
  companion: EditionItem | null;
  hash: string;
  text: string;
}

export function dayNumber(d: Date): number {
  const utcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((utcMidnight - EPOCH) / 86_400_000);
}

export function parseDate(input?: string): Date {
  if (!input) return new Date();
  // Accept YYYY-MM-DD; treat as UTC midnight.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!m) return new Date();
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  return new Date(Date.UTC(y, mo, da));
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function pick(module: ModuleId, idx: number): EditionItem {
  const arr = MODULE_ARRAYS[module];
  const item = arr[((idx % arr.length) + arr.length) % arr.length];
  const meta = MODULE_META[module];
  return { module, label: meta.label, name: meta.name, item };
}

/** Map a UTC weekday to its primary module (null = Sunday digest). */
function primaryModuleFor(weekday: number): ModuleId | null {
  switch (weekday) {
    case 0: // Sun
      return null;
    case 1: // Mon
      return 'm1';
    case 2: // Tue
    case 5: // Fri
      return 'm2';
    case 3: // Wed
    case 6: // Sat
      return 'm3';
    case 4: // Thu
      return 'm4';
    default:
      return null;
  }
}

/** A neighbouring module used as the companion item. */
function companionModuleFor(weekday: number): ModuleId {
  switch (weekday) {
    case 0:
      return 'm1';
    case 1:
      return 'm2';
    case 2:
      return 'm3';
    case 3:
      return 'm4';
    case 4:
      return 'm1';
    case 5:
      return 'm3';
    default:
      return 'm4';
  }
}

function renderItem(ei: EditionItem): string {
  const detail = ei.item.detail ? `\n\n${ei.item.detail}` : '';
  return `### ${ei.label} · ${ei.item.title}\n${ei.item.summary}${detail}`;
}

function composeText(date: string, weekday: number, primary: EditionItem | null, companion: EditionItem | null): string {
  const lines: string[] = [];
  lines.push(`# Ethics for AI — Daily Feed (${date})`);
  lines.push('');
  lines.push(`> Curriculum v${CURRICULUM_VERSION}. Deterministic edition. Generated for ${date}.`);
  lines.push('');

  if (weekday === 0) {
    // Sunday digest: every module, first item of each.
    lines.push(`## Sunday Digest — all four modules`);
    lines.push('');
    (['m1', 'm2', 'm3', 'm4'] as ModuleId[]).forEach((mod) => {
      lines.push(renderItem(pick(mod, 0)));
      lines.push('');
    });
  } else if (primary && companion) {
    lines.push(`## Today’s primary`);
    lines.push('');
    lines.push(renderItem(primary));
    lines.push('');
    lines.push(`## Companion (neighbouring module)`);
    lines.push('');
    lines.push(renderItem(companion));
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(`Reflect: what does today’s item require of you, and where would you apply it?`);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function sha256(text: string): string {
  return createHash('sha256').update(text + '|' + CURRICULUM_VERSION, 'utf8').digest('hex');
}

export function composeEdition(input?: string): Edition {
  const date = parseDate(input);
  const iso = toIsoDate(date);
  const weekday = date.getUTCDay();
  const dn = dayNumber(date);

  const primaryMod = primaryModuleFor(weekday);
  const primary = primaryMod ? pick(primaryMod, dn) : null;
  const companion = weekday === 0 ? null : pick(companionModuleFor(weekday), dn + 1);

  const text = composeText(iso, weekday, primary, companion);
  return {
    date: iso,
    weekday,
    isDigest: weekday === 0,
    primary,
    companion,
    hash: sha256(text),
    text,
  };
}

/** The Sunday digest for the week containing `input` (the Sunday on/before it). */
export function digestForWeek(input?: string): Edition {
  const date = parseDate(input);
  const dow = date.getUTCDay();
  const sunday = new Date(date.getTime() - dow * 86_400_000);
  return composeEdition(toIsoDate(sunday));
}

export interface EditionIndexEntry {
  date: string;
  weekday: number;
  isDigest: boolean;
  primaryModule: ModuleId | null;
  primaryId: string | null;
  hash: string;
}

export function listEditions(days: number, fromInput?: string): EditionIndexEntry[] {
  const from = parseDate(fromInput);
  const out: EditionIndexEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(from.getTime() - i * 86_400_000);
    const e = composeEdition(toIsoDate(d));
    out.push({
      date: e.date,
      weekday: e.weekday,
      isDigest: e.isDigest,
      primaryModule: e.primary?.module ?? null,
      primaryId: e.primary?.item.id ?? null,
      hash: e.hash,
    });
  }
  return out;
}

export function editionsSince(sinceInput: string, days: number): Edition[] {
  const since = parseDate(sinceInput);
  const out: Edition[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000);
    out.push(composeEdition(toIsoDate(d)));
  }
  return out;
}
