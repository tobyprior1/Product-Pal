import { describe, expect, test } from "bun:test"
import { getAiFunctionError } from "./ai-function-error"

describe("AI function errors", () => {
  test("reads the server error from a failed HTTP response", async () => {
    const response = Response.json({ error: "Gemini rate limit reached." }, { status: 429 })
    expect(await getAiFunctionError(null, { context: response })).toBe("Gemini rate limit reached.")
    expect(response.bodyUsed).toBe(false)
  })
  test("recognises the platform idle timeout", async () => {
    const response = Response.json({ code: "IDLE_TIMEOUT", message: "Request idle timeout limit (150s) reached" }, { status: 504 })
    expect(await getAiFunctionError(null, { context: response })).toContain("timed out after 150 seconds")
  })
  test("keeps errors in successful response bodies", async () => {
    expect(await getAiFunctionError({ error: "Opportunity not found" }, null)).toBe("Opportunity not found")
  })
  test("reads message-style HTTP errors", async () => {
    expect(await getAiFunctionError(null, { context: Response.json({ message: "Access denied" }, { status: 403 }) })).toBe("Access denied")
  })
  test("handles non-JSON timeout bodies", async () => {
    expect(await getAiFunctionError(null, { context: new Response("<html>timeout</html>", { status: 504 }) })).toBe("The AI request timed out. Please try again later.")
  })
  test("handles network errors and invalid error fields safely", async () => {
    expect(await getAiFunctionError(null, new Error("Failed to fetch"))).toBe("Couldn't reach the AI right now. Please try again.")
    expect(await getAiFunctionError(null, { context: Response.json({ error: {} }, { status: 500 }) })).toBe("Couldn't reach the AI right now. Please try again.")
  })
})