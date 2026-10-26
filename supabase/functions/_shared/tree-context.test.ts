import { test, expect } from "bun:test";
import { buildOpportunityContext, OUTCOME_ALIGNMENT_INSTRUCTION } from "./tree-context";

function client(nodes: Record<string, unknown>[]) {
  return { from(table: string) {
    const q: any = {
      select() { return q; }, eq() { return q; }, order() { return q; }, limit() { return q; },
      async maybeSingle() { return { data: table === "nodes" ? nodes.find(n => n.id === "opp") : { id: "tree" } }; },
      then(resolve: any) { return Promise.resolve({ data: table === "nodes" ? nodes : [] }).then(resolve); },
    };
    return q;
  } };
}

test("AI brief includes the linked business outcome, metrics and contribution", async () => {
  const nodes = [
    { id: "business", type: "BusinessOutcome", title: "Grow recurring revenue", data: { metric: "ARR", baseline: 100, current: 120, target: 200 } },
    { id: "product", type: "Outcome", parent_id: "business", title: "Increase activation", data: { businessContribution: "Activation drives paid conversion", timeframePeriodValue: "Q1 2027" } },
    { id: "opp", type: "Opportunity", parent_id: "product", tree_id: "tree", title: "Cannot complete setup", data: {} },
  ];
  const { context } = await buildOpportunityContext(client(nodes), "opp");
  for (const value of ["## BUSINESS OUTCOME", "## PRODUCT OUTCOME", "Grow recurring revenue", "baseline 100", "target 200", "Activation drives paid conversion", "Q1 2027"]) expect(context).toContain(value);
  expect(OUTCOME_ALIGNMENT_INSTRUCTION).toContain("Do not claim causation");
});

test("existing trees without a business outcome remain valid", async () => {
  const { context } = await buildOpportunityContext(client([
    { id: "product", type: "Outcome", title: "Activation", data: {} },
    { id: "opp", type: "Opportunity", tree_id: "tree", title: "Setup", data: {} },
  ]), "opp");
  expect(context).toContain("## PRODUCT OUTCOME");
  expect(context).not.toContain("## BUSINESS OUTCOME");
});

test("AI brief retains business alignment through the multi-year North Star", async () => {
  const { context } = await buildOpportunityContext(client([
    { id: "business", type: "BusinessOutcome", title: "Sustainable growth", data: {} },
    { id: "north", type: "ProductNorthStar", parent_id: "business", title: "Daily team workspace", data: { timeframePeriodValue: "2027–2030", metric: "Weekly active teams", target: 10000 } },
    { id: "product", type: "Outcome", parent_id: "north", title: "Activation", data: {} },
    { id: "opp", type: "Opportunity", parent_id: "product", tree_id: "tree", title: "Setup", data: {} },
  ]), "opp");
  expect(context).toContain("Sustainable growth");
  expect(context).toContain("Daily team workspace");
  expect(context).toContain("2027–2030");
  expect(context).toContain("target 10000");
  expect(context).toContain("Activation");
});