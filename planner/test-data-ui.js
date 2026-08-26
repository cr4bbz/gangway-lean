(() => {
  const testData = window.GangwayTestData;
  const select = document.querySelector("#test-scenario");
  const loadButton = document.querySelector("#load-test-scenario");
  const info = document.querySelector("#test-scenario-info");

  if (!testData || !select || !loadButton) return;

  function scenarioOption(scenario) {
    const option = document.createElement("option");
    option.value = scenario.id;
    option.textContent = scenario.label;
    return option;
  }

  testData.TEST_SCENARIOS.forEach(scenario => select.appendChild(scenarioOption(scenario)));

  function setChoice(card, choice) {
    card.querySelector(".student").value = choice.student;
    card.querySelector(".level").value = choice.level;
    card.querySelector(".day").value = choice.day;
    card.querySelector(".block").value = choice.block;
    card.querySelector(".block").dispatchEvent(new Event("change", { bubbles: true }));
    [...card.querySelectorAll(".subject")].forEach((subjectSelect, index) => {
      subjectSelect.value = choice.subjects[index];
    });
  }

  function renderInfo(scenario) {
    const meta = scenario.metadata;
    const monday = meta.attendance.monday;
    const thursday = meta.attendance.thursday;
    const realizedMonday = ((monday.absent / meta.enrolled) * 100).toFixed(1);
    const realizedThursday = ((thursday.absent / meta.enrolled) * 100).toFixed(1);

    info.innerHTML = `
      <strong>${meta.enrolled} eingeschriebene SuS</strong>
      <span>Montag: ${monday.present} anwesend / ${monday.absent} absent (${realizedMonday} %)</span>
      <span>Donnerstag: ${thursday.present} anwesend / ${thursday.absent} absent (${realizedThursday} %)</span>
      <span>${scenario.choices.length} Tagesbelegungen · Erwartung: ${meta.expectation}</span>
      <small>${meta.note}</small>
    `;
  }

  function loadScenario() {
    const scenario = testData.byId[select.value];
    if (!scenario) return;

    document.querySelector("#clear-choices").click();
    scenario.choices.forEach(choice => {
      document.querySelector("#add-choice").click();
      const cards = document.querySelectorAll("#choices .choice-card");
      setChoice(cards[cards.length - 1], choice);
    });

    renderInfo(scenario);
    document.querySelector("#generate").click();
  }

  select.addEventListener("change", () => {
    const scenario = testData.byId[select.value];
    if (scenario) renderInfo(scenario);
  });
  loadButton.addEventListener("click", loadScenario);

  if (testData.TEST_SCENARIOS.length > 0) {
    select.value = testData.TEST_SCENARIOS.find(scenario => scenario.id === "cohort-75-mid")?.id
      || testData.TEST_SCENARIOS[0].id;
    renderInfo(testData.byId[select.value]);
  }
})();
