import { expect, test } from "bun:test"
import { getOutcomeAlignment } from "./outcome-alignment"
import type { OSTNode } from "./pm-types"

const node = (id: string, type: OSTNode["type"], parentId: string | null): OSTNode => ({ id, type, parentId, title: id, createdAt: "", updatedAt: "" } as OSTNode)

test("North Star is optional above the Product Outcome", () => {
  const result = getOutcomeAlignment([node("product", "Outcome", null)])
  expect(result.product?.id).toBe("product")
  expect(result.northStar).toBeUndefined()
})
test("North Star sits between Business and Product Outcomes", () => {
  const result = getOutcomeAlignment([node("business", "BusinessOutcome", null), node("north", "ProductNorthStar", "business"), node("product", "Outcome", "north")])
  expect(result.product?.parentId).toBe("north")
  expect(result.northStar?.parentId).toBe("business")
  expect(result.business?.id).toBe("business")
})
test("North Star does not require a Business Outcome", () => {
  const result = getOutcomeAlignment([node("north", "ProductNorthStar", null), node("product", "Outcome", "north")])
  expect(result.northStar?.id).toBe("north")
  expect(result.business).toBeUndefined()
})