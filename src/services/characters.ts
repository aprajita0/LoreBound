import { supabase } from "@/lib/supabase";

const PORTRAIT_BUCKET = "character-portraits";
const SIGNED_URL_LIFETIME_SECONDS = 60 * 60;
const MAX_PORTRAIT_BYTES = 8 * 1024 * 1024;
const MIN_PORTRAIT_EDGE = 400;
const PORTRAIT_RATIO = 4 / 5;
const MAX_OUTPUT_WIDTH = 1200;
const MAX_OUTPUT_HEIGHT = 1500;

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface PortraitCrop {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export async function prepareCharacterPortrait(
  file: File,
  crop?: PortraitCrop,
): Promise<File> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a JPG, PNG, WebP, or AVIF image.");
  }

  if (file.size > MAX_PORTRAIT_BYTES) {
    throw new Error("Character portraits must be smaller than 8 MB.");
  }

  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be read. Try another portrait file.");
  }

  try {
    if (
      bitmap.width < MIN_PORTRAIT_EDGE ||
      bitmap.height < MIN_PORTRAIT_EDGE
    ) {
      throw new Error(
        `This portrait is only ${bitmap.width}×${bitmap.height}px. Choose an image at least ${MIN_PORTRAIT_EDGE}×${MIN_PORTRAIT_EDGE}px; 800×1000px or larger is recommended.`,
      );
    }

    if (
      !crop &&
      file.type === "image/png" &&
      file.name.endsWith("-lorebound-portrait.png")
    ) {
      return file;
    }

    const zoom = clamp(crop?.zoom ?? 1, 1, 3);
    const sourceRatio = bitmap.width / bitmap.height;

    const baseCropWidth =
      sourceRatio > PORTRAIT_RATIO
        ? bitmap.height * PORTRAIT_RATIO
        : bitmap.width;

    const baseCropHeight = baseCropWidth / PORTRAIT_RATIO;
    const sourceWidth = baseCropWidth / zoom;
    const sourceHeight = baseCropHeight / zoom;

    const maximumSourceX = (bitmap.width - sourceWidth) / 2;
    const maximumSourceY = (bitmap.height - sourceHeight) / 2;

    const sourceX =
      maximumSourceX -
      clamp(crop?.offsetX ?? 0, -1, 1) * maximumSourceX;

    const sourceY =
      maximumSourceY -
      clamp(crop?.offsetY ?? 0, -1, 1) * maximumSourceY;

    // Never enlarge a smaller source crop.
    const outputScale = Math.min(
      1,
      MAX_OUTPUT_WIDTH / sourceWidth,
      MAX_OUTPUT_HEIGHT / sourceHeight,
    );

    const canvas = document.createElement("canvas");

    canvas.width = Math.max(
      1,
      Math.round(sourceWidth * outputScale),
    );

    canvas.height = Math.max(
      1,
      Math.round(sourceHeight * outputScale),
    );

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Your browser could not prepare this portrait.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
        } else {
          reject(
            new Error("Your browser could not process this portrait."),
          );
        }
      }, "image/png");
    });

    const baseName =
      file.name.replace(/\.[^.]+$/u, "") || "portrait";

    return new File(
      [blob],
      `${baseName}-lorebound-portrait.png`,
      {
        type: "image/png",
        lastModified: Date.now(),
      },
    );
  } finally {
    bitmap.close();
  }
}

export type CharacterImportance =
  | "major"
  | "supporting"
  | "minor";

export type CharacterStatus =
  | "active"
  | "absent"
  | "deceased"
  | "unknown";

export interface Character {
  id: string;
  worldId: string;
  name: string;
  role: string;
  summary: string;
  importance: CharacterImportance;
  status: CharacterStatus;
  location: string;
  portraitPath: string | null;
  portraitUrl: string | null;
  aliases: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveCharacterInput {
  worldId: string;
  name: string;
  role: string;
  summary: string;
  importance: CharacterImportance;
  status: CharacterStatus;
  location: string;
  aliases: string[];
  tags: string[];
}

interface CharacterRow {
  id: string;
  world_id: string;
  name: string;
  role: string | null;
  summary: string | null;
  importance: CharacterImportance;
  status: CharacterStatus;
  location: string | null;
  portrait_path: string | null;
  aliases: string[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

function isRemoteUrl(path: string): boolean {
  return /^https?:\/\//iu.test(path);
}

function normalizeList(values: string[]): string[] {
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function mapCharacter(
  row: CharacterRow,
  portraitUrl: string | null,
): Character {
  return {
    id: row.id,
    worldId: row.world_id,
    name: row.name,
    role: row.role ?? "",
    summary: row.summary ?? "",
    importance: row.importance,
    status: row.status,
    location: row.location ?? "",
    portraitPath: row.portrait_path,
    portraitUrl,
    aliases: row.aliases ?? [],
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolvePortraitUrls(
  paths: Array<string | null>,
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();

  const storagePaths = [
    ...new Set(
      paths.filter(
        (path): path is string => Boolean(path),
      ),
    ),
  ].filter((path) => {
    if (isRemoteUrl(path)) {
      urls.set(path, path);
      return false;
    }

    return true;
  });

  if (storagePaths.length === 0) {
    return urls;
  }

  const { data, error } = await supabase.storage
    .from(PORTRAIT_BUCKET)
    .createSignedUrls(
      storagePaths,
      SIGNED_URL_LIFETIME_SECONDS,
    );

  if (error) {
    console.warn(
      "Lorebound could not resolve character portraits.",
      error,
    );

    return urls;
  }

  data.forEach((portrait) => {
    if (portrait.signedUrl) {
      urls.set(
        portrait.path,
        portrait.signedUrl,
      );
    }
  });

  return urls;
}

export async function listCharacters(
  worldId: string,
): Promise<Character[]> {
  const { data, error } = await supabase
    .from("characters")
    .select(
      `
        id,
        world_id,
        name,
        role,
        summary,
        importance,
        status,
        location,
        portrait_path,
        aliases,
        tags,
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

  const rows = (data ?? []) as CharacterRow[];

  const urls = await resolvePortraitUrls(
    rows.map(
      (character) => character.portrait_path,
    ),
  );

  return rows.map((row) =>
    mapCharacter(
      row,
      row.portrait_path
        ? urls.get(row.portrait_path) ?? null
        : null,
    ),
  );
}

export async function createCharacter(
  input: SaveCharacterInput,
): Promise<Character> {
  const name = input.name.trim();

  if (!name) {
    throw new Error(
      "Your character needs a name.",
    );
  }

  const { data, error } = await supabase
    .from("characters")
    .insert({
      world_id: input.worldId,
      name,
      role: input.role.trim(),
      summary: input.summary.trim(),
      importance: input.importance,
      status: input.status,
      location: input.location.trim(),
      aliases: normalizeList(input.aliases),
      tags: normalizeList(input.tags),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapCharacter(
    data as CharacterRow,
    null,
  );
}

export async function updateCharacter(
  characterId: string,
  input: SaveCharacterInput,
): Promise<void> {
  const name = input.name.trim();

  if (!name) {
    throw new Error(
      "Your character needs a name.",
    );
  }

  const { error } = await supabase
    .from("characters")
    .update({
      name,
      role: input.role.trim(),
      summary: input.summary.trim(),
      importance: input.importance,
      status: input.status,
      location: input.location.trim(),
      aliases: normalizeList(input.aliases),
      tags: normalizeList(input.tags),
    })
    .eq("id", characterId)
    .eq("world_id", input.worldId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCharacter(
  character: Character,
): Promise<void> {
  const { error } = await supabase
    .from("characters")
    .delete()
    .eq("id", character.id)
    .eq("world_id", character.worldId);

  if (error) {
    throw new Error(error.message);
  }

  if (
    character.portraitPath &&
    !isRemoteUrl(character.portraitPath)
  ) {
    void supabase.storage
      .from(PORTRAIT_BUCKET)
      .remove([character.portraitPath]);
  }
}

export async function uploadCharacterPortrait(
  character: Character,
  file: File,
): Promise<{
  portraitPath: string;
  portraitUrl: string;
}> {
  const normalizedFile =
    await prepareCharacterPortrait(file);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error(
      "You must be signed in to upload a portrait.",
    );
  }

  const portraitPath =
    `${user.id}/${character.worldId}/${character.id}/` +
    `portrait-${crypto.randomUUID()}.png`;

  const { error: uploadError } =
    await supabase.storage
      .from(PORTRAIT_BUCKET)
      .upload(
        portraitPath,
        normalizedFile,
        {
          cacheControl: "31536000",
          contentType: normalizedFile.type,
          upsert: false,
        },
      );

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: updateError } =
    await supabase
      .from("characters")
      .update({
        portrait_path: portraitPath,
      })
      .eq("id", character.id)
      .eq(
        "world_id",
        character.worldId,
      );

  if (updateError) {
    await supabase.storage
      .from(PORTRAIT_BUCKET)
      .remove([portraitPath]);

    throw new Error(
      updateError.message,
    );
  }

  if (
    character.portraitPath &&
    !isRemoteUrl(character.portraitPath) &&
    character.portraitPath !== portraitPath
  ) {
    void supabase.storage
      .from(PORTRAIT_BUCKET)
      .remove([
        character.portraitPath,
      ]);
  }

  const {
    data: signed,
    error: signedError,
  } = await supabase.storage
    .from(PORTRAIT_BUCKET)
    .createSignedUrl(
      portraitPath,
      SIGNED_URL_LIFETIME_SECONDS,
    );

  if (signedError) {
    throw new Error(
      signedError.message,
    );
  }

  return {
    portraitPath,
    portraitUrl: signed.signedUrl,
  };
}