import { supabase } from "@/lib/supabase";

export type PlaceType =
  | "world"
  | "continent"
  | "kingdom"
  | "region"
  | "city"
  | "village"
  | "building"
  | "landmark"
  | "wilderness"
  | "other";

export type PlaceStatus =
  | "active"
  | "hidden"
  | "abandoned"
  | "destroyed"
  | "unknown";

export interface Place {
  id: string;
  worldId: string;
  parentPlaceId: string | null;

  name: string;
  placeType: PlaceType;
  status: PlaceStatus;

  summary: string;
  description: string;
  aliases: string[];
  imagePath: string | null;

  mapX: number | null;
  mapY: number | null;

  createdAt: string;
  updatedAt: string;
}

export interface SavePlaceInput {
  worldId: string;
  parentPlaceId?: string | null;

  name: string;
  placeType: PlaceType;
  status: PlaceStatus;

  summary?: string;
  description?: string;
  aliases?: string[];
  imagePath?: string | null;

  mapX?: number | null;
  mapY?: number | null;
}

interface PlaceRow {
  id: string;
  world_id: string;
  parent_place_id: string | null;

  name: string;
  place_type: PlaceType;
  status: PlaceStatus;

  summary: string | null;
  description: string | null;
  aliases: string[] | null;
  image_path: string | null;

  map_x: number | null;
  map_y: number | null;

  created_at: string;
  updated_at: string;
}

function mapPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    worldId: row.world_id,
    parentPlaceId: row.parent_place_id,

    name: row.name,
    placeType: row.place_type,
    status: row.status,

    summary: row.summary ?? "",
    description: row.description ?? "",
    aliases: row.aliases ?? [],
    imagePath: row.image_path,

    mapX: row.map_x,
    mapY: row.map_y,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPlaceRow(input: SavePlaceInput) {
  return {
    world_id: input.worldId,
    parent_place_id: input.parentPlaceId ?? null,

    name: input.name.trim(),
    place_type: input.placeType,
    status: input.status,

    summary: input.summary?.trim() ?? "",
    description: input.description?.trim() ?? "",
    aliases:
      input.aliases
        ?.map((alias) => alias.trim())
        .filter(Boolean) ?? [],
    image_path: input.imagePath?.trim() || null,

    map_x: input.mapX ?? null,
    map_y: input.mapY ?? null,

    updated_at: new Date().toISOString(),
  };
}

export async function listPlaces(
  worldId: string,
): Promise<Place[]> {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("world_id", worldId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PlaceRow[]).map(mapPlace);
}

export async function getPlace(
  worldId: string,
  placeId: string,
): Promise<Place> {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("world_id", worldId)
    .eq("id", placeId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapPlace(data as PlaceRow);
}

export async function createPlace(
  input: SavePlaceInput,
): Promise<Place> {
  if (!input.name.trim()) {
    throw new Error("A place name is required.");
  }

  const { data, error } = await supabase
    .from("places")
    .insert(toPlaceRow(input))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapPlace(data as PlaceRow);
}

export async function updatePlace(
  placeId: string,
  input: SavePlaceInput,
): Promise<Place> {
  if (!input.name.trim()) {
    throw new Error("A place name is required.");
  }

  if (input.parentPlaceId === placeId) {
    throw new Error(
      "A place cannot be its own parent location.",
    );
  }

  const { data, error } = await supabase
    .from("places")
    .update(toPlaceRow(input))
    .eq("id", placeId)
    .eq("world_id", input.worldId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapPlace(data as PlaceRow);
}

export async function deletePlace(
  placeId: string,
  worldId: string,
): Promise<void> {
  const { error } = await supabase
    .from("places")
    .delete()
    .eq("id", placeId)
    .eq("world_id", worldId);

  if (error) {
    throw new Error(error.message);
  }
}

export function getPlaceTypeLabel(
  type: PlaceType,
): string {
  const labels: Record<PlaceType, string> = {
    world: "World",
    continent: "Continent",
    kingdom: "Kingdom",
    region: "Region",
    city: "City",
    village: "Village",
    building: "Building",
    landmark: "Landmark",
    wilderness: "Wilderness",
    other: "Other",
  };

  return labels[type];
}

export function getPlaceStatusLabel(
  status: PlaceStatus,
): string {
  const labels: Record<PlaceStatus, string> = {
    active: "Active",
    hidden: "Hidden",
    abandoned: "Abandoned",
    destroyed: "Destroyed",
    unknown: "Unknown",
  };

  return labels[status];
}