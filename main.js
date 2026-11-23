(() => {
  const form = document.querySelector("#calculator-form");
  const yearInput = document.querySelector("#batch-year");
  const intakeInput = document.querySelector("#intake");
  const currentYearInput = document.querySelector("#current-year");
  const currentSeasonInput = document.querySelector("#current-season");
  const freezeList = document.querySelector("#freeze-list");
  const emptyFreezes = document.querySelector("#empty-freezes");
  const addFreezeButton = document.querySelector("#add-freeze");
  const errorMessage = document.querySelector("#error-message");
  const resultEyebrow = document.querySelector("#result-eyebrow");
  const resultTitle = document.querySelector("#result-title");
  const resultSubtitle = document.querySelector("#result-subtitle");
  const resultMetrics = document.querySelector("#result-metrics");
  const resultNote = document.querySelector("#result-note");
  const freezeTerms = [];

  const termIndex = ({ year, season }) => year * 2 + (season === "fall" ? 1 : 0);
  const termName = (season) => season === "fall" ? "Fall" : "Spring";
  const termLabel = ({ year, season }) => `${termName(season)} ${year}`;

  const validateFreezes = (terms, batchIndex, currentIndex) => {
    if (terms.length > 4) return "You can enter a maximum of 4 freezes.";
    const indices = terms.map(({ year, season }) => {
      if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
      return termIndex({ year, season });
    });
    if (indices.some((index) => index === null)) return "Enter a valid year and semester for each freeze.";
    if (indices.some((index) => index < batchIndex || index > currentIndex)) {
      return "Each freeze must be between your batch intake and the current semester.";
    }
    if (new Set(indices).size !== indices.length) return "Each semester can only be entered as a freeze once.";
    const sorted = [...indices].sort((a, b) => a - b);
    for (let index = 2; index < sorted.length; index += 1) {
      if (sorted[index] === sorted[index - 1] + 1 && sorted[index - 1] === sorted[index - 2] + 1) {
        return "You cannot have more than 2 consecutive frozen semesters.";
      }
    }
    return "";
  };

  const syncFreezeControls = () => {
    freezeList.replaceChildren();
    emptyFreezes.hidden = freezeTerms.length > 0;
    addFreezeButton.disabled = freezeTerms.length >= 4;

    freezeTerms.forEach((term, index) => {
      const row = document.createElement("div");
      row.className = "freeze-row";
      const freezeYear = document.createElement("input");
      freezeYear.type = "number";
      freezeYear.min = "2000";
      freezeYear.max = "2100";
      freezeYear.step = "1";
      freezeYear.value = String(term.year);
      freezeYear.setAttribute("aria-label", `Frozen semester year ${index + 1}`);
      freezeYear.addEventListener("input", () => {
        freezeTerms[index].year = Number(freezeYear.value);
        showError("");
      });
      const freezeSeason = document.createElement("select");
      freezeSeason.setAttribute("aria-label", `Frozen semester ${index + 1}`);
      for (const season of ["spring", "fall"]) {
        const option = document.createElement("option");
        option.value = season;
        option.textContent = termName(season);
        option.selected = term.season === season;
        freezeSeason.append(option);
      }
      freezeSeason.addEventListener("change", () => {
        freezeTerms[index].season = freezeSeason.value;
        showError("");
      });
      const remove = document.createElement("button");
      remove.className = "remove-button";
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove frozen semester ${index + 1}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        freezeTerms.splice(index, 1);
        syncFreezeControls();
        showError("");
      });
      row.append(freezeYear, freezeSeason, remove);
      freezeList.append(row);
    });
  };

  const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.classList.toggle("visible", Boolean(message));
  };

  const addMetric = (label, value) => {
    const row = document.createElement("div");
    row.className = "metric";
    const name = document.createElement("span");
    name.textContent = label;
    const result = document.createElement("strong");
    result.textContent = value;
    row.append(name, result);
    resultMetrics.append(row);
  };

  const showResult = ({ currentSemester, elapsedTerms, freezes, current }) => {
    resultMetrics.replaceChildren();
    resultEyebrow.textContent = "Your estimate";
    resultSubtitle.textContent = `As of ${termLabel(current)}; ${elapsedTerms} batch semester${elapsedTerms === 1 ? "" : "s"} elapsed, including ${freezes} freeze${freezes === 1 ? "" : "s"}.`;
    resultNote.className = "result-note";

    if (currentSemester < 1) {
      resultTitle.textContent = "Semester not started";
      addMetric("Current academic semester", "Not started");
      return;
    }

    resultTitle.textContent = currentSemester > 12
      ? "Degree incomplete"
      : `Currently in semester ${currentSemester}`;
    addMetric("Current academic semester", `${currentSemester}${currentSemester > 12 ? " (maximum is 12)" : ""}`);
    addMetric("Extra semesters beyond 8", String(Math.max(0, currentSemester - 8)));

    if (currentSemester > 12) {
      resultEyebrow.textContent = "Degree incomplete";
      addMetric("Maximum semester", "12th");
      resultNote.classList.add("warning");
      resultNote.textContent = `You have reached semester ${currentSemester}, beyond the 12-semester maximum. Contact your campus to confirm your academic status.`;
    } else if (currentSemester > 8) {
      addMetric("Recommended ending semester", `${currentSemester} (finish as soon as possible)`);
      resultNote.textContent = `You are ${currentSemester - 8} semester${currentSemester - 8 === 1 ? "" : "s"} beyond the standard 8. The recommended target is to complete by the end of semester ${currentSemester}.`;
    } else {
      addMetric("Recommended ending semester", "8 (standard)");
      resultNote.textContent = "You are within the standard 8-semester degree timeline.";
    }
  };

  addFreezeButton.addEventListener("click", () => {
    if (freezeTerms.length >= 4) return;
    freezeTerms.push({
      year: Number(currentYearInput.value),
      season: currentSeasonInput.value,
    });
    syncFreezeControls();
  });

  for (const input of [yearInput, intakeInput, currentYearInput, currentSeasonInput]) {
    input.addEventListener("input", syncFreezeControls);
    input.addEventListener("change", syncFreezeControls);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showError("");
    const year = Number(yearInput.value);
    const currentYear = Number(currentYearInput.value);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      showError("Enter a valid batch year between 2000 and 2100.");
      yearInput.focus();
      return;
    }
    if (!Number.isInteger(currentYear) || currentYear < 2000 || currentYear > 2100) {
      showError("Enter a valid current semester year between 2000 and 2100.");
      currentYearInput.focus();
      return;
    }

    const batch = { year, season: intakeInput.value };
    const current = { year: currentYear, season: currentSeasonInput.value };
    const batchIndex = termIndex(batch);
    const currentIndex = termIndex(current);
    if (batchIndex > currentIndex) {
      showError("The current semester cannot be earlier than your batch intake.");
      return;
    }
    const validationError = validateFreezes(freezeTerms, batchIndex, currentIndex);
    if (validationError) {
      showError(validationError);
      return;
    }

    const elapsedTerms = currentIndex - batchIndex + 1;
    const currentSemester = elapsedTerms - freezeTerms.length;
    showResult({
      currentSemester,
      elapsedTerms,
      freezes: freezeTerms.length,
      current,
    });
  });

  const plannerForm = document.querySelector("#semester-planner-form");
  const plannerInputYear = document.querySelector("#planner-input-year");
  const plannerInputSeason = document.querySelector("#planner-input-season");
  const semesterOffset = document.querySelector("#semester-offset");
  const plannerFreezeList = document.querySelector("#planner-freeze-list");
  const plannerEmptyFreezes = document.querySelector("#planner-empty-freezes");
  const addPlannerFreeze = document.querySelector("#add-planner-freeze");
  const plannerError = document.querySelector("#planner-error-message");
  const plannerResultTitle = document.querySelector("#planner-result-title");
  const plannerResultMetrics = document.querySelector("#planner-result-metrics");
  const plannerFreezeTerms = [];

  const termFromIndex = (index) => ({
    year: Math.floor(index / 2),
    season: index % 2 === 1 ? "fall" : "spring",
  });

  const showPlannerError = (message) => {
    plannerError.textContent = message;
    plannerError.classList.toggle("visible", Boolean(message));
  };

  const syncPlannerFreezes = () => {
    plannerFreezeList.replaceChildren();
    plannerEmptyFreezes.hidden = plannerFreezeTerms.length > 0;
    addPlannerFreeze.disabled = plannerFreezeTerms.length >= 4;

    plannerFreezeTerms.forEach((term, index) => {
      const row = document.createElement("div");
      row.className = "freeze-row";

      const year = document.createElement("input");
      year.type = "number";
      year.min = "2000";
      year.max = "2100";
      year.step = "1";
      year.value = String(term.year);
      year.setAttribute("aria-label", `Calculated freeze year ${index + 1}`);
      year.addEventListener("input", () => {
        plannerFreezeTerms[index].year = Number(year.value);
        showPlannerError("");
      });

      const season = document.createElement("select");
      season.setAttribute("aria-label", `Calculated freeze semester ${index + 1}`);
      for (const value of ["spring", "fall"]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = termName(value);
        option.selected = term.season === value;
        season.append(option);
      }
      season.addEventListener("change", () => {
        plannerFreezeTerms[index].season = season.value;
        showPlannerError("");
      });

      const remove = document.createElement("button");
      remove.className = "remove-button";
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove calculated freeze ${index + 1}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        plannerFreezeTerms.splice(index, 1);
        syncPlannerFreezes();
        showPlannerError("");
      });

      row.append(year, season, remove);
      plannerFreezeList.append(row);
    });
  };

  const addPlannerMetric = (label, value) => {
    const row = document.createElement("div");
    row.className = "metric";
    const name = document.createElement("span");
    name.textContent = label;
    const result = document.createElement("strong");
    result.textContent = value;
    row.append(name, result);
    plannerResultMetrics.append(row);
  };

  addPlannerFreeze.addEventListener("click", () => {
    if (plannerFreezeTerms.length >= 4) return;
    plannerFreezeTerms.push({
      year: Number(plannerInputYear.value),
      season: plannerInputSeason.value,
    });
    syncPlannerFreezes();
  });

  for (const input of [plannerInputYear, plannerInputSeason, semesterOffset]) {
    input.addEventListener("input", () => showPlannerError(""));
    input.addEventListener("change", () => showPlannerError(""));
  }

  plannerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    showPlannerError("");

    const inputYear = Number(plannerInputYear.value);
    const offset = Number(semesterOffset.value);
    if (!Number.isInteger(inputYear) || inputYear < 2000 || inputYear > 2100) {
      showPlannerError("Enter a valid input semester year between 2000 and 2100.");
      plannerInputYear.focus();
      return;
    }
    if (!Number.isInteger(offset) || offset === 0 || offset < -11 || offset > 11) {
      showPlannerError("Enter an offset from -11 to 11, excluding zero.");
      semesterOffset.focus();
      return;
    }

    const inputTerm = { year: inputYear, season: plannerInputSeason.value };
    const inputIndex = termIndex(inputTerm);
    const targetIndex = inputIndex + offset;
    const target = termFromIndex(targetIndex);

    if (plannerFreezeTerms.length > 4) {
      showPlannerError("You can enter a maximum of 4 freezes.");
      return;
    }
    const freezeIndices = plannerFreezeTerms.map(({ year, season }) => {
      if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
      return termIndex({ year, season });
    });
    if (freezeIndices.some((index) => index === null)) {
      showPlannerError("Enter a valid year and semester for each freeze.");
      return;
    }
    const rangeStart = Math.min(inputIndex, targetIndex);
    const rangeEnd = Math.max(inputIndex, targetIndex);
    if (freezeIndices.some((index) => index < rangeStart || index > rangeEnd)) {
      showPlannerError("Each freeze must be between the input and calculated target semester.");
      return;
    }
    if (new Set(freezeIndices).size !== freezeIndices.length) {
      showPlannerError("Each semester can only be entered as a freeze once.");
      return;
    }

    const sortedFreezes = [...freezeIndices].sort((a, b) => a - b);
    for (let index = 2; index < sortedFreezes.length; index += 1) {
      if (sortedFreezes[index] === sortedFreezes[index - 1] + 1 &&
          sortedFreezes[index - 1] === sortedFreezes[index - 2] + 1) {
        showPlannerError("You cannot have more than 2 consecutive frozen semesters.");
        return;
      }
    }

    const pathFreezes = freezeIndices.filter((index) => index >= rangeStart && index <= rangeEnd).length;

    plannerResultMetrics.replaceChildren();
    plannerResultTitle.textContent = `${termLabel(target)} (${offset > 0 ? "+" : ""}${offset} semester${Math.abs(offset) === 1 ? "" : "s"})`;
    addPlannerMetric("Calculated semester", termLabel(target));
    addPlannerMetric("Input semester", termLabel(inputTerm));
    addPlannerMetric("Offset", `${offset > 0 ? "+" : ""}${offset}`);
    addPlannerMetric("Freezes on path", String(pathFreezes));
  });

  const today = new Date();
  const defaultCurrent = {
    year: today.getFullYear(),
    season: today.getMonth() < 6 ? "spring" : "fall",
  };
  yearInput.value = String(defaultCurrent.year);
  currentYearInput.value = String(defaultCurrent.year);
  currentSeasonInput.value = defaultCurrent.season;
  plannerInputYear.value = String(defaultCurrent.year);
  plannerInputSeason.value = defaultCurrent.season;
  syncFreezeControls();
  syncPlannerFreezes();
})();
