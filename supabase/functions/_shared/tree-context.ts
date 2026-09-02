/**
 * Builds a rich, structured description of the problem space around a node so
 * AI features (solution suggestions, interview analysis) reason with the same
 * context a product manager would have in front of them.
 */

type AnyRow = Record<string, any>;

const MAX_SIBLING_OPPS = 8;
const MAX_SOLUTIONS = 12;
const MAX_EXPERIMENTS = 8;
const MAX_EVIDENCE = 6;

export interface TreeContextOptions {
  /** Client-supplied fallback used when the node is not yet synced to the DB. */
  fallback?: {
    title?: string;
    data?: AnyRow;
    outcomeTitle?: string;
    /** Tree the node belongs to, so project context still loads when unsynced. */
    treeId?: string;
  };
  /** Extra free-text steer from the user. */
  steer?: string;
}

const clip = (value: unknown, max = 400): string => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const section = (heading: string, lines: (string | null | undefined | false)[]) => {
  const body = lines.filter(Boolean) as string[];
  if (body.length === 0) return null;
  return `${heading}\n${body.map((l) => `- ${l}`).join("\n")}`;
};

function describeOutcome(outcome: AnyRow | null, fallbackTitle?: string): string | null {
  if (!outcome) return fallbackTitle ? section("## OUTCOME", [clip(fallbackTitle)]) : null;
  const d = (outcome.data ?? {}) as AnyRow;
  const measure = [
    d.metric ? `Metric: ${clip(d.metric, 120)}` : null,
    d.baseline !== undefined && d.baseline !== null ? `baseline ${d.baseline}` : null,
    d.current !== undefined && d.current !== null ? `current ${d.current}` : null,
    d.target !== undefined && d.target !== null ? `target ${d.target}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return section("## OUTCOME", [
    clip(outcome.title, 200),
    d.description ? `Description: ${clip(d.description)}` : null,
    measure || null,
    d.timeframe ? `Timeframe: ${clip(d.timeframe, 80)}` : null,
    d.timeframeStartDate || d.timeframeEndDate
      ? `Window: ${d.timeframeStartDate ?? "?"} → ${d.timeframeEndDate ?? "?"}`
      : null,
  ]);
}

function describeOpportunity(
  title: string,
  data: AnyRow,
  notes?: string | null,
  links?: unknown,
): string | null {
  const linkList = Array.isArray(links)
    ? (links as AnyRow[]).map((l) => (typeof l === "string" ? l : l?.url)).filter(Boolean)
    : [];
  const evidenceLinks = Array.isArray(data.evidence)
    ? (data.evidence as AnyRow[]).map((e) => e?.label || e?.url).filter(Boolean)
    : [];

  const rice = [
    data.reach !== undefined && data.reach !== null ? `reach ${data.reach}` : null,
    data.impact !== undefined && data.impact !== null ? `impact ${data.impact}` : null,
    data.confidence !== undefined && data.confidence !== null ? `confidence ${data.confidence}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return section("## OPPORTUNITY (the customer need to solve)", [
    clip(title, 200),
    data.evidenceSummary ? `Evidence / customer signal: ${clip(data.evidenceSummary, 700)}` : null,
    notes ? `Notes: ${clip(notes, 500)}` : null,
    Array.isArray(data.tags) && data.tags.length ? `Tags: ${(data.tags as string[]).join(", ")}` : null,
    data.status ? `Discovery status: ${data.status}` : null,
    rice ? `Prioritisation: ${rice}` : null,
    evidenceLinks.length ? `Evidence links: ${evidenceLinks.slice(0, 5).join("; ")}` : null,
    linkList.length ? `Related links: ${linkList.slice(0, 5).join("; ")}` : null,
  ]);
}

export async function buildOpportunityContext(
  supabase: any,
  opportunityId: string,
  options: TreeContextOptions = {},
): Promise<{ context: string; opportunity: AnyRow | null; error?: string }> {
  const fallback = options.fallback ?? {};

  const { data: opportunity, error: oppError } = await supabase
    .from("nodes")
    .select("*")
    .eq("id", opportunityId)
    .maybeSingle();

  if (oppError) return { context: "", opportunity: null, error: oppError.message };

  const treeId = opportunity?.tree_id ?? null;
  const parts: (string | null)[] = [];

  // --- Product / project ------------------------------------------------
  let treeRow: AnyRow | null = null;
  let projectRow: AnyRow | null = null;
  if (treeId) {
    const { data: tree } = await supabase
      .from("trees")
      .select("id, name, description, project_id")
      .eq("id", treeId)
      .maybeSingle();
    treeRow = tree ?? null;
    if (treeRow?.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("name, description, product_context, target_users, constraints")
        .eq("id", treeRow.project_id)
        .maybeSingle();
      projectRow = project ?? null;
    }
  }

  parts.push(
    section("## PRODUCT", [
      projectRow?.name ? `Project: ${clip(projectRow.name, 120)}` : null,
      projectRow?.description ? `About: ${clip(projectRow.description, 600)}` : null,
      projectRow?.product_context ? `Product context: ${clip(projectRow.product_context, 1200)}` : null,
      projectRow?.target_users ? `Target users: ${clip(projectRow.target_users, 600)}` : null,
      treeRow?.description ? `Outcome notes: ${clip(treeRow.description, 400)}` : null,
    ]),
  );

  // --- Outcome ----------------------------------------------------------
  let allNodes: AnyRow[] = [];
  if (treeId) {
    const { data } = await supabase
      .from("nodes")
      .select("id, parent_id, type, title, notes, links, data")
      .eq("tree_id", treeId);
    allNodes = (data ?? []) as AnyRow[];
  }

  const byId = new Map(allNodes.map((n) => [n.id, n]));
  const outcome = allNodes.find((n) => n.type === "Outcome") ?? null;
  parts.push(describeOutcome(outcome, fallback.outcomeTitle));

  // --- Ancestry ---------------------------------------------------------
  const ancestors: AnyRow[] = [];
  let cursor = opportunity?.parent_id ? byId.get(opportunity.parent_id) : null;
  while (cursor && ancestors.length < 5) {
    if (cursor.type === "Opportunity") ancestors.unshift(cursor);
    cursor = cursor.parent_id ? byId.get(cursor.parent_id) : null;
  }
  if (ancestors.length) {
    parts.push(
      section(
        "## BROADER OPPORTUNITY THIS SITS UNDER",
        ancestors.map((a) => `${clip(a.title, 160)}${a.data?.evidenceSummary ? ` — ${clip(a.data.evidenceSummary, 200)}` : ""}`),
      ),
    );
  }

  // --- The opportunity itself ------------------------------------------
  const oppTitle = opportunity?.title ?? fallback.title ?? "";
  const oppData = (opportunity?.data ?? fallback.data ?? {}) as AnyRow;
  parts.push(describeOpportunity(oppTitle, oppData, opportunity?.notes, opportunity?.links));

  // --- Sibling opportunities -------------------------------------------
  const siblingOpps = allNodes
    .filter(
      (n) =>
        n.type === "Opportunity" &&
        n.id !== opportunityId &&
        n.parent_id === (opportunity?.parent_id ?? null),
    )
    .slice(0, MAX_SIBLING_OPPS);
  if (siblingOpps.length) {
    parts.push(
      section(
        "## NEIGHBOURING OPPORTUNITIES (already covered elsewhere — do not solve these)",
        siblingOpps.map((s) => clip(s.title, 160)),
      ),
    );
  }

  // --- Existing solutions & experiments ---------------------------------
  const existingSolutions = allNodes.filter((n) => n.type === "Solution" && n.parent_id === opportunityId);
  if (existingSolutions.length) {
    const lines: string[] = [];
    for (const s of existingSolutions.slice(0, MAX_SOLUTIONS)) {
      const d = (s.data ?? {}) as AnyRow;
      lines.push(
        `${clip(s.title, 160)}${d.status ? ` [${d.status}]` : ""}${d.description ? ` — ${clip(d.description, 200)}` : ""}`,
      );
      const experiments = allNodes
        .filter((n) => n.type === "Experiment" && n.parent_id === s.id)
        .slice(0, MAX_EXPERIMENTS);
      for (const e of experiments) {
        const ed = (e.data ?? {}) as AnyRow;
        lines.push(
          `   experiment: ${clip(e.title, 120)}${ed.decision ? ` → decision ${ed.decision}` : ""}${
            ed.resultSummary ? ` — ${clip(ed.resultSummary, 200)}` : ""
          }`,
        );
      }
    }
    parts.push(
      section("## ALREADY TRIED OR PLANNED (do NOT repeat; build on what was learned)", lines),
    );
  }

  // --- Customer evidence from interviews --------------------------------
  if (treeId) {
    const { data: interviews } = await supabase
      .from("interviews")
      .select("id, participant_name, conducted_at")
      .eq("tree_id", treeId)
      .order("uploaded_at", { ascending: false })
      .limit(10);

    const interviewIds = (interviews ?? []).map((i: AnyRow) => i.id);
    if (interviewIds.length) {
      const { data: oppEvidence } = await supabase
        .from("interview_opportunities")
        .select("title, why_it_matters, evidence_quote, opportunity_node_id, interview_id")
        .in("interview_id", interviewIds);

      const relevant = (oppEvidence ?? []).filter(
        (e: AnyRow) =>
          e.opportunity_node_id === opportunityId ||
          (!e.opportunity_node_id &&
            oppTitle &&
            clip(e.title, 200).toLowerCase().includes(clip(oppTitle, 60).toLowerCase().slice(0, 25))),
      );

      const evidence = (relevant.length ? relevant : (oppEvidence ?? []).slice(0, MAX_EVIDENCE)).slice(
        0,
        MAX_EVIDENCE,
      );

      if (evidence.length) {
        parts.push(
          section(
            "## CUSTOMER EVIDENCE (verbatim from interviews)",
            evidence.map(
              (e: AnyRow) =>
                `"${clip(e.evidence_quote, 300)}"${e.why_it_matters ? ` — why it matters: ${clip(e.why_it_matters, 200)}` : ""}`,
            ),
          ),
        );
      }
    }
  }

  // --- Constraints / steer ---------------------------------------------
  parts.push(
    section("## CONSTRAINTS", [
      projectRow?.constraints ? clip(projectRow.constraints, 800) : null,
      options.steer ? `User instruction for this request: ${clip(options.steer, 500)}` : null,
    ]),
  );

  return {
    context: parts.filter(Boolean).join("\n\n"),
    opportunity: opportunity ?? null,
  };
}
