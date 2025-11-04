const filesTableBody = document.getElementById("files-table-body");
const filesMeta = document.getElementById("files-meta");
const filtersForm = document.getElementById("file-filters");
const searchInput = document.getElementById("file-search");
const orderSelect = document.getElementById("file-order");
const directionSelect = document.getElementById("file-direction");
const limitSelect = document.getElementById("file-limit");
const refreshBtn = document.getElementById("refresh-files");
const clearBtn = document.getElementById("clear-files");

const state = {
  files: [],
};

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function renderFiles(files) {
  filesTableBody.innerHTML = "";
  if (files.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "No files match the current filters.";
    row.append(cell);
    filesTableBody.append(row);
    return;
  }

  files.forEach((file) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${file.id}</td>
      <td>${file.fileName}</td>
      <td>${formatDate(file.uploadedAt)}</td>
      <td>${file.totalLines}</td>
      <td>${file.parsedLines}</td>
      <td>${file.skippedLines ?? 0}</td>
      <td>${file.errorCount ?? 0}</td>`;
    filesTableBody.append(row);
  });
}

function summarizeFiles(filtered, total) {
  if (total === 0) {
    filesMeta.textContent = "No files have been uploaded yet.";
  } else if (filtered === total) {
    filesMeta.textContent = `Showing ${filtered} file${filtered === 1 ? "" : "s"}.`;
  } else {
    filesMeta.textContent = `Showing ${filtered} of ${total} file${total === 1 ? "" : "s"} (filtered).`;
  }
}

function applyLocalFilters() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = term.length
    ? state.files.filter((file) => {
        const nameMatch = file.fileName.toLowerCase().includes(term);
        const idMatch = String(file.id).includes(term);
        return nameMatch || idMatch;
      })
    : state.files;

  renderFiles(filtered);
  summarizeFiles(filtered.length, state.files.length);
}

function buildQueryFromControls() {
  const orderBy = orderSelect.value === "fileName" ? "fileName" : "uploadedAt";
  const direction = directionSelect.value === "asc" ? "asc" : "desc";
  const limit = Number(limitSelect.value) || 200;
  const params = new URLSearchParams({
    limit: String(limit),
    orderBy,
    direction,
  });
  return params.toString();
}

async function loadFiles() {
  refreshBtn.disabled = true;
  filesMeta.textContent = "Loading files…";
  try {
    const query = buildQueryFromControls();
    const data = await fetchJSON(`/api/cdr/files?${query}`);
    const files = Array.isArray(data.files) ? data.files : [];
    state.files = files;
    applyLocalFilters();
  } catch (err) {
    console.error(err);
    state.files = [];
    filesTableBody.innerHTML = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = err instanceof Error ? err.message : "Failed to load files.";
    row.append(cell);
    filesTableBody.append(row);
    filesMeta.textContent = "Unable to load files.";
  } finally {
    refreshBtn.disabled = false;
  }
}

filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadFiles();
});

searchInput.addEventListener("input", () => {
  applyLocalFilters();
});

clearBtn.addEventListener("click", () => {
  filtersForm.reset();
  orderSelect.value = "uploadedAt";
  directionSelect.value = "desc";
  limitSelect.value = "200";
  searchInput.value = "";
  loadFiles();
});

refreshBtn.addEventListener("click", () => {
  loadFiles();
});

loadFiles();
