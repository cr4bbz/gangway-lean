(() => {
  const model = window.GangwayModel;
  const choicesRoot = document.querySelector("#choices");
  const template = document.querySelector("#choice-template");
  const planRoot = document.querySelector("#plan");
  const summaryRoot = document.querySelector("#summary");
  const statusRoot = document.querySelector("#plan-status");
  const leanCode = document.querySelector("#lean-code");
  const leanExport = document.querySelector("#lean-export");
  const availabilityRoot = document.querySelector("#availability");

  let choiceSequence = 0;
  let latestResult = null;
  let latestChoices = [];

  function subjectOptions(selected) {
    return model.SUBJECTS.map(subject =>
      `<option value="${subject.id}"${subject.id === selected ? " selected" : ""}>${subject.label}</option>`
    ).join("");
  }

  function updateSlotLabels(card) {
    const block = card.querySelector(".block").value;
    card.querySelectorAll(".subject-field").forEach((field, slotIndex) => {
      field.querySelector(".slot-time").textContent = model.BLOCKS[block].slots[slotIndex];
    });
  }

  function renumberChoices() {
    [...choicesRoot.querySelectorAll(".choice-card")].forEach((card, index) => {
      card.querySelector(".choice-number").textContent = `Belegung ${String(index + 1).padStart(2, "0")}`;
    });
  }

  function addChoice(data = {}) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.choiceId = String(++choiceSequence);

    card.querySelector(".student").value = data.student || "";
    card.querySelector(".level").value = data.level || "esa";
    card.querySelector(".day").value = data.day || "monday";
    card.querySelector(".block").value = data.block || "morning";

    const subjects = data.subjects || ["mathematics", "german", "english"];
    const subjectRoot = card.querySelector(".subjects");
    subjects.forEach((subject, slotIndex) => {
      const label = document.createElement("label");
      label.className = "subject-field";
      label.innerHTML = `
        <span>Slot ${slotIndex + 1} · <b class="slot-time"></b></span>
        <select class="subject" data-slot="${slotIndex}">${subjectOptions(subject)}</select>
      `;
      subjectRoot.appendChild(label);
    });

    card.querySelector(".remove-choice").addEventListener("click", () => {
      card.remove();
      renumberChoices();
      invalidateResult();
    });

    card.querySelector(".block").addEventListener("change", () => {
      updateSlotLabels(card);
      invalidateResult();
    });

    card.querySelectorAll("input, select").forEach(control => {
      control.addEventListener("input", invalidateResult);
      control.addEventListener("change", invalidateResult);
    });

    updateSlotLabels(card);
    choicesRoot.appendChild(card);
    renumberChoices();
  }

  function invalidateResult() {
    if (!latestResult) return;
    statusRoot.className = "status neutral";
    statusRoot.textContent = "Eingaben geändert";
  }

  function clearChoices() {
    choicesRoot.innerHTML = "";
    latestResult = null;
    latestChoices = [];
    renderEmpty();
  }

  function loadReference() {
    clearChoices();
    model.REFERENCE_CHOICES.forEach(addChoice);
    generate();
  }

  function readChoices() {
    return [...choicesRoot.querySelectorAll(".choice-card")].map((card, index) => ({
      student: card.querySelector(".student").value.trim() || `SuS ${index + 1}`,
      level: card.querySelector(".level").value,
      day: card.querySelector(".day").value,
      block: card.querySelector(".block").value,
      subjects: [...card.querySelectorAll(".subject")].map(select => select.value)
    }));
  }

  function setStatus(kind, text) {
    statusRoot.className = `status ${kind}`;
    statusRoot.textContent = text;
  }

  function renderEmpty() {
    setStatus("neutral", "Noch nicht berechnet");
    summaryRoot.innerHTML = "";
    planRoot.className = "plan-grid empty-state";
    planRoot.innerHTML = "<p>Füge Belegungen hinzu und erzeuge einen Plan. Gleiche Fachwünsche im selben Slot werden zu einer Lerngruppe gebündelt.</p>";
    leanCode.textContent = "-- Erzeuge zuerst einen gültigen Plan.";
    leanExport.open = false;
  }

  function summaryCard(value, label) {
    return `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`;
  }

  function momentKey(item) {
    return `${item.day}|${item.block}|${item.slotIndex}`;
  }

  function renderSummary(result, choices) {
    const teachers = new Set(result.assignments.map(item => item.teacher));
    const rooms = new Set(result.assignments.map(item => item.room));
    summaryRoot.innerHTML = [
      summaryCard(choices.length, "Belegungen"),
      summaryCard(result.assignments.length, "Lerngruppen"),
      summaryCard(teachers.size, "Lehrkräfte genutzt"),
      summaryCard(rooms.size, "Räume genutzt")
    ].join("");
  }

  function renderAssignmentCard(assignment) {
    const students = [...new Set(assignment.students)].join(", ");
    return `
      <article class="lesson-card">
        <div class="lesson-title">
          <strong>${model.SUBJECT_LABEL[assignment.subject]}</strong>
          <span>${assignment.levels.map(level => level.toUpperCase()).filter((value, index, list) => list.indexOf(value) === index).join(" / ")}</span>
        </div>
        <dl>
          <div><dt>Lehrkraft</dt><dd>${model.TEACHERS[assignment.teacher].label}</dd></div>
          <div><dt>Raum</dt><dd>${model.ROOMS[assignment.room].label}</dd></div>
          <div><dt>SuS</dt><dd>${students}</dd></div>
        </dl>
      </article>
    `;
  }

  function renderPlan(result) {
    planRoot.className = "plan-grid";

    if (!result.ok) {
      planRoot.innerHTML = result.failures.map(failure => {
        const block = model.BLOCKS[failure.block];
        const time = block.slots[failure.slotIndex];
        const issues = failure.tasks.map(task => {
          const teachers = task.teacherCandidates.length
            ? task.teacherCandidates.map(id => model.TEACHERS[id].label).join(", ")
            : "keine verfügbare Lehrkraft";
          const rooms = task.roomCandidates.length
            ? task.roomCandidates.map(id => model.ROOMS[id].label).join(", ")
            : "kein planbarer Raum";
          return `<li><strong>${model.SUBJECT_LABEL[task.subject]}</strong>: ${teachers}; Räume: ${rooms}</li>`;
        }).join("");

        return `
          <article class="failure-card">
            <p class="kicker">Nicht lösbarer Moment</p>
            <h3>${model.DAYS[failure.day].label} · ${block.label} · ${time}</h3>
            <p>Für alle gleichzeitig gewünschten Fächer konnte keine kollisionsfreie Lehrer-/Raumkombination gefunden werden.</p>
            <ul>${issues}</ul>
          </article>
        `;
      }).join("");
      return;
    }

    const grouped = new Map();
    result.assignments.forEach(assignment => {
      const key = momentKey(assignment);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(assignment);
    });

    planRoot.innerHTML = [...grouped.entries()].map(([, assignments]) => {
      const first = assignments[0];
      const block = model.BLOCKS[first.block];
      return `
        <section class="moment-card">
          <header>
            <div>
              <p class="kicker">${model.DAYS[first.day].label} · ${block.label}</p>
              <h3>Slot ${first.slotIndex + 1}</h3>
            </div>
            <time>${block.slots[first.slotIndex]}</time>
          </header>
          <div class="lesson-list">${assignments.map(renderAssignmentCard).join("")}</div>
        </section>
      `;
    }).join("");
  }

  function leanString(value) {
    return JSON.stringify(value);
  }

  function leanChoice(choice, index) {
    const subjects = choice.subjects.map(subject => `.${subject}`).join(", ");
    return `def plannerChoice${index} : AttendanceChoice :=\n  { student := ${leanString(choice.student)}\n    day := .${choice.day}\n    block := .${choice.block}\n    level := .${choice.level}\n    subjects := ⟨${subjects}⟩ }`;
  }

  function leanLesson(assignment) {
    const slot = model.SLOT_IDS[assignment.slotIndex];
    return `  ⟨⟨.${assignment.day}, .${assignment.block}, .${slot}, .${assignment.subject}, .${assignment.teacher}⟩, .${assignment.room}⟩`;
  }

  function buildLeanExport(result, choices) {
    if (!result.ok) return "-- Der aktuelle Browser-Plan ist nicht konfliktfrei und kann nicht exportiert werden.";

    const definitions = choices.map(leanChoice).join("\n\n");
    const lessons = result.assignments.map(leanLesson).join(",\n");
    const coverageChecks = choices.map((_, index) =>
      `example : scheduledCoversChoice plannerPlan plannerChoice${index} = true := by decide`
    ).join("\n");

    return `import GangwayLean.Rooms\n\nnamespace Gangway\n\n${definitions}\n\ndef plannerPlan : List ScheduledLesson := [\n${lessons}\n]\n\nexample : scheduledPlanValid plannerPlan = true := by decide\n${coverageChecks}\n\nend Gangway\n`;
  }

  function generate() {
    const choices = readChoices();
    if (choices.length === 0) {
      setStatus("warning", "Keine Belegungen");
      planRoot.className = "plan-grid empty-state";
      planRoot.innerHTML = "<p>Mindestens eine Belegung wird benötigt.</p>";
      return;
    }

    const result = model.generatePlan(choices);
    latestResult = result;
    latestChoices = choices;

    renderSummary(result, choices);
    renderPlan(result);
    leanCode.textContent = buildLeanExport(result, choices);

    if (result.ok) {
      setStatus("success", "Kollisionsfrei im Browsermodell");
    } else {
      setStatus("error", `${result.failures.length} Konflikt${result.failures.length === 1 ? "" : "e"}`);
    }
  }

  function renderAvailability() {
    const blocks = Object.entries(model.AVAILABILITY).map(([key, teacherIds]) => {
      const [day, block] = key.split("|");
      const teacherList = teacherIds.map(id => {
        const teacher = model.TEACHERS[id];
        const subjects = teacher.subjects.map(subject => model.SUBJECT_LABEL[subject]).join(" / ");
        return `<li><strong>${teacher.label}</strong><span>${subjects}</span></li>`;
      }).join("");

      return `
        <details>
          <summary>${model.DAYS[day].label} · ${model.BLOCKS[block].label}</summary>
          <ul>${teacherList}</ul>
        </details>
      `;
    }).join("");

    const rooms = Object.entries(model.ROOMS).map(([id, room]) => {
      let tag = "nicht verplant";
      if (room.mode === "scheduled") tag = "planbar";
      if (room.mode === "independent") tag = "frei nutzbar · nicht verplant";
      if (room.mode === "nonTeaching") tag = "kein Unterrichtsraum";
      return `<li><strong>${room.label}</strong><span>${tag}</span></li>`;
    }).join("");

    availabilityRoot.innerHTML = `
      <h3>Lehrkräfte je Block</h3>
      ${blocks}
      <h3>Räume</h3>
      <ul>${rooms}</ul>
    `;
  }

  async function copyLean() {
    const text = leanCode.textContent;
    try {
      await navigator.clipboard.writeText(text);
      const button = document.querySelector("#copy-lean");
      const previous = button.textContent;
      button.textContent = "Kopiert ✓";
      setTimeout(() => { button.textContent = previous; }, 1400);
    } catch {
      leanExport.open = true;
      window.getSelection()?.selectAllChildren(leanCode);
    }
  }

  document.querySelector("#add-choice").addEventListener("click", () => addChoice());
  document.querySelector("#clear-choices").addEventListener("click", clearChoices);
  document.querySelector("#load-reference").addEventListener("click", loadReference);
  document.querySelector("#generate").addEventListener("click", generate);
  document.querySelector("#copy-lean").addEventListener("click", copyLean);

  window.GangwayPlannerUI = { addChoice, clearChoices, generate };

  renderAvailability();
  loadReference();
})();
