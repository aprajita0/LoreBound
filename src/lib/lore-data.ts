import type {
  RelationshipCategory,
  RelationshipStatus,
} from "@/services/relationships";

export type RelationshipKind = RelationshipCategory;

export interface Character {
  id: string;
  name: string;
  role: string;
  portrait: string;
  x: number;
  y: number;
}

export type UiRelationshipStatus =
  | "Established"
  | "Strained"
  | "Hidden"
  | "Evolving";

export interface Relationship {
  id: string;
  source: string;
  target: string;
  kind: RelationshipKind;
  label: string;
  status: UiRelationshipStatus;
  since: string;
  summary: string;
  beats: string[];
}

export const KIND_ORDER: RelationshipKind[] = [
  "romantic",
  "family",
  "friendship",
  "alliance",
  "mentor",
  "rivalry",
  "enemy",
  "other",
];

export const KIND_META: Record<
  RelationshipKind,
  {
    label: string;
    color: string;
    dash?: string;
  }
> = {
  romantic: {
    label: "Romantic",
    color: "#c87591",
  },
  family: {
    label: "Family",
    color: "#caa55b",
  },
  friendship: {
    label: "Friendship",
    color: "#56aaa5",
  },
  alliance: {
    label: "Alliance",
    color: "#6198ca",
    dash: "7 5",
  },
  mentor: {
    label: "Mentor",
    color: "#9b7dcc",
    dash: "2 6",
  },
  rivalry: {
    label: "Rivalry",
    color: "#ce854e",
    dash: "8 5",
  },
  enemy: {
    label: "Enemy",
    color: "#c95f62",
    dash: "10 6",
  },
  other: {
    label: "Other",
    color: "#89919f",
    dash: "4 5",
  },
};

export const UI_TO_DATABASE_STATUS: Record<
  UiRelationshipStatus,
  RelationshipStatus
> = {
  Established: "active",
  Strained: "strained",
  Hidden: "unknown",
  Evolving: "past",
};

export const DATABASE_TO_UI_STATUS: Record<
  RelationshipStatus,
  UiRelationshipStatus
> = {
  active: "Established",
  strained: "Strained",
  broken: "Strained",
  past: "Evolving",
  unknown: "Hidden",
};