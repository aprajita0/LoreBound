import { supabase } from "@/lib/supabase";
import type { Place } from "@/services/places";

export type TimelineEventType =
  | "birth"
  | "death"
  | "battle"
  | "political"
  | "relationship"
  | "discovery"
  | "journey"
  | "prophecy"
  | "historical"
  | "personal"
  | "other";

export type TimelineEventStatus =
  | "canonical"
  | "disputed"
  | "secret"
  | "draft";

export interface TimelineCharacter {
  characterId: string;
  name: string;
  role: string;
  portraitUrl: string | null;
  roleInEvent: string;
}

export interface TimelinePlaceSummary {
  id: string;
  name: string;
  placeType: Place["placeType"];
}

export interface TimelineChapterSummary {
  id: string;
  title: string;
  position: number;
}

export interface TimelineEvent {
  id: string;
  worldId: string;

  placeId: string | null;
  chapterId: string | null;

  title: string;
  fictionalDate: string;
  era: string;
  eventType: TimelineEventType;
  status: TimelineEventStatus;

  summary: string;
  description: string;

  importance: number;
  sortOrder: number;

  place: TimelinePlaceSummary | null;
  chapter: TimelineChapterSummary | null;
  characters: TimelineCharacter[];

  createdAt: string;
  updatedAt: string;
}

export interface TimelineParticipantInput {
  characterId: string;
  roleInEvent?: string;
}

export interface SaveTimelineEventInput {
  worldId: string;

  placeId?: string | null;
  chapterId?: string | null;

  title: string;
  fictionalDate?: string;
  era?: string;

  eventType: TimelineEventType;
  status: TimelineEventStatus;

  summary?: string;
  description?: string;

  importance?: number;
  sortOrder: number;

  characters?: TimelineParticipantInput[];
}

interface PlaceRelationRow {
  id: string;
  name: string;
  place_type: Place["placeType"];
}

interface ChapterRelationRow {
  id: string;
  title: string;
  position: number;
}

interface CharacterRelationRow {
  id: string;
  name: string;
  role: string | null;
}

interface TimelineCharacterLinkRow {
  role_in_event: string | null;

  character:
    | CharacterRelationRow
    | CharacterRelationRow[]
    | null;
}

interface TimelineEventRow {
  id: string;
  world_id: string;

  place_id: string | null;
  chapter_id: string | null;

  title: string;
  fictional_date: string | null;
  era: string | null;

  event_type: TimelineEventType;
  status: TimelineEventStatus;

  summary: string | null;
  description: string | null;

  importance: number;
  sort_order: number | string;

  created_at: string;
  updated_at: string;

  place:
    | PlaceRelationRow
    | PlaceRelationRow[]
    | null;

  chapter:
    | ChapterRelationRow
    | ChapterRelationRow[]
    | null;

  timeline_event_characters:
    | TimelineCharacterLinkRow[]
    | null;
}

const EVENT_SELECT = `
  *,
  place:places (
    id,
    name,
    place_type
  ),
  chapter:chapters (
    id,
    title,
    position
  ),
  timeline_event_characters (
    role_in_event,
    character:characters (
      id,
      name,
      role
    )
  )
`;

function singleRelation<T>(
  relation: T | T[] | null,
): T | null {
  if (!relation) return null;

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function mapTimelineEvent(
  row: TimelineEventRow,
): TimelineEvent {
  const place = singleRelation(row.place);
  const chapter = singleRelation(row.chapter);

  const characters: TimelineCharacter[] = (
    row.timeline_event_characters ?? []
  ).flatMap((link) => {
    const character = singleRelation(link.character);

    if (!character) return [];

    return [
      {
        characterId: character.id,
        name: character.name,
        role: character.role ?? "",
        portraitUrl: null,
        roleInEvent: link.role_in_event ?? "",
      },
    ];
  });

  return {
    id: row.id,
    worldId: row.world_id,

    placeId: row.place_id,
    chapterId: row.chapter_id,

    title: row.title,
    fictionalDate: row.fictional_date ?? "",
    era: row.era ?? "",

    eventType: row.event_type,
    status: row.status,

    summary: row.summary ?? "",
    description: row.description ?? "",

    importance: row.importance,
    sortOrder: Number(row.sort_order),

    place: place
      ? {
          id: place.id,
          name: place.name,
          placeType: place.place_type,
        }
      : null,

    chapter: chapter
      ? {
          id: chapter.id,
          title: chapter.title,
          position: chapter.position,
        }
      : null,

    characters,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTimelineEventRow(
  input: SaveTimelineEventInput,
) {
  const importance = Math.min(
    5,
    Math.max(1, input.importance ?? 3),
  );

  return {
    world_id: input.worldId,

    place_id: input.placeId ?? null,
    chapter_id: input.chapterId ?? null,

    title: input.title.trim(),
    fictional_date:
      input.fictionalDate?.trim() ?? "",
    era: input.era?.trim() ?? "",

    event_type: input.eventType,
    status: input.status,

    summary: input.summary?.trim() ?? "",
    description:
      input.description?.trim() ?? "",

    importance,
    sort_order: input.sortOrder,

    updated_at: new Date().toISOString(),
  };
}

function removeDuplicateParticipants(
  participants: TimelineParticipantInput[],
): TimelineParticipantInput[] {
  const participantsByCharacter = new Map<
    string,
    TimelineParticipantInput
  >();

  participants.forEach((participant) => {
    if (!participant.characterId) return;

    participantsByCharacter.set(
      participant.characterId,
      participant,
    );
  });

  return Array.from(
    participantsByCharacter.values(),
  );
}

async function replaceEventCharacters(
  eventId: string,
  participants: TimelineParticipantInput[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("timeline_event_characters")
    .delete()
    .eq("event_id", eventId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const uniqueParticipants =
    removeDuplicateParticipants(participants);

  if (uniqueParticipants.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("timeline_event_characters")
    .insert(
      uniqueParticipants.map((participant) => ({
        event_id: eventId,
        character_id: participant.characterId,
        role_in_event:
          participant.roleInEvent?.trim() ?? "",
      })),
    );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function listTimelineEvents(
  worldId: string,
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from("timeline_events")
    .select(EVENT_SELECT)
    .eq("world_id", worldId)
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data ?? []) as unknown as TimelineEventRow[]
  ).map(mapTimelineEvent);
}

export async function getTimelineEvent(
  worldId: string,
  eventId: string,
): Promise<TimelineEvent> {
  const { data, error } = await supabase
    .from("timeline_events")
    .select(EVENT_SELECT)
    .eq("world_id", worldId)
    .eq("id", eventId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTimelineEvent(
    data as unknown as TimelineEventRow,
  );
}

export async function createTimelineEvent(
  input: SaveTimelineEventInput,
): Promise<TimelineEvent> {
  if (!input.title.trim()) {
    throw new Error(
      "An event title is required.",
    );
  }

  const { data, error } = await supabase
    .from("timeline_events")
    .insert(toTimelineEventRow(input))
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    await replaceEventCharacters(
      data.id,
      input.characters ?? [],
    );
  } catch (error) {
    await supabase
      .from("timeline_events")
      .delete()
      .eq("id", data.id)
      .eq("world_id", input.worldId);

    throw error;
  }

  return getTimelineEvent(
    input.worldId,
    data.id,
  );
}

export async function updateTimelineEvent(
  eventId: string,
  input: SaveTimelineEventInput,
): Promise<TimelineEvent> {
  if (!input.title.trim()) {
    throw new Error(
      "An event title is required.",
    );
  }

  const { error } = await supabase
    .from("timeline_events")
    .update(toTimelineEventRow(input))
    .eq("id", eventId)
    .eq("world_id", input.worldId);

  if (error) {
    throw new Error(error.message);
  }

  await replaceEventCharacters(
    eventId,
    input.characters ?? [],
  );

  return getTimelineEvent(
    input.worldId,
    eventId,
  );
}

export async function deleteTimelineEvent(
  eventId: string,
  worldId: string,
): Promise<void> {
  const { error } = await supabase
    .from("timeline_events")
    .delete()
    .eq("id", eventId)
    .eq("world_id", worldId);

  if (error) {
    throw new Error(error.message);
  }
}

export function getTimelineEventTypeLabel(
  type: TimelineEventType,
): string {
  const labels: Record<
    TimelineEventType,
    string
  > = {
    birth: "Birth",
    death: "Death",
    battle: "Battle",
    political: "Political",
    relationship: "Relationship",
    discovery: "Discovery",
    journey: "Journey",
    prophecy: "Prophecy",
    historical: "Historical",
    personal: "Personal",
    other: "Other",
  };

  return labels[type];
}

export function getTimelineStatusLabel(
  status: TimelineEventStatus,
): string {
  const labels: Record<
    TimelineEventStatus,
    string
  > = {
    canonical: "Canonical",
    disputed: "Disputed",
    secret: "Secret",
    draft: "Draft",
  };

  return labels[status];
}