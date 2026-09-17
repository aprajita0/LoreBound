import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/app/site-chrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Lorebound — What it understands about your story" },
      {
        name: "description",
        content:
          "Lorebound understands what is true in a fictional world, when it becomes true, and which characters know it.",
      },
      { property: "og:title", content: "About Lorebound" },
      {
        property: "og:description",
        content: "Story intelligence for fiction writers, built around evidence rather than guesses.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PublicPage>
      <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
        <p className="mb-4 text-[0.7rem] font-medium uppercase tracking-[0.26em] text-gold-soft">
          About
        </p>
        <h1 className="font-display text-[2.4rem] leading-tight text-foreground sm:text-[3rem]">
          Lorebound understands what is true in a fictional world, when it becomes true, and which
          characters know it.
        </h1>

        <div className="mt-10 space-y-6 text-[1.05rem] leading-relaxed text-muted-foreground">
          <p>
            A manuscript is not a database, but it behaves like one. Every scene adds facts, moves
            people between places, hands somebody a secret, and quietly contradicts something you
            wrote four months ago. Most writing tools store your words. Lorebound reads them and
            keeps the world they describe.
          </p>
          <p>
            Lorebound is not a chatbot and it does not write for you. It never invents a fact it
            cannot point at. Every character, relationship, secret, timeline event and continuity
            question in your world traces back to a passage you wrote, in the chapter you wrote it.
          </p>
          <p>
            The part that matters most is knowledge. A fact being true is one thing. A character
            knowing it is another, and knowing it two chapters too early is the kind of error that
            survives three rounds of edits. Lorebound tracks both, chapter by chapter.
          </p>
          <p className="font-display text-[1.3rem] italic text-foreground">
            Every fact. Every secret. Exactly when it matters.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/demo/terra">Explore the Demo</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-gold/40">
            <Link to="/signup">Begin Your World</Link>
          </Button>
        </div>
      </article>
    </PublicPage>
  );
}
