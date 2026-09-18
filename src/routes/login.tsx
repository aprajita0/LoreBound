import { useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/app/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      {
        title: "Log in — Lorebound",
      },
      {
        name: "description",
        content:
          "Return to your story worlds in Lorebound.",
      },
      {
        property: "og:title",
        content: "Log in — Lorebound",
      },
      {
        property: "og:description",
        content:
          "Return to your story worlds in Lorebound.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const user = await signIn(email, password);

      toast.success(`Welcome back, ${user.name}.`);

      await navigate({
        to: "/worlds",
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Sign in failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Return to your worlds"
      lede="Your archive is exactly where you left it."
      footer={
        <>
          No account yet?{" "}
          <Link
            to="/signup"
            className="text-gold underline-offset-4 hover:underline"
          >
            Begin a world
          </Link>
        </>
      }
    >
      <form
        onSubmit={onSubmit}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>

          <Input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) =>
              setEmail(event.target.value)
            }
            disabled={busy}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>

            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Input
            id="password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) =>
              setPassword(event.target.value)
            }
            disabled={busy}
            required
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}

          {busy ? "Opening your archive…" : "Log In"}
        </Button>
      </form>
    </AuthLayout>
  );
}