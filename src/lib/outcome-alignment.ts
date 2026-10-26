import type { OSTNode } from "./pm-types"

/** Follow actual links rather than matching unrelated strategic nodes. */
export function getOutcomeAlignment(nodes: OSTNode[]) {
  const product = nodes.find(n => n.type === "Outcome")
  const parent = nodes.find(n => n.id === product?.parentId)
  const northStar = parent?.type === "ProductNorthStar" ? parent : undefined
  const businessParent = northStar ? nodes.find(n => n.id === northStar.parentId) : parent
  const business = businessParent?.type === "BusinessOutcome" ? businessParent : undefined
  return { product, northStar, business }
}