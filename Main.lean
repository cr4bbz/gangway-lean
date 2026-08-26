import GangwayLean

open Gangway

def main : IO Unit := do
  IO.println "Gangway Lean timetable model"
  IO.println s!"Monday morning gaps: {reprStr (coverageGaps .monday .morning)}"
  IO.println s!"Monday afternoon gaps: {reprStr (coverageGaps .monday .afternoon)}"
  IO.println s!"Thursday morning gaps: {reprStr (coverageGaps .thursday .morning)}"
  IO.println s!"Thursday afternoon gaps: {reprStr (coverageGaps .thursday .afternoon)}"
  IO.println s!"Repeated-math example valid: {reprStr repeatedMathPlan.valid}"
