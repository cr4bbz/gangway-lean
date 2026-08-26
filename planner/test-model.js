const assert = require("node:assert/strict");

global.window = {};
require("./model.js");

const model = global.window.GangwayModel;

assert.deepEqual(
  model.SCHEDULABLE_ROOMS,
  ["english", "science", "art", "german", "historyGeography"],
  "Only the five regular teaching rooms may be allocated"
);
assert.deepEqual(
  model.INDEPENDENT_ROOMS,
  ["individualWork", "groupWork"],
  "Work rooms must be tracked separately as independently usable spaces"
);
for (const candidates of Object.values(model.PREFERRED_ROOMS)) {
  assert.equal(candidates.includes("individualWork"), false, "Individual-work room must never be a candidate");
  assert.equal(candidates.includes("groupWork"), false, "Group-work room must never be a candidate");
  assert.equal(candidates.includes("chill"), false, "Chill room must never be a candidate");
}

const reference = model.generatePlan(model.REFERENCE_CHOICES);
assert.equal(reference.ok, true, "Lean reference choices must be solvable in the browser model");
assert.equal(reference.assignments.length, 12, "Reference case should create twelve grouped lessons");

const moments = new Map();
for (const assignment of reference.assignments) {
  assert.ok(model.SCHEDULABLE_ROOMS.includes(assignment.room), "Every assignment must use a regular teaching room");
  const key = `${assignment.day}|${assignment.block}|${assignment.slotIndex}`;
  if (!moments.has(key)) moments.set(key, []);
  moments.get(key).push(assignment);
}

for (const assignments of moments.values()) {
  const teachers = assignments.map(assignment => assignment.teacher);
  const rooms = assignments.map(assignment => assignment.room);
  assert.equal(new Set(teachers).size, teachers.length, "No teacher may be double-booked in one moment");
  assert.equal(new Set(rooms).size, rooms.length, "No room may be double-booked in one moment");
}

for (const choice of model.REFERENCE_CHOICES) {
  choice.subjects.forEach((subject, slotIndex) => {
    const covered = reference.assignments.some(assignment =>
      assignment.day === choice.day &&
      assignment.block === choice.block &&
      assignment.slotIndex === slotIndex &&
      assignment.subject === subject &&
      assignment.students.includes(choice.student)
    );
    assert.equal(covered, true, `${choice.student}'s ${subject} request must be covered`);
  });
}

const impossibleThursdayMorning = model.generatePlan([{
  student: "Test",
  level: "esa",
  day: "thursday",
  block: "morning",
  subjects: ["chemistry", "mathematics", "history"]
}]);

assert.equal(impossibleThursdayMorning.ok, false, "Chemistry Thursday morning has no available qualified teacher");
assert.ok(
  impossibleThursdayMorning.failures.some(failure =>
    failure.tasks.some(task => task.subject === "chemistry" && task.teacherCandidates.length === 0)
  ),
  "Failure diagnostics should expose the missing chemistry teacher"
);

console.log("Gangway browser planner model: all checks passed.");
