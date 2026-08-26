namespace Gangway

/-- The two teaching days currently offered by the school. -/
inductive Day where
  | monday
  | thursday
  deriving Repr, DecidableEq, BEq

/-- Students choose exactly one of these blocks for a teaching day. -/
inductive Block where
  | morning
  | afternoon
  deriving Repr, DecidableEq, BEq

/-- The three consecutive teaching positions inside a three-hour block. -/
inductive Slot where
  | first
  | second
  | third
  deriving Repr, DecidableEq, BEq

/-- ESA and MSA are both supported by every teacher in the current model. -/
inductive Level where
  | esa
  | msa
  deriving Repr, DecidableEq, BEq

inductive Subject where
  | biology
  | chemistry
  | english
  | german
  | geography
  | politics
  | mathematics
  | history
  | physics
  deriving Repr, DecidableEq, BEq

inductive Teacher where
  | zara
  | agnes
  | pino
  | marianne
  | phil
  | julian
  | vicky
  | titus
  | janT
  | janS
  deriving Repr, DecidableEq, BEq

/-- Minutes after midnight. Morning is 09:30-12:30, afternoon 13:00-16:00. -/
def blockStartMinutes : Block → Nat
  | .morning => 9 * 60 + 30
  | .afternoon => 13 * 60

def blockEndMinutes : Block → Nat
  | .morning => 12 * 60 + 30
  | .afternoon => 16 * 60

/-- We split each three-hour block into three one-hour planning slots. -/
def slotOffsetMinutes : Slot → Nat
  | .first => 0
  | .second => 60
  | .third => 120

def slotStartMinutes (block : Block) (slot : Slot) : Nat :=
  blockStartMinutes block + slotOffsetMinutes slot

def slotEndMinutes (block : Block) (slot : Slot) : Nat :=
  slotStartMinutes block slot + 60

def allSubjects : List Subject :=
  [.biology, .chemistry, .english, .german, .geography, .politics,
   .mathematics, .history, .physics]

def allTeachers : List Teacher :=
  [.zara, .agnes, .pino, .marianne, .phil, .julian, .vicky, .titus, .janT, .janS]

def teacherSubjects : Teacher → List Subject
  | .zara => [.biology, .chemistry]
  | .agnes => [.english, .german]
  | .pino => [.geography, .politics]
  | .marianne => [.english]
  | .phil => [.mathematics]
  | .julian => [.mathematics, .biology]
  | .vicky => [.history]
  | .titus => [.mathematics, .history]
  | .janT => [.history, .german]
  | .janS => [.mathematics, .physics]

/-- Every listed teacher can teach both ESA and MSA students. -/
def teacherLevels (_ : Teacher) : List Level := [.esa, .msa]

/-- The availability matrix supplied by the school. -/
def availableTeachers : Day → Block → List Teacher
  | .monday, .morning => [.agnes, .janT, .zara, .titus, .janS, .marianne, .pino]
  | .monday, .afternoon => [.agnes, .vicky, .phil, .zara, .julian, .pino]
  | .thursday, .morning => [.phil, .vicky, .janT, .titus, .janS]
  | .thursday, .afternoon => [.julian, .marianne, .zara, .janS]

def canTeachSubject (teacher : Teacher) (subject : Subject) : Bool :=
  (teacherSubjects teacher).contains subject

def canTeachLevel (teacher : Teacher) (level : Level) : Bool :=
  (teacherLevels teacher).contains level

def isAvailable (teacher : Teacher) (day : Day) (block : Block) : Bool :=
  (availableTeachers day block).contains teacher

/-- A teacher can cover a subject only if both qualification and availability hold. -/
def canTeachAt (teacher : Teacher) (day : Day) (block : Block)
    (subject : Subject) : Bool :=
  isAvailable teacher day block && canTeachSubject teacher subject

/-- All teachers that can actually cover a subject in a concrete block. -/
def candidateTeachers (day : Day) (block : Block) (subject : Subject) : List Teacher :=
  allTeachers.filter fun teacher => canTeachAt teacher day block subject

/-- Subjects for which a block has no available qualified teacher at all. -/
def coverageGaps (day : Day) (block : Block) : List Subject :=
  allSubjects.filter fun subject => (candidateTeachers day block subject).isEmpty

/-- Student identifiers are deliberately abstract; no real student names belong in the model. -/
structure StudentId where
  value : String
  deriving Repr, DecidableEq, BEq

/-- Exactly three subject choices. They are intentionally NOT required to be distinct. -/
structure ThreeSubjects where
  first : Subject
  second : Subject
  third : Subject
  deriving Repr, DecidableEq, BEq

def ThreeSubjects.at (subjects : ThreeSubjects) : Slot → Subject
  | .first => subjects.first
  | .second => subjects.second
  | .third => subjects.third

/-- One student's choice for one teaching day. A student chooses one block and three subjects. -/
structure StudentRequest where
  student : StudentId
  level : Level
  day : Day
  block : Block
  subjects : ThreeSubjects
  deriving Repr, DecidableEq, BEq

/-- A request is staffable iff every requested slot has at least one candidate teacher. -/
def StudentRequest.staffable (request : StudentRequest) : Bool :=
  !(candidateTeachers request.day request.block request.subjects.first).isEmpty &&
  !(candidateTeachers request.day request.block request.subjects.second).isEmpty &&
  !(candidateTeachers request.day request.block request.subjects.third).isEmpty

/-- A concrete teacher allocation for the three consecutive slots of one request. -/
structure PlannedBlock where
  request : StudentRequest
  firstTeacher : Teacher
  secondTeacher : Teacher
  thirdTeacher : Teacher
  deriving Repr, DecidableEq, BEq

def PlannedBlock.teacherAt (plan : PlannedBlock) : Slot → Teacher
  | .first => plan.firstTeacher
  | .second => plan.secondTeacher
  | .third => plan.thirdTeacher

/-- Reusing the same teacher across consecutive slots is allowed.
    Validity only demands availability, subject qualification, and ESA/MSA capability. -/
def PlannedBlock.valid (plan : PlannedBlock) : Bool :=
  let request := plan.request
  let validSlot (slot : Slot) : Bool :=
    let teacher := plan.teacherAt slot
    let subject := request.subjects.at slot
    canTeachAt teacher request.day request.block subject &&
      canTeachLevel teacher request.level
  validSlot .first && validSlot .second && validSlot .third

/-- A grouped lesson is the unit used by a future school-wide timetable solver. -/
structure Lesson where
  day : Day
  block : Block
  slot : Slot
  subject : Subject
  teacher : Teacher
  students : List StudentId
  deriving Repr, DecidableEq, BEq

def Lesson.valid (lesson : Lesson) : Bool :=
  canTeachAt lesson.teacher lesson.day lesson.block lesson.subject

/-- Two separate lessons conflict when the same teacher is assigned simultaneously. -/
def teacherConflict (left right : Lesson) : Bool :=
  left.day == right.day &&
  left.block == right.block &&
  left.slot == right.slot &&
  left.teacher == right.teacher

/-- Pairwise teacher-conflict check for a list of grouped lessons. -/
def conflictFree : List Lesson → Bool
  | [] => true
  | lesson :: rest =>
      !(rest.any fun other => teacherConflict lesson other) && conflictFree rest

structure Timetable where
  lessons : List Lesson
  deriving Repr, DecidableEq, BEq

def Timetable.valid (timetable : Timetable) : Bool :=
  timetable.lessons.all (fun lesson => lesson.valid) && conflictFree timetable.lessons

/-! ## Executable specification checks -/

example : blockStartMinutes .morning = 570 := rfl
example : blockEndMinutes .morning = 750 := rfl
example : blockStartMinutes .afternoon = 780 := rfl
example : blockEndMinutes .afternoon = 960 := rfl

example : candidateTeachers .monday .morning .mathematics = [.titus, .janS] := by
  decide

example : candidateTeachers .monday .afternoon .biology = [.zara, .julian] := by
  decide

example : candidateTeachers .thursday .afternoon .mathematics = [.julian, .janS] := by
  decide

/-- Monday morning currently has complete subject coverage. -/
example : coverageGaps .monday .morning = [] := by
  decide

/-- Monday afternoon lacks a physics teacher because Jan S. is not available then. -/
example : coverageGaps .monday .afternoon = [.physics] := by
  decide

/-- Thursday morning exposes several hard staffing gaps. -/
example : coverageGaps .thursday .morning =
    [.biology, .chemistry, .english, .geography, .politics] := by
  decide

/-- Thursday afternoon has no German, geography, politics, or history coverage. -/
example : coverageGaps .thursday .afternoon =
    [.german, .geography, .politics, .history] := by
  decide

/-- Repeating one subject throughout a block is a legal request. -/
def repeatedMathRequest : StudentRequest :=
  { student := ⟨"example-student"⟩
    level := .msa
    day := .thursday
    block := .afternoon
    subjects := { first := .mathematics, second := .mathematics, third := .mathematics } }

example : repeatedMathRequest.staffable = true := by
  decide

/-- The same available teacher may cover all three consecutive slots. -/
def repeatedMathPlan : PlannedBlock :=
  { request := repeatedMathRequest
    firstTeacher := .julian
    secondTeacher := .julian
    thirdTeacher := .julian }

example : repeatedMathPlan.valid = true := by
  decide

end Gangway
