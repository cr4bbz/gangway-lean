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

/--
A room-aware reference timetable covering both example students.

Each simultaneously running lesson has a different teacher and room. Students requesting
the same subject at the same moment could share one offering because capacities are not
modelled yet.
-/
def referencePlan : List ScheduledLesson := [
  -- Monday morning, slot 1
  ⟨⟨.monday, .morning, .first, .english, .agnes⟩, .english⟩,
  ⟨⟨.monday, .morning, .first, .german, .janT⟩, .german⟩,

  -- Monday morning, slot 2
  ⟨⟨.monday, .morning, .second, .biology, .zara⟩, .science⟩,
  ⟨⟨.monday, .morning, .second, .geography, .pino⟩, .historyGeography⟩,

  -- Monday morning, slot 3
  ⟨⟨.monday, .morning, .third, .mathematics, .titus⟩, .groupWork⟩,
  ⟨⟨.monday, .morning, .third, .physics, .janS⟩, .science⟩,

  -- Thursday afternoon, slot 1
  ⟨⟨.thursday, .afternoon, .first, .english, .marianne⟩, .english⟩,
  ⟨⟨.thursday, .afternoon, .first, .mathematics, .julian⟩, .groupWork⟩,

  -- Thursday afternoon, slot 2
  ⟨⟨.thursday, .afternoon, .second, .biology, .julian⟩, .science⟩,
  ⟨⟨.thursday, .afternoon, .second, .english, .marianne⟩, .english⟩,

  -- Thursday afternoon, slot 3
  ⟨⟨.thursday, .afternoon, .third, .mathematics, .janS⟩, .groupWork⟩,
  ⟨⟨.thursday, .afternoon, .third, .chemistry, .zara⟩, .science⟩
]

/-- The complete reference plan is accepted by the room-aware formal model. -/
example : scheduledTimetableValidFor referencePlan [alexWeekly, beaWeekly] = true := by
  decide

/-- Specialist science room accepts all three natural-science subjects. -/
example : roomSupportsSubject .science .biology = true := by decide
example : roomSupportsSubject .science .chemistry = true := by decide
example : roomSupportsSubject .science .physics = true := by decide

/-- Mathematics has no specialist classroom and uses a flexible work room. -/
example : preferredRooms .mathematics = [.groupWork, .individualWork] := by
  decide

/-- The chill room is deliberately not a regular teaching room. -/
example : roomSupportsSubject .chill .mathematics = false := by decide
example : roomSupportsSubject .chill .english = false := by decide

/-- A room cannot host two incompatible simultaneous lessons. -/
def roomCollision : List ScheduledLesson := [
  ⟨⟨.monday, .morning, .first, .english, .agnes⟩, .groupWork⟩,
  ⟨⟨.monday, .morning, .first, .mathematics, .titus⟩, .groupWork⟩
]

example : roomCollision.all ScheduledLesson.valid = true := by decide
example : noScheduleConflicts roomCollision = false := by decide
example : scheduledPlanValid roomCollision = false := by decide

end Gangway
