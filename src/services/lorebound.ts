/**
 * Mock asynchronous service layer.
 *
 * Every page reads through these functions, never from the data modules
 * directly. Swapping this file for real `fetch` calls against the Express
 * API is the only change the UI should need.
 */
import { currentUser, projects } from "@/data/worlds";
import { evidence, evidenceById } from "@/data/evidence";
import { terraCharacters, terraEntities, terraIdentities } from "@/data/terra-characters";
import { terraChapters } from "@/data/terra-chapters";
import { terraRelationships } from "@/data/terra-relationships";
import { terraEvents, terraThreads } from "@/data/terra-timeline";
import {
  knowledgeCharacterIds,
  terraFacts,
  terraKnowledge,
  terraSecrets,
} from "@/data/terra-knowledge";
import { terraLocations, terraLore } from "@/data/terra-places";
import { terraFindings, terraNotes } from "@/data/terra-continuity";
import type {
  AnalysisStage,
  AnswerResult,
  Chapter,
  Character,
  CharacterIdentity,
  ContinuityFinding,
  Entity,
  EvidenceReference,
  KnowledgeState,
  Location,
  LoreEntry,
  Note,
  PlotThread,
  Project,
  Relationship,
  SearchResult,
  Secret,
  StoryFact,
  TimelineEvent,
  User,
} from "@/types/lorebound";

const LATENCY = 260;

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredCloneSafe(value)), ms));
}

function structuredCloneSafe<T>(value: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      /* fall through */
    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "not-found" | "read-only" | "unknown" = "unknown",
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/* ------------------------------------------------------------------ user */

export const authService = {
  async login(email: string, password: string): Promise<User> {
    await delay(null, 500);
    if (!email.includes("@") || password.length < 4) {
      throw new ServiceError("That email and password combination wasn't recognised.");
    }
    return structuredCloneSafe(currentUser);
  },
  async signup(name: string, email: string): Promise<User> {
    await delay(null, 600);
    return { ...currentUser, name: name || currentUser.name, email };
  },
  async requestPasswordReset(email: string): Promise<{ sentTo: string }> {
    await delay(null, 550);
    if (!email.includes("@")) throw new ServiceError("Enter a valid email address.");
    return { sentTo: email };
  },
  async me(): Promise<User> {
    return delay(currentUser, 120);
  },
};

/* --------------------------------------------------------------- worlds */

export const worldService = {
  async list(): Promise<Project[]> {
    return delay(projects);
  },
  async get(slug: string): Promise<Project> {
    const found = projects.find((p) => p.slug === slug);
    if (!found) throw new ServiceError(`No world named "${slug}".`, "not-found");
    return delay(found);
  },
  async create(draft: Partial<Project>): Promise<Project> {
    await delay(null, 700);
    return {
      ...projects[0]!,
      id: `prj-${Date.now()}`,
      slug: "new-world",
      title: draft.title ?? "Untitled World",
      genre: draft.genre ?? "Unspecified",
      description: draft.description ?? "",
      chapterCount: 1,
      wordCount: 0,
      characterCount: 0,
      unresolvedThreadCount: 0,
      lastOpenedLabel: "Created just now",
    };
  },
};

/* ------------------------------------------------------------ chapters */

export const chapterService = {
  async list(): Promise<Chapter[]> {
    return delay(terraChapters);
  },
  async get(id: string): Promise<Chapter> {
    const found = terraChapters.find((c) => c.id === id || String(c.number) === id);
    if (!found) throw new ServiceError("Chapter not found.", "not-found");
    return delay(found);
  },
};

export const analysisStages: { stage: AnalysisStage; label: string }[] = [
  { stage: "uploading", label: "Uploading" },
  { stage: "reading", label: "Reading chapter" },
  { stage: "identifying", label: "Identifying entities" },
  { stage: "connecting", label: "Connecting story facts" },
  { stage: "checking", label: "Checking continuity" },
  { stage: "ready", label: "Review ready" },
];

/* ---------------------------------------------------------- characters */

export const characterService = {
  async list(): Promise<Character[]> {
    return delay(terraCharacters);
  },
  async get(idOrSlug: string): Promise<Character> {
    const key = idOrSlug.toLowerCase();
    const found = terraCharacters.find(
      (c) => c.id === key || c.id === `ch-${key}` || c.shortName.toLowerCase() === key,
    );
    if (!found) throw new ServiceError("Character not found.", "not-found");
    return delay(found);
  },
  async identities(): Promise<CharacterIdentity[]> {
    return delay(terraIdentities);
  },
  async entities(): Promise<Entity[]> {
    return delay(terraEntities);
  },
};

/* -------------------------------------------------------- relationships */

export const relationshipService = {
  async list(): Promise<Relationship[]> {
    return delay(terraRelationships);
  },
  async get(id: string): Promise<Relationship> {
    const found = terraRelationships.find((r) => r.id === id);
    if (!found) throw new ServiceError("Relationship not found.", "not-found");
    return delay(found);
  },
};

/* -------------------------------------------------------------- world */

export const timelineService = {
  async events(): Promise<TimelineEvent[]> {
    return delay(terraEvents);
  },
  async threads(): Promise<PlotThread[]> {
    return delay(terraThreads);
  },
};

export const placeService = {
  async list(): Promise<Location[]> {
    return delay(terraLocations);
  },
};

export const loreService = {
  async list(): Promise<LoreEntry[]> {
    return delay(terraLore);
  },
};

export const secretService = {
  async list(): Promise<Secret[]> {
    return delay(terraSecrets);
  },
};

export const knowledgeService = {
  async facts(): Promise<StoryFact[]> {
    return delay(terraFacts);
  },
  async states(): Promise<KnowledgeState[]> {
    return delay(terraKnowledge);
  },
  async columns(): Promise<string[]> {
    return delay(knowledgeCharacterIds);
  },
};

export const continuityService = {
  async list(): Promise<ContinuityFinding[]> {
    return delay(terraFindings);
  },
  async review(id: string, decision: string): Promise<ContinuityFinding> {
    await delay(null, 420);
    const found = terraFindings.find((f) => f.id === id);
    if (!found) throw new ServiceError("Finding not found.", "not-found");
    return structuredCloneSafe(found);
  },
};

export const noteService = {
  async list(): Promise<Note[]> {
    return delay(terraNotes);
  },
};

export const evidenceService = {
  async list(): Promise<EvidenceReference[]> {
    return delay(evidence);
  },
  get(id: string | undefined): EvidenceReference | undefined {
    return id ? evidenceById[id] : undefined;
  },
};

/* ------------------------------------------------------------- search */

const staticIndex: SearchResult[] = [
  ...terraCharacters.map((c) => ({
    id: c.id,
    kind: "character" as const,
    title: c.name,
    subtitle: c.role,
    to: `characters/${c.id.replace("ch-", "")}`,
  })),
  ...terraIdentities.map((i) => ({
    id: i.id,
    kind: "identity" as const,
    title: i.name,
    subtitle: `Identity of ${terraCharacters.find((c) => c.id === i.ownerCharacterId)?.name ?? ""}`,
    to: `characters/${i.ownerCharacterId.replace("ch-", "")}`,
  })),
  ...terraChapters.map((c) => ({
    id: c.id,
    kind: "chapter" as const,
    title: `Chapter ${c.number} — ${c.title}`,
    subtitle: c.summary,
    to: "manuscript",
  })),
  ...terraEvents.map((e) => ({
    id: e.id,
    kind: "event" as const,
    title: e.title,
    subtitle: `Chapter ${e.chapter}`,
    to: "timeline",
  })),
  ...terraLocations.map((l) => ({
    id: l.id,
    kind: "location" as const,
    title: l.name,
    subtitle: l.kind,
    to: "places",
  })),
  ...terraLore.map((l) => ({
    id: l.id,
    kind: "lore" as const,
    title: l.title,
    subtitle: l.summary,
    to: "lore",
  })),
  ...terraRelationships.map((r) => ({
    id: r.id,
    kind: "relationship" as const,
    title: r.label,
    subtitle: r.currentSummary,
    to: "relationships",
  })),
  ...terraSecrets.map((s) => ({
    id: s.id,
    kind: "secret" as const,
    title: s.title,
    subtitle: s.detail,
    to: "secrets",
  })),
  ...terraFacts.map((f) => ({
    id: f.id,
    kind: "fact" as const,
    title: f.statement,
    subtitle: `True from Chapter ${f.becameTrueInChapter}`,
    to: "knowledge",
  })),
  ...terraFindings.map((f) => ({
    id: f.id,
    kind: "finding" as const,
    title: f.title,
    subtitle: f.explanation,
    to: "continuity",
  })),
];

export const searchService = {
  async query(term: string): Promise<SearchResult[]> {
    await delay(null, 160);
    const t = term.trim().toLowerCase();
    if (!t) return staticIndex.slice(0, 8);
    return staticIndex
      .filter((r) => `${r.title} ${r.subtitle}`.toLowerCase().includes(t))
      .slice(0, 24);
  },

  /** Structured answer for question-shaped queries, e.g. "Who knows Mira is Omir?" */
  async answer(term: string): Promise<AnswerResult | null> {
    await delay(null, 200);
    const t = term.toLowerCase();
    const isQuestion = t.includes("who know") || t.includes("knows");
    const factMatch = terraFacts.find((f) =>
      t.includes((f.statement.toLowerCase().split(" ")[0] ?? "")) &&
      f.statement
        .toLowerCase()
        .split(" ")
        .some((w) => w.length > 3 && t.includes(w)),
    );
    if (!isQuestion || !factMatch) return null;

    const rows = terraKnowledge
      .filter((k) => k.factId === factMatch.id && k.state !== "does-not-know")
      .map((k) => {
        const char = terraCharacters.find((c) => c.id === k.characterId);
        return {
          label: char?.name ?? k.characterId,
          value:
            k.state === "knows"
              ? `Knows since Chapter ${k.sinceChapter}`
              : k.state === "suspects"
                ? `Suspects since Chapter ${k.sinceChapter}`
                : k.state === "believes-incorrectly"
                  ? "Believes something else"
                  : "No recorded state",
          state: k.state,
        };
      });

    return {
      question: term,
      answer: `${rows.filter((r) => r.state === "knows").length} characters know, ${rows.filter((r) => r.state === "suspects").length} suspect, as of Chapter 24.`,
      rows,
      evidence: factMatch.evidenceIds
        .map((id) => evidenceById[id])
        .filter(Boolean) as EvidenceReference[],
    };
  },
};
