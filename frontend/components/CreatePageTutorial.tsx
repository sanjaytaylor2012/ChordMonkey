"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";

interface TutorialStep {
  id: string;
  target: string;
  title: string;
  description: string;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CreatePageTutorialProps {
  open: boolean;
  currentStep: number;
  steps: TutorialStep[];
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const TOOLTIP_WIDTH = 320;

export function CreatePageTutorial({
  open,
  currentStep,
  steps,
  onClose,
  onNext,
  onPrevious,
}: CreatePageTutorialProps) {
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const step = steps[currentStep];

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowRight") {
        onNext();
      }
      if (event.key === "ArrowLeft") {
        onPrevious();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onNext, onPrevious]);

  useLayoutEffect(() => {
    if (!open || !step) {
      setRect(null);
      return;
    }

    const targetElement = document.querySelector<HTMLElement>(
      `[data-tutorial="${step.target}"]`,
    );

    if (!targetElement) {
      setRect(null);
      return;
    }

    const element = targetElement;

    function updateRect() {
      const bounds = element.getBoundingClientRect();
      setRect({
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      });
    }

    const timeoutId = window.setTimeout(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      updateRect();
    }, 80);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open, step]);

  const tooltipStyle = useMemo(() => {
    if (!rect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }
    if (step.id === "add-section") {
      return {
        top: rect.top - 260,
        left: rect.left,
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - (rect.top + rect.height);
    const top =
      spaceBelow > 240
        ? rect.top + rect.height + 16
        : Math.max(16, rect.top - 220);
    const left = Math.min(
      Math.max(16, rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2),
      viewportWidth - TOOLTIP_WIDTH - 16,
    );

    return { top, left };
  }, [rect]);

  if (!open || !step) {
    return null;
  }

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/55" />

      {rect && (
        <div
          className="absolute rounded-2xl ring-4 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] transition-all duration-200"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}

      <div
        className="pointer-events-auto absolute w-[320px] rounded-2xl border border-border bg-card p-5 shadow-2xl"
        style={tooltipStyle}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Close
          </button>
        </div>

        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {step.title}
        </h3>
        <p className="mb-5 text-sm leading-6 text-muted-foreground whitespace-pre-line">
          {step.description}
        </p>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrevious}
            disabled={currentStep === 0}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={isLastStep ? onClose : onNext}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
