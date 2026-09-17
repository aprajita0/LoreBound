import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/app/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/lorebound";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Lorebound" },
      { name: "description", content: "Send yourself a Lorebound password reset link." },
      { property: "og:title", content: "Reset your password — Lorebound" },
      { property: "og:description", content: "Send yourself a Lorebound password reset link." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await authService.requestPasswordReset(email);
      setSentTo(res.sentTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Find your way back"
      lede="We'll send a reset link to the address on your account."
      footer={
        <Link to="/login" className="text-gold underline-offset-4 hover:underline">
          Back to log in
        </Link>
      }
    >
      {sentTo ? (
        <div className="flex items-start gap-3 rounded-lg border border-forest/40 bg-forest/10 px-4 py-4">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">Reset link sent</p>
            <p className="mt-1 text-sm text-muted-foreground">
              If an account exists for {sentTo}, a link is on its way.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
