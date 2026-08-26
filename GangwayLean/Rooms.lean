import GangwayLean.Planning

namespace Gangway

/-- Physical rooms currently available at the school. -/
inductive Room where
  | english
  | science
  | art
  | german
  | historyGeography
  | individualWork
  | groupWork
  | chill
  deriving Repr, DecidableEq, BEq

/-- Every currently known room. -/
def allRooms : List Room :=
  [.english, .science, .art, .german, .historyGeography,
   .individualWork, .groupWork, .chill]

/--
Whether a room may host a subject.

Specialist rooms are restricted to their natural subject families. The rooms for
individual and group work are deliberately flexible fallbacks. The chill room is not
used as a regular teaching room in the formal model.
-/
def roomSupportsSubject : Room → Subject → Bool
  | .english, .english => true
  | .science, .biology => true
  | .science, .chemistry => true
  | .science, .physics => true
  | .german, .german => true
  | .historyGeography, .history => true
  | .historyGeography, .geography => true
  | .historyGeography, .politics => true
  | .individualWork, _ => true
  | .groupWork, _ => true
  | _, _ => false

/-- Preferred rooms, ordered from specialist room to flexible fallback. -/
def preferredRooms : Subject → List Room
  | .english => [.english, .groupWork, .individualWork]
  | .biology => [.science, .groupWork, .individualWork]
  | .chemistry => [.science, .groupWork, .individualWork]
  | .physics => [.science, .groupWork, .individualWork]
  | .german => [.german, .groupWork, .individualWork]
  | .history => [.historyGeography, .groupWork, .individualWork]
  | .geography => [.historyGeography, .groupWork, .individualWork]
  | .politics => [.historyGeography, .groupWork, .individualWork]
  | .mathematics => [.groupWork, .individualWork]

/-- A lesson offering together with its assigned physical room. -/
structure ScheduledLesson where
  offering : LessonOffering
  room : Room
  deriving Repr, DecidableEq

namespace ScheduledLesson

/-- A scheduled lesson needs both a valid teacher assignment and a suitable room. -/
def valid (lesson : ScheduledLesson) : Bool :=
  lesson.offering.valid && roomSupportsSubject lesson.room lesson.offering.subject

/-- Two scheduled lessons use the same room at the same time in incompatible ways. -/
def roomConflict (left right : ScheduledLesson) : Bool :=
  sameMoment left.offering right.offering &&
  left.room == right.room &&
  (left.offering.teacher != right.offering.teacher ||
   left.offering.subject != right.offering.subject)

/-- A student choice is satisfied by the underlying teacher/subject offering. -/
def satisfies (lesson : ScheduledLesson) (choice : AttendanceChoice) (slot : Slot) : Bool :=
  lesson.valid && lesson.offering.satisfies choice slot

end ScheduledLesson

/-- Pairwise teacher and room conflict check for a room-aware plan. -/
def noScheduleConflicts : List ScheduledLesson → Bool
  | [] => true
  | lesson :: rest =>
      !(rest.any fun other =>
          teacherConflict lesson.offering other.offering ||
          ScheduledLesson.roomConflict lesson other) &&
      noScheduleConflicts rest

/-- Basic validity predicate for a room-aware timetable. -/
def scheduledPlanValid (plan : List ScheduledLesson) : Bool :=
  plan.all ScheduledLesson.valid && noScheduleConflicts plan

/-- Whether a room-aware plan covers one requested teaching slot. -/
def scheduledCoversSlot
    (plan : List ScheduledLesson) (choice : AttendanceChoice) (slot : Slot) : Bool :=
  plan.any fun lesson => lesson.satisfies choice slot

/-- Whether a room-aware plan covers all three slots of one attendance choice. -/
def scheduledCoversChoice
    (plan : List ScheduledLesson) (choice : AttendanceChoice) : Bool :=
  scheduledCoversSlot plan choice .first &&
  scheduledCoversSlot plan choice .second &&
  scheduledCoversSlot plan choice .third

/-- Whether a room-aware plan covers both days of one weekly choice. -/
def scheduledCoversWeeklyChoice
    (plan : List ScheduledLesson) (choice : WeeklyChoice) : Bool :=
  scheduledCoversChoice plan choice.mondayAttendance &&
  scheduledCoversChoice plan choice.thursdayAttendance

/-- A valid room-aware timetable covering every supplied weekly student choice. -/
def scheduledTimetableValidFor
    (plan : List ScheduledLesson) (choices : List WeeklyChoice) : Bool :=
  scheduledPlanValid plan &&
  choices.all fun choice => scheduledCoversWeeklyChoice plan choice

/-- First preferred room for a subject, if one exists. -/
def chooseRoom? (subject : Subject) : Option Room :=
  (preferredRooms subject).head?

/-- Draft a room-aware lesson for one student's requested slot. -/
def draftScheduledLesson?
    (choice : AttendanceChoice) (slot : Slot) : Option ScheduledLesson := do
  let offering ← draftOffering? choice slot
  let room ← chooseRoom? offering.subject
  pure { offering := offering, room := room }

/-- Draft a simple room-aware three-slot plan for one student's day choice. -/
def draftScheduledPlanForChoice?
    (choice : AttendanceChoice) : Option (List ScheduledLesson) := do
  let first ← draftScheduledLesson? choice .first
  let second ← draftScheduledLesson? choice .second
  let third ← draftScheduledLesson? choice .third
  pure [first, second, third]

end Gangway
