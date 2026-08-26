window.GangwayModel = (() => {
  const DAYS = {
    monday: { label: "Montag", order: 0 },
    thursday: { label: "Donnerstag", order: 1 }
  };

  const BLOCKS = {
    morning: {
      label: "Vormittag",
      window: "09:30–12:30",
      slots: ["09:30–10:30", "10:30–11:30", "11:30–12:30"]
    },
    afternoon: {
      label: "Nachmittag",
      window: "13:00–16:00",
      slots: ["13:00–14:00", "14:00–15:00", "15:00–16:00"]
    }
  };

  const SLOT_IDS = ["first", "second", "third"];

  const SUBJECTS = [
    ["biology", "Biologie"],
    ["chemistry", "Chemie"],
    ["english", "Englisch"],
    ["german", "Deutsch"],
    ["geography", "Geographie"],
    ["politics", "Politik"],
    ["mathematics", "Mathematik"],
    ["history", "Geschichte"],
    ["physics", "Physik"]
  ].map(([id, label]) => ({ id, label }));

  const SUBJECT_LABEL = Object.fromEntries(SUBJECTS.map(subject => [subject.id, subject.label]));

  const TEACHERS = {
    zara: { label: "Zara", subjects: ["biology", "chemistry"], levels: ["esa", "msa"] },
    agnes: { label: "Agnes", subjects: ["english", "german"], levels: ["esa", "msa"] },
    pino: { label: "Pino", subjects: ["geography", "politics"], levels: ["esa", "msa"] },
    marianne: { label: "Marianne", subjects: ["english"], levels: ["esa", "msa"] },
    phil: { label: "Phil", subjects: ["mathematics"], levels: ["esa", "msa"] },
    julian: { label: "Julian", subjects: ["mathematics", "biology"], levels: ["esa", "msa"] },
    vicky: { label: "Vicky", subjects: ["history"], levels: ["esa", "msa"] },
    titus: { label: "Titus", subjects: ["mathematics", "history"], levels: ["esa", "msa"] },
    janT: { label: "Jan T.", subjects: ["history", "german"], levels: ["esa", "msa"] },
    janS: { label: "Jan S.", subjects: ["mathematics", "physics"], levels: ["esa", "msa"] }
  };

  const AVAILABILITY = {
    "monday|morning": ["agnes", "janT", "zara", "titus", "janS", "marianne", "pino"],
    "monday|afternoon": ["agnes", "vicky", "phil", "zara", "julian", "pino"],
    "thursday|morning": ["phil", "vicky", "janT", "titus", "janS"],
    "thursday|afternoon": ["julian", "marianne", "zara", "janS"]
  };

  const ROOMS = {
    english: { label: "Englisch" },
    science: { label: "Biologie / Physik / Chemie" },
    art: { label: "Kunst" },
    german: { label: "Deutsch" },
    historyGeography: { label: "Geschichte / Geographie" },
    individualWork: { label: "Einzelarbeit" },
    groupWork: { label: "Gruppenarbeit" },
    chill: { label: "Chillraum" }
  };

  const PREFERRED_ROOMS = {
    english: ["english", "groupWork", "individualWork"],
    biology: ["science", "groupWork", "individualWork"],
    chemistry: ["science", "groupWork", "individualWork"],
    physics: ["science", "groupWork", "individualWork"],
    german: ["german", "groupWork", "individualWork"],
    history: ["historyGeography", "groupWork", "individualWork"],
    geography: ["historyGeography", "groupWork", "individualWork"],
    politics: ["historyGeography", "groupWork", "individualWork"],
    mathematics: ["groupWork", "individualWork"]
  };

  function availabilityKey(day, block) {
    return `${day}|${block}`;
  }

  function eligibleTeachers(day, block, levels, subject) {
    const requiredLevels = [...new Set(levels)];
    return (AVAILABILITY[availabilityKey(day, block)] || []).filter(teacherId => {
      const teacher = TEACHERS[teacherId];
      return teacher.subjects.includes(subject) && requiredLevels.every(level => teacher.levels.includes(level));
    });
  }

  function preferredRooms(subject) {
    return PREFERRED_ROOMS[subject] ? [...PREFERRED_ROOMS[subject]] : [];
  }

  function compareMoments(a, b) {
    const dayDifference = DAYS[a.day].order - DAYS[b.day].order;
    if (dayDifference !== 0) return dayDifference;
    if (a.block !== b.block) return a.block === "morning" ? -1 : 1;
    return a.slotIndex - b.slotIndex;
  }

  function solveMoment(tasks) {
    const enriched = tasks.map(task => ({
      ...task,
      teacherCandidates: eligibleTeachers(task.day, task.block, task.levels, task.subject),
      roomCandidates: preferredRooms(task.subject)
    }));

    const ordered = [...enriched].sort((a, b) => {
      const aScore = a.teacherCandidates.length * a.roomCandidates.length;
      const bScore = b.teacherCandidates.length * b.roomCandidates.length;
      return aScore - bScore;
    });

    if (ordered.some(task => task.teacherCandidates.length === 0 || task.roomCandidates.length === 0)) {
      return { ok: false, tasks: enriched, assignments: [] };
    }

    function search(index, usedTeachers, usedRooms, assignments) {
      if (index >= ordered.length) return assignments;
      const task = ordered[index];

      for (const teacher of task.teacherCandidates) {
        if (usedTeachers.has(teacher)) continue;
        for (const room of task.roomCandidates) {
          if (usedRooms.has(room)) continue;

          const nextAssignments = [...assignments, { ...task, teacher, room }];
          const result = search(
            index + 1,
            new Set([...usedTeachers, teacher]),
            new Set([...usedRooms, room]),
            nextAssignments
          );
          if (result) return result;
        }
      }
      return null;
    }

    const assignments = search(0, new Set(), new Set(), []);
    return assignments
      ? { ok: true, tasks: enriched, assignments }
      : { ok: false, tasks: enriched, assignments: [] };
  }

  function buildTasks(choices) {
    const moments = new Map();

    choices.forEach(choice => {
      choice.subjects.forEach((subject, slotIndex) => {
        const key = `${choice.day}|${choice.block}|${slotIndex}`;
        if (!moments.has(key)) {
          moments.set(key, {
            day: choice.day,
            block: choice.block,
            slotIndex,
            subjects: new Map()
          });
        }

        const moment = moments.get(key);
        if (!moment.subjects.has(subject)) {
          moment.subjects.set(subject, {
            subject,
            students: [],
            levels: []
          });
        }

        const subjectTask = moment.subjects.get(subject);
        subjectTask.students.push(choice.student);
        subjectTask.levels.push(choice.level);
      });
    });

    return [...moments.values()].map(moment => ({
      ...moment,
      tasks: [...moment.subjects.values()].map(task => ({
        ...task,
        day: moment.day,
        block: moment.block,
        slotIndex: moment.slotIndex
      }))
    })).sort(compareMoments);
  }

  function generatePlan(choices) {
    const moments = buildTasks(choices);
    const assignments = [];
    const failures = [];

    moments.forEach(moment => {
      const solved = solveMoment(moment.tasks);
      if (solved.ok) {
        assignments.push(...solved.assignments);
      } else {
        failures.push({ ...moment, ...solved });
      }
    });

    assignments.sort(compareMoments);
    return {
      ok: failures.length === 0,
      moments,
      assignments,
      failures
    };
  }

  const REFERENCE_CHOICES = [
    {
      student: "Alex",
      level: "msa",
      day: "monday",
      block: "morning",
      subjects: ["english", "biology", "mathematics"]
    },
    {
      student: "Alex",
      level: "msa",
      day: "thursday",
      block: "afternoon",
      subjects: ["english", "biology", "mathematics"]
    },
    {
      student: "Bea",
      level: "esa",
      day: "monday",
      block: "morning",
      subjects: ["german", "geography", "physics"]
    },
    {
      student: "Bea",
      level: "esa",
      day: "thursday",
      block: "afternoon",
      subjects: ["mathematics", "english", "chemistry"]
    }
  ];

  return {
    DAYS,
    BLOCKS,
    SLOT_IDS,
    SUBJECTS,
    SUBJECT_LABEL,
    TEACHERS,
    AVAILABILITY,
    ROOMS,
    PREFERRED_ROOMS,
    REFERENCE_CHOICES,
    eligibleTeachers,
    preferredRooms,
    generatePlan
  };
})();
