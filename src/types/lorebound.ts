/**
 * Lorebound domain model.
 *
 * These interfaces describe the shape of data a future Node/Express +
 * PostgreSQL + AI-processing backend will return. Nothing here imports
 * React — pages consume this only through the service layer.
 */

export type ID = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  initials: string;
  penName?: string;
  joinedAt: string;
}

export type AccessMode = "authenticated" | "demo" | "public";

export type WorldPalette = "terra" | "glass" | "cartographer";

export interface Project {
  id: ID;
  slug: string;
  title: string;
  genre: string;
  palette: WorldPalette;
  description: string;
  coverUrl: string;
  chapterCount: number;
  wordCount: number;
  characterCount: number;
  unresolvedThreadCount: number;
  lastOpenedLabel: string;
  pointOfView: string;
  tense: string;
  createdAt: string;
}

export type ChapterStatus =
  | "draft"
  | "ready-for-analysis"
  | "processing"
  | "reviewed"
  | "needs-attention";

export interface Chapter {
  id: ID;
  projectId: ID;
  number: number;
  title: string;
  status: ChapterStatus;
  wordCount: number;
  lastEditedLabel: string;
  summary: string;
  body: string[];
}

export interface CharacterIdentity {
  id: ID;
  name: string;
  ownerCharacterId: ID;
  kind: "alias" | "disguise" | "true-name" | "public-persona";
  description: string;
  createdInChapter: number;
  knownBy: ID[];
  suspectedBy: ID[];
  relatedFindingIds: ID[];
}

export type CharacterImportance = "major" | "supporting" | "minor";

export interface Character {
  id: ID;
  projectId: ID;
  name: string;
  shortName: string;
  role: string;
  importance: CharacterImportance;
  age?: number;
  status: "active" | "absent" | "deceased" | "unknown";
  factionId?: ID;
  locationId?: ID;
  portraitUrl?: string;
  accent: "gold" | "forest" | "plum" | "wine" | "mist" | "ember" | "rose";
  biography: string[];
  emotionalState: string;
  physicalState: string;
  traits: string[];
  abilities: { name: string; detail: string }[];
  limitations: string[];
  possessions: { name: string; detail: string }[];
  identityIds: ID[];
  knownSecretIds: ID[];
  secretsKeptFromThemIds: ID[];
  appearsInChapters: number[];
  recentlyChanged?: boolean;
  hasOpenFindings?: boolean;
  evidenceIds: ID[];
}

export type EntityKind = "faction" | "object" | "ability" | "creature" | "organisation";

export interface Entity {
  id: ID;
  projectId: ID;
  kind: EntityKind;
  name: string;
  description: string;
  relatedCharacterIds: ID[];
  chapters: number[];
}

export interface Location {
  id: ID;
  projectId: ID;
  name: string;
  kind: string;
  description: string;
  chapters: number[];
  presentCharacterIds: ID[];
  eventIds: ID[];
  secretIds: ID[];
  travelLinks: { toLocationId: ID; detail: string }[];
  evidenceIds: ID[];
}

export interface LoreEntry {
  id: ID;
  projectId: ID;
  title: string;
  category: "bloodline" | "place" | "bond" | "creature" | "law" | "custom" | "magic";
  summary: string;
  body: string[];
  relatedCharacterIds: ID[];
  evidenceIds: ID[];
}

export interface EvidenceReference {
  id: ID;
  chapter: number;
  chapterTitle: string;
  passage: string;
  locationInChapter: string;
}

export interface StoryFact {
  id: ID;
  projectId: ID;
  statement: string;
  category: "identity" | "creature" | "bloodline" | "action" | "relationship" | "feeling";
  becameTrueInChapter: number;
  evidenceIds: ID[];
}

export type RelationshipType =
  | "soulbond"
  | "found-family"
  | "family"
  | "romantic-interest"
  | "friendship"
  | "alliance"
  | "political-tension"
  | "familiar-bond"
  | "suspicion"
  | "secrecy"
  | "mentorship";

export type RelationshipDirection = "mutual" | "one-sided" | "unknown" | "complicated";
export type RelationshipVisibility = "public" | "private" | "secret";

export interface RelationshipParticipant {
  characterId: ID;
  stance: string;
  believes: string;
}

export interface RelationshipChange {
  chapter: number;
  summary: string;
  kind: "formed" | "deepened" | "strained" | "revealed" | "concealed";
}

export interface Relationship {
  id: ID;
  projectId: ID;
  label: string;
  participants: RelationshipParticipant[];
  types: RelationshipType[];
  direction: RelationshipDirection;
  visibility: RelationshipVisibility;
  group:
    | "closest"
    | "family"
    | "affection"
    | "friends"
    | "political"
    | "tension"
    | "familiar";
  currentSummary: string;
  publicPerception: string;
  privateTruth: string;
  sharedSecretIds: ID[];
  beganInChapter: number;
  lastChangedInChapter: number;
  arc: RelationshipChange[];
  keyEventIds: ID[];
  evidenceIds: ID[];
  openQuestions: string[];
  findingIds: ID[];
  recentlyChanged?: boolean;
}

export interface TimelineEvent {
  id: ID;
  projectId: ID;
  chapter: number;
  title: string;
  description: string;
  consequence: string;
  locationId: ID;
  participantIds: ID[];
  threadIds: ID[];
  type: "discovery" | "deception" | "movement" | "conflict" | "bond" | "political";
  verification: "confirmed" | "inferred" | "unverified";
  evidenceIds: ID[];
}

export interface Secret {
  id: ID;
  projectId: ID;
  title: string;
  detail: string;
  severity: "world-shaking" | "dangerous" | "personal";
  knownByIds: ID[];
  suspectedByIds: ID[];
  believesFalselyIds: ID[];
  mustNotKnowIds: ID[];
  createdInChapter: number;
  revealedInChapter?: number;
  evidenceIds: ID[];
  findingIds: ID[];
}

export type KnowledgeStateValue =
  | "knows"
  | "suspects"
  | "believes-incorrectly"
  | "does-not-know"
  | "unknown";

export interface KnowledgeState {
  factId: ID;
  characterId: ID;
  state: KnowledgeStateValue;
  sinceChapter: number;
  confidence: number;
  learningEvent?: string;
  evidenceId?: ID;
}

export type FindingCategory =
  | "character-knowledge"
  | "timeline"
  | "location"
  | "relationship"
  | "inventory"
  | "physical-state"
  | "world-rule";

export interface FindingDecision {
  id: ID;
  label: string;
  at: string;
  by: string;
}

export interface ContinuityFinding {
  id: ID;
  projectId: ID;
  title: string;
  category: FindingCategory;
  severity: "high" | "medium" | "low";
  confidence: number;
  explanation: string;
  currentEvidenceId: ID;
  earlierEvidenceId?: ID;
  relatedCharacterIds: ID[];
  chapters: number[];
  suggestedInterpretation: string;
  status: "unreviewed" | "confirmed" | "intentional" | "foreshadowing" | "explained-later" | "dismissed" | "resolved";
  decisions: FindingDecision[];
}

export interface PlotThread {
  id: ID;
  projectId: ID;
  title: string;
  status: "open" | "turning" | "resolved";
  summary: string;
  chapters: number[];
  characterIds: ID[];
}

export interface Note {
  id: ID;
  projectId: ID;
  title: string;
  body: string;
  kind: "loose" | "research" | "scene-idea" | "character";
  pinned: boolean;
  updatedLabel: string;
  links: { kind: "character" | "chapter" | "secret" | "event"; id: ID; label: string }[];
}

export type AnalysisStage =
  | "uploading"
  | "reading"
  | "identifying"
  | "connecting"
  | "checking"
  | "ready";

export interface AnalysisJob {
  id: ID;
  chapterId: ID;
  stage: AnalysisStage;
  progress: number;
  startedAt: string;
}

export interface SearchResult {
  id: ID;
  kind:
    | "character"
    | "identity"
    | "chapter"
    | "event"
    | "location"
    | "lore"
    | "relationship"
    | "secret"
    | "fact"
    | "finding";
  title: string;
  subtitle: string;
  to: string;
}

export interface AnswerResult {
  question: string;
  answer: string;
  rows: { label: string; value: string; state?: KnowledgeStateValue }[];
  evidence: EvidenceReference[];
}
