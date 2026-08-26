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

function subjectCapacityUpperBound(task) {
  const capacities = task.roomCandidates
    .map(room => model.ROOMS[room].capacity)
    .sort((a, b) => b - a);
  const parallelGroups = Math.min(task.teacherCandidates.length, capacities.length);
  return capacities.slice(0, parallelGroups).reduce((sum, capacity) => sum + capacity, 0);
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

  if (result.ok) {
    assertSolvedPlan(result);
  } else if (scenario.id !== "cohort-75-negative") {
    assert.ok(
      result.failures.some(failure =>
        failure.tasks.some(task => task.students.length > subjectCapacityUpperBound(task))
      ),
      `${scenario.id}: expected a demonstrable teacher/room capacity bottleneck`
    );
  }

  const monday = scenario.metadata.attendance.monday;
  const thursday = scenario.metadata.attendance.thursday;
  assert.equal(monday.present + monday.absent, scenario.metadata.enrolled);
  assert.equal(thursday.present + thursday.absent, scenario.metadata.enrolled);
  assert.ok(uniqueStudents(scenario.choices) <= scenario.metadata.enrolled);

  if (scenario.id === "cohort-75-negative") {
    assert.ok(
      result.failures.some(failure =>
        failure.day === "thursday" &&
        failure.block === "morning" &&
        failure.tasks.some(task => task.subject === "chemistry" && task.teacherCandidates.length === 0)
      ),
      "Negative test must expose unavailable Thursday-morning chemistry"
    );
  }

  rows.push({
    id: scenario.id,
    enrolled: scenario.metadata.enrolled,
    mondayPresent: monday.present,
    thursdayPresent: thursday.present,
    groups: result.assignments.length,
    failures: result.failures.length,
    expected: expected ? "OK" : "FAIL",
    actual: result.ok ? "OK" : "FAIL",
    ms: elapsedMs.toFixed(2)
  });
}

console.table(rows);
console.log("Gangway synthetic cohorts: capacity-aware expected outcomes confirmed.");
