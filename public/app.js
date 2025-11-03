const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const statusEl = document.getElementById("status");
const resultsSection = document.getElementById("results");
const fileNameEl = document.getElementById("result-file");
const totalLinesEl = document.getElementById("result-lines");
const fileIdEl = document.getElementById("result-file-id");
const uploadedAtEl = document.getElementById("result-uploaded");
const recordCountEl = document.getElementById("result-count");
const skippedLinesEl = document.getElementById("result-skipped");
const errorCountEl = document.getElementById("result-errors");
const recordsContainer = document.getElementById("records-container");
const errorsContainer = document.getElementById("errors-container");
const errorList = document.getElementById("error-list");

function setStatus(message, tone = "info") {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`;
}

function toggleForm(disabled) {
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = disabled;
  fileInput.disabled = disabled;
}

function renderRecords(records) {
  if (!Array.isArray(records) || records.length === 0) {
    recordsContainer.innerHTML = "<p>No records decoded.</p>";
    return;
  }

  const headers = [
    "lineNumber",
    "id",
    "bytesUsed",
    "mnc",
    "dmcc",
    "cellId",
    "ip",
    "rawLine",
  ];
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.append(th);
  });

  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement("tbody");

  records.forEach((record) => {
    const row = document.createElement("tr");
    headers.forEach((header) => {
      const td = document.createElement("td");
      const value = record?.[header];
      td.textContent = value !== undefined && value !== null ? String(value) : "";
      row.append(td);
    });
    tbody.append(row);
  });

  table.append(tbody);
  recordsContainer.innerHTML = "";
  recordsContainer.append(table);
}

function renderErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    errorsContainer.classList.add("hidden");
    errorList.innerHTML = "";
    return;
  }

  errorsContainer.classList.remove("hidden");
  errorList.innerHTML = "";

  errors.forEach((error) => {
    const li = document.createElement("li");
    const lineNumber = document.createElement("strong");
    lineNumber.textContent = `Line ${error.lineNumber}: `;

    const content = document.createElement("span");
    content.className = "error-line";
    content.textContent = error.content;

    const reason = document.createElement("span");
    reason.textContent = ` – ${error.reason}`;

    li.append(lineNumber, content, reason);
    errorList.append(li);
  });
}

async function handleUpload(file) {
  toggleForm(true);
  setStatus("Uploading and parsing…");

  try {
    const content = await file.text();
    const response = await fetch("/api/cdr/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        content,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();

    const errors = Array.isArray(result.invalidRecords) ? result.invalidRecords : [];
    const records = Array.isArray(result.records) ? result.records : [];

    fileNameEl.textContent = result.fileName;
    fileIdEl.textContent =
      result.fileId !== undefined ? String(result.fileId) : "—";
    uploadedAtEl.textContent = result.uploadedAt
      ? new Date(result.uploadedAt).toLocaleString()
      : "—";
    totalLinesEl.textContent = result.totalLines;
    recordCountEl.textContent = records.length;
    skippedLinesEl.textContent = result.skippedLines ?? 0;
    errorCountEl.textContent = errors.length;

    renderRecords(records);
    renderErrors(errors);

    resultsSection.classList.remove("hidden");
    setStatus("File parsed successfully.", "success");
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    setStatus(message, "error");
  } finally {
    toggleForm(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const [file] = fileInput.files ?? [];

  if (!file) {
    setStatus("Please choose a file to upload.", "error");
    return;
  }

  handleUpload(file);
});
