import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/app/site-chrome";
import { WorldWindow } from "@/components/marketing/world-window";
import { PassageToMemory } from "@/components/marketing/passage-to-memory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Lorebound — Every fact. Every secret. Exactly when it matters.",
      },
      {
        name: "description",
        content:
          "Lorebound remembers the people, secrets, promises and contradictions woven through your manuscript, so every thread stays connected as your world grows.",
      },
      {
        property: "og:title",
        content:
          "Lorebound — Every fact. Every secret. Exactly when it matters.",
      },
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
  const reduceMotion = useReducedMotion();

  return (
    <PublicPage>
      {/* Hero */}
      <section className="lorebound-hero relative overflow-hidden">
        <div className="lorebound-hero__atmosphere" aria-hidden="true">
          <div className="lorebound-hero__glow lorebound-hero__glow--teal" />
          <div className="lorebound-hero__glow lorebound-hero__glow--violet" />
          <div className="lorebound-hero__constellation">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="lorebound-hero__sigil">
            <span className="lorebound-hero__sigil-ring lorebound-hero__sigil-ring--outer" />
            <span className="lorebound-hero__sigil-ring lorebound-hero__sigil-ring--inner" />
            <span className="lorebound-hero__sigil-mark">LB</span>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] lg:gap-14 lg:py-20">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.p
              className="mb-5 text-[0.7rem] font-medium uppercase tracking-[0.26em] text-gold-soft"
              initial={reduceMotion ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
            >
              Every fact. Every secret. Exactly when it matters.
            </motion.p>
            <h1 className="font-display text-[2.6rem] leading-[1.05] text-balance-tight text-foreground sm:text-[3.4rem]">
              Every story leaves
              <span className="lorebound-hero__title-accent"> a trail.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground">
              Lorebound remembers the people, secrets, promises, and
              contradictions woven through your manuscript&mdash;so every thread
              remains connected as your world grows.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="lorebound-hero__primary-action"
              >
                <Link to="/demo/terra">
                  Explore the Demo
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-gold/40"
              >
                <Link to="/signup">Begin Your World</Link>
              </Button>
              <Link
                to="/login"
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Log In
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="lorebound-hero__window"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 34, scale: 0.965, rotateX: 3 }
            }
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            transition={{
              duration: 1,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={reduceMotion ? undefined : { y: -5, scale: 1.006 }}
          >
            <div className="lorebound-hero__window-glow" aria-hidden="true" />
            <WorldWindow coverUrl="/covers/terra.jpg" />
          </motion.div>
        </div>
      </section>

      <PassageToMemory />
    </PublicPage>
  );
}
