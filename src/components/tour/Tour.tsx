import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/pm-supabase-store";
import { cn } from "@/lib/utils";

const TOUR_STORAGE_KEY = "product-pal-tour-v1";

type TourContext = {
  navigate: (path: string) => void;
};

type TourStep = {
  id: string;
  title: string;
  body: string;
  /** CSS selector for the element to highlight. Omitted = centred card. */
  selector?: string;
  /** Runs before the step is shown (navigation, loading the sample outcome). */
  before?: (ctx: TourContext) => Promise<void> | void;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Product Pal",
    body: "A quick 60-second look around. We'll use an example outcome so you can see how everything fits together.",
    before: ({ navigate }) => {
      navigate("/");
    },
  },
  {
    id: "teams",
    title: "Start with a team",
    body: "A project is a team or product area — the Editor team, say. It holds the outcomes that team is driving. You'll create yours at the end.",
    selector: '[data-tour="new-project"]',
  },
  {
    id: "outcome",
    title: "Everything hangs off an outcome",
    body: "This is a goal worth moving, with a metric, a starting point and a target. Here's an example outcome to explore.",
    selector: '[data-tour="node-outcome"]',
    before: async ({ navigate }) => {
      await useDataStore.getState().loadSampleTree();
      navigate("/editor");
      await wait(600);
    },
  },
  {
    id: "opportunity",
    title: "Opportunities are customer needs",
    body: "The problems, needs and pain points that stand between you and the outcome. They come from talking to customers, not from guessing.",
    selector: '[data-tour="node-opportunity"]',
  },
  {
    id: "solution",
    title: "Solutions and experiments",
    body: "Each opportunity gets solutions, and each solution gets small experiments to prove it's worth building before you build it.",
    selector: '[data-tour="node-solution"]',
  },
  {
    id: "ai",
    title: "Let the AI do the thinking",
    body: "Hover any opportunity, click its + pill and choose \"Suggest solutions with AI\". On a solution you can ask for experiments the same way.",
    selector: '[data-tour="node-opportunity"]',
  },
  {
    id: "views",
    title: "Four ways to see your work",
    body: "Switch between the tree, a work list, a dated roadmap and your customer interviews from here.",
    selector: '[data-tour="view-switcher"]',
  },
  {
    id: "finish",
    title: "Your turn",
    body: "This example isn't saved. Create your own team, add the outcome it's driving, and start mapping opportunities.",
    selector: '[data-tour="new-project"]',
    before: async ({ navigate }) => {
      navigate("/");
      await wait(400);
    },
  },
];

type TourApi = {
  start: () => void;
  isActive: boolean;
};

const TourCtx = createContext<TourApi>({ start: () => {}, isActive: false });

export const useTour = () => useContext(TourCtx);

export function hasSeenTour() {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "done";
  } catch {
    return true;
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "done");
  } catch {
    /* ignore */
  }
}

type Rect = { top: number; left: number; width: number; height: number };

function useTargetRect(selector: string | undefined, stepIndex: number) {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    let frame = 0;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setRect((prev) => {
            if (
              prev &&
              Math.abs(prev.top - r.top) < 0.5 &&
              Math.abs(prev.left - r.left) < 0.5 &&
              Math.abs(prev.width - r.width) < 0.5 &&
              Math.abs(prev.height - r.height) < 0.5
            ) {
              return prev;
            }
            return { top: r.top, left: r.left, width: r.width, height: r.height };
          });
        }
      } else {
        setRect(null);
      }
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [selector, stepIndex]);

  return rect;
}

function TourOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(true);
  const ranRef = useRef<number | null>(null);

  const step = STEPS[stepIndex];
  const rect = useTargetRect(busy ? undefined : step.selector, stepIndex);

  useEffect(() => {
    if (ranRef.current === stepIndex) return;
    ranRef.current = stepIndex;

    let cancelled = false;
    setBusy(true);
    (async () => {
      try {
        await step.before?.({ navigate: (path) => navigate(path) });
      } catch (error) {
        console.error("Tour step failed:", error);
      }
      if (!cancelled) setBusy(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [stepIndex, step, navigate]);

  const finish = useCallback(() => {
    markTourSeen();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  const isLast = stepIndex === STEPS.length - 1;
  const padding = 8;

  const spotlight = rect
    ? {
        top: Math.max(rect.top - padding, 4),
        left: Math.max(rect.left - padding, 4),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }
    : null;

  const cardWidth = 340;
  const cardStyle: React.CSSProperties = spotlight
    ? (() => {
        const below = spotlight.top + spotlight.height + 14;
        const fitsBelow = below + 210 < window.innerHeight;
        const top = fitsBelow ? below : Math.max(spotlight.top - 210, 16);
        const left = Math.min(
          Math.max(spotlight.left + spotlight.width / 2 - cardWidth / 2, 16),
          window.innerWidth - cardWidth - 16,
        );
        return { top, left, width: cardWidth, position: "fixed" };
      })()
    : {
        top: "50%",
        left: "50%",
        width: cardWidth,
        transform: "translate(-50%, -50%)",
        position: "fixed",
      };

  return createPortal(
    <div className="fixed inset-0 z-[120]" aria-live="polite">
      {spotlight ? (
        <>
          {/* Four panels dim everything around the highlighted element. */}
          <div
            className="pointer-events-none fixed left-0 right-0 top-0 bg-slate-900/55"
            style={{ height: Math.max(spotlight.top, 0) }}
          />
          <div
            className="pointer-events-none fixed left-0 right-0 bottom-0 bg-slate-900/55"
            style={{ top: spotlight.top + spotlight.height }}
          />
          <div
            className="pointer-events-none fixed left-0 bg-slate-900/55"
            style={{
              top: spotlight.top,
              height: spotlight.height,
              width: Math.max(spotlight.left, 0),
            }}
          />
          <div
            className="pointer-events-none fixed right-0 bg-slate-900/55"
            style={{
              top: spotlight.top,
              height: spotlight.height,
              left: spotlight.left + spotlight.width,
            }}
          />
          <div
            className="pointer-events-none fixed rounded-xl ring-2 ring-primary transition-all duration-200"
            style={spotlight}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-900/55" />
      )}

      <div
        className={cn(
          "rounded-xl border border-border bg-background p-5 shadow-2xl transition-all duration-200",
          busy && "opacity-70",
        )}
        style={cardStyle}
        role="dialog"
        aria-label={step.title}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step {stepIndex + 1} of {STEPS.length}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish}>
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
              >
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
            >
              {isLast ? "Create my team" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  const api = useMemo<TourApi>(
    () => ({ start: () => setIsActive(true), isActive }),
    [isActive],
  );

  return (
    <TourCtx.Provider value={api}>
      {children}
      {isActive && <TourOverlay onClose={() => setIsActive(false)} />}
    </TourCtx.Provider>
  );
}
