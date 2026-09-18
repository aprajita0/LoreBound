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

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      {
        title: "Begin a world — Lorebound",
      },
      {
        name: "description",
        content:
          "Create a Lorebound account and start mapping the story world inside your manuscript.",
      },
      {
        property: "og:title",
        content: "Begin a world — Lorebound",
      },
      {
        property: "og:description",
        content:
          "Start mapping the story world inside your manuscript.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signUp } = useSession();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Enter the name you want to write under.");
      return;
    }

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Choose a password containing at least 8 characters.",
      );
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await signUp(
        name,
        email,
        password,
      );

      if (result.requiresEmailConfirmation) {
        toast.success(
          "Check your email to confirm your Lorebound account.",
        );

        await navigate({
          to: "/login",
        });

        return;
      }

      toast.success("Your archive is ready.");

      await navigate({
        to: "/worlds",
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Sign up failed.",
      );
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
          <Link
            to="/login"
            className="text-gold underline-offset-4 hover:underline"
          >
            Log in
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
          <Label htmlFor="name">Name</Label>

          <Input
            id="name"
            value={name}
            autoComplete="name"
            onChange={(event) =>
              setName(event.target.value)
            }
            disabled={busy}
            required
          />
        </div>

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
          <Label htmlFor="password">Password</Label>

          <Input
            id="password"
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(event) =>
              setPassword(event.target.value)
            }
            disabled={busy}
            required
          />

          <p className="text-xs text-muted-foreground">
            Use at least 8 characters.
          </p>
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

          {busy ? "Preparing your archive…" : "Create Account"}
        </Button>
      </form>
    </AuthLayout>
  );
}