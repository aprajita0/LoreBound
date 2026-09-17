import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/app/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Begin a world — Lorebound" },
      {
        name: "description",
        content: "Create a Lorebound account and start mapping the story world inside your manuscript.",
      },
      { property: "og:title", content: "Begin a world — Lorebound" },
      { property: "og:description", content: "Start mapping the story world inside your manuscript." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signUp } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("Aprajita");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 4) {
      setError("Choose a password of at least 4 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signUp(name, email);
      toast.success("Your archive is ready.");
      navigate({ to: "/worlds" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Begin a world"
      lede="Upload a manuscript later. For now, all you need is a name to write under."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-gold underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Create Account
        </Button>
      </form>
    </AuthLayout>
  );
}
