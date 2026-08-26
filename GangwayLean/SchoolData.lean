import GangwayLean.Domain

namespace Gangway

/-- Subjects each teacher is qualified to teach. -/
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

/-- All listed teachers teach both ESA and MSA students. -/
def teacherLevels (_ : Teacher) : List Level := [.esa, .msa]

/-- Concrete staff availability supplied for the current timetable model. -/
def availableTeachers : Day → Block → List Teacher
  | .monday, .morning =>
      [.agnes, .janT, .zara, .titus, .janS, .marianne, .pino]
  | .monday, .afternoon =>
      [.agnes, .vicky, .phil, .zara, .julian, .pino]
  | .thursday, .morning =>
      [.phil, .vicky, .janT, .titus, .janS]
  | .thursday, .afternoon =>
      [.julian, .marianne, .zara, .janS]

/-- Boolean test for a teacher's subject qualification. -/
def isQualified (teacher : Teacher) (subject : Subject) : Bool :=
  (teacherSubjects teacher).contains subject

/-- Boolean test for a teacher's level qualification. -/
def teachesLevel (teacher : Teacher) (level : Level) : Bool :=
  (teacherLevels teacher).contains level

/-- Boolean test for whether a teacher is present in a day/block combination. -/
def isAvailable (teacher : Teacher) (day : Day) (block : Block) : Bool :=
  (availableTeachers day block).contains teacher

end Gangway
