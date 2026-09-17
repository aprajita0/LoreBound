import type { Project, User } from "@/types/lorebound";

export const currentUser: User = {
  id: "user-1",
  name: "Aprajita",
  email: "aprajita@lorebound.studio",
  initials: "AS",
  penName: "A. Srivastava",
  joinedAt: "2025-11-04",
};

export const projects: Project[] = [
  {
    id: "prj-terra",
    slug: "terra",
    title: "The Isles of Terra",
    genre: "Epic Fantasy",
    palette: "terra",
    description:
      "A hidden heir follows a foreign delegate through borrowed identities, broken vows, and islands where stone remembers every promise.",
    coverUrl: "/covers/terra.jpg",
    chapterCount: 24,
    wordCount: 87430,
    characterCount: 18,
    unresolvedThreadCount: 7,
    lastOpenedLabel: "Last opened 2 hours ago",
    pointOfView: "Third person limited",
    tense: "Past",
    createdAt: "2025-12-02",
  },
  {
    id: "prj-glass",
    slug: "glass",
    title: "A City Made of Glass",
    genre: "Literary Science Fiction",
    palette: "glass",
    description:
      "In a city that records every conversation, an archivist begins deleting the sentences that would convict her brother.",
    coverUrl: "/covers/glass.jpg",
    chapterCount: 11,
    wordCount: 34120,
    characterCount: 9,
    unresolvedThreadCount: 3,
    lastOpenedLabel: "Last opened 6 days ago",
    pointOfView: "First person",
    tense: "Present",
    createdAt: "2026-02-19",
  },
  {
    id: "prj-cartographer",
    slug: "cartographer",
    title: "The Hollow Cartographer",
    genre: "Gothic Mystery",
    palette: "cartographer",
    description:
      "A mapmaker is hired to chart a house that grows a new room for every lie told inside it.",
    coverUrl: "/covers/cartographer.jpg",
    chapterCount: 7,
    wordCount: 19880,
    characterCount: 6,
    unresolvedThreadCount: 5,
    lastOpenedLabel: "Last opened 3 weeks ago",
    pointOfView: "Third person limited",
    tense: "Past",
    createdAt: "2026-05-30",
  },
];

export const worldAccent: Record<Project["palette"], { ink: string; wash: string; rule: string }> = {
  terra: {
    ink: "text-gold",
    wash: "from-forest/25 via-background to-background",
    rule: "border-gold/40",
  },
  glass: {
    ink: "text-mist",
    wash: "from-mist/20 via-background to-background",
    rule: "border-mist/40",
  },
  cartographer: {
    ink: "text-rose",
    wash: "from-wine/25 via-background to-background",
    rule: "border-wine/40",
  },
};
