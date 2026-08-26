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

Only regular teaching rooms are assigned. The individual-work and group-work rooms remain
free for independent student use throughout every slot.
-/
def referencePlan : List ScheduledLesson := [
  -- Monday morning, slot 1
  ⟨⟨.monday, .morning, .first, .english, .agnes⟩, .english⟩,
  ⟨⟨.monday, .morning, .first, .german, .janT⟩, .german⟩,

  -- Monday morning, slot 2
  ⟨⟨.monday, .morning, .second, .biology, .zara⟩, .science⟩,
  ⟨⟨.monday, .morning, .second, .geography, .pino⟩, .historyGeography⟩,

  -- Monday morning, slot 3
  ⟨⟨.monday, .morning, .third, .mathematics, .titus⟩, .art⟩,
  ⟨⟨.monday, .morning, .third, .physics, .janS⟩, .science⟩,

  -- Thursday afternoon, slot 1
  ⟨⟨.thursday, .afternoon, .first, .english, .marianne⟩, .english⟩,
  ⟨⟨.thursday, .afternoon, .first, .mathematics, .julian⟩, .art⟩,

  -- Thursday afternoon, slot 2
  ⟨⟨.thursday, .afternoon, .second, .biology, .julian⟩, .science⟩,
  ⟨⟨.thursday, .afternoon, .second, .english, .marianne⟩, .english⟩,

  -- Thursday afternoon, slot 3
  ⟨⟨.thursday, .afternoon, .third, .mathematics, .janS⟩, .art⟩,
  ⟨⟨.thursday, .afternoon, .third, .chemistry, .zara⟩, .science⟩
]

/-- The complete reference plan is accepted by the room-aware formal model. -/
example : scheduledTimetableValidFor referencePlan [alexWeekly, beaWeekly] = true := by
  decide

/-- The five ordinary teaching rooms are schedulable. -/
example : schedulableRooms = [.english, .science, .art, .german, .historyGeography] := by
  decide

/-- Work rooms are known spaces but are never valid timetable assignments. -/
example : independentlyUsableRooms = [.individualWork, .groupWork] := by decide
example : isSchedulableRoom .individualWork = false := by decide
example : isSchedulableRoom .groupWork = false := by decide
example : roomSupportsSubject .individualWork .mathematics = false := by decide
example : roomSupportsSubject .groupWork .english = false := by decide

/-- The chill room is likewise not a regular teaching room. -/
example : roomSupportsSubject .chill .mathematics = false := by decide
example : roomSupportsSubject .chill .english = false := by decide

/-- Mathematics uses only ordinary teaching rooms; work rooms are absent from candidates. -/
example : preferredRooms .mathematics = [.art, .english, .german, .historyGeography, .science] := by
  decide

/-- A regular room cannot host two incompatible simultaneous lessons. -/
def roomCollision : List ScheduledLesson := [
  ⟨⟨.monday, .morning, .first, .english, .agnes⟩, .art⟩,
  ⟨⟨.monday, .morning, .first, .mathematics, .titus⟩, .art⟩
]

example : roomCollision.all ScheduledLesson.valid = true := by decide
example : noScheduleConflicts roomCollision = false := by decide
example : scheduledPlanValid roomCollision = false := by decide

end Gangway
