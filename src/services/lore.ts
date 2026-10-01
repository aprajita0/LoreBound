import { supabase } from "@/lib/supabase";

export type LoreCategory =
  | "magic"
  | "culture"
  | "religion"
  | "faction"
  | "species"
  | "bloodline"
  | "artifact"
  | "language"
  | "tradition"
  | "law"
  | "history"
  | "creature"
  | "technology"
  | "cosmology"
  | "other";

export type LoreStatus =
  | "draft"
  | "canonical"
  | "retired";

export type LoreDocument =
  Record<string, unknown>;

export interface LoreEntry {
  id: string;
  worldId: string;
  parentEntryId: string | null;

  title: string;
  category: LoreCategory;
  status: LoreStatus;

  summary: string;
  contentJson: LoreDocument;
  plainText: string;

  imagePath: string | null;
  tags: string[];

  isFeatured: boolean;
  sortOrder: number;

  characterIds: string[];
  placeIds: string[];
  relatedEntryIds: string[];

  createdAt: string;
  updatedAt: string;
}

export interface SaveLoreEntryInput {
  worldId: string;
  parentEntryId?: string | null;

  title: string;
  category: LoreCategory;
  status: LoreStatus;

  summary?: string;
  contentJson?: LoreDocument;
  plainText?: string;

  imagePath?: string | null;
  tags?: string[];

  isFeatured?: boolean;
  sortOrder?: number;

  characterIds?: string[];
  placeIds?: string[];
  relatedEntryIds?: string[];
}

interface LoreEntryRow {
  id: string;
  world_id: string;
  parent_entry_id: string | null;

  title: string;
  category: LoreCategory;
  status: LoreStatus;

  summary: string | null;
  content_json: LoreDocument | null;
  plain_text: string | null;

  image_path: string | null;
  tags: string[] | null;

  is_featured: boolean;
  sort_order: number;

  created_at: string;
  updated_at: string;
}

interface CharacterLinkRow {
  character_id: string;
}

interface PlaceLinkRow {
  place_id: string;
}

interface RelatedEntryLinkRow {
  target_entry_id: string;
}

const LORE_IMAGE_BUCKET = "lore-images";

const EMPTY_DOCUMENT: LoreDocument = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

function mapLoreEntry(
  row: LoreEntryRow,
): LoreEntry {
  return {
    id: row.id,
    worldId: row.world_id,
    parentEntryId: row.parent_entry_id,

    title: row.title,
    category: row.category,
    status: row.status,

    summary: row.summary ?? "",
    contentJson:
      row.content_json ?? EMPTY_DOCUMENT,
    plainText: row.plain_text ?? "",

    imagePath: row.image_path,
    tags: row.tags ?? [],

    isFeatured: row.is_featured,
    sortOrder: row.sort_order,

    characterIds: [],
    placeIds: [],
    relatedEntryIds: [],

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeIds(
  ids?: string[],
): string[] {
  return Array.from(
    new Set(
      (ids ?? [])
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

function toLoreEntryRow(
  input: SaveLoreEntryInput,
) {
  return {
    world_id: input.worldId,
    parent_entry_id:
      input.parentEntryId ?? null,

    title: input.title.trim(),
    category: input.category,
    status: input.status,

    summary: input.summary?.trim() ?? "",
    content_json:
      input.contentJson ?? EMPTY_DOCUMENT,
    plain_text:
      input.plainText?.trim() ?? "",

    image_path:
      input.imagePath?.trim() || null,

    tags:
      input.tags
        ?.map((tag) => tag.trim())
        .filter(Boolean) ?? [],

    is_featured:
      input.isFeatured ?? false,
    sort_order: input.sortOrder ?? 0,

    updated_at: new Date().toISOString(),
  };
}

async function replaceLoreRelations(
  loreEntryId: string,
  input: SaveLoreEntryInput,
): Promise<void> {
  const characterIds = normalizeIds(
    input.characterIds,
  );

  const placeIds = normalizeIds(
    input.placeIds,
  );

  const relatedEntryIds = normalizeIds(
    input.relatedEntryIds,
  ).filter((id) => id !== loreEntryId);

  const deleteResults = await Promise.all([
    supabase
      .from("lore_entry_characters")
      .delete()
      .eq("lore_entry_id", loreEntryId),

    supabase
      .from("lore_entry_places")
      .delete()
      .eq("lore_entry_id", loreEntryId),

    supabase
      .from("lore_entry_links")
      .delete()
      .eq("source_entry_id", loreEntryId),
  ]);

  for (const result of deleteResults) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  if (characterIds.length > 0) {
    const { error } = await supabase
      .from("lore_entry_characters")
      .insert(
        characterIds.map((characterId) => ({
          lore_entry_id: loreEntryId,
          character_id: characterId,
          relationship: "related",
        })),
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  if (placeIds.length > 0) {
    const { error } = await supabase
      .from("lore_entry_places")
      .insert(
        placeIds.map((placeId) => ({
          lore_entry_id: loreEntryId,
          place_id: placeId,
          relationship: "related",
        })),
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  if (relatedEntryIds.length > 0) {
    const { error } = await supabase
      .from("lore_entry_links")
      .insert(
        relatedEntryIds.map(
          (targetEntryId) => ({
            source_entry_id: loreEntryId,
            target_entry_id: targetEntryId,
            relationship: "related",
          }),
        ),
      );

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function uploadLoreImage(
  worldId: string,
  file: File,
): Promise<string> {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Choose a JPEG, PNG, or WebP image.",
    );
  }

  const maximumSize = 5 * 1024 * 1024;

  if (file.size > maximumSize) {
    throw new Error(
      "The image must be smaller than 5 MB.",
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "You must be signed in to upload an image.",
    );
  }

  const extensionByType: Record<
    string,
    string
  > = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const extension =
    extensionByType[file.type];

  const filename =
    `${crypto.randomUUID()}.${extension}`;

  const storagePath =
    `${user.id}/${worldId}/${filename}`;

  const { error: uploadError } =
    await supabase.storage
      .from(LORE_IMAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from(LORE_IMAGE_BUCKET)
    .getPublicUrl(storagePath);

  if (!data.publicUrl) {
    throw new Error(
      "The image uploaded, but its URL could not be created.",
    );
  }

  return data.publicUrl;
}

export async function listLoreEntries(
  worldId: string,
): Promise<LoreEntry[]> {
  const { data, error } = await supabase
    .from("lore_entries")
    .select("*")
    .eq("world_id", worldId)
    .order("is_featured", {
      ascending: false,
    })
    .order("sort_order", {
      ascending: true,
    })
    .order("title", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data ?? []) as LoreEntryRow[]
  ).map(mapLoreEntry);
}

export async function getLoreEntry(
  worldId: string,
  loreEntryId: string,
): Promise<LoreEntry> {
  const { data, error } = await supabase
    .from("lore_entries")
    .select("*")
    .eq("world_id", worldId)
    .eq("id", loreEntryId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const entry = mapLoreEntry(
    data as LoreEntryRow,
  );

  const [
    characterResult,
    placeResult,
    relatedEntryResult,
  ] = await Promise.all([
    supabase
      .from("lore_entry_characters")
      .select("character_id")
      .eq("lore_entry_id", loreEntryId),

    supabase
      .from("lore_entry_places")
      .select("place_id")
      .eq("lore_entry_id", loreEntryId),

    supabase
      .from("lore_entry_links")
      .select("target_entry_id")
      .eq("source_entry_id", loreEntryId),
  ]);

  if (characterResult.error) {
    throw new Error(
      characterResult.error.message,
    );
  }

  if (placeResult.error) {
    throw new Error(
      placeResult.error.message,
    );
  }

  if (relatedEntryResult.error) {
    throw new Error(
      relatedEntryResult.error.message,
    );
  }

  entry.characterIds = (
    (characterResult.data ??
      []) as CharacterLinkRow[]
  ).map((link) => link.character_id);

  entry.placeIds = (
    (placeResult.data ??
      []) as PlaceLinkRow[]
  ).map((link) => link.place_id);

  entry.relatedEntryIds = (
    (relatedEntryResult.data ??
      []) as RelatedEntryLinkRow[]
  ).map((link) => link.target_entry_id);

  return entry;
}

export async function createLoreEntry(
  input: SaveLoreEntryInput,
): Promise<LoreEntry> {
  if (!input.title.trim()) {
    throw new Error(
      "A title is required for this lore entry.",
    );
  }

  const { data, error } = await supabase
    .from("lore_entries")
    .insert(toLoreEntryRow(input))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const entry = mapLoreEntry(
    data as LoreEntryRow,
  );

  try {
    await replaceLoreRelations(
      entry.id,
      input,
    );
  } catch (relationError) {
    await supabase
      .from("lore_entries")
      .delete()
      .eq("id", entry.id)
      .eq("world_id", input.worldId);

    throw relationError;
  }

  return getLoreEntry(
    input.worldId,
    entry.id,
  );
}

export async function updateLoreEntry(
  loreEntryId: string,
  input: SaveLoreEntryInput,
): Promise<LoreEntry> {
  if (!input.title.trim()) {
    throw new Error(
      "A title is required for this lore entry.",
    );
  }

  if (
    input.parentEntryId === loreEntryId
  ) {
    throw new Error(
      "A lore entry cannot be its own parent.",
    );
  }

  const { error } = await supabase
    .from("lore_entries")
    .update(toLoreEntryRow(input))
    .eq("id", loreEntryId)
    .eq("world_id", input.worldId);

  if (error) {
    throw new Error(error.message);
  }

  await replaceLoreRelations(
    loreEntryId,
    input,
  );

  return getLoreEntry(
    input.worldId,
    loreEntryId,
  );
}

export async function deleteLoreEntry(
  loreEntryId: string,
  worldId: string,
): Promise<void> {
  const { error } = await supabase
    .from("lore_entries")
    .delete()
    .eq("id", loreEntryId)
    .eq("world_id", worldId);

  if (error) {
    throw new Error(error.message);
  }
}

export function getLoreCategoryLabel(
  category: LoreCategory,
): string {
  const labels: Record<
    LoreCategory,
    string
  > = {
    magic: "Magic",
    culture: "Culture",
    religion: "Religion",
    faction: "Faction",
    species: "Species",
    bloodline: "Bloodline",
    artifact: "Artifact",
    language: "Language",
    tradition: "Tradition",
    law: "Law",
    history: "History",
    creature: "Creature",
    technology: "Technology",
    cosmology: "Cosmology",
    other: "Other",
  };

  return labels[category];
}

export function getLoreStatusLabel(
  status: LoreStatus,
): string {
  const labels: Record<
    LoreStatus,
    string
  > = {
    draft: "Draft",
    canonical: "Canonical",
    retired: "Retired",
  };

  return labels[status];
}