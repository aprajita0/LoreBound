import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Trash2, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Panel, PanelTitle } from "@/components/app/primitives";
import { useWorldMode } from "@/components/app/world-mode";
import { worldService } from "@/services/lorebound";

const preferences = [
  { key: "evidence", label: "Require evidence for every fact", detail: "Nothing is recorded without a passage to point at." },
  { key: "inferred", label: "Flag inferred knowledge", detail: "Mark knowledge states Lorebound guessed rather than read." },
  { key: "possessions", label: "Track character possessions", detail: "Notice when an object changes hands or vanishes." },
  { key: "injuries", label: "Track injuries", detail: "Carry physical state forward between chapters." },
  { key: "travel", label: "Track travel time", detail: "Raise a finding when a journey happens too fast." },
  { key: "magic", label: "Track magic rules", detail: "Compare spellwork against your approved world rules." },
];

export function SettingsPage() {
  const { guard, readOnly } = useWorldMode();
  const world = useQuery({ queryKey: ["world", "terra"], queryFn: () => worldService.get("terra") });
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    evidence: true,
    inferred: true,
    possessions: true,
    injuries: false,
    travel: true,
    magic: true,
  });
  const [sensitivity, setSensitivity] = useState([70]);
  const [deleting, setDeleting] = useState(false);

  const p = world.data;

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="World settings"
        title="The Isles of Terra"
        lede="How Lorebound reads this world, and who else can see it."
      />

      <div className="space-y-6">
        <Panel>
          <PanelTitle>Project details</PanelTitle>
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <div className="space-y-1.5">
              <Label htmlFor="s-title">Title</Label>
              <Input id="s-title" defaultValue={p?.title ?? ""} readOnly={readOnly} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-genre">Genre</Label>
              <Input id="s-genre" defaultValue={p?.genre ?? ""} readOnly={readOnly} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-desc">Description</Label>
              <Textarea id="s-desc" rows={3} defaultValue={p?.description ?? ""} readOnly={readOnly} />
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelTitle hint="How the manuscript is told">Story structure</PanelTitle>
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <div className="space-y-1.5">
              <Label>Point of view</Label>
              <Select defaultValue={p?.pointOfView ?? "Third person limited"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["First person", "Third person limited", "Third person omniscient"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tense</Label>
              <Select defaultValue={p?.tense ?? "Past"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Past", "Present"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-entities">Custom entity types</Label>
              <Input id="s-entities" defaultValue="Houses, Familiars, Vows, Islands" readOnly={readOnly} />
              <p className="text-xs text-muted-foreground">
                Comma separated. Lorebound will extract these alongside characters and places.
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-rules">Continuity rules</Label>
              <Textarea
                id="s-rules"
                rows={4}
                readOnly={readOnly}
                defaultValue={
                  "Omir avoids offensive magic.\nA broken vow marks the stone it was sworn on.\nFamiliars cannot change species.\nHouse recognition requires two living witnesses."
                }
              />
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelTitle hint="What Lorebound watches for">Analysis preferences</PanelTitle>
          <ul className="divide-y divide-border/50">
            {preferences.map((pref) => (
              <li key={pref.key} className="flex items-start justify-between gap-6 px-5 py-4">
                <div>
                  <Label htmlFor={`pref-${pref.key}`} className="text-sm text-foreground">
                    {pref.label}
                  </Label>
                  <p className="mt-0.5 text-sm text-muted-foreground">{pref.detail}</p>
                </div>
                <Switch
                  id={`pref-${pref.key}`}
                  checked={prefs[pref.key] ?? false}
                  onCheckedChange={(v) =>
                    guard(() => setPrefs((s) => ({ ...s, [pref.key]: v })))
                  }
                />
              </li>
            ))}
          </ul>
          <div className="border-t border-border/60 px-5 py-5">
            <Label htmlFor="sensitivity">Continuity detection sensitivity — {sensitivity[0]}%</Label>
            <Slider
              id="sensitivity"
              className="mt-3"
              value={sensitivity}
              onValueChange={setSensitivity}
              min={10}
              max={100}
              step={5}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Higher sensitivity raises more findings, including softer ones you may have intended.
            </p>
          </div>
        </Panel>

        <Panel>
          <PanelTitle hint="Who can see this world">Privacy and collaborators</PanelTitle>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <Label htmlFor="private" className="text-sm">Private world</Label>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Only you and invited collaborators can open it.
                </p>
              </div>
              <Switch id="private" defaultChecked onCheckedChange={() => guard()} />
            </div>
            <Button variant="outline" onClick={() => guard(() => toast.success("Invitation sent."))}>
              <UserPlus className="size-4" /> Invite a collaborator
            </Button>
          </div>
        </Panel>

        <Panel>
          <PanelTitle>Manuscript</PanelTitle>
          <div className="flex flex-wrap gap-3 p-5 sm:p-6">
            <Button variant="outline" onClick={() => guard(() => toast.success("Import started."))}>
              <Upload className="size-4" /> Import manuscript
            </Button>
            <Button variant="outline" onClick={() => guard(() => toast.success("Export prepared."))}>
              <Download className="size-4" /> Export world
            </Button>
          </div>
        </Panel>

        <Panel className="border-destructive/40">
          <PanelTitle hint="This cannot be undone">Delete project</PanelTitle>
          <div className="p-5 sm:p-6">
            <Button variant="destructive" onClick={() => guard(() => setDeleting(true))}>
              <Trash2 className="size-4" /> Delete this world
            </Button>
          </div>
        </Panel>
      </div>

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              Delete The Isles of Terra?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Every chapter, character, secret, and finding in this world is removed. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep the world</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toast.success("In the prototype, nothing was actually deleted.")}
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
