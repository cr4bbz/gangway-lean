import GangwayLean.Rooms

namespace Gangway

/-- A first concrete MSA weekly declaration used as a verified reference case. -/
def alexWeekly : WeeklyChoice :=
  {
    student := "Alex"
    level := .msa
    mondayBlock := .morning
    mondaySubjects := ⟨.english, .biology, .mathematics⟩
    thursdayBlock := .afternoon
    thursdaySubjects := ⟨.english, .biology, .mathematics⟩
  }

/-- A second concrete ESA weekly declaration sharing several timetable moments. -/
def beaWeekly : WeeklyChoice :=
  {
    student := "Bea"
    level := .esa
    mondayBlock := .morning
    mondaySubjects := ⟨.german, .geography, .physics⟩
    thursdayBlock := .afternoon
    thursdaySubjects := ⟨.mathematics, .english, .chemistry⟩
  }

/-- Capacity-aware reference timetable covering both example students. -/
def referencePlan : List ScheduledLesson := [
  -- Monday morning, slot 1
  ⟨⟨.monday, .morning, .first, .english, .agnes⟩, .english, ["Alex"]⟩,
  ⟨⟨.monday, .morning, .first, .german, .janT⟩, .german, ["Bea"]⟩,

  -- Monday morning, slot 2
  ⟨⟨.monday, .morning, .second, .biology, .zara⟩, .science, ["Alex"]⟩,
  ⟨⟨.monday, .morning, .second, .geography, .pino⟩, .historyGeography, ["Bea"]⟩,

  -- Monday morning, slot 3
  ⟨⟨.monday, .morning, .third, .mathematics, .titus⟩, .mathematics, ["Alex"]⟩,
  ⟨⟨.monday, .morning, .third, .physics, .janS⟩, .science, ["Bea"]⟩,

  -- Thursday afternoon, slot 1
  ⟨⟨.thursday, .afternoon, .first, .english, .marianne⟩, .english, ["Alex"]⟩,
  ⟨⟨.thursday, .afternoon, .first, .mathematics, .julian⟩, .mathematics, ["Bea"]⟩,

  -- Thursday afternoon, slot 2
  ⟨⟨.thursday, .afternoon, .second, .biology, .julian⟩, .science, ["Alex"]⟩,
  ⟨⟨.thursday, .afternoon, .second, .english, .marianne⟩, .english, ["Bea"]⟩,

  -- Thursday afternoon, slot 3
  ⟨⟨.thursday, .afternoon, .third, .mathematics, .janS⟩, .mathematics, ["Alex"]⟩,
  ⟨⟨.thursday, .afternoon, .third, .chemistry, .zara⟩, .science, ["Bea"]⟩
]

example : scheduledTimetableValidFor referencePlan [alexWeekly, beaWeekly] = true := by
  decide

/-- The six ordinary teaching rooms are schedulable. -/
example : schedulableRooms =
    [.english, .science, .art, .german, .historyGeography, .mathematics] := by
  decide

/-- Student-only capacities supplied by the school. -/
example : roomCapacity .english = 11 := by decide
example : roomCapacity .science = 12 := by decide
example : roomCapacity .art = 8 := by decide
example : roomCapacity .german = 11 := by decide
example : roomCapacity .historyGeography = 12 := by decide
example : roomCapacity .mathematics = 10 := by decide
example : roomCapacity .individualWork = 8 := by decide
example : roomCapacity .groupWork = 14 := by decide
example : roomCapacity .breakRoom = 6 := by decide

/-- Work rooms remain independent spaces despite having known capacities. -/
example : independentlyUsableRooms = [.individualWork, .groupWork] := by decide
example : isSchedulableRoom .individualWork = false := by decide
example : isSchedulableRoom .groupWork = false := by decide
example : isSchedulableRoom .breakRoom = false := by decide

/-- Mathematics now has its own schedulable room as first preference. -/
example : preferredRooms .mathematics =
    [.mathematics, .historyGeography, .english, .german, .art, .science] := by
  decide

/-- Exactly ten students fit the mathematics room. -/
def fullMathGroup : ScheduledLesson :=
  ⟨⟨.monday, .morning, .first, .mathematics, .titus⟩, .mathematics,
    ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10"]⟩

example : fullMathGroup.valid = true := by decide

/-- Eleven students exceed the mathematics-room capacity and are rejected. -/
def oversizedMathGroup : ScheduledLesson :=
  ⟨⟨.monday, .morning, .first, .mathematics, .titus⟩, .mathematics,
    ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11"]⟩

example : oversizedMathGroup.valid = false := by decide

/-- One teacher may not lead two simultaneous groups, even for the same subject. -/
def teacherDoubleBooking : List ScheduledLesson := [
  ⟨⟨.monday, .morning, .first, .mathematics, .titus⟩, .mathematics, ["A"]⟩,
  ⟨⟨.monday, .morning, .first, .mathematics, .titus⟩, .art, ["B"]⟩
]

example : teacherDoubleBooking.all ScheduledLesson.valid = true := by decide
example : noScheduleConflicts teacherDoubleBooking = false := by decide

end Gangway
