import GangwayLean.Planning

namespace Gangway

/-- Physical rooms and independently usable spaces currently known at the school. -/
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

/-- Every currently known room/space. -/
def allRooms : List Room :=
  [.english, .science, .art, .german, .historyGeography,
   .individualWork, .groupWork, .chill]

/--
Rooms that the timetable is actually allowed to assign to a lesson.

The individual-work room and group-work room are intentionally absent: students may use
them independently during a lesson, so assigning either room to one class would model the
school incorrectly. The chill room is likewise not a regular teaching room.
-/
def schedulableRooms : List Room :=
  [.english, .science, .art, .german, .historyGeography]

/-- Spaces students may use independently without a timetable assignment. -/
def independentlyUsableRooms : List Room :=
  [.individualWork, .groupWork]

/-- Whether the timetable may assign this room to an ordinary lesson. -/
def isSchedulableRoom (room : Room) : Bool :=
  schedulableRooms.contains room

/--
Whether a room may host a subject.

The five ordinary teaching rooms are treated as generally usable classrooms. Their subject
names determine preference, not exclusivity. This keeps mathematics and overflow lessons
schedulable without incorrectly consuming the independently usable work rooms.
-/
def roomSupportsSubject (room : Room) (_subject : Subject) : Bool :=
  isSchedulableRoom room

/--
Preferred rooms for a subject. Subject-labelled rooms come first; the remaining ordinary
teaching rooms are fallbacks. Work rooms and chill room never appear here.
-/
def preferredRooms : Subject → List Room
  | .english => [.english, .german, .historyGeography, .art, .science]
  | .biology => [.science, .art, .english, .german, .historyGeography]
  | .chemistry => [.science, .art, .english, .german, .historyGeography]
  | .physics => [.science, .art, .english, .german, .historyGeography]
  | .german => [.german, .english, .historyGeography, .art, .science]
  | .history => [.historyGeography, .german, .english, .art, .science]
  | .geography => [.historyGeography, .german, .english, .art, .science]
  | .politics => [.historyGeography, .german, .english, .art, .science]
  | .mathematics => [.art, .english, .german, .historyGeography, .science]

/-- A lesson offering together with its assigned physical room. -/
structure ScheduledLesson where
  offering : LessonOffering
  room : Room
  deriving Repr, DecidableEq

namespace ScheduledLesson

/-- A scheduled lesson needs both a valid teacher assignment and a schedulable room. -/
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

/-- First preferred schedulable room for a subject, if one exists. -/
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
