import { supabase } from "@/lib/supabase";

export type RelationshipCategory =
  | "romantic"
  | "family"
  | "friendship"
  | "alliance"
  | "mentor"
  | "rivalry"
  | "enemy"
  | "other";

export type RelationshipStatus =
  | "active"
  | "strained"
  | "broken"
  | "past"
  | "unknown";

export interface CharacterRelationship {
  id: string;
  worldId: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  category: RelationshipCategory;
  sourceLabel: string;
  targetLabel: string;
  description: string;
  status: RelationshipStatus;
  strength: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveRelationshipInput {
  worldId: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  category: RelationshipCategory;
  sourceLabel: string;
  targetLabel: string;
  description: string;
  status: RelationshipStatus;
  strength: number;
}

interface CharacterRelationshipRow {
  id: string;
  world_id: string;
  source_character_id: string;
  target_character_id: string;
  category: RelationshipCategory;
  source_label: string;
  target_label: string;
  description: string;
  status: RelationshipStatus;
  strength: number;
  created_at: string;
  updated_at: string;
}

function mapRelationship(
  row: CharacterRelationshipRow,
): CharacterRelationship {
  return {
    id: row.id,
    worldId: row.world_id,
    sourceCharacterId: row.source_character_id,
    targetCharacterId: row.target_character_id,
    category: row.category,
    sourceLabel: row.source_label,
    targetLabel: row.target_label,
    description: row.description,
    status: row.status,
    strength: row.strength,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeStrength(value: number): number {
  if (!Number.isFinite(value)) {
    return 3;
  }

  return Math.min(
    5,
    Math.max(1, Math.round(value)),
  );
}

function validateRelationship(
  input: SaveRelationshipInput,
): void {
  if (!input.worldId) {
    throw new Error(
      "This relationship needs a world.",
    );
  }

  if (!input.sourceCharacterId) {
    throw new Error(
      "Choose the first character.",
    );
  }

  if (!input.targetCharacterId) {
    throw new Error(
      "Choose the second character.",
    );
  }

  if (
    input.sourceCharacterId ===
    input.targetCharacterId
  ) {
    throw new Error(
      "A character cannot have a relationship with themselves.",
    );
  }
}

export async function listRelationships(
  worldId: string,
): Promise<CharacterRelationship[]> {
  const { data, error } = await supabase
    .from("character_relationships")
    .select(
      `
        id,
        world_id,
        source_character_id,
        target_character_id,
        category,
        source_label,
        target_label,
        description,
        status,
        strength,
        created_at,
        updated_at
      `,
    )
    .eq("world_id", worldId)
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data ?? []) as CharacterRelationshipRow[]
  ).map(mapRelationship);
}

export async function createRelationship(
  input: SaveRelationshipInput,
): Promise<CharacterRelationship> {
  validateRelationship(input);

  const { data, error } = await supabase
    .from("character_relationships")
    .insert({
      world_id: input.worldId,
      source_character_id:
        input.sourceCharacterId,
      target_character_id:
        input.targetCharacterId,
      category: input.category,
      source_label:
        input.sourceLabel.trim(),
      target_label:
        input.targetLabel.trim(),
      description:
        input.description.trim(),
      status: input.status,
      strength: normalizeStrength(
        input.strength,
      ),
    })
    .select(
      `
        id,
        world_id,
        source_character_id,
        target_character_id,
        category,
        source_label,
        target_label,
        description,
        status,
        strength,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRelationship(
    data as CharacterRelationshipRow,
  );
}

export async function updateRelationship(
  relationshipId: string,
  input: SaveRelationshipInput,
): Promise<CharacterRelationship> {
  validateRelationship(input);

  const { data, error } = await supabase
    .from("character_relationships")
    .update({
      source_character_id:
        input.sourceCharacterId,
      target_character_id:
        input.targetCharacterId,
      category: input.category,
      source_label:
        input.sourceLabel.trim(),
      target_label:
        input.targetLabel.trim(),
      description:
        input.description.trim(),
      status: input.status,
      strength: normalizeStrength(
        input.strength,
      ),
    })
    .eq("id", relationshipId)
    .eq("world_id", input.worldId)
    .select(
      `
        id,
        world_id,
        source_character_id,
        target_character_id,
        category,
        source_label,
        target_label,
        description,
        status,
        strength,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRelationship(
    data as CharacterRelationshipRow,
  );
}

export async function deleteRelationship(
  relationshipId: string,
  worldId: string,
): Promise<void> {
  const { error } = await supabase
    .from("character_relationships")
    .delete()
    .eq("id", relationshipId)
    .eq("world_id", worldId);

  if (error) {
    throw new Error(error.message);
  }
}

export function getRelationshipCategoryLabel(
  category: RelationshipCategory,
): string {
  const labels: Record<
    RelationshipCategory,
    string
  > = {
    romantic: "Romantic",
    family: "Family",
    friendship: "Friendship",
    alliance: "Alliance",
    mentor: "Mentor",
    rivalry: "Rivalry",
    enemy: "Enemy",
    other: "Other",
  };

  return labels[category];
}

export function getRelationshipStatusLabel(
  status: RelationshipStatus,
): string {
  const labels: Record<
    RelationshipStatus,
    string
  > = {
    active: "Active",
    strained: "Strained",
    broken: "Broken",
    past: "Past",
    unknown: "Unknown",
  };

  return labels[status];
}