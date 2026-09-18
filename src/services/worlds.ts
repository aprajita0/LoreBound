import { supabase } from "@/lib/supabase";

export interface WorldSummary {
  id: string;
  title: string;
  description: string;
  genre: string;
  coverPath: string | null;
  status: string;
  lastOpenedAt: string;
  createdAt: string;
  chapterCount: number;
  wordCount: number;
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

interface WorldQueryRow {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  cover_path: string | null;
  status: string;
  last_opened_at: string;
  created_at: string;
  chapters:
    | Array<{
        id: string;
        word_count: number | null;
      }>
    | null;
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
            content: [
              {
                type: "text",
                text: paragraph,
              },
            ],
          }))
        : [{ type: "paragraph" }],
  };
}

export async function listWorlds(): Promise<WorldSummary[]> {
  const { data, error } = await supabase
    .from("worlds")
    .select(`
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
        word_count
      )
    `)
    .order("last_opened_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WorldQueryRow[]).map((world) => ({
    id: world.id,
    title: world.title,
    description: world.description ?? "",
    genre: world.genre ?? "Fantasy",
    coverPath: world.cover_path,
    status: world.status,
    lastOpenedAt: world.last_opened_at,
    createdAt: world.created_at,
    chapterCount: world.chapters?.length ?? 0,
    wordCount:
      world.chapters?.reduce(
        (total, chapter) => total + (chapter.word_count ?? 0),
        0,
      ) ?? 0,
  }));
}

export async function createWorld(
  input: CreateWorldInput,
): Promise<WorldSummary> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("You must be signed in to create a world.");
  }

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
    .select(`
      id,
      title,
      description,
      genre,
      cover_path,
      status,
      last_opened_at,
      created_at
    `)
    .single();

  if (worldError) {
    throw new Error(worldError.message);
  }

  const chapterText = input.chapterText.trim();

  const { error: chapterError } = await supabase.from("chapters").insert({
    world_id: world.id,
    title: input.chapterTitle.trim() || "Chapter One",
    position: 1,
    content_json: createDocument(chapterText),
    plain_text: chapterText,
    word_count: countWords(chapterText),
    status: "draft",
  });

  if (chapterError) {
    // Cleanup prevents a half-created world if chapter creation fails.
    await supabase.from("worlds").delete().eq("id", world.id);
    throw new Error(chapterError.message);
  }

  return {
    id: world.id,
    title: world.title,
    description: world.description ?? "",
    genre: world.genre ?? "Fantasy",
    coverPath: world.cover_path,
    status: world.status,
    lastOpenedAt: world.last_opened_at,
    createdAt: world.created_at,
    chapterCount: 1,
    wordCount: countWords(chapterText),
  };
}