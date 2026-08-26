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
    english: { label: "Englisch", mode: "scheduled", capacity: 11 },
    science: { label: "Biologie / Physik / Chemie", mode: "scheduled", capacity: 12 },
    art: { label: "Kunst", mode: "scheduled", capacity: 8 },
    german: { label: "Deutsch", mode: "scheduled", capacity: 11 },
    historyGeography: { label: "Geschichte / Geographie", mode: "scheduled", capacity: 12 },
    mathematics: { label: "Mathematik", mode: "scheduled", capacity: 10 },
    individualWork: { label: "Einzelarbeit", mode: "independent", capacity: 8 },
    groupWork: { label: "Gruppenarbeit", mode: "independent", capacity: 14 },
    breakRoom: { label: "Pausenraum", mode: "nonTeaching", capacity: 6 }
  };

  const SCHEDULABLE_ROOMS = ["english", "science", "art", "german", "historyGeography", "mathematics"];
  const INDEPENDENT_ROOMS = ["individualWork", "groupWork"];

  const PREFERRED_ROOMS = {
    english: ["english", "german", "historyGeography", "mathematics", "art", "science"],
    biology: ["science", "historyGeography", "english", "german", "mathematics", "art"],
    chemistry: ["science", "historyGeography", "english", "german", "mathematics", "art"],
    physics: ["science", "historyGeography", "english", "german", "mathematics", "art"],
    german: ["german", "english", "historyGeography", "mathematics", "art", "science"],
    history: ["historyGeography", "german", "english", "mathematics", "art", "science"],
    geography: ["historyGeography", "german", "english", "mathematics", "art", "science"],
    politics: ["historyGeography", "german", "english", "mathematics", "art", "science"],
    mathematics: ["mathematics", "historyGeography", "english", "german", "art", "science"]
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

  function combinations(values, size, start = 0, prefix = [], result = []) {
    if (prefix.length === size) {
      result.push(prefix);
      return result;
    }
    for (let index = start; index <= values.length - (size - prefix.length); index += 1) {
      combinations(values, size, index + 1, [...prefix, values[index]], result);
    }
    return result;
  }

  function splitMembers(members, rooms) {
    const groups = [];
    let cursor = 0;
    for (let index = 0; index < rooms.length; index += 1) {
      const room = rooms[index];
      const remainingStudents = members.length - cursor;
      const remainingGroups = rooms.length - index - 1;
      const size = Math.min(ROOMS[room].capacity, remainingStudents - remainingGroups);
      if (size <= 0) return null;
      groups.push(members.slice(cursor, cursor + size));
      cursor += size;
    }
    return cursor === members.length ? groups : null;
  }

  function groupOptions(task, usedTeachers, usedRooms) {
    const teachers = task.teacherCandidates.filter(id => !usedTeachers.has(id));
    const rooms = task.roomCandidates.filter(id => !usedRooms.has(id));
    const studentCount = task.members.length;
    const maxGroups = Math.min(teachers.length, rooms.length, studentCount);
    const options = [];

    for (let groupCount = 1; groupCount <= maxGroups; groupCount += 1) {
      const roomSets = combinations(rooms, groupCount)
        .filter(roomSet => roomSet.reduce((sum, room) => sum + ROOMS[room].capacity, 0) >= studentCount);
      if (roomSets.length === 0) continue;

      const teacherSets = combinations(teachers, groupCount);
      for (const roomSet of roomSets) {
        const memberGroups = splitMembers(task.members, roomSet);
        if (!memberGroups) continue;
        for (const teacherSet of teacherSets) {
          options.push(roomSet.map((room, index) => {
            const members = memberGroups[index];
            return {
              ...task,
              teacher: teacherSet[index],
              room,
              members,
              students: members.map(member => member.student),
              levels: members.map(member => member.level),
              capacity: ROOMS[room].capacity
            };
          }));
        }
      }

      // Prefer the smallest number of simultaneous groups that can solve this subject.
      if (options.length > 0) break;
    }

    return options;
  }

  function solveMoment(tasks) {
    const enriched = tasks.map(task => ({
      ...task,
      teacherCandidates: eligibleTeachers(task.day, task.block, task.levels, task.subject),
      roomCandidates: preferredRooms(task.subject)
    }));

    const ordered = [...enriched].sort((a, b) => {
      const aTeacherPressure = a.members.length / Math.max(1, a.teacherCandidates.length);
      const bTeacherPressure = b.members.length / Math.max(1, b.teacherCandidates.length);
      if (aTeacherPressure !== bTeacherPressure) return bTeacherPressure - aTeacherPressure;
      return a.teacherCandidates.length - b.teacherCandidates.length;
    });

    if (ordered.some(task => task.teacherCandidates.length === 0 || task.roomCandidates.length === 0)) {
      return { ok: false, tasks: enriched, assignments: [] };
    }

    function search(index, usedTeachers, usedRooms, assignments) {
      if (index >= ordered.length) return assignments;
      const task = ordered[index];
      const options = groupOptions(task, usedTeachers, usedRooms);

      for (const option of options) {
        const nextTeachers = new Set(usedTeachers);
        const nextRooms = new Set(usedRooms);
        option.forEach(group => {
          nextTeachers.add(group.teacher);
          nextRooms.add(group.room);
        });
        const result = search(index + 1, nextTeachers, nextRooms, [...assignments, ...option]);
        if (result) return result;
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
          moment.subjects.set(subject, { subject, members: [] });
        }
        moment.subjects.get(subject).members.push({ student: choice.student, level: choice.level });
      });
    });

    return [...moments.values()].map(moment => ({
      ...moment,
      tasks: [...moment.subjects.values()].map(task => ({
        ...task,
        students: task.members.map(member => member.student),
        levels: task.members.map(member => member.level),
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
      if (solved.ok) assignments.push(...solved.assignments);
      else failures.push({ ...moment, ...solved });
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
    { student: "Alex", level: "msa", day: "monday", block: "morning", subjects: ["english", "biology", "mathematics"] },
    { student: "Alex", level: "msa", day: "thursday", block: "afternoon", subjects: ["english", "biology", "mathematics"] },
    { student: "Bea", level: "esa", day: "monday", block: "morning", subjects: ["german", "geography", "physics"] },
    { student: "Bea", level: "esa", day: "thursday", block: "afternoon", subjects: ["mathematics", "english", "chemistry"] }
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
    SCHEDULABLE_ROOMS,
    INDEPENDENT_ROOMS,
    PREFERRED_ROOMS,
    REFERENCE_CHOICES,
    eligibleTeachers,
    preferredRooms,
    generatePlan
  };
})();
