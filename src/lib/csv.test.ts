import { test, expect } from "bun:test"
import { parseCsv, guessFeedbackColumn, buildFeedbackText, MAX_FEEDBACK_ROWS } from "./csv"

test("parses quoted fields with commas, escaped quotes and newlines", () => {
  const rows = parseCsv('id,comment\r\n1,"Slow, very ""slow""\nreally"\n2,ok\n')
  expect(rows).toEqual([["id", "comment"], ["1", 'Slow, very "slow"\nreally'], ["2", "ok"]])
})

test("guesses the feedback column by header name", () => {
  expect(guessFeedbackColumn(["Plan", "Customer Comment"], [["Pro", "x"]])).toBe(1)
})

test("builds numbered feedback lines with segment, skipping empty rows", () => {
  const { text, count } = buildFeedbackText([["Pro", "Hard to export"], ["Free", "  "]], 1, 0)
  expect(count).toBe(1)
  expect(text).toBe("1. [Pro] Hard to export")
})

test("caps feedback at the row limit", () => {
  const rows = Array.from({ length: MAX_FEEDBACK_ROWS + 20 }, (_, i) => [`item ${i}`])
  expect(buildFeedbackText(rows, 0, null).count).toBe(500)
})
