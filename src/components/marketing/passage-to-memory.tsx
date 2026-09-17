import { Link } from "@tanstack/react-router";
import { CalendarClock, Eye, HelpCircle, UserSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const extractions = [
  {
    icon: UserSquare,
    label: "Extracted identity",
    value: "Mira is Omir",
    tone: "text-plum",
  },
  {
    icon: Eye,
    label: "Knowledge state",
    value: "Omir knows; Aria suspects",
    tone: "text-mist",
  },
  {
    icon: CalendarClock,
    label: "Timeline event",
    value: "Mira created in Chapter 20",
    tone: "text-forest",
  },
  {
    icon: HelpCircle,
    label: "Continuity question",
    value: "Does Ethan learn the truth before Chapter 24?",
    tone: "text-gold",
  },
];

export function PassageToMemory() {
  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:py-24">
        <h2 className="max-w-2xl font-display text-[2rem] leading-tight text-foreground sm:text-[2.5rem]">
          From passage to story memory
        </h2>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] lg:gap-0">
          {/* The passage */}
          <figure className="relative rounded-lg border border-border/70 bg-surface/70 p-6 sm:p-8 lg:rounded-r-none lg:border-r-0">
            <figcaption className="mb-4 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Manuscript passage · Chapter 20
            </figcaption>
            <blockquote className="font-display text-[1.45rem] leading-[1.5] text-foreground sm:text-[1.7rem]">
              &ldquo;The mirror softened <mark className="bg-plum/25 text-foreground">Omir&rsquo;s</mark> jaw,
              lengthened his hair, and returned{" "}
              <mark className="bg-plum/25 text-foreground">Mira&rsquo;s</mark> practiced smile.&rdquo;
            </blockquote>
          </figure>

          {/* What Lorebound made of it */}
          <div className="relative rounded-lg border border-border/70 bg-background/40 p-6 sm:p-8 lg:rounded-l-none">
            <p className="mb-5 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-gold-soft">
              What Lorebound recorded
            </p>
            <ul className="space-y-0">
              {extractions.map(({ icon: Icon, label, value, tone }, i) => (
                <li
                  key={label}
                  className="relative flex gap-4 border-l border-dashed border-gold/35 py-3.5 pl-6"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span
                    className="absolute -left-[5px] top-6 size-2.5 rounded-full border border-gold/60 bg-background"
                    aria-hidden
                  />
                  <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-hidden />
                  <span>
                    <span className="block text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {label}
                    </span>
                    <span className="mt-0.5 block text-[1.02rem] text-foreground">{value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">
          Lorebound connects every extracted detail to its source, its place in the story, and the
          characters who know it.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/demo/terra">Explore the Full Demo</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-gold/40">
            <Link to="/signup">Create Your World</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
