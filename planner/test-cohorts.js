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

function assertCollisionFree(result) {
  const moments = new Map();
  for (const assignment of result.assignments) {
    assert.ok(
      model.SCHEDULABLE_ROOMS.includes(assignment.room),
      `Non-schedulable room assigned: ${assignment.room}`
    );
    assert.equal(model.INDEPENDENT_ROOMS.includes(assignment.room), false, "Work rooms must remain independently usable");

    const key = `${assignment.day}|${assignment.block}|${assignment.slotIndex}`;
    if (!moments.has(key)) moments.set(key, []);
    moments.get(key).push(assignment);
  }

  for (const assignments of moments.values()) {
    const teachers = assignments.map(item => item.teacher);
    const rooms = assignments.map(item => item.room);
    assert.equal(new Set(teachers).size, teachers.length, "Teacher collision in solved test cohort");
    assert.equal(new Set(rooms).size, rooms.length, "Room collision in solved test cohort");
  }
}

const rows = [];
for (const scenario of testData.TEST_SCENARIOS) {
  const start = performance.now();
  const result = model.generatePlan(scenario.choices);
  const elapsedMs = performance.now() - start;
  const expected = scenario.metadata.expectedSolvable;

  assert.equal(
    result.ok,
    expected,
    `${scenario.id}: expected solvable=${expected}, got ${result.ok}; failures=${result.failures.length}`
  );

  if (result.ok) assertCollisionFree(result);

  const monday = scenario.metadata.attendance.monday;
  const thursday = scenario.metadata.attendance.thursday;
  assert.equal(monday.present + monday.absent, scenario.metadata.enrolled);
  assert.equal(thursday.present + thursday.absent, scenario.metadata.enrolled);
  assert.ok(uniqueStudents(scenario.choices) <= scenario.metadata.enrolled);

  if (!expected) {
    assert.ok(
      result.failures.some(failure =>
        failure.day === "thursday" &&
        failure.block === "morning" &&
        failure.tasks.some(task => task.subject === "chemistry" && task.teacherCandidates.length === 0)
      ),
      `${scenario.id}: negative test must expose unavailable Thursday-morning chemistry`
    );
  }

  rows.push({
    id: scenario.id,
    enrolled: scenario.metadata.enrolled,
    mondayPresent: monday.present,
    thursdayPresent: thursday.present,
    choices: scenario.choices.length,
    groups: result.assignments.length,
    failures: result.failures.length,
    expected: expected ? "OK" : "FAIL",
    actual: result.ok ? "OK" : "FAIL",
    ms: elapsedMs.toFixed(2)
  });
}

console.table(rows);
console.log("Gangway synthetic cohorts: all expected outcomes confirmed without allocating work rooms.");
