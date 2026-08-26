import Std

namespace Gangway

/-- The two teaching days currently used by the school. -/
inductive Day where
  | monday
  | thursday
  deriving Repr, DecidableEq, BEq

/-- A student attends either the morning or the afternoon block on a teaching day. -/
inductive Block where
  | morning
  | afternoon
  deriving Repr, DecidableEq, BEq

/-- Each three-hour block is represented by three one-hour teaching slots. -/
inductive Slot where
  | first
  | second
  | third
  deriving Repr, DecidableEq, BEq

/-- A simple clock time. The concrete school data only constructs valid times. -/
structure ClockTime where
  hour : Nat
  minute : Nat
  deriving Repr, DecidableEq, BEq

structure TimeWindow where
  startTime : ClockTime
  endTime : ClockTime
  deriving Repr, DecidableEq, BEq

/-- Fixed attendance window for each block. -/
def Block.window : Block → TimeWindow
  | .morning => ⟨⟨9, 30⟩, ⟨12, 30⟩⟩
  | .afternoon => ⟨⟨13, 0⟩, ⟨16, 0⟩⟩

/-- Exact one-hour interval represented by a slot inside a block. -/
def slotWindow : Block → Slot → TimeWindow
  | .morning, .first => ⟨⟨9, 30⟩, ⟨10, 30⟩⟩
  | .morning, .second => ⟨⟨10, 30⟩, ⟨11, 30⟩⟩
  | .morning, .third => ⟨⟨11, 30⟩, ⟨12, 30⟩⟩
  | .afternoon, .first => ⟨⟨13, 0⟩, ⟨14, 0⟩⟩
  | .afternoon, .second => ⟨⟨14, 0⟩, ⟨15, 0⟩⟩
  | .afternoon, .third => ⟨⟨15, 0⟩, ⟨16, 0⟩⟩

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

/-- Both school-leaving levels currently taught by every listed teacher. -/
inductive Level where
  | esa
  | msa
  deriving Repr, DecidableEq, BEq

abbrev StudentId := String

/-- Exactly three subject choices, one for each slot. Repetition is intentionally allowed. -/
structure SubjectSelections where
  first : Subject
  second : Subject
  third : Subject
  deriving Repr, DecidableEq

namespace SubjectSelections

/-- Read the subject selected for one of the three slots. -/
def get (subjects : SubjectSelections) : Slot → Subject
  | .first => subjects.first
  | .second => subjects.second
  | .third => subjects.third

end SubjectSelections

/--
A student's declared attendance choice for one teaching day.

The model does not require the three subjects to be distinct. Therefore a student may,
for example, choose mathematics for the complete three-hour block.
-/
structure AttendanceChoice where
  student : StudentId
  day : Day
  block : Block
  level : Level
  subjects : SubjectSelections
  deriving Repr, DecidableEq

namespace AttendanceChoice

def subjectAt (choice : AttendanceChoice) (slot : Slot) : Subject :=
  choice.subjects.get slot

end AttendanceChoice

end Gangway
