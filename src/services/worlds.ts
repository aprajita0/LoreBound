import { supabase } from "@/lib/supabase";

const WORLD_COVERS_BUCKET = "world-covers";
const SIGNED_COVER_LIFETIME_SECONDS = 60 * 60;
const MAX_COVER_BYTES = 8 * 1024 * 1024;
const ACCEPTED_COVER_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface LatestChapterSummary {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  wordCount: number;
  updatedAt: string;
}

export interface WorldSummary {
  id: string;
  title: string;
  description: string;
  genre: string;
  coverPath: string | null;
  coverUrl: string | null;
  status: string;
  lastOpenedAt: string;
  createdAt: string;
  chapterCount: number;
  wordCount: number;
  latestChapter: LatestChapterSummary | null;
}

export interface CreateWorldInput {
  title: string;
  genre: string;
  description: string;
  pointOfView: string;
  tense: string;
  rules: string[];
  chapterTitle: string;
  chapterText: string;
}

export interface UpdateWorldDetailsInput {
  worldId: string;
  title: string;
  genre: string;
  synopsis: string;
}

interface ChapterSummaryRow {
  id: string;
  title: string;
  subtitle: string | null;
  plain_text: string | null;
  word_count: number | null;
  updated_at: string;
  position: number;
}

interface WorldQueryRow {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  cover_path: string | null;
  status: string;
  last_opened_at: string;
  created_at: string;
  chapters: ChapterSummaryRow[] | null;
}

export interface WorldCoverResult {
  coverPath: string;
  coverUrl: string;
}

function countWords(text: string): number {
  const normalized = text.trim();
  return normalized ? normalized.split(/\s+/u).length : 0;
}

function createDocument(text: string) {
  const paragraphs = text
    .split(/\n{2,}/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    type: "doc",
    content:
      paragraphs.length > 0
        ? paragraphs.map((paragraph) => ({
            type: "paragraph",
            content: [{ type: "text", text: paragraph }],
          }))
        : [{ type: "paragraph" }],
  };
}

function makeExcerpt(text: string, maximumLength = 280): string {
  const normalized = text.replace(/\s+/gu, " ").trim();

  if (!normalized) return "";
  if (normalized.length <= maximumLength) return normalized;

  const shortened = normalized.slice(0, maximumLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");

  return `${shortened.slice(0, lastSpace > 180 ? lastSpace : maximumLength).trim()}…`;
}

function isRemoteUrl(path: string): boolean {
  return /^https?:\/\//iu.test(path);
}

async function resolveCoverUrls(
  paths: Array<string | null>,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const storagePaths = [
    ...new Set(paths.filter((path): path is string => Boolean(path))),
  ].filter((path) => {
    if (isRemoteUrl(path)) {
      result.set(path, path);
      return false;
    }

    return true;
  });

  if (storagePaths.length === 0) return result;

  const { data, error } = await supabase.storage
    .from(WORLD_COVERS_BUCKET)
    .createSignedUrls(storagePaths, SIGNED_COVER_LIFETIME_SECONDS);

  if (error) {
    console.warn("Lorebound could not resolve world cover images.", error);
    return result;
  }

  data.forEach((cover) => {
    if (cover.signedUrl) result.set(cover.path, cover.signedUrl);
  });

  return result;
}

function findLatestChapter(
  chapters: ChapterSummaryRow[] | null,
): ChapterSummaryRow | null {
  if (!chapters?.length) return null;

  return chapters.reduce((latest, chapter) => {
    const currentTime = new Date(chapter.updated_at).getTime();
    const latestTime = new Date(latest.updated_at).getTime();

    if (currentTime === latestTime) {
      return chapter.position > latest.position ? chapter : latest;
    }

    return currentTime > latestTime ? chapter : latest;
  });
}

export async function listWorlds(): Promise<WorldSummary[]> {
  const { data, error } = await supabase
    .from("worlds")
    .select(
      `
      id,
      title,
      description,
      genre,
      cover_path,
      status,
      last_opened_at,
      created_at,
      chapters (
        id,
        title,
        subtitle,
        plain_text,
        word_count,
        updated_at,
        position
      )
    `,
    )
    .order("last_opened_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as WorldQueryRow[];
  const coverUrls = await resolveCoverUrls(
    rows.map((world) => world.cover_path),
  );

  return rows.map((world) => {
    const latest = findLatestChapter(world.chapters);

    return {
      id: world.id,
      title: world.title,
      description: world.description ?? "",
      genre: world.genre ?? "Fantasy",
      coverPath: world.cover_path,
      coverUrl: world.cover_path
        ? (coverUrls.get(world.cover_path) ?? null)
        : null,
      status: world.status,
      lastOpenedAt: world.last_opened_at,
      createdAt: world.created_at,
      chapterCount: world.chapters?.length ?? 0,
      wordCount:
        world.chapters?.reduce(
          (total, chapter) => total + (chapter.word_count ?? 0),
          0,
        ) ?? 0,
      latestChapter: latest
        ? {
            id: latest.id,
            title: latest.title,
            subtitle: latest.subtitle ?? "",
            excerpt: makeExcerpt(latest.plain_text ?? ""),
            wordCount: latest.word_count ?? 0,
            updatedAt: latest.updated_at,
          }
        : null,
    };
  });
}

export async function uploadWorldCover(
  worldId: string,
  file: File,
): Promise<WorldCoverResult> {
  if (!ACCEPTED_COVER_TYPES.has(file.type)) {
    throw new Error("Choose a JPG, PNG, WebP, or AVIF image.");
  }

  if (file.size > MAX_COVER_BYTES) {
    throw new Error("Cover images must be smaller than 8 MB.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("You must be signed in to upload a cover.");

  const { data: existingWorld, error: worldError } = await supabase
    .from("worlds")
    .select("cover_path")
    .eq("id", worldId)
    .single();

  if (worldError) throw new Error(worldError.message);

  const fileExtension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/gu, "") ||
    file.type.split("/").pop() ||
    "jpg";
  const coverPath = `${user.id}/${worldId}/cover-${crypto.randomUUID()}.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(WORLD_COVERS_BUCKET)
    .upload(coverPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { error: updateError } = await supabase
    .from("worlds")
    .update({ cover_path: coverPath })
    .eq("id", worldId);

  if (updateError) {
    await supabase.storage.from(WORLD_COVERS_BUCKET).remove([coverPath]);
    throw new Error(updateError.message);
  }

  const previousPath = existingWorld.cover_path as string | null;
  if (
    previousPath &&
    !isRemoteUrl(previousPath) &&
    previousPath !== coverPath
  ) {
    void supabase.storage.from(WORLD_COVERS_BUCKET).remove([previousPath]);
  }

  const { data: signedCover, error: signedCoverError } = await supabase.storage
    .from(WORLD_COVERS_BUCKET)
    .createSignedUrl(coverPath, SIGNED_COVER_LIFETIME_SECONDS);

  if (signedCoverError) throw new Error(signedCoverError.message);

  return { coverPath, coverUrl: signedCover.signedUrl };
}

export async function updateWorldDetails(
  input: UpdateWorldDetailsInput,
): Promise<void> {
  const title = input.title.trim();
  const genre = input.genre.trim();

  if (!title) throw new Error("Your world needs a name.");
  if (!genre) throw new Error("Choose or enter a genre.");

  const { error } = await supabase
    .from("worlds")
    .update({
      title,
      genre,
      description: input.synopsis.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.worldId);

  if (error) throw new Error(error.message);
}

export async function createWorld(
  input: CreateWorldInput,
): Promise<WorldSummary> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("You must be signed in to create a world.");

  const { data: world, error: worldError } = await supabase
    .from("worlds")
    .insert({
      owner_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      genre: input.genre.trim(),
      point_of_view: input.pointOfView.trim(),
      tense: input.tense.trim(),
      rules: input.rules,
      status: "draft",
      last_opened_at: new Date().toISOString(),
    })
    .select(
      "id, title, description, genre, cover_path, status, last_opened_at, created_at",
    )
    .single();

  if (worldError) throw new Error(worldError.message);

  const chapterText = input.chapterText.trim();
  const chapterTitle = input.chapterTitle.trim() || "Chapter One";
  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .insert({
      world_id: world.id,
      title: chapterTitle,
      position: 1,
      content_json: createDocument(chapterText),
      plain_text: chapterText,
      word_count: countWords(chapterText),
      status: "draft",
    })
    .select("id, updated_at")
    .single();

  if (chapterError) {
    await supabase.from("worlds").delete().eq("id", world.id);
    throw new Error(chapterError.message);
  }

  return {
    id: world.id,
    title: world.title,
    description: world.description ?? "",
    genre: world.genre ?? "Fantasy",
    coverPath: world.cover_path,
    coverUrl: null,
    status: world.status,
    lastOpenedAt: world.last_opened_at,
    createdAt: world.created_at,
    chapterCount: 1,
    wordCount: countWords(chapterText),
    latestChapter: {
      id: chapter.id,
      title: chapterTitle,
      subtitle: "",
      excerpt: makeExcerpt(chapterText),
      wordCount: countWords(chapterText),
      updatedAt: chapter.updated_at,
    },
  };
}
