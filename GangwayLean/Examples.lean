import GangwayLean.Planning

namespace Gangway

/-- A student may intentionally choose the same subject for the complete block. -/
def repeatedMathMonday : AttendanceChoice :=
  {
    student := "example-student"
    day := .monday
    block := .afternoon
    level := .msa
    subjects := ⟨.mathematics, .mathematics, .mathematics⟩
  }

example : choiceFeasible repeatedMathMonday = true := by
  decide

example : teacherOptions repeatedMathMonday =
    {
      first := [.phil, .julian]
      second := [.phil, .julian]
      third := [.phil, .julian]
    } := by
  decide

/-- The deterministic single-student planner can keep Phil for all three math slots. -/
example : draftPlanForChoice? repeatedMathMonday = some [
    ⟨.monday, .afternoon, .first, .mathematics, .phil⟩,
    ⟨.monday, .afternoon, .second, .mathematics, .phil⟩,
    ⟨.monday, .afternoon, .third, .mathematics, .phil⟩
  ] := by
  decide

/-- A complete, feasible Monday/Thursday declaration. -/
def exampleWeek : WeeklyChoice :=
  {
    student := "example-student"
    level := .msa
    mondayBlock := .afternoon
    mondaySubjects := ⟨.mathematics, .mathematics, .mathematics⟩
    thursdayBlock := .afternoon
    thursdaySubjects := ⟨.mathematics, .biology, .english⟩
  }

example : weeklyChoiceFeasible exampleWeek = true := by
  decide

/-- One concrete timetable that covers the complete example week. -/
def exampleWeekPlan : List LessonOffering := [
  ⟨.monday, .afternoon, .first, .mathematics, .phil⟩,
  ⟨.monday, .afternoon, .second, .mathematics, .phil⟩,
  ⟨.monday, .afternoon, .third, .mathematics, .phil⟩,
  ⟨.thursday, .afternoon, .first, .mathematics, .julian⟩,
  ⟨.thursday, .afternoon, .second, .biology, .julian⟩,
  ⟨.thursday, .afternoon, .third, .english, .marianne⟩
]

example : timetableValidFor exampleWeekPlan [exampleWeek] = true := by
  decide

/-- German currently has no available qualified teacher on Thursday afternoon. -/
example : canOffer .thursday .afternoon .esa .german = false := by
  decide

/-- A weekly choice that requests German on Thursday afternoon is therefore infeasible. -/
def impossibleThursdayGerman : WeeklyChoice :=
  {
    student := "counterexample-student"
    level := .esa
    mondayBlock := .morning
    mondaySubjects := ⟨.english, .biology, .mathematics⟩
    thursdayBlock := .afternoon
    thursdaySubjects := ⟨.german, .mathematics, .biology⟩
  }

example : weeklyChoiceFeasible impossibleThursdayGerman = false := by
  decide

/-- Mathematics is available on Thursday afternoon through Julian or Jan S. -/
example : eligibleTeachers .thursday .afternoon .esa .mathematics = [.julian, .janS] := by
  decide

/-- English is available on Thursday afternoon through Marianne. -/
example : eligibleTeachers .thursday .afternoon .msa .english = [.marianne] := by
  decide

/-- Every teacher is encoded as able to teach both school-leaving levels. -/
example : teachesLevel .zara .esa = true := by decide
example : teachesLevel .zara .msa = true := by decide
example : teachesLevel .janS .esa = true := by decide
example : teachesLevel .janS .msa = true := by decide

/-- A teacher may not offer two different subjects in the same slot. -/
def zaraDoubleBooking : List LessonOffering := [
  ⟨.monday, .afternoon, .first, .biology, .zara⟩,
  ⟨.monday, .afternoon, .first, .chemistry, .zara⟩
]

example : zaraDoubleBooking.all LessonOffering.valid = true := by
  decide

example : noTeacherConflicts zaraDoubleBooking = false := by
  decide

example : planValid zaraDoubleBooking = false := by
  decide

/-- The supplied block times are represented exactly. -/
example : Block.window .morning = ⟨⟨9, 30⟩, ⟨12, 30⟩⟩ := by decide
example : Block.window .afternoon = ⟨⟨13, 0⟩, ⟨16, 0⟩⟩ := by decide

end Gangway
