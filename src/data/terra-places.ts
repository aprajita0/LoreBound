import type { Location, LoreEntry } from "@/types/lorebound";

const P = "prj-terra";

export const terraLocations: Location[] = [
  {
    id: "loc-academy",
    projectId: P,
    name: "The Academy",
    kind: "Institution · neutral ground by charter",
    description:
      "Four centuries of worked stone on an island that was never meant to hold a building. Houses send their spare children here and call it education.",
    chapters: [2, 4, 6, 13, 17, 18, 20],
    presentCharacterIds: ["ch-omir", "ch-aria", "ch-ethan", "ch-corvane", "ch-lynx"],
    eventIds: ["evt-4", "evt-18", "evt-20"],
    secretIds: ["sec-bloodline", "sec-lynx"],
    travelLinks: [
      { toLocationId: "loc-harbor", detail: "Twenty minutes downhill; the court stones end at the third bridge." },
    ],
    evidenceIds: ["ev-soulbond", "ev-omir-senses"],
  },
  {
    id: "loc-lantern",
    projectId: P,
    name: "The Low Lantern",
    kind: "Tavern · harbour quarter",
    description:
      "A cider house with a bad floor and an excellent view of the door. Bram hires whoever looks harmless. The Mokshan delegation has visited four times without conducting any trade.",
    chapters: [19, 21, 22, 23, 24],
    presentCharacterIds: ["ch-omir", "ch-bram", "ch-delegate", "ch-arthur", "ch-ethan"],
    eventIds: ["evt-21", "evt-22", "evt-23", "evt-24"],
    secretIds: ["sec-mira", "sec-delegate-purpose"],
    travelLinks: [
      { toLocationId: "loc-delegation", detail: "Four streets east; the delegate walks it alone." },
      { toLocationId: "loc-harbor", detail: "Directly on the quarter's second lane." },
    ],
    evidenceIds: ["ev-lantern-hire", "ev-cup-tap", "ev-ethan-slip"],
  },
  {
    id: "loc-harbor",
    projectId: P,
    name: "Harbor Quarter",
    kind: "District · docks and chandleries",
    description:
      "The oldest walked ground on the island, which makes it the loudest to Omir and the most useful to anyone burying something.",
    chapters: [19, 21, 22, 23],
    presentCharacterIds: ["ch-omir", "ch-delegate", "ch-arthur"],
    eventIds: ["evt-19"],
    secretIds: ["sec-investigation"],
    travelLinks: [
      { toLocationId: "loc-lantern", detail: "Second lane, past the chandler's." },
      { toLocationId: "loc-academy", detail: "Uphill, twenty minutes." },
    ],
    evidenceIds: ["ev-omir-follows"],
  },
  {
    id: "loc-house-cornelius",
    projectId: P,
    name: "House Cornelius",
    kind: "Estate · old harbour money",
    description:
      "A house that recognises heirs publicly and refuses them silently. Liam waited at its gate for eleven days.",
    chapters: [15, 17],
    presentCharacterIds: ["ch-arthur", "ch-liam", "ch-aurelia"],
    eventIds: ["evt-15", "evt-17"],
    secretIds: [],
    travelLinks: [{ toLocationId: "loc-harbor", detail: "The estate's own quay." }],
    evidenceIds: ["ev-liam-house", "ev-engagement"],
  },
  {
    id: "loc-delegation",
    projectId: P,
    name: "Mokshan delegation residence",
    kind: "Residence · leased for the negotiations",
    description:
      "New construction, laid on new stone — which is precisely why Omir can sense nothing at all inside it.",
    chapters: [16, 22, 24],
    presentCharacterIds: ["ch-delegate"],
    eventIds: [],
    secretIds: ["sec-delegate-purpose"],
    travelLinks: [{ toLocationId: "loc-lantern", detail: "Four streets west." }],
    evidenceIds: ["ev-cup-tap"],
  },
];

export const terraLore: LoreEntry[] = [
  {
    id: "lore-igwe",
    projectId: P,
    title: "The Igwe bloodline",
    category: "bloodline",
    summary: "A drowned lineage that the Isles agreed, in writing, no longer exists.",
    body: [
      "The Igwe held the eastern stones for six generations and were lost when those islands went under. The record is unambiguous and the record is wrong.",
      "The Igwe were not drowned with their islands. One of them was sent to school.",
    ],
    relatedCharacterIds: ["ch-omir", "ch-ethan"],
    evidenceIds: ["ev-igwe"],
  },
  {
    id: "lore-terra",
    projectId: P,
    title: "Terra",
    category: "place",
    summary: "An archipelago whose worked stone retains what happens on it.",
    body: [
      "Terra is not merely a place with magic in it. Terra is the magic, and the islands are the part of it that has been stepped on.",
      "New construction is inert. Ground that has been walked for centuries is nearly talkative.",
    ],
    relatedCharacterIds: ["ch-omir"],
    evidenceIds: ["ev-vowbreak"],
  },
  {
    id: "lore-soulbond",
    projectId: P,
    title: "Soulbonds",
    category: "bond",
    summary: "Bonds that take without ceremony and cannot be undone, only denied.",
    body: [
      "The bond took in the dark of the dormitory, without ceremony, which is the only way the old bonds ever took.",
      "The Academy dissolves declared bonds between students as a matter of policy. It has no mechanism for undeclared ones.",
    ],
    relatedCharacterIds: ["ch-omir", "ch-aria", "ch-ethan"],
    evidenceIds: ["ev-soulbond"],
  },
  {
    id: "lore-familiars",
    projectId: P,
    title: "Familiars",
    category: "creature",
    summary: "Bonded creatures, registered by species, sharing senses at short range.",
    body: [
      "Registration is a formality performed by Master Corvane in under a minute per student.",
      "A familiar can hold a false form indefinitely while bonded. Strong light and deep shadow are the two conditions under which it cannot.",
    ],
    relatedCharacterIds: ["ch-lynx", "ch-omir", "ch-corvane"],
    evidenceIds: ["ev-lynx-griffin"],
  },
  {
    id: "lore-vowbreaking",
    projectId: P,
    title: "Vow-breaking",
    category: "law",
    summary: "A broken vow settles into the ground and waits to be stepped on.",
    body: [
      "A vow broken in Terra does not vanish. It settles into the ground and waits to be stepped on.",
      "A vow-breaker who can prevent the stone from holding the residue is doing something the Isles have no law for, because the Isles never imagined it.",
    ],
    relatedCharacterIds: ["ch-delegate", "ch-omir"],
    evidenceIds: ["ev-vowbreak", "ev-omir-senses"],
  },
  {
    id: "lore-recognition",
    projectId: P,
    title: "House recognition",
    category: "custom",
    summary: "Heirs are made by public acknowledgement, not by birth.",
    body: [
      "A House may decline to recognise without stating a reason. Silence is the instrument.",
      "House Cornelius sent no answer, which was itself the answer, and Liam stopped waiting by the gate.",
    ],
    relatedCharacterIds: ["ch-liam", "ch-arthur", "ch-aurelia"],
    evidenceIds: ["ev-liam-house"],
  },
  {
    id: "lore-earth-magic",
    projectId: P,
    title: "Earth magic",
    category: "magic",
    summary: "Reading and moving worked stone; strongest on long-walked ground.",
    body: [
      "Practitioners read residue before they move anything. Moving is the crude part.",
      "Omir promised the stone, and himself, that he would never make a weapon of either. He broke that promise in Chapter 24.",
    ],
    relatedCharacterIds: ["ch-omir"],
    evidenceIds: ["ev-omir-rule", "ev-omir-offensive"],
  },
];
