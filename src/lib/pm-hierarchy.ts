import { Target, Lightbulb, Zap, FlaskConical, type LucideIcon } from "lucide-react";

/**
 * Single source of truth for how the tree hierarchy is presented.
 *
 * Outcome > Opportunity > Solution > Experiment. Roadmap, work view and the
 * canvas nodes all read from here so the colour language stays consistent.
 * All values are semantic design tokens defined in `index.css`.
 */
export type HierarchyKind = "outcome" | "opportunity" | "solution" | "experiment";

export interface HierarchyStyle {
  /** Uppercase type label shown above titles. */
  label: string;
  icon: LucideIcon;
  /** Icon / accent text colour. */
  text: string;
  /** Row or card background. */
  surface: string;
  /** Hover background for interactive rows. */
  surfaceHover: string;
  /** Left accent bar colour. */
  accentBorder: string;
  /** Filled circle/square behind an icon. */
  iconBg: string;
  /** Outline badge styling. */
  badge: string;
}

export const HIERARCHY_STYLES: Record<HierarchyKind, HierarchyStyle> = {
  outcome: {
    label: "Outcome",
    icon: Target,
    text: "text-outcome",
    surface: "bg-outcome-surface",
    surfaceHover: "hover:bg-outcome-surface-strong",
    accentBorder: "border-l-outcome-border",
    iconBg: "bg-outcome-soft",
    badge: "bg-outcome-surface text-outcome border-outcome-border",
  },
  opportunity: {
    label: "Opportunity",
    icon: Lightbulb,
    text: "text-opportunity",
    surface: "bg-opportunity-surface",
    surfaceHover: "hover:bg-opportunity-surface-strong",
    accentBorder: "border-l-opportunity-border",
    iconBg: "bg-opportunity-soft",
    badge: "bg-opportunity-surface text-opportunity border-opportunity-border",
  },
  solution: {
    label: "Solution",
    icon: Zap,
    text: "text-solution",
    surface: "bg-solution-surface",
    surfaceHover: "hover:bg-solution-surface-strong",
    accentBorder: "border-l-solution-border",
    iconBg: "bg-solution-soft",
    badge: "bg-solution-surface text-solution border-solution-border",
  },
  experiment: {
    label: "Experiment",
    icon: FlaskConical,
    text: "text-experiment",
    surface: "bg-experiment-surface",
    surfaceHover: "hover:bg-experiment-surface-strong",
    accentBorder: "border-l-experiment-border",
    iconBg: "bg-experiment-soft",
    badge: "bg-experiment-surface text-experiment border-experiment-border",
  },
};

const NODE_TYPE_TO_KIND: Record<string, HierarchyKind> = {
  Outcome: "outcome",
  Opportunity: "opportunity",
  Solution: "solution",
  Experiment: "experiment",
};

export function hierarchyStyleForNodeType(type: string): HierarchyStyle {
  return HIERARCHY_STYLES[NODE_TYPE_TO_KIND[type] ?? "solution"];
}
