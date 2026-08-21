"use client";

import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  ACTIVE_TAB,
  AFTER_STEPS_MS,
  AFTER_TYPING_MS,
  CHAR_MS,
  DEMO_CRITERIA,
  DEMO_ESSAY,
  DEMO_OVERALL,
  DEMO_PROMPT,
  DEMO_STEPS,
  DEMO_TABS,
  HOLD_REVEALED_MS,
  STEP_MS,
  type Phase,
} from "@/components/landing/ScoringDemo.data";
import { EASE_EDITORIAL, EDITORIAL_SPRING, SNAP } from "@/lib/motion";

/**
 * The hero's looping product demo: an essay types itself, three scoring steps run, a
 * band is revealed, and the whole thing restarts.
 *
 * ## Why the panel is `aria-hidden`
 *
 * It is a picture of the product, not the product. A looping animation exposed to the
 * accessibility tree would announce a new essay fragment several times a second,
 * forever. The `sr-only` paragraph immediately before it says in one sentence what the
 * panel depicts, which is what a screen-reader user actually needs from it.
 *
 * That decision cascades: the tabs and the "Xem bai mau" footer are styled text rather
 * than controls. Nothing inside a hidden subtree may be focusable, and there is no
 * sample-essay route for the footer to point at in any case.
 *
 * ## Rendering and hydration
 *
 * The server renders the finished state — full essay, all steps done, band revealed.
 * That is the sensible still frame if JavaScript never arrives, and it makes the first
 * paint identical on both sides of hydration. A layout effect rewinds to `typing`
 * before the browser paints, so the reader never sees the end state flash first.
 *
 * The loop suspends whenever nobody is watching: off-screen (`useInView`), on a hidden
 * tab (`visibilitychange`), or when the reader has asked for less motion — in which
 * case it never starts, and the revealed state is what stays on screen.
 */

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const PHASE_LABEL: Record<Phase, string> = {
  typing: "Your essay",
  scoring: "AI scoring",
  revealed: "Score revealed",
};

function StepIcon({ state }: { state: "pending" | "active" | "done" }) {
  if (state === "done") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-tertiary">
        <svg
          viewBox="0 0 24 24"
          className="size-3 text-on-tertiary"
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
    );
  }

  if (state === "active") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center">
        <motion.span
          className="block size-4 rounded-full border-2 border-outline-variant border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
        />
      </span>
    );
  }

  return (
    <span className="flex size-5 shrink-0 items-center justify-center">
      <span className="block size-2 rounded-full bg-outline-variant" />
    </span>
  );
}

export default function ScoringDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("revealed");
  const [typed, setTyped] = useState(DEMO_ESSAY.length);
  const [activeAnalysisStep, setActiveAnalysisStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number>(DEMO_STEPS.length);
  const [displayedScore, setDisplayedScore] = useState(DEMO_OVERALL);
  const [criteriaProgress, setCriteriaProgress] = useState(() =>
    DEMO_CRITERIA.map((criterion) => criterion.band / 9),
  );
  const [isComplete, setIsComplete] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const typedRef = useRef(DEMO_ESSAY.length);

const active = inView && pageVisible; // sửa gốc : const active = inView && pageVisible && !reduced;

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Rewind to the start before first paint. This also covers `useReducedMotion`
  // resolving to true a tick after mount: the panel snaps back to the finished state
  // rather than freezing halfway through an essay it will never finish typing.
  useIsomorphicLayoutEffect(() => {
    typedRef.current = 0;
    setTyped(0);
    setActiveAnalysisStep(null);
    setCompletedSteps(0);
    setDisplayedScore(0);
    setCriteriaProgress(DEMO_CRITERIA.map(() => 0));
    setIsComplete(false);
    setPhase("typing");
  }, [reduced]);

  // One cancellable sequence owns every transition, so no stage can finish out of order.
  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let frame = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const animations = new Set<{ stop: () => void }>();

    const wait = (duration: number) =>
      new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          resolve(!cancelled);
        }, duration);
        timers.add(timer);
      });

    const typeEssay = async () => {
      typedRef.current = 0;
      setTyped(0);
      const startedAt = performance.now();

      await new Promise<void>((resolve) => {
        const tick = (now: number) => {
          const next = Math.min(DEMO_ESSAY.length, Math.floor((now - startedAt) / CHAR_MS));
          typedRef.current = next;
          setTyped(next);
          if (next < DEMO_ESSAY.length && !cancelled) {
            frame = requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };
        frame = requestAnimationFrame(tick);
      });
    };

    const animateCriteria = async () => {
      for (let i = 0; i < DEMO_CRITERIA.length; i += 1) {
        if (cancelled) return false;
        const target = DEMO_CRITERIA[i].band / 9;
        const controls = animate(0, target, {
          duration: 0.7,
          ease: EASE_EDITORIAL,
          onUpdate: (value) => {
            if (!cancelled) {
              setCriteriaProgress((progress) =>
                progress.map((current, index) => (index === i ? value : current)),
              );
            }
          },
        });
        animations.add(controls);
        if (!(await wait(700))) return false;
        setCriteriaProgress((progress) =>
          progress.map((current, index) => (index === i ? target : current)),
        );
        controls.stop();
        animations.delete(controls);
      }
      return !cancelled;
    };

    const runDemo = async () => {
      while (!cancelled) {
        setPhase("typing");
        setActiveAnalysisStep(null);
        setCompletedSteps(0);
        setDisplayedScore(0);
        setCriteriaProgress(DEMO_CRITERIA.map(() => 0));
        setIsComplete(false);
        await typeEssay();
        if (!(await wait(AFTER_TYPING_MS))) break;

        setPhase("scoring");
        for (let i = 0; i < DEMO_STEPS.length; i += 1) {
          setActiveAnalysisStep(i);
          if (!(await wait(STEP_MS))) break;
          setCompletedSteps(i + 1);
          setActiveAnalysisStep(null);
        }
        if (cancelled) break;
        if (!(await wait(AFTER_STEPS_MS))) break;

        setPhase("revealed");
        const scoreControls = animate(0, DEMO_OVERALL, {
          duration: 1.4,
          ease: EASE_EDITORIAL,
          onUpdate: (value) => {
            if (!cancelled) setDisplayedScore(value);
          },
        });
        animations.add(scoreControls);
        if (!(await wait(1400))) break;
        setDisplayedScore(DEMO_OVERALL);
        scoreControls.stop();
        animations.delete(scoreControls);
        if (!(await animateCriteria())) break;
        setIsComplete(true);
        if (!(await wait(HOLD_REVEALED_MS))) break;
      }
    };

    void runDemo();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      timers.forEach((timer) => clearTimeout(timer));
      animations.forEach((animation) => animation.stop());
    };
  }, [active]);

  const words = DEMO_ESSAY.slice(0, typed).trim().split(/\s+/).filter(Boolean).length;

  return (
    <div ref={ref} className="relative">
      <p className="sr-only">
        An illustration of the grader at work: a sample Task 2 essay is typed out, checked
        against the four IELTS assessment criteria, and given a provisional overall band of{" "}
        {DEMO_OVERALL.toFixed(1)}.
      </p>

      {/* A colour block bleeding out from behind the panel, so it reads as pasted onto
          the page rather than as a card sitting inside a column. */}
      <span
        aria-hidden="true"
        data-decoration
        className="absolute -right-6 -top-8 -z-10 hidden size-48 rounded-blob bg-primary-container/25 lg:block"
      />

      <motion.div
        aria-hidden="true"
        data-tilt
        data-demo-phase={phase}
        data-active-analysis-step={activeAnalysisStep ?? ""}
        data-completed-steps={completedSteps}
        data-demo-complete={isComplete}
        initial={{ opacity: 0, x: 60, rotate: 6, scale: 0.94 }}
        animate={{ opacity: 1, x: 0, rotate: -1.5, scale: 1 }}
        transition={{ ...EDITORIAL_SPRING, delay: 0.25 }}
        className="relative overflow-hidden rounded-xl border-2 border-ink bg-surface-container-lowest shadow-brutal"
      >
        {/* Tape, breaking the panel's own corner. */}
        <span
          data-decoration
          data-tilt
          className="absolute -left-8 -top-3 z-raised h-7 w-32 -rotate-[24deg] bg-accent-yellow-soft/90 shadow-hairline"
        />

        <div className="flex items-center gap-1 border-b-2 border-ink bg-surface-container-low px-3 pt-3">
          {DEMO_TABS.map((tab) => (
            <span
              key={tab}
              className={`rounded-t-md px-3.5 py-2 font-body text-body-sm font-bold ${
                tab === ACTIVE_TAB
                  ? "bg-surface-container-lowest text-on-surface"
                  : "text-on-surface-variant"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="font-body text-mono-caps uppercase text-on-surface-variant"
            >
              {PHASE_LABEL[phase]}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {phase === "scoring" ? (
              <motion.span
                key="analyzing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 rounded-full bg-primary-fixed px-2.5 py-1 font-body text-[11px] font-bold text-on-primary-fixed"
              >
                <motion.span
                  className="block size-1.5 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                Analyzing
              </motion.span>
            ) : phase === "revealed" && isComplete ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-full bg-tertiary-container px-2.5 py-1 font-body text-[11px] font-bold text-on-tertiary-container"
              >
                Complete
              </motion.span>
            ) : phase === "revealed" ? (
              <motion.span
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-body text-[11px] font-semibold tabular-nums text-on-surface-variant"
              >
                Final result
              </motion.span>
            ) : (
              <motion.span
                key="count"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-body text-[11px] font-semibold tabular-nums text-on-surface-variant"
              >
                {words} words
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="min-h-[272px] px-5 py-4">
          <AnimatePresence mode="wait">
            {phase === "typing" && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.15 } }}
              >
                <p className="mb-3 rounded-md border-l-2 border-primary bg-surface-container-low px-3 py-2 font-body text-body-sm italic text-on-surface-variant">
                  {DEMO_PROMPT}
                </p>
                <p className="font-body text-body-sm leading-relaxed text-on-surface">
                  {DEMO_ESSAY.slice(0, typed)}
                  {typed < DEMO_ESSAY.length && (
                    <span className="ml-px inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-caret bg-primary" />
                  )}
                </p>
                {typed < DEMO_ESSAY.length && (
                  <p className="mt-3 animate-pulse font-body text-[11px] text-on-surface-variant">
                    Bạn đang gõ bài...
                  </p>
                )}
              </motion.div>
            )}

            {phase === "scoring" && (
              <motion.div
                key="scoring"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.15 } }}
                className="flex flex-col justify-center gap-1 py-6"
              >
                {DEMO_STEPS.map((label, i) => {
                  const state = completedSteps > i
                    ? "done"
                    : activeAnalysisStep === i
                      ? "active"
                      : "pending";
                  return (
                    <motion.div
                      key={label}
                      className={`flex items-center gap-3 rounded-md px-2 py-3 transition-colors ${
                        state === "active" ? "bg-accent-yellow-soft" : ""
                      }`}
                      animate={{
                        opacity: state === "pending" ? 0.45 : 1,
                        x: state === "active" ? 4 : 0,
                      }}
                      transition={SNAP}
                    >
                      <StepIcon state={state} />
                      <span
                        className={`font-body text-body-sm ${
                          state === "pending"
                            ? "text-on-surface-variant"
                            : "font-semibold text-on-surface"
                        }`}
                      >
                        {label}
                      </span>
                    </motion.div>
                  );
                })}

                <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-container">
                  <motion.div
                    className="h-full rounded-full bg-primary-container"
                    animate={{ width: `${(completedSteps / DEMO_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: EASE_EDITORIAL }}
                  />
                </div>
              </motion.div>
            )}

            {phase === "revealed" && (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.15 } }}
              >
                <div className="mb-5 flex items-end gap-4">
                  <motion.p
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...EDITORIAL_SPRING, delay: 0.05 }}
                    className="font-display text-[64px] font-bold leading-none tabular-nums text-on-surface"
                  >
                    {displayedScore.toFixed(1)}
                  </motion.p>
                  <div className="pb-2">
                    <p className="font-body text-body-sm font-bold text-on-surface">Overall band</p>
                    {/* Constitution TP-1: a band is never shown as a settled result. */}
                    <p className="font-body text-[11px] text-on-surface-variant">
                      Provisional estimate
                    </p>
                  </div>
                </div>

                <ul className="flex flex-col gap-2.5">
                  {DEMO_CRITERIA.map((criterion, i) => (
                    <motion.li
                      key={criterion.short}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: EASE_EDITORIAL }}
                      className="flex items-center gap-3"
                    >
                      <span className="w-9 shrink-0 font-body text-[11px] font-bold text-on-surface-variant">
                        {criterion.short}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
                        <motion.span
                          className="block h-full rounded-full bg-primary-container"
                          initial={{ width: 0 }}
                          animate={{ width: `${criteriaProgress[i] * 100}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </span>
                      <span className="w-7 shrink-0 text-right font-body text-body-sm font-bold tabular-nums text-on-surface">
                        {criterion.band.toFixed(1)}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-5 py-3">
          <span className="font-body text-body-sm font-semibold text-primary">Xem bài mẫu →</span>
          <span className="font-body text-[11px] text-on-surface-variant">
            4 official IELTS criteria
          </span>
        </div>
      </motion.div>
    </div>
  );
}
