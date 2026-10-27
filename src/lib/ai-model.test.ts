import { expect, test } from "bun:test"
import { formatAiModelName } from "./ai-model"

test("known Gemini models get readable names", () => {
  expect(formatAiModelName("gemini-3.8-flash")).toBe("Gemini 3.8 Flash")
  expect(formatAiModelName("gemini-3.6-flash")).toBe("Gemini 3.6 Flash")
  expect(formatAiModelName("gemini-3.5-flash-lite")).toBe("Gemini 3.5 Flash-Lite")
})

test("an unrecognised model is tidied rather than dropped", () => {
  expect(formatAiModelName("gemini-4.0-pro")).toBe("Gemini 4.0 Pro")
})

test("a missing model returns null so the info button stays hidden", () => {
  expect(formatAiModelName(null)).toBeNull()
  expect(formatAiModelName(undefined)).toBeNull()
  expect(formatAiModelName("   ")).toBeNull()
})
