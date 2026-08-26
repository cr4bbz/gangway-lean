import GangwayLean.Planning

namespace Gangway

/-- Physical rooms and independently usable spaces currently known at the school. -/
inductive Room where
  | english
  | science
  | art
  | german
  | historyGeography
  | mathematics
  | individualWork
  | groupWork
  | breakRoom
  deriving Repr, DecidableEq, BEq

/-- Every currently known room/space. -/
def allRooms : List Room :=
  [.english, .science, .art, .german, .historyGeography, .mathematics,
   .individualWork, .groupWork, .breakRoom]

/-- Student capacities. Teachers are deliberately not counted. -/
def roomCapacity : Room → Nat
  | .english => 11
  | .science => 12
  | .art => 8
  | .german => 11
  | .historyGeography => 12
  | .mathematics => 10
  | .individualWork => 8
  | .groupWork => 14
  | .breakRoom => 6

/-- Rooms that the timetable is allowed to assign to ordinary lessons. -/
def schedulableRooms : List Room :=
  [.english, .science, .art, .german, .historyGeography, .mathematics]

/-- Spaces students may use independently without a timetable assignment. -/
def independentlyUsableRooms : List Room :=
  [.individualWork, .groupWork]

/-- Whether the timetable may assign this room to an ordinary lesson. -/
def isSchedulableRoom (room : Room) : Bool :=
  schedulableRooms.contains room

/-- Subject-labelled rooms express preference, not exclusivity. -/
def roomSupportsSubject (room : Room) (_subject : Subject) : Bool :=
  isSchedulableRoom room

/-- Preferred schedulable rooms for each subject. -/
def preferredRooms : Subject → List Room
  | .english => [.english, .german, .historyGeography, .mathematics, .art, .science]
  | .biology => [.science, .historyGeography, .english, .german, .mathematics, .art]
  | .chemistry => [.science, .historyGeography, .english, .german, .mathematics, .art]
  | .physics => [.science, .historyGeography, .english, .german, .mathematics, .art]
  | .german => [.german, .english, .historyGeography, .mathematics, .art, .science]
  | .history => [.historyGeography, .german, .english, .mathematics, .art, .science]
  | .geography => [.historyGeography, .german, .english, .mathematics, .art, .science]
  | .politics => [.historyGeography, .german, .english, .mathematics, .art, .science]
  | .mathematics => [.mathematics, .historyGeography, .english, .german, .art, .science]

/-- A concrete lesson group with room and participating students. -/
structure ScheduledLesson where
  offering : LessonOffering
  room : Room
  students : List StudentId
  deriving Repr, DecidableEq

namespace ScheduledLesson

/-- A scheduled group needs a valid teacher, a schedulable room, and must fit its room. -/
def valid (lesson : ScheduledLesson) : Bool :=
  lesson.offering.valid &&
  roomSupportsSubject lesson.room lesson.offering.subject &&
  decide (lesson.students.length ≤ roomCapacity lesson.room)

/-- Two groups cannot occupy one room at the same moment. -/
def roomConflict (left right : ScheduledLesson) : Bool :=
  sameMoment left.offering right.offering && left.room == right.room

/-- One teacher cannot lead two groups at the same moment, even for the same subject. -/
def teacherConflict (left right : ScheduledLesson) : Bool :=
  sameMoment left.offering right.offering && left.offering.teacher == right.offering.teacher

/-- A student cannot be assigned to two groups at the same moment. -/
def studentConflict (left right : ScheduledLesson) : Bool :=
  sameMoment left.offering right.offering &&
  left.students.any fun student => right.students.contains student

/-- A choice is covered only when that student is actually a member of the group. -/
def satisfies (lesson : ScheduledLesson) (choice : AttendanceChoice) (slot : Slot) : Bool :=
  lesson.valid &&
  lesson.students.contains choice.student &&
  lesson.offering.satisfies choice slot

end ScheduledLesson

/-- Pairwise teacher, room and student conflict check. -/
def noScheduleConflicts : List ScheduledLesson → Bool
  | [] => true
  | lesson :: rest =>
      !(rest.any fun other =>
          ScheduledLesson.teacherConflict lesson other ||
          ScheduledLesson.roomConflict lesson other ||
          ScheduledLesson.studentConflict lesson other) &&
      noScheduleConflicts rest

/-- Basic validity predicate for a capacity-aware timetable. -/
def scheduledPlanValid (plan : List ScheduledLesson) : Bool :=
  plan.all ScheduledLesson.valid && noScheduleConflicts plan

/-- Whether a capacity-aware plan covers one requested teaching slot. -/
def scheduledCoversSlot
    (plan : List ScheduledLesson) (choice : AttendanceChoice) (slot : Slot) : Bool :=
  plan.any fun lesson => lesson.satisfies choice slot

/-- Whether a capacity-aware plan covers all three slots of one attendance choice. -/
def scheduledCoversChoice
    (plan : List ScheduledLesson) (choice : AttendanceChoice) : Bool :=
  scheduledCoversSlot plan choice .first &&
  scheduledCoversSlot plan choice .second &&
  scheduledCoversSlot plan choice .third

/-- Whether a capacity-aware plan covers both days of one weekly choice. -/
def scheduledCoversWeeklyChoice
    (plan : List ScheduledLesson) (choice : WeeklyChoice) : Bool :=
  scheduledCoversChoice plan choice.mondayAttendance &&
  scheduledCoversChoice plan choice.thursdayAttendance

/-- A valid capacity-aware timetable covering every supplied weekly student choice. -/
def scheduledTimetableValidFor
    (plan : List ScheduledLesson) (choices : List WeeklyChoice) : Bool :=
  scheduledPlanValid plan &&
  choices.all fun choice => scheduledCoversWeeklyChoice plan choice

/-- First preferred schedulable room for a subject, if one exists. -/
def chooseRoom? (subject : Subject) : Option Room :=
  (preferredRooms subject).head?

/-- Draft a one-student capacity-aware lesson for one requested slot. -/
def draftScheduledLesson?
    (choice : AttendanceChoice) (slot : Slot) : Option ScheduledLesson := do
  let offering ← draftOffering? choice slot
  let room ← chooseRoom? offering.subject
  pure { offering := offering, room := room, students := [choice.student] }

/-- Draft a simple three-slot plan for one student's day choice. -/
def draftScheduledPlanForChoice?
    (choice : AttendanceChoice) : Option (List ScheduledLesson) := do
  let first ← draftScheduledLesson? choice .first
  let second ← draftScheduledLesson? choice .second
  let third ← draftScheduledLesson? choice .third
  pure [first, second, third]

end Gangway
