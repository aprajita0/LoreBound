import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Local-only persistence for the Writing Studio. Scene drafts, manuscript
 * structure edits, snapshots and approved review suggestions live in
 * localStorage until a real backend exists.
 */

export type SaveState = "idle" | "saving" | "saved";

export type OutlineStatus = "planned" | "drafting" | "revised" | "final";

export interface SceneOverride {
  title?: string;
  archived?: boolean;
  status?: OutlineStatus;
}

export interface ExtraScene {
  id: string;
  chapterId: string;
  title: string;
  after?: string;
}

export interface ExtraChapter {
  id: string;
  partId: string;
  title: string;
  number: number;
}

export interface Snapshot {
  id: string;
  sceneId: string;
  label: string;
  when: string;
  words: number;
  html: string;
  manual: boolean;
}

interface StudioState {
  scenes: Record<string, string>;
  approved: string[];
  rejected: string[];
  sceneOverrides: Record<string, SceneOverride>;
  chapterTitles: Record<string, string>;
  extraScenes: ExtraScene[];
  extraChapters: ExtraChapter[];
  sceneOrder: Record<string, string[]>;
  snapshots: Snapshot[];
}

const empty: StudioState = {
  scenes: {},
  approved: [],
  rejected: [],
  sceneOverrides: {},
  chapterTitles: {},
  extraScenes: [],
  extraChapters: [],
  sceneOrder: {},
  snapshots: [],
};

function keyFor(scope: string) {
  return `lorebound.studio.v2.${scope}`;
}

function read(scope: string): StudioState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(keyFor(scope));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<StudioState>;
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

function write(scope: string, state: StudioState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(scope), JSON.stringify(state));
  } catch {
    /* storage unavailable — drafts stay in memory for this session */
  }
}

function countWords(text: string) {
  const plain = text.replace(/<[^>]*>/g, " ");
  return plain.trim() ? plain.trim().split(/\s+/).length : 0;
}

export function useStudioStore(scope: string) {
  const [state, setState] = useState<StudioState>(empty);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<StudioState>(empty);

  latest.current = state;

  useEffect(() => {
    const loaded = read(scope);
    latest.current = loaded;
    setState(loaded);
    setHydrated(true);
  }, [scope]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /** Debounced autosave — used for prose typing. */
  const persist = useCallback(
    (update: (prev: StudioState) => StudioState) => {
      const next = update(latest.current);
      latest.current = next;
      setState(next);
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        write(scope, next);
        setSaveState("saved");
      }, 700);
    },
    [scope],
  );

  /** Immediate save — used for structural edits. */
  const commit = useCallback(
    (update: (prev: StudioState) => StudioState) => {
      const next = update(latest.current);
      latest.current = next;
      setState(next);
      write(scope, next);
      setSaveState("saved");
    },
    [scope],
  );

  const setSceneText = useCallback(
    (sceneId: string, html: string) => {
      persist((prev) => ({ ...prev, scenes: { ...prev.scenes, [sceneId]: html } }));
    },
    [persist],
  );

  const approve = useCallback(
    (id: string) =>
      commit((prev) => ({
        ...prev,
        approved: [...new Set([...prev.approved, id])],
        rejected: prev.rejected.filter((r) => r !== id),
      })),
    [commit],
  );

  const reject = useCallback(
    (id: string) =>
      commit((prev) => ({
        ...prev,
        rejected: [...new Set([...prev.rejected, id])],
        approved: prev.approved.filter((a) => a !== id),
      })),
    [commit],
  );

  const renameScene = useCallback(
    (sceneId: string, title: string) =>
      commit((prev) => ({
        ...prev,
        sceneOverrides: {
          ...prev.sceneOverrides,
          [sceneId]: { ...prev.sceneOverrides[sceneId], title },
        },
      })),
    [commit],
  );

  const setSceneStatus = useCallback(
    (sceneId: string, status: OutlineStatus) =>
      commit((prev) => ({
        ...prev,
        sceneOverrides: {
          ...prev.sceneOverrides,
          [sceneId]: { ...prev.sceneOverrides[sceneId], status },
        },
      })),
    [commit],
  );

  const archiveScene = useCallback(
    (sceneId: string, archived: boolean) =>
      commit((prev) => ({
        ...prev,
        sceneOverrides: {
          ...prev.sceneOverrides,
          [sceneId]: { ...prev.sceneOverrides[sceneId], archived },
        },
      })),
    [commit],
  );

  const renameChapter = useCallback(
    (chapterId: string, title: string) =>
      commit((prev) => ({ ...prev, chapterTitles: { ...prev.chapterTitles, [chapterId]: title } })),
    [commit],
  );

  const addScene = useCallback(
    (chapterId: string, title: string, after?: string) => {
      const id = `extra-${Date.now().toString(36)}`;
      commit((prev) => ({
        ...prev,
        extraScenes: [...prev.extraScenes, { id, chapterId, title, ...(after ? { after } : {}) }],
      }));
      return id;
    },
    [commit],
  );

  const duplicateScene = useCallback(
    (chapterId: string, title: string, html: string, after?: string) => {
      const id = `extra-${Date.now().toString(36)}`;
      commit((prev) => ({
        ...prev,
        extraScenes: [...prev.extraScenes, { id, chapterId, title, ...(after ? { after } : {}) }],
        scenes: { ...prev.scenes, [id]: html },
      }));
      return id;
    },
    [commit],
  );

  const addChapter = useCallback(
    (partId: string, title: string, number: number) => {
      const id = `extra-ch-${Date.now().toString(36)}`;
      commit((prev) => ({
        ...prev,
        extraChapters: [...prev.extraChapters, { id, partId, title, number }],
      }));
      return id;
    },
    [commit],
  );

  const setSceneOrder = useCallback(
    (chapterId: string, order: string[]) =>
      commit((prev) => ({ ...prev, sceneOrder: { ...prev.sceneOrder, [chapterId]: order } })),
    [commit],
  );

  const saveSnapshot = useCallback(
    (sceneId: string, label: string, html: string, manual = true) =>
      commit((prev) => ({
        ...prev,
        snapshots: [
          {
            id: `snap-${Date.now().toString(36)}`,
            sceneId,
            label,
            when: new Date().toISOString(),
            words: countWords(html),
            html,
            manual,
          },
          ...prev.snapshots,
        ].slice(0, 20),
      })),
    [commit],
  );

  const restoreSnapshot = useCallback(
    (snapshotId: string) => {
      const snap = latest.current.snapshots.find((s) => s.id === snapshotId);
      if (!snap) return;
      commit((prev) => ({ ...prev, scenes: { ...prev.scenes, [snap.sceneId]: snap.html } }));
    },
    [commit],
  );

  return {
    hydrated,
    sceneText: state.scenes,
    approved: state.approved,
    rejected: state.rejected,
    sceneOverrides: state.sceneOverrides,
    chapterTitles: state.chapterTitles,
    extraScenes: state.extraScenes,
    extraChapters: state.extraChapters,
    sceneOrder: state.sceneOrder,
    snapshots: state.snapshots,
    saveState,
    setSceneText,
    approve,
    reject,
    renameScene,
    setSceneStatus,
    archiveScene,
    renameChapter,
    addScene,
    duplicateScene,
    addChapter,
    setSceneOrder,
    saveSnapshot,
    restoreSnapshot,
  };
}
