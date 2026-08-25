import type { OSTNode } from "./pm-types";

/**
 * Pure derived queries over a node list.
 *
 * These used to live inside the data store. Keeping them as free functions
 * makes them trivially testable and reusable outside of the store.
 */

export interface OpportunityStats {
  solutionsCount: number;
  experimentsCount: number;
  solutionsInProgress: number;
  experimentsRunning: number;
}

export function getNodeChildren(nodes: OSTNode[], nodeId: string): OSTNode[] {
  return nodes.filter((node) => node.parentId === nodeId);
}

export function getOpportunityStats(nodes: OSTNode[], opportunityId: string): OpportunityStats {
  const children = getNodeChildren(nodes, opportunityId);
  const solutions = children.filter((n) => n.type === "Solution");
  const allExperiments = children.filter((n) => n.type === "Experiment");

  const solutionsInProgress = solutions.filter(
    (s) => (s as any).status !== "Done" && (s as any).status !== "Backlog"
  ).length;

  const experimentsRunning = allExperiments.filter((e) => (e as any).status === "running").length;

  return {
    solutionsCount: solutions.length,
    experimentsCount: allExperiments.length,
    solutionsInProgress,
    experimentsRunning,
  };
}

export function isParentOpportunity(nodes: OSTNode[], opportunityId: string): boolean {
  return nodes.some((n) => n.type === "Opportunity" && n.parentId === opportunityId);
}

export function isSubOpportunity(nodes: OSTNode[], opportunityId: string): boolean {
  const node = nodes.find((n) => n.id === opportunityId);
  return (
    node?.type === "Opportunity" &&
    node.parentId !== null &&
    nodes.some((n) => n.id === node.parentId && n.type === "Opportunity")
  );
}

/** An opportunity can only hold sub-opportunities while it has no solutions. */
export function canAddSubOpportunity(nodes: OSTNode[], opportunityId: string): boolean {
  return !nodes.some((n) => n.type === "Solution" && n.parentId === opportunityId);
}

/** An opportunity can only hold solutions while it has no sub-opportunities. */
export function canAddSolution(nodes: OSTNode[], opportunityId: string): boolean {
  return !nodes.some((n) => n.type === "Opportunity" && n.parentId === opportunityId);
}

export function getSubOpportunitiesCount(nodes: OSTNode[], opportunityId: string): number {
  return nodes.filter((n) => n.type === "Opportunity" && n.parentId === opportunityId).length;
}

export function getBacklogItems(nodes: OSTNode[]): OSTNode[] {
  return nodes.filter((node) => {
    if (node.type === "Opportunity") return (node as any).status === "backlog";
    if (node.type === "Solution") return (node as any).status === "Backlog";
    if (node.type === "Experiment") {
      const status = (node as any).status;
      return status === "backlog" || status === "planned";
    }
    return false;
  });
}

export function getRoadmapItems(nodes: OSTNode[]): OSTNode[] {
  return nodes.filter((node) => {
    if (node.type !== "Solution") return false;
    const status = (node as any).status;
    return status === "Now" || status === "Next" || status === "Later" || status === "Done";
  });
}

export function getWorkItems(nodes: OSTNode[]): OSTNode[] {
  return nodes.filter((node) => {
    if (node.type === "Opportunity") return (node as any).status === "in-discovery";
    if (node.type === "Solution") {
      const status = (node as any).status;
      return status === "Now" || status === "Next";
    }
    if (node.type === "Experiment") {
      const status = (node as any).status;
      return status === "in-build" || status === "running";
    }
    return false;
  });
}

/** Ancestors of a node, root first (the node itself is not included). */
export function getNodePath(nodes: OSTNode[], nodeId: string): OSTNode[] {
  const path: OSTNode[] = [];
  let currentNode = nodes.find((n) => n.id === nodeId);

  while (currentNode?.parentId) {
    const parent = nodes.find((n) => n.id === currentNode!.parentId);
    if (!parent) break;
    path.unshift(parent);
    currentNode = parent;
  }

  return path;
}

export function isLeafOpportunity(nodes: OSTNode[], opportunityId: string): boolean {
  return !nodes.some(
    (n) => (n.type === "Opportunity" || n.type === "Solution") && n.parentId === opportunityId
  );
}

export function getAllOpportunitiesUnderOutcome(nodes: OSTNode[], outcomeId: string): OSTNode[] {
  const opportunities: OSTNode[] = [];

  const collect = (parentId: string) => {
    nodes.forEach((node) => {
      if (node.parentId === parentId && node.type === "Opportunity") {
        opportunities.push(node);
        collect(node.id);
      }
    });
  };

  collect(outcomeId);
  return opportunities;
}

/** The node plus every descendant, used when deleting a subtree. */
export function collectSubtreeIds(nodes: OSTNode[], nodeId: string): Set<string> {
  const ids = new Set<string>([nodeId]);

  const walk = (parentId: string) => {
    nodes.forEach((node) => {
      if (node.parentId === parentId && !ids.has(node.id)) {
        ids.add(node.id);
        walk(node.id);
      }
    });
  };

  walk(nodeId);
  return ids;
}
