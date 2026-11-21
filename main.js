(() => {
  const form = document.querySelector("#calculator-form");
  const yearInput = document.querySelector("#batch-year");
  const intakeInput = document.querySelector("#intake");
  const currentYearInput = document.querySelector("#current-year");
  const currentSeasonInput = document.querySelector("#current-season");
  const freezeList = document.querySelector("#freeze-list");
  const emptyFreezes = document.querySelector("#empty-freezes");
  const addFreezeButton = document.querySelector("#add-freeze");
  const passedOutInput = document.querySelector("#passed-out");
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

  const showResult = ({ currentSemester, elapsedTerms, freezes, current, passedOut }) => {
    resultMetrics.replaceChildren();
    resultEyebrow.textContent = "Your estimate";
    resultSubtitle.textContent = `As of ${termLabel(current)}; ${elapsedTerms} batch semester${elapsedTerms === 1 ? "" : "s"} elapsed, including ${freezes} freeze${freezes === 1 ? "" : "s"}.`;
    resultNote.className = "result-note";

    if (passedOut) {
      resultEyebrow.textContent = "Degree completed";
      resultTitle.textContent = "Passed out in semester 8";
      addMetric("Degree status", "Completed");
      addMetric("Passout semester", "8th semester");
      resultNote.classList.add("success");
      resultNote.textContent = "Based on the passout-after-8th-semester option.";
      return;
    }

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
      resultNote.textContent = `You have reached semester ${currentSemester} without a passout, beyond the 12-semester maximum. Contact your campus to confirm your academic status.`;
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
      passedOut: passedOutInput.checked,
    });
  });

  const today = new Date();
  const defaultCurrent = {
    year: today.getFullYear(),
    season: today.getMonth() < 6 ? "spring" : "fall",
  };
  yearInput.value = String(defaultCurrent.year);
  currentYearInput.value = String(defaultCurrent.year);
  currentSeasonInput.value = defaultCurrent.season;
  syncFreezeControls();
})();
