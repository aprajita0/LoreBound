import type { ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  Map,
  MapPin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  getPlaceStatusLabel,
  getPlaceTypeLabel,
  type Place,
} from "@/services/places";

interface PlaceDrawerProps {
  place: Place | null;
  places: Place[];
  deleting?: boolean;
  onClose: () => void;
  onEdit: (place: Place) => void;
  onDelete: (place: Place) => void;
  onSelectPlace: (place: Place) => void;
}

export function PlaceDrawer({
  place,
  places,
  deleting = false,
  onClose,
  onEdit,
  onDelete,
  onSelectPlace,
}: PlaceDrawerProps) {
  if (!place) return null;

  const parent =
    places.find(
      (candidate) => candidate.id === place.parentPlaceId,
    ) ?? null;

  const childPlaces = places.filter(
    (candidate) => candidate.parentPlaceId === place.id,
  );

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close place details"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <aside className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-border bg-background shadow-2xl">
        <div className="relative h-72 overflow-hidden bg-muted">
          {place.imagePath ? (
            <img
              src={place.imagePath}
              alt={place.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(200,164,92,0.22),transparent_42%),linear-gradient(145deg,#182335,#080d17)]">
              <Map className="size-16 text-gold/60" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-black/20" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60"
          >
            <X className="size-5" />
          </button>

          <div className="absolute bottom-5 left-6 right-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge>{getPlaceTypeLabel(place.placeType)}</Badge>
              <Badge>{getPlaceStatusLabel(place.status)}</Badge>
            </div>

            <h2 className="font-serif text-4xl text-foreground">
              {place.name}
            </h2>

            {place.summary && (
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                {place.summary}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-8 px-7 pb-10 pt-7">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onEdit(place)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
            >
              <Pencil className="size-4" />
              Edit place
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete(place)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>

          <DetailSection title="Location">
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail
                icon={<MapPin className="size-4" />}
                label="Located within"
                value={parent?.name ?? "No parent location"}
              />

              <Detail
                icon={<Building2 className="size-4" />}
                label="Place type"
                value={getPlaceTypeLabel(place.placeType)}
              />

              <Detail
                icon={<Map className="size-4" />}
                label="Coordinates"
                value={
                  place.mapX !== null && place.mapY !== null
                    ? `${place.mapX}, ${place.mapY}`
                    : "Not positioned"
                }
              />

              <Detail
                icon={<CalendarDays className="size-4" />}
                label="Last updated"
                value={new Date(place.updatedAt).toLocaleDateString()}
              />
            </div>
          </DetailSection>

          {place.description && (
            <DetailSection title="About this place">
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {place.description}
              </p>
            </DetailSection>
          )}

          {place.aliases.length > 0 && (
            <DetailSection title="Also known as">
              <div className="flex flex-wrap gap-2">
                {place.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {childPlaces.length > 0 && (
            <DetailSection title="Locations inside this place">
              <div className="space-y-2">
                {childPlaces.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => onSelectPlace(child)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 text-left transition hover:border-gold/40 hover:bg-muted/40"
                  >
                    <div>
                      <p className="font-serif text-foreground">
                        {child.name}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {getPlaceTypeLabel(child.placeType)}
                      </p>
                    </div>

                    <MapPin className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </DetailSection>
          )}
        </div>
      </aside>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-gold">
        {title}
      </h3>

      {children}
    </section>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-gold/30 bg-black/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-gold backdrop-blur">
      {children}
    </span>
  );
}