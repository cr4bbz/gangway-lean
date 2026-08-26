const assert = require("node:assert/strict");

global.window = {};
require("./model.js");

const model = global.window.GangwayModel;

assert.deepEqual(
  model.SCHEDULABLE_ROOMS,
  ["english", "science", "art", "german", "historyGeography", "mathematics"],
  "Only the six regular teaching rooms may be allocated"
);
assert.deepEqual(model.INDEPENDENT_ROOMS, ["individualWork", "groupWork"]);

const expectedCapacities = {
  english: 11,
  science: 12,
  art: 8,
  german: 11,
  historyGeography: 12,
  mathematics: 10,
  individualWork: 8,
  groupWork: 14,
  breakRoom: 6
};
for (const [room, capacity] of Object.entries(expectedCapacities)) {
  assert.equal(model.ROOMS[room].capacity, capacity, `${room} capacity must match school data`);
}

for (const candidates of Object.values(model.PREFERRED_ROOMS)) {
  assert.equal(candidates.includes("individualWork"), false, "Individual-work room must never be allocated");
  assert.equal(candidates.includes("groupWork"), false, "Group-work room must never be allocated");
  assert.equal(candidates.includes("breakRoom"), false, "Break room must never be allocated");
}

function assertAssignmentsValid(assignments) {
  const moments = new Map();
  for (const assignment of assignments) {
    assert.ok(model.SCHEDULABLE_ROOMS.includes(assignment.room), "Every assignment must use a regular teaching room");
    assert.ok(
      assignment.students.length <= model.ROOMS[assignment.room].capacity,
      `${assignment.subject} group must fit room ${assignment.room}`
    );
    const key = `${assignment.day}|${assignment.block}|${assignment.slotIndex}`;
    if (!moments.has(key)) moments.set(key, []);
    moments.get(key).push(assignment);
  }
  for (const atMoment of moments.values()) {
    assert.equal(new Set(atMoment.map(item => item.teacher)).size, atMoment.length, "Teacher collision");
    assert.equal(new Set(atMoment.map(item => item.room)).size, atMoment.length, "Room collision");
  }
}

const reference = model.generatePlan(model.REFERENCE_CHOICES);
assert.equal(reference.ok, true, "Lean reference choices must be solvable in the browser model");
assert.equal(reference.assignments.length, 12);
assertAssignmentsValid(reference.assignments);

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

function repeatedMathChoices(count) {
  return Array.from({ length: count }, (_, index) => ({
    student: `M${String(index + 1).padStart(2, "0")}`,
    level: index % 2 === 0 ? "esa" : "msa",
    day: "monday",
    block: "morning",
    subjects: ["mathematics", "mathematics", "mathematics"]
  }));
}

const splitMath = model.generatePlan(repeatedMathChoices(18));
assert.equal(splitMath.ok, true, "18 simultaneous mathematics students should be split across two teachers/rooms");
assertAssignmentsValid(splitMath.assignments);
for (let slotIndex = 0; slotIndex < 3; slotIndex += 1) {
  const groups = splitMath.assignments.filter(item => item.slotIndex === slotIndex && item.subject === "mathematics");
  assert.equal(groups.length, 2, "18 mathematics students need two capacity-aware groups per slot");
  assert.equal(groups.reduce((sum, group) => sum + group.students.length, 0), 18);
}

const overloadedMath = model.generatePlan(repeatedMathChoices(25));
assert.equal(
  overloadedMath.ok,
  false,
  "25 simultaneous mathematics students exceed the two available Monday-morning math teachers' room capacity"
);

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
  )
);

console.log("Gangway browser planner model: capacity and collision checks passed.");
