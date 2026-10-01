import { supabase } from "@/lib/supabase";

export type SecretCategory =
  | "identity"
  | "betrayal"
  | "relationship"
  | "crime"
  | "political"
  | "magical"
  | "historical"
  | "prophecy"
  | "lineage"
  | "other";

export type SecretSeverity =
  | "minor"
  | "dangerous"
  | "catastrophic";

export type SecretStatus =
  | "buried"
  | "active"
  | "partially_revealed"
  | "exposed";

export type KnowledgeState =
  | "knows"
  | "suspects"
  | "unaware";

export type SecretDocument =
  Record<string, unknown>;

export interface SecretKnowledge {
  characterId: string;
  state: KnowledgeState;
  notes: string;
  learnedInChapterId: string | null;
}

export interface Secret {
  id: string;
  worldId: string;

  title: string;
  category: SecretCategory;
  severity: SecretSeverity;
  status: SecretStatus;

  publicStory: string;
  truthJson: SecretDocument;
  truthPlainText: string;

  revealCondition: string;
  consequences: string;
  evidence: string;

  imagePath: string | null;

  isFeatured: boolean;
  sortOrder: number;

  characterKnowledge: SecretKnowledge[];
  placeIds: string[];
  loreEntryIds: string[];
  chapterIds: string[];

  createdAt: string;
  updatedAt: string;
}

export interface SaveSecretInput {
  worldId: string;

  title: string;
  category: SecretCategory;
  severity: SecretSeverity;
  status: SecretStatus;

  publicStory?: string;
  truthJson?: SecretDocument;
  truthPlainText?: string;

  revealCondition?: string;
  consequences?: string;
  evidence?: string;

  imagePath?: string | null;

  isFeatured?: boolean;
  sortOrder?: number;

  characterKnowledge?: SecretKnowledge[];
  placeIds?: string[];
  loreEntryIds?: string[];
  chapterIds?: string[];
}

interface SecretRow {
  id: string;
  world_id: string;

  title: string;
  category: SecretCategory;
  severity: SecretSeverity;
  status: SecretStatus;

  public_story: string | null;
  truth_json: SecretDocument | null;
  truth_plain_text: string | null;

  reveal_condition: string | null;
  consequences: string | null;
  evidence: string | null;

  image_path: string | null;

  is_featured: boolean;
  sort_order: number;

  created_at: string;
  updated_at: string;
}

interface SecretKnowledgeRow {
  secret_id: string;
  character_id: string;
  knowledge_state: KnowledgeState;
  knowledge_notes: string | null;
  learned_in_chapter_id: string | null;
}

interface SecretPlaceRow {
  place_id: string;
}

interface SecretLoreRow {
  lore_entry_id: string;
}

interface SecretChapterRow {
  chapter_id: string;
}

const EMPTY_DOCUMENT: SecretDocument = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

function normalizeIds(
  values?: string[],
): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeKnowledge(
  knowledge?: SecretKnowledge[],
): SecretKnowledge[] {
  const records = new Map<
    string,
    SecretKnowledge
  >();

  for (const item of knowledge ?? []) {
    const characterId =
      item.characterId.trim();

    if (!characterId) {
      continue;
    }

    records.set(characterId, {
      characterId,
      state: item.state,
      notes: item.notes.trim(),
      learnedInChapterId:
        item.learnedInChapterId || null,
    });
  }

  return Array.from(records.values());
}

function mapSecret(
  row: SecretRow,
): Secret {
  return {
    id: row.id,
    worldId: row.world_id,

    title: row.title,
    category: row.category,
    severity: row.severity,
    status: row.status,

    publicStory: row.public_story ?? "",
    truthJson:
      row.truth_json ?? EMPTY_DOCUMENT,
    truthPlainText:
      row.truth_plain_text ?? "",

    revealCondition:
      row.reveal_condition ?? "",
    consequences: row.consequences ?? "",
    evidence: row.evidence ?? "",

    imagePath: row.image_path,

    isFeatured: row.is_featured,
    sortOrder: row.sort_order,

    characterKnowledge: [],
    placeIds: [],
    loreEntryIds: [],
    chapterIds: [],

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSecretRow(
  input: SaveSecretInput,
) {
  return {
    world_id: input.worldId,

    title: input.title.trim(),
    category: input.category,
    severity: input.severity,
    status: input.status,

    public_story:
      input.publicStory?.trim() ?? "",

    truth_json:
      input.truthJson ?? EMPTY_DOCUMENT,

    truth_plain_text:
      input.truthPlainText?.trim() ?? "",

    reveal_condition:
      input.revealCondition?.trim() ?? "",

    consequences:
      input.consequences?.trim() ?? "",

    evidence:
      input.evidence?.trim() ?? "",

    image_path:
      input.imagePath?.trim() || null,

    is_featured:
      input.isFeatured ?? false,

    sort_order:
      input.sortOrder ?? 0,

    updated_at: new Date().toISOString(),
  };
}

async function replaceSecretRelations(
  secretId: string,
  input: SaveSecretInput,
): Promise<void> {
  const characterKnowledge =
    normalizeKnowledge(
      input.characterKnowledge,
    );

  const placeIds = normalizeIds(
    input.placeIds,
  );

  const loreEntryIds = normalizeIds(
    input.loreEntryIds,
  );

  const chapterIds = normalizeIds(
    input.chapterIds,
  );

  const deleteResults =
    await Promise.all([
      supabase
        .from(
          "secret_character_knowledge",
        )
        .delete()
        .eq("secret_id", secretId),

      supabase
        .from("secret_places")
        .delete()
        .eq("secret_id", secretId),

      supabase
        .from("secret_lore_entries")
        .delete()
        .eq("secret_id", secretId),

      supabase
        .from("secret_chapters")
        .delete()
        .eq("secret_id", secretId),
    ]);

  for (const result of deleteResults) {
    if (result.error) {
      throw new Error(
        result.error.message,
      );
    }
  }

  if (characterKnowledge.length > 0) {
    const { error } = await supabase
      .from(
        "secret_character_knowledge",
      )
      .insert(
        characterKnowledge.map(
          (knowledge) => ({
            secret_id: secretId,

            character_id:
              knowledge.characterId,

            knowledge_state:
              knowledge.state,

            knowledge_notes:
              knowledge.notes,

            learned_in_chapter_id:
              knowledge.learnedInChapterId,
          }),
        ),
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  if (placeIds.length > 0) {
    const { error } = await supabase
      .from("secret_places")
      .insert(
        placeIds.map((placeId) => ({
          secret_id: secretId,
          place_id: placeId,
          relationship: "related",
        })),
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  if (loreEntryIds.length > 0) {
    const { error } = await supabase
      .from("secret_lore_entries")
      .insert(
        loreEntryIds.map(
          (loreEntryId) => ({
            secret_id: secretId,
            lore_entry_id: loreEntryId,
            relationship: "related",
          }),
        ),
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  if (chapterIds.length > 0) {
    const { error } = await supabase
      .from("secret_chapters")
      .insert(
        chapterIds.map((chapterId) => ({
          secret_id: secretId,
          chapter_id: chapterId,
          relationship: "related",
        })),
      );

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function listSecrets(
  worldId: string,
): Promise<Secret[]> {
  const { data, error } = await supabase
    .from("secrets")
    .select("*")
    .eq("world_id", worldId)
    .order("is_featured", {
      ascending: false,
    })
    .order("sort_order", {
      ascending: true,
    })
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const secrets = (
    (data ?? []) as SecretRow[]
  ).map(mapSecret);

  if (secrets.length === 0) {
    return [];
  }

  const secretIds = secrets.map(
    (secret) => secret.id,
  );

  const {
    data: knowledgeData,
    error: knowledgeError,
  } = await supabase
    .from("secret_character_knowledge")
    .select(
      `
        secret_id,
        character_id,
        knowledge_state,
        knowledge_notes,
        learned_in_chapter_id
      `,
    )
    .in("secret_id", secretIds);

  if (knowledgeError) {
    throw new Error(
      knowledgeError.message,
    );
  }

  const knowledgeRows =
    (knowledgeData ??
      []) as SecretKnowledgeRow[];

  const knowledgeBySecret =
    new Map<string, SecretKnowledge[]>();

  for (const row of knowledgeRows) {
    const current =
      knowledgeBySecret.get(
        row.secret_id,
      ) ?? [];

    current.push({
      characterId: row.character_id,
      state: row.knowledge_state,
      notes:
        row.knowledge_notes ?? "",
      learnedInChapterId:
        row.learned_in_chapter_id,
    });

    knowledgeBySecret.set(
      row.secret_id,
      current,
    );
  }

  return secrets.map((secret) => ({
    ...secret,
    characterKnowledge:
      knowledgeBySecret.get(secret.id) ??
      [],
  }));
}

export async function getSecret(
  worldId: string,
  secretId: string,
): Promise<Secret> {
  const { data, error } = await supabase
    .from("secrets")
    .select("*")
    .eq("world_id", worldId)
    .eq("id", secretId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const secret = mapSecret(
    data as SecretRow,
  );

  const [
    knowledgeResult,
    placesResult,
    loreResult,
    chaptersResult,
  ] = await Promise.all([
    supabase
      .from(
        "secret_character_knowledge",
      )
      .select(
        `
          secret_id,
          character_id,
          knowledge_state,
          knowledge_notes,
          learned_in_chapter_id
        `,
      )
      .eq("secret_id", secretId),

    supabase
      .from("secret_places")
      .select("place_id")
      .eq("secret_id", secretId),

    supabase
      .from("secret_lore_entries")
      .select("lore_entry_id")
      .eq("secret_id", secretId),

    supabase
      .from("secret_chapters")
      .select("chapter_id")
      .eq("secret_id", secretId),
  ]);

  if (knowledgeResult.error) {
    throw new Error(
      knowledgeResult.error.message,
    );
  }

  if (placesResult.error) {
    throw new Error(
      placesResult.error.message,
    );
  }

  if (loreResult.error) {
    throw new Error(
      loreResult.error.message,
    );
  }

  if (chaptersResult.error) {
    throw new Error(
      chaptersResult.error.message,
    );
  }

  secret.characterKnowledge = (
    (knowledgeResult.data ??
      []) as SecretKnowledgeRow[]
  ).map((row) => ({
    characterId: row.character_id,
    state: row.knowledge_state,
    notes: row.knowledge_notes ?? "",
    learnedInChapterId:
      row.learned_in_chapter_id,
  }));

  secret.placeIds = (
    (placesResult.data ??
      []) as SecretPlaceRow[]
  ).map((row) => row.place_id);

  secret.loreEntryIds = (
    (loreResult.data ??
      []) as SecretLoreRow[]
  ).map((row) => row.lore_entry_id);

  secret.chapterIds = (
    (chaptersResult.data ??
      []) as SecretChapterRow[]
  ).map((row) => row.chapter_id);

  return secret;
}

export async function createSecret(
  input: SaveSecretInput,
): Promise<Secret> {
  if (!input.title.trim()) {
    throw new Error(
      "A title is required for this secret.",
    );
  }

  const { data, error } = await supabase
    .from("secrets")
    .insert(toSecretRow(input))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const secret = mapSecret(
    data as SecretRow,
  );

  try {
    await replaceSecretRelations(
      secret.id,
      input,
    );
  } catch (relationError) {
    await supabase
      .from("secrets")
      .delete()
      .eq("id", secret.id)
      .eq("world_id", input.worldId);

    throw relationError;
  }

  return getSecret(
    input.worldId,
    secret.id,
  );
}

export async function updateSecret(
  secretId: string,
  input: SaveSecretInput,
): Promise<Secret> {
  if (!input.title.trim()) {
    throw new Error(
      "A title is required for this secret.",
    );
  }

  const { error } = await supabase
    .from("secrets")
    .update(toSecretRow(input))
    .eq("id", secretId)
    .eq("world_id", input.worldId);

  if (error) {
    throw new Error(error.message);
  }

  await replaceSecretRelations(
    secretId,
    input,
  );

  return getSecret(
    input.worldId,
    secretId,
  );
}

export async function deleteSecret(
  secretId: string,
  worldId: string,
): Promise<void> {
  const { error } = await supabase
    .from("secrets")
    .delete()
    .eq("id", secretId)
    .eq("world_id", worldId);

  if (error) {
    throw new Error(error.message);
  }
}

export function getSecretCategoryLabel(
  category: SecretCategory,
): string {
  const labels: Record<
    SecretCategory,
    string
  > = {
    identity: "Identity",
    betrayal: "Betrayal",
    relationship: "Relationship",
    crime: "Crime",
    political: "Political",
    magical: "Magical",
    historical: "Historical",
    prophecy: "Prophecy",
    lineage: "Lineage",
    other: "Other",
  };

  return labels[category];
}

export function getSecretSeverityLabel(
  severity: SecretSeverity,
): string {
  const labels: Record<
    SecretSeverity,
    string
  > = {
    minor: "Minor",
    dangerous: "Dangerous",
    catastrophic: "Catastrophic",
  };

  return labels[severity];
}

export function getSecretStatusLabel(
  status: SecretStatus,
): string {
  const labels: Record<
    SecretStatus,
    string
  > = {
    buried: "Buried",
    active: "Active",
    partially_revealed:
      "Partially Revealed",
    exposed: "Exposed",
  };

  return labels[status];
}

export function getKnowledgeStateLabel(
  state: KnowledgeState,
): string {
  const labels: Record<
    KnowledgeState,
    string
  > = {
    knows: "Knows",
    suspects: "Suspects",
    unaware: "Unaware",
  };

  return labels[state];
}

export function countSecretKnowledge(
  secret: Secret,
) {
  return {
    knows: secret.characterKnowledge.filter(
      (record) =>
        record.state === "knows",
    ).length,

    suspects:
      secret.characterKnowledge.filter(
        (record) =>
          record.state === "suspects",
      ).length,

    unaware:
      secret.characterKnowledge.filter(
        (record) =>
          record.state === "unaware",
      ).length,
  };
}