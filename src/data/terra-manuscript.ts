import { terraChapters } from "./terra-chapters";
import type { Chapter, ID } from "@/types/lorebound";

/**
 * Writing Studio structure for The Isles of Terra: parts, scenes and the
 * per-scene "story memory" the right panel reads. Mock data only.
 */

export interface StudioScene {
  id: ID;
  chapterId: ID;
  chapterNumber: number;
  number: number;
  title: string;
  summary: string;
  /** Paragraphs of prose, stored as plain text. */
  body: string[];
  memory: SceneMemory;
}

export interface SceneMemory {
  characterIds: ID[];
  location: string;
  secrets: string[];
  lore: string[];
  knowledge: string[];
  threads: string[];
  concerns: string[];
}

export interface StudioPart {
  id: ID;
  title: string;
  subtitle: string;
  chapterNumbers: number[];
}

export const terraParts: StudioPart[] = [
  {
    id: "part-2",
    title: "Part Two — Borrowed Faces",
    subtitle: "Chapters 18–21",
    chapterNumbers: [18, 19, 20, 21],
  },
  {
    id: "part-3",
    title: "Part Three — The Vow-Breaker",
    subtitle: "Chapters 22–24",
    chapterNumbers: [22, 23, 24],
  },
];

const memoryByChapter: Record<number, SceneMemory> = {
  18: {
    characterIds: ["ch-omir"],
    location: "The Academy court",
    secrets: ["Omir carries the hidden Igwe bloodline"],
    lore: ["Earth magic", "Vow-breaking"],
    knowledge: ["Omir suspects something is wrong beneath the flagstones"],
    threads: ["The vow-breaker investigation begins"],
    concerns: [],
  },
  19: {
    characterIds: ["ch-omir", "ch-lynx", "ch-delegate"],
    location: "Harbour Quarter",
    secrets: ["Lynx is a griffin"],
    lore: ["Familiars"],
    knowledge: ["Omir suspects the delegate's purpose"],
    threads: ["Why does the Mokshan delegate visit the tavern?"],
    concerns: ["Lynx refuses the harbour quarter here but appears there in Chapter 23"],
  },
  20: {
    characterIds: ["ch-omir", "ch-aria"],
    location: "Omir's rooms, the Academy",
    secrets: ["Mira is Omir"],
    lore: ["Igwe bloodline"],
    knowledge: ["Aria knows the Mira identity exists"],
    threads: ["Who knows Mira's identity?"],
    concerns: ["'Practiced smile' implies the identity predates this scene"],
  },
  21: {
    characterIds: ["ch-omir", "ch-bram", "ch-arthur", "ch-aria"],
    location: "The Low Lantern",
    secrets: ["Mira is Omir", "Omir has feelings for Arthur"],
    lore: ["House recognition"],
    knowledge: ["Aria suspects Omir's regard for Arthur"],
    threads: ["Arthur has entered the political negotiations"],
    concerns: [],
  },
  22: {
    characterIds: ["ch-omir", "ch-arthur", "ch-ethan", "ch-delegate"],
    location: "The Low Lantern",
    secrets: ["Omir is investigating the Mokshan delegate"],
    lore: ["Vow-breaking", "House recognition"],
    knowledge: ["Ethan does not recognise Mira in this scene"],
    threads: ["Why does the Mokshan delegate visit the tavern?"],
    concerns: ["Ethan's later recognition has no recorded learning event"],
  },
  23: {
    characterIds: ["ch-omir", "ch-lynx", "ch-delegate"],
    location: "The Low Lantern",
    secrets: ["Lynx is a griffin", "Mira is Omir"],
    lore: ["Familiars", "Vow-breaking"],
    knowledge: ["Omir now knows the delegation keeps a second ledger"],
    threads: ["The ledger page is taken and never mentioned again"],
    concerns: ["Ledger page never reappears", "Bruised forearm unacknowledged afterwards"],
  },
  24: {
    characterIds: ["ch-omir", "ch-ethan", "ch-delegate"],
    location: "The Low Lantern, then the harbour street",
    secrets: ["Mira is Omir", "Omir is investigating the Mokshan delegate"],
    lore: ["Vow-breaking", "Earth magic"],
    knowledge: ["Ethan knows Mira is Omir", "Omir knows the delegate's purpose"],
    threads: ["Will Omir reveal what he sensed?", "Can the vow-breaker detect Igwe magic?"],
    concerns: [
      "Offensive earth spell conflicts with an approved world rule",
      "Ethan's knowledge is asserted without a learning event",
    ],
  },
};

const sceneTitles: Record<number, string[]> = {
  18: ["The delegation crosses the court", "A palm to the ground"],
  19: ["Three streets behind", "The lane to the Lantern"],
  20: ["The mirror", "She needs a surname"],
  21: ["An apron that smells of cider", "Four names and a suspicion"],
  22: ["Rain on the delegation's seal", "Twice, pause, twice"],
  23: ["The ledger, memorised backwards", "Feathers on the wall"],
  24: ["A vow settles into the ground", "Ethan says the wrong name", "The flagstones rise"],
};

function scenesForChapter(chapter: Chapter): StudioScene[] {
  const titles = sceneTitles[chapter.number] ?? ["Scene one", "Scene two"];
  const per = Math.max(1, Math.ceil(chapter.body.length / titles.length));
  const memory = memoryByChapter[chapter.number]!;
  return titles.map((title, i) => {
    const body = chapter.body.slice(i * per, (i + 1) * per);
    return {
      id: `${chapter.id}-s${i + 1}`,
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      number: i + 1,
      title,
      summary: chapter.summary,
      body: body.length ? body : [""],
      memory,
    };
  });
}

export const terraScenes: StudioScene[] = terraChapters.flatMap(scenesForChapter);

export interface ReviewSuggestion {
  id: ID;
  group: "facts" | "characters" | "knowledge" | "continuity";
  title: string;
  detail: string;
  /** Index of the paragraph in the chapter body that supports it. */
  paragraph: number;
  passage: string;
  confidence: number;
}

export const reviewGroups = [
  { key: "facts", label: "New facts" },
  { key: "characters", label: "Character changes" },
  { key: "knowledge", label: "Knowledge changes" },
  { key: "continuity", label: "Continuity findings" },
] as const;

export function reviewSuggestionsFor(chapter: Chapter): ReviewSuggestion[] {
  const n = Math.max(1, chapter.body.length);
  const p = (i: number) => Math.min(i, n - 1);
  const passage = (i: number) => chapter.body[p(i)] ?? "";
  return [
    {
      id: `${chapter.id}-f1`,
      group: "facts",
      title: "A broken vow settles into worked stone",
      detail: "World rule restated in the narration of this chapter.",
      paragraph: p(0),
      passage: passage(0),
      confidence: 0.88,
    },
    {
      id: `${chapter.id}-f2`,
      group: "facts",
      title: `Vow-breaker plot surfaces in Chapter ${chapter.number}`,
      detail: "Recorded as a timeline event with the harbour quarter as its location.",
      paragraph: p(1),
      passage: passage(1),
      confidence: 0.81,
    },
    {
      id: `${chapter.id}-c1`,
      group: "characters",
      title: "Omir — physical state updated",
      detail: "Shows strain after sustained stone working; left forearm still bruised.",
      paragraph: p(2),
      passage: passage(2),
      confidence: 0.64,
    },
    {
      id: `${chapter.id}-c2`,
      group: "characters",
      title: "Mira — identity still active",
      detail: "The identity remains in use at The Low Lantern at chapter's end.",
      paragraph: p(1),
      passage: passage(1),
      confidence: 0.79,
    },
    {
      id: `${chapter.id}-k1`,
      group: "knowledge",
      title: "Ethan: suspects → knows that Mira is Omir",
      detail: "He names Omir aloud; no earlier learning event is recorded.",
      paragraph: p(1),
      passage: passage(1),
      confidence: 0.72,
    },
    {
      id: `${chapter.id}-k2`,
      group: "knowledge",
      title: "Omir: suspects → knows the delegate's purpose",
      detail: "The signal pattern is confirmed rather than inferred.",
      paragraph: p(2),
      passage: passage(2),
      confidence: 0.69,
    },
    {
      id: `${chapter.id}-i1`,
      group: "continuity",
      title: "Possible magic-rule conflict",
      detail:
        "An offensive earth spell contradicts the approved rule that Omir avoids offensive magic.",
      paragraph: p(3),
      passage: passage(3),
      confidence: 0.84,
    },
    {
      id: `${chapter.id}-i2`,
      group: "continuity",
      title: "Injury unacknowledged",
      detail: "A two-handed working is performed without reference to the bruised forearm.",
      paragraph: p(3),
      passage: passage(3),
      confidence: 0.52,
    },
  ];
}
