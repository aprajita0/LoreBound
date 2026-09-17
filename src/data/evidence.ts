import type { EvidenceReference } from "@/types/lorebound";

export const evidence: EvidenceReference[] = [
  {
    id: "ev-mirror",
    chapter: 20,
    chapterTitle: "Borrowed Faces",
    passage:
      "The mirror softened Omir's jaw, lengthened his hair, and returned Mira's practiced smile.",
    locationInChapter: "Chapter 20 · scene 2",
  },
  {
    id: "ev-lantern-hire",
    chapter: 21,
    chapterTitle: "The Low Lantern",
    passage:
      "Bram looked her over once, decided she was harmless, and handed Mira an apron that smelled of spilled cider.",
    locationInChapter: "Chapter 21 · scene 1",
  },
  {
    id: "ev-ethan-slip",
    chapter: 24,
    chapterTitle: "The Vow-Breaker",
    passage:
      "\"Omir,\" Ethan said, quite calmly, to the girl wiping down the bar. \"You're going to get yourself killed.\"",
    locationInChapter: "Chapter 24 · scene 3",
  },
  {
    id: "ev-ethan-earlier",
    chapter: 22,
    chapterTitle: "Delegates and Cider",
    passage:
      "Ethan watched the new serving girl for a long moment and decided he had never seen her before in his life.",
    locationInChapter: "Chapter 22 · scene 4",
  },
  {
    id: "ev-lynx-griffin",
    chapter: 23,
    chapterTitle: "What the Stone Keeps",
    passage:
      "For half a breath the shadow on the wall had feathers, and a beak, and a tail that did not belong to any cat.",
    locationInChapter: "Chapter 23 · scene 5",
  },
  {
    id: "ev-omir-senses",
    chapter: 18,
    chapterTitle: "A Wrongness in the Stone",
    passage:
      "Something under the flagstones flinched away from the delegate's shoes, and only Omir felt it flinch.",
    locationInChapter: "Chapter 18 · scene 1",
  },
  {
    id: "ev-omir-follows",
    chapter: 19,
    chapterTitle: "Three Streets Behind",
    passage:
      "He kept three streets behind the man, and the harbour stones passed his footsteps along like gossip.",
    locationInChapter: "Chapter 19 · scene 3",
  },
  {
    id: "ev-cup-tap",
    chapter: 22,
    chapterTitle: "Delegates and Cider",
    passage:
      "The delegate tapped the rim of his cup — twice, pause, twice — and a man by the door finished his drink and left.",
    locationInChapter: "Chapter 22 · scene 2",
  },
  {
    id: "ev-evidence-gather",
    chapter: 23,
    chapterTitle: "What the Stone Keeps",
    passage:
      "Mira memorised the ledger the way Omir had been taught to memorise lineages: in threes, and backwards.",
    locationInChapter: "Chapter 23 · scene 2",
  },
  {
    id: "ev-vowbreak",
    chapter: 24,
    chapterTitle: "The Vow-Breaker",
    passage:
      "A vow broken in Terra does not vanish. It settles into the ground and waits to be stepped on.",
    locationInChapter: "Chapter 24 · scene 6",
  },
  {
    id: "ev-omir-offensive",
    chapter: 24,
    chapterTitle: "The Vow-Breaker",
    passage:
      "Omir drove the flagstones upward in a wave and the delegate's guard went down beneath them, hard.",
    locationInChapter: "Chapter 24 · scene 7",
  },
  {
    id: "ev-omir-rule",
    chapter: 6,
    chapterTitle: "A Gentle Weapon",
    passage:
      "He had promised the stone, and himself, that he would never make a weapon of either.",
    locationInChapter: "Chapter 6 · scene 4",
  },
  {
    id: "ev-arthur-tavern",
    chapter: 22,
    chapterTitle: "Delegates and Cider",
    passage:
      "Arthur came in out of the rain with the delegation's seal still wet on his sleeve.",
    locationInChapter: "Chapter 22 · scene 1",
  },
  {
    id: "ev-soulbond",
    chapter: 4,
    chapterTitle: "Three Threads",
    passage:
      "The bond took in the dark of the dormitory, without ceremony, which is the only way the old bonds ever took.",
    locationInChapter: "Chapter 4 · scene 2",
  },
  {
    id: "ev-liam-house",
    chapter: 17,
    chapterTitle: "Unrecognised",
    passage:
      "House Cornelius sent no answer, which was itself the answer, and Liam stopped waiting by the gate.",
    locationInChapter: "Chapter 17 · scene 3",
  },
  {
    id: "ev-igwe",
    chapter: 2,
    chapterTitle: "What the Earth Remembers",
    passage:
      "The Igwe were not drowned with their islands. One of them was sent to school.",
    locationInChapter: "Chapter 2 · scene 1",
  },
  {
    id: "ev-arthur-feel",
    chapter: 21,
    chapterTitle: "The Low Lantern",
    passage:
      "Aria watched Omir watch Arthur leave, and said nothing, which was its own kind of cruelty.",
    locationInChapter: "Chapter 21 · scene 4",
  },
  {
    id: "ev-engagement",
    chapter: 15,
    chapterTitle: "A Suitable Match",
    passage:
      "The engagement was announced at dusk, so that nobody would have to look anyone in the eye.",
    locationInChapter: "Chapter 15 · scene 1",
  },
];

export const evidenceById = Object.fromEntries(evidence.map((e) => [e.id, e]));
