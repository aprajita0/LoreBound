import type { JSONContent } from "@tiptap/react";
import { supabase } from "@/lib/supabase";

export interface ManuscriptWorld {
  id: string;
  title: string;
  description: string;
  genre: string;
  status: string;
  lastOpenedAt: string;
}

export interface ManuscriptChapter {
  id: string;
  worldId: string;
  title: string;
  subtitle: string;
  position: number;
  contentJson: JSONContent;
  plainText: string;
  wordCount: number;
  status: "draft" | "reviewed" | "final";
  analysisStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManuscriptData {
  world: ManuscriptWorld;
  chapters: ManuscriptChapter[];
}

export interface SaveChapterInput {
  chapterId: string;
  title: string;
  contentJson: JSONContent;
  plainText: string;
  wordCount: number;
}

interface WorldRow {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  status: string;
  last_opened_at: string;
}

interface ChapterRow {
  id: string;
  world_id: string;
  title: string;
  subtitle: string | null;
  position: number;
  content_json: JSONContent | null;
  plain_text: string | null;
  word_count: number | null;
  status: "draft" | "reviewed" | "final";
  analysis_status: string;
  created_at: string;
  updated_at: string;
}

const emptyDocument: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

function mapWorld(row: WorldRow): ManuscriptWorld {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    genre: row.genre ?? "Unspecified",
    status: row.status,
    lastOpenedAt: row.last_opened_at,
  };
}

function mapChapter(row: ChapterRow): ManuscriptChapter {
  return {
    id: row.id,
    worldId: row.world_id,
    title: row.title,
    subtitle: row.subtitle ?? "",
    position: row.position,
    contentJson: row.content_json ?? emptyDocument,
    plainText: row.plain_text ?? "",
    wordCount: row.word_count ?? 0,
    status: row.status,
    analysisStatus: row.analysis_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getManuscript(
  worldId: string,
): Promise<ManuscriptData> {
  const [worldResult, chaptersResult] = await Promise.all([
    supabase
      .from("worlds")
      .select(`
        id,
        title,
        description,
        genre,
        status,
        last_opened_at
      `)
      .eq("id", worldId)
      .single(),

    supabase
      .from("chapters")
      .select(`
        id,
        world_id,
        title,
        subtitle,
        position,
        content_json,
        plain_text,
        word_count,
        status,
        analysis_status,
        created_at,
        updated_at
      `)
      .eq("world_id", worldId)
      .order("position", { ascending: true }),
  ]);

  if (worldResult.error) {
    throw new Error(worldResult.error.message);
  }

  if (chaptersResult.error) {
    throw new Error(chaptersResult.error.message);
  }

  void supabase
    .from("worlds")
    .update({
      last_opened_at: new Date().toISOString(),
    })
    .eq("id", worldId);

  return {
    world: mapWorld(worldResult.data as WorldRow),
    chapters: ((chaptersResult.data ?? []) as ChapterRow[]).map(mapChapter),
  };
}

export async function saveChapter(
  input: SaveChapterInput,
): Promise<void> {
  const { error } = await supabase
    .from("chapters")
    .update({
      title: input.title.trim() || "Untitled Chapter",
      content_json: input.contentJson,
      plain_text: input.plainText,
      word_count: input.wordCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.chapterId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createChapter(
  worldId: string,
): Promise<ManuscriptChapter> {
  const { data: latestChapter, error: latestChapterError } = await supabase
    .from("chapters")
    .select("position")
    .eq("world_id", worldId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestChapterError) {
    throw new Error(latestChapterError.message);
  }

  const nextPosition = (latestChapter?.position ?? 0) + 1;

  const { data, error } = await supabase
    .from("chapters")
    .insert({
      world_id: worldId,
      title: `Chapter ${nextPosition}`,
      position: nextPosition,
      content_json: emptyDocument,
      plain_text: "",
      word_count: 0,
      status: "draft",
    })
    .select(`
      id,
      world_id,
      title,
      subtitle,
      position,
      content_json,
      plain_text,
      word_count,
      status,
      analysis_status,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapChapter(data as ChapterRow);
}

export async function deleteChapter(
  chapterId: string,
): Promise<void> {
  const { error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", chapterId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createChapterVersion(
  chapter: ManuscriptChapter,
): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("You must be signed in to create a version.");
  }

  const { error } = await supabase.from("chapter_versions").insert({
    chapter_id: chapter.id,
    created_by: user.id,
    content_json: chapter.contentJson,
    plain_text: chapter.plainText,
    word_count: chapter.wordCount,
  });

  if (error) {
    throw new Error(error.message);
  }
}