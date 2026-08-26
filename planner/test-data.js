(() => {
  const DAYS = ["monday", "thursday"];

  // These palettes are deliberately chosen so that the current teacher/room model can
  // schedule the complete set of subjects in parallel for the corresponding block.
  const FEASIBLE_PALETTES = {
    "monday|morning": ["english", "german", "biology", "mathematics", "geography", "physics"],
    "monday|afternoon": ["english", "history", "mathematics", "chemistry", "geography"],
    "thursday|morning": ["mathematics", "history", "german", "physics"],
    "thursday|afternoon": ["mathematics", "english", "biology", "chemistry"]
  };

  function mulberry32(seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffledIndices(count, seed) {
    const values = Array.from({ length: count }, (_, index) => index);
    const random = mulberry32(seed);
    for (let index = values.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [values[index], values[target]] = [values[target], values[index]];
    }
    return values;
  }

  function subjectTriple(palette, studentIndex, dayIndex) {
    const offset = (studentIndex * 3 + dayIndex * 2) % palette.length;
    return [0, 1, 2].map(slotIndex => palette[(offset + slotIndex * 2) % palette.length]);
  }

  function buildScenario(config) {
    const {
      id,
      label,
      students,
      absenceRate,
      morningShare = 0.5,
      seed = 1,
      expectedSolvable = true,
      note = ""
    } = config;

    const roster = Array.from({ length: students }, (_, index) => ({
      index,
      student: `T${String(students).padStart(3, "0")}-${String(index + 1).padStart(3, "0")}`,
      level: index % 2 === 0 ? "esa" : "msa"
    }));

    const choices = [];
    const attendance = {};

    DAYS.forEach((day, dayIndex) => {
      const absenceCount = Math.round(students * absenceRate);
      const absentOrder = shuffledIndices(students, seed + 101 * (dayIndex + 1));
      const absent = new Set(absentOrder.slice(0, absenceCount));
      const presentRoster = roster.filter(person => !absent.has(person.index));

      const blockOrder = shuffledIndices(presentRoster.length, seed + 1009 * (dayIndex + 1));
      const morningCount = Math.round(presentRoster.length * morningShare);
      const morningPositions = new Set(blockOrder.slice(0, morningCount));

      presentRoster.forEach((person, presentIndex) => {
        const block = morningPositions.has(presentIndex) ? "morning" : "afternoon";
        const palette = FEASIBLE_PALETTES[`${day}|${block}`];
        choices.push({
          student: person.student,
          level: person.level,
          day,
          block,
          subjects: subjectTriple(palette, person.index, dayIndex)
        });
      });

      attendance[day] = {
        absent: absenceCount,
        present: presentRoster.length,
        morning: morningCount,
        afternoon: presentRoster.length - morningCount
      };
    });

    return {
      id,
      label,
      metadata: {
        enrolled: students,
        targetAbsenceRate: absenceRate,
        morningShare,
        expectedSolvable,
        seed,
        note,
        attendance
      },
      choices
    };
  }

  const SCENARIO_CONFIGS = [
    {
      id: "cohort-25",
      label: "25 SuS · 12 % absent",
      students: 25,
      absenceRate: 0.12,
      seed: 25012,
      note: "Kleine Smoke-Test-Kohorte."
    },
    {
      id: "cohort-50",
      label: "50 SuS · 12 % absent",
      students: 50,
      absenceRate: 0.12,
      seed: 50012,
      note: "Mittlere Kohorte."
    },
    {
      id: "cohort-75-low",
      label: "75 SuS · ca. 10 % absent",
      students: 75,
      absenceRate: 0.10,
      seed: 75100,
      note: "Reale Schulgröße bei niedriger Abwesenheit."
    },
    {
      id: "cohort-75-mid",
      label: "75 SuS · 12 % absent",
      students: 75,
      absenceRate: 0.12,
      seed: 75120,
      note: "Reale Schulgröße, mittlere Abwesenheitsannahme."
    },
    {
      id: "cohort-75-high",
      label: "75 SuS · ca. 15 % absent",
      students: 75,
      absenceRate: 0.15,
      seed: 75150,
      note: "Reale Schulgröße bei hoher typischer Abwesenheit."
    },
    {
      id: "cohort-75-morning-heavy",
      label: "75 SuS · 12 % absent · 70 % vormittags",
      students: 75,
      absenceRate: 0.12,
      morningShare: 0.70,
      seed: 75700,
      note: "Belastungstest mit starker Vormittagskonzentration."
    },
    {
      id: "cohort-100",
      label: "100 SuS · 12 % absent",
      students: 100,
      absenceRate: 0.12,
      seed: 100012,
      note: "Überlast-/Wachstumstest oberhalb der realen Schulgröße."
    }
  ];

  const TEST_SCENARIOS = SCENARIO_CONFIGS.map(buildScenario);

  // Fault injection: same realistic cohort, but one Thursday-morning request asks for
  // chemistry although no chemistry teacher is available in that block.
  const negativeBase = buildScenario({
    id: "cohort-75-negative",
    label: "75 SuS · Negativtest (Chemie Do VM)",
    students: 75,
    absenceRate: 0.12,
    seed: 75999,
    expectedSolvable: false,
    note: "Absichtlich unlösbar: Chemie am Donnerstagvormittag."
  });
  const injected = negativeBase.choices.find(choice => choice.day === "thursday" && choice.block === "morning");
  if (injected) injected.subjects[0] = "chemistry";
  TEST_SCENARIOS.push(negativeBase);

  const byId = Object.fromEntries(TEST_SCENARIOS.map(scenario => [scenario.id, scenario]));

  window.GangwayTestData = {
    FEASIBLE_PALETTES,
    TEST_SCENARIOS,
    byId,
    buildScenario
  };
})();
