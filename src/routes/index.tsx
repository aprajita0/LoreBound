import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/app/site-chrome";
import { WorldWindow } from "@/components/marketing/world-window";
import { PassageToMemory } from "@/components/marketing/passage-to-memory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lorebound — Every fact. Every secret. Exactly when it matters." },
      {
        name: "description",
        content:
          "Lorebound remembers the people, secrets, promises and contradictions woven through your manuscript, so every thread stays connected as your world grows.",
      },
      { property: "og:title", content: "Lorebound — Every fact. Every secret. Exactly when it matters." },
      {
        property: "og:description",
        content:
          "A continuity and story-intelligence workspace for fiction writers. Explore a full demo world.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <PublicPage>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] lg:gap-14 lg:py-20">
          <div className="animate-rise">
            <p className="mb-5 text-[0.7rem] font-medium uppercase tracking-[0.26em] text-gold-soft">
              Every fact. Every secret. Exactly when it matters.
            </p>
            <h1 className="font-display text-[2.6rem] leading-[1.05] text-balance-tight text-foreground sm:text-[3.4rem]">
              Every story leaves a trail.
            </h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground">
              Lorebound remembers the people, secrets, promises, and contradictions woven through
              your manuscript&mdash;so every thread remains connected as your world grows.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/demo/terra">
                  Explore the Demo
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gold/40">
                <Link to="/signup">Begin Your World</Link>
              </Button>
              <Link
                to="/login"
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Log In
              </Link>
            </div>
          </div>

          <div className="animate-rise" style={{ animationDelay: "120ms" }}>
            <WorldWindow coverUrl="/covers/terra.jpg" />
          </div>
        </div>
      </section>

      <PassageToMemory />
    </PublicPage>
  );
}
