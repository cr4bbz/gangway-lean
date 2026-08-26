import GangwayLean.SchoolData

namespace Gangway

/--
All teachers who are simultaneously present, qualified for the subject, and able to
teach the student's level.
-/
def eligibleTeachers (day : Day) (block : Block) (level : Level) (subject : Subject) :
    List Teacher :=
  (availableTeachers day block).filter fun teacher =>
    isQualified teacher subject && teachesLevel teacher level

/-- Whether at least one qualified teacher is available for a requested subject. -/
def canOffer (day : Day) (block : Block) (level : Level) (subject : Subject) : Bool :=
  !(eligibleTeachers day block level subject).isEmpty

structure SlotOptions where
  first : List Teacher
  second : List Teacher
  third : List Teacher
  deriving Repr, DecidableEq

/-- Teacher candidates for each of a student's three requested slots. -/
def teacherOptions (choice : AttendanceChoice) : SlotOptions :=
  {
    first := eligibleTeachers choice.day choice.block choice.level choice.subjects.first
    second := eligibleTeachers choice.day choice.block choice.level choice.subjects.second
    third := eligibleTeachers choice.day choice.block choice.level choice.subjects.third
  }

/--
Local feasibility of a student's choice. This means each requested subject can be taught
by at least one suitable teacher in the selected block. It does not yet solve collisions
between different students or room/capacity constraints.
-/
def choiceFeasible (choice : AttendanceChoice) : Bool :=
  canOffer choice.day choice.block choice.level choice.subjects.first &&
  canOffer choice.day choice.block choice.level choice.subjects.second &&
  canOffer choice.day choice.block choice.level choice.subjects.third

/-- Both teaching days of a weekly declaration are locally feasible. -/
def weeklyChoiceFeasible (choice : WeeklyChoice) : Bool :=
  choiceFeasible choice.mondayAttendance &&
  choiceFeasible choice.thursdayAttendance

/-- One concrete lesson offered in one slot. -/
structure LessonOffering where
  day : Day
  block : Block
  slot : Slot
  subject : Subject
  teacher : Teacher
  deriving Repr, DecidableEq

namespace LessonOffering

/-- An offering is valid exactly when the teacher is present and qualified. -/
def valid (offering : LessonOffering) : Bool :=
  isAvailable offering.teacher offering.day offering.block &&
  isQualified offering.teacher offering.subject

/-- Whether this offering can satisfy one particular slot of a student's choice. -/
def satisfies (offering : LessonOffering) (choice : AttendanceChoice) (slot : Slot) : Bool :=
  offering.valid &&
  offering.day == choice.day &&
  offering.block == choice.block &&
  offering.slot == slot &&
  offering.subject == choice.subjectAt slot &&
  teachesLevel offering.teacher choice.level

end LessonOffering

/-- Whether a plan contains a suitable offering for one selected slot. -/
def coversSlot (plan : List LessonOffering) (choice : AttendanceChoice) (slot : Slot) : Bool :=
  plan.any fun offering => offering.satisfies choice slot

/-- Whether all three subject selections of one student are covered by a plan. -/
def coversChoice (plan : List LessonOffering) (choice : AttendanceChoice) : Bool :=
  coversSlot plan choice .first &&
  coversSlot plan choice .second &&
  coversSlot plan choice .third

/-- Whether a plan covers both Monday and Thursday choices of one student. -/
def coversWeeklyChoice (plan : List LessonOffering) (choice : WeeklyChoice) : Bool :=
  coversChoice plan choice.mondayAttendance &&
  coversChoice plan choice.thursdayAttendance

/-- Whether a plan covers every supplied weekly student declaration. -/
def coversAllChoices (plan : List LessonOffering) (choices : List WeeklyChoice) : Bool :=
  choices.all fun choice => coversWeeklyChoice plan choice

/-- Two offerings happen at the same teaching moment. -/
def sameMoment (left right : LessonOffering) : Bool :=
  left.day == right.day &&
  left.block == right.block &&
  left.slot == right.slot

/--
A teacher cannot offer two different subjects at the same moment. Identical duplicate
offerings are not treated as a conflict because they denote the same possible lesson.
-/
def teacherConflict (left right : LessonOffering) : Bool :=
  sameMoment left right &&
  left.teacher == right.teacher &&
  left.subject != right.subject

/-- Pairwise conflict check for a concrete list of offerings. -/
def noTeacherConflicts : List LessonOffering → Bool
  | [] => true
  | offering :: rest =>
      !(rest.any fun other => teacherConflict offering other) && noTeacherConflicts rest

/-- Basic validity predicate for a concrete timetable plan. -/
def planValid (plan : List LessonOffering) : Bool :=
  plan.all LessonOffering.valid && noTeacherConflicts plan

/-- A timetable is acceptable for a cohort when it is valid and covers every weekly choice. -/
def timetableValidFor (plan : List LessonOffering) (choices : List WeeklyChoice) : Bool :=
  planValid plan && coversAllChoices plan choices

/-- Deterministically choose the first available qualified teacher, when one exists. -/
def chooseTeacher? (day : Day) (block : Block) (level : Level) (subject : Subject) :
    Option Teacher :=
  (eligibleTeachers day block level subject).head?

/-- Draft one concrete offering for one slot of a student's choice. -/
def draftOffering? (choice : AttendanceChoice) (slot : Slot) : Option LessonOffering := do
  let subject := choice.subjectAt slot
  let teacher ← chooseTeacher? choice.day choice.block choice.level subject
  pure {
    day := choice.day
    block := choice.block
    slot := slot
    subject := subject
    teacher := teacher
  }

/--
A tiny deterministic planner for a single student's choice. It succeeds exactly when all
three slots have at least one teacher candidate. A global multi-student solver can later
replace this while reusing the same validity predicates.
-/
def draftPlanForChoice? (choice : AttendanceChoice) : Option (List LessonOffering) := do
  let first ← draftOffering? choice .first
  let second ← draftOffering? choice .second
  let third ← draftOffering? choice .third
  pure [first, second, third]

/-- Draft six offerings for one student's complete Monday/Thursday declaration. -/
def draftPlanForWeeklyChoice? (choice : WeeklyChoice) : Option (List LessonOffering) := do
  let monday ← draftPlanForChoice? choice.mondayAttendance
  let thursday ← draftPlanForChoice? choice.thursdayAttendance
  pure (monday ++ thursday)

end Gangway
