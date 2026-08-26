const assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");

global.window = {};
require("./model.js");
require("./test-data.js");

const model = global.window.GangwayModel;
const testData = global.window.GangwayTestData;

function uniqueStudents(choices) {
  return new Set(choices.map(choice => choice.student)).size;
}

function assertSolvedPlan(result) {
  const moments = new Map();
  for (const assignment of result.assignments) {
    assert.ok(model.SCHEDULABLE_ROOMS.includes(assignment.room), `Non-schedulable room assigned: ${assignment.room}`);
    assert.equal(model.INDEPENDENT_ROOMS.includes(assignment.room), false);
    assert.ok(
      assignment.students.length <= model.ROOMS[assignment.room].capacity,
      `${assignment.room}: ${assignment.students.length} exceeds ${model.ROOMS[assignment.room].capacity}`
    );
    const key = `${assignment.day}|${assignment.block}|${assignment.slotIndex}`;
    if (!moments.has(key)) moments.set(key, []);
    moments.get(key).push(assignment);
  }

  for (const assignments of moments.values()) {
    assert.equal(new Set(assignments.map(item => item.teacher)).size, assignments.length, "Teacher collision");
    assert.equal(new Set(assignments.map(item => item.room)).size, assignments.length, "Room collision");
  }
}

const rows = [];
for (const scenario of testData.TEST_SCENARIOS) {
  const start = performance.now();
  const result = model.generatePlan(scenario.choices);
  const elapsedMs = performance.now() - start;
  if (result.ok) assertSolvedPlan(result);

  const monday = scenario.metadata.attendance.monday;
  const thursday = scenario.metadata.attendance.thursday;
  assert.equal(monday.present + monday.absent, scenario.metadata.enrolled);
  assert.equal(thursday.present + thursday.absent, scenario.metadata.enrolled);
  assert.ok(uniqueStudents(scenario.choices) <= scenario.metadata.enrolled);

  const failureSummary = result.failures.map(failure => ({
    moment: `${failure.day}|${failure.block}|${failure.slotIndex + 1}`,
    tasks: failure.tasks.map(task => `${task.subject}:${task.students.length}SuS/${task.teacherCandidates.length}L`).join(",")
  }));

  rows.push({
    id: scenario.id,
    enrolled: scenario.metadata.enrolled,
    mondayPresent: monday.present,
    thursdayPresent: thursday.present,
    groups: result.assignments.length,
    failures: result.failures.length,
    actual: result.ok ? "OK" : "FAIL",
    ms: elapsedMs.toFixed(2)
  });

  if (failureSummary.length) console.log(`${scenario.id} failures:`, JSON.stringify(failureSummary));
}

const negative = testData.byId["cohort-75-negative"];
const negativeResult = model.generatePlan(negative.choices);
assert.equal(negativeResult.ok, false);
assert.ok(
  negativeResult.failures.some(failure =>
    failure.day === "thursday" &&
    failure.block === "morning" &&
    failure.tasks.some(task => task.subject === "chemistry" && task.teacherCandidates.length === 0)
  ),
  "Negative test must still expose unavailable Thursday-morning chemistry"
);

console.table(rows);
console.log("Gangway capacity diagnostic: invariants confirmed; scenario outcomes listed above.");
