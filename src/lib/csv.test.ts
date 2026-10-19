import { test, expect } from "bun:test"
import { parseCsv, guessFeedbackColumn, buildFeedbackText, MAX_FEEDBACK_ROWS } from "./csv"

test("parses quoted fields with commas, escaped quotes and newlines", () => {
  const rows = parseCsv('id,comment\r\n1,"Slow, very ""slow""\nreally"\n2,ok\n')
  expect(rows).toEqual([["id", "comment"], ["1", 'Slow, very "slow"\nreally'], ["2", "ok"]])
})

test("guesses the feedback column by header name", () => {
  expect(guessFeedbackColumn(["Plan", "Customer Comment"], [["Pro", "x"]])).toBe(1)
})

test("skips id-like columns even when their name hints at feedback", () => {
  const headers = ["response_id", "customer", "segment", "comment"]
  const rows = [
    ["1", "Anna", "SME", "It takes ages to find the right keywords"],
    ["2", "Ben", "Enterprise", "We cannot see which brand tiles are live"],
  ]
  expect(guessFeedbackColumn(headers, rows)).toBe(3)
})

test("prefers free text over a numeric column when no header hints at feedback", () => {
  const headers = ["Ticket ID", "Rating", "Anything else?"]
  const rows = [
    ["10", "5", "The export kept failing for an hour"],
    ["11", "1", "Please let me schedule reports"],
  ]
  expect(guessFeedbackColumn(headers, rows)).toBe(2)
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
