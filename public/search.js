const fileSelect = document.getElementById("filter-file");
const searchForm = document.getElementById("search-form");
const clearSearchBtn = document.getElementById("clear-search");
const recordsTableBody = document.getElementById("records-table-body");
const recordsMeta = document.getElementById("records-meta");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const paginationEl = document.getElementById("pagination");
const pageInfo = document.getElementById("page-info");
const limitSelect = document.getElementById("filter-limit");
const orderSelect = document.getElementById("filter-order");

const state = {
  files: [],
  limit: Number(limitSelect.value),
  offset: 0,
  total: undefined,
  lastFilters: {},
};

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

function populateFileSelect(files) {
  const currentValue = fileSelect.value;
  fileSelect.innerHTML = '<option value="">All files</option>';
  files.forEach((file) => {
    const option = document.createElement("option");
    option.value = String(file.id);
    option.textContent = `${file.fileName} (ID ${file.id})`;
    fileSelect.append(option);
  });
  if (currentValue) {
    fileSelect.value = currentValue;
  }
}

async function loadFilesForFilter() {
  try {
    const data = await fetchJSON("/api/cdr/files?limit=200&orderBy=uploadedAt&direction=desc");
    const files = Array.isArray(data.files) ? data.files : [];
    state.files = files;
    populateFileSelect(files);
  } catch (err) {
    console.error(err);
    state.files = [];
    populateFileSelect([]);
  }
}

function buildSearchParams(filters, limit, offset) {
  const params = new URLSearchParams();
  if (filters.fileId) params.set("fileId", filters.fileId);
  if (filters.cdrId) params.set("cdrId", filters.cdrId);
  if (filters.mnc) params.set("mnc", filters.mnc);
  if (filters.dmcc) params.set("dmcc", filters.dmcc);
  if (filters.cellId) params.set("cellId", filters.cellId);
  if (filters.ip) params.set("ip", filters.ip);
  if (filters.text) params.set("text", filters.text);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.set("orderBy", filters.orderBy ?? "createdAt");
  params.set("direction", filters.direction ?? "desc");
  params.set("includeTotal", "true");
  return params.toString();
}

function parseFiltersFromForm() {
  const filters = {};
  const fileValue = fileSelect.value.trim();
  if (fileValue.length > 0) filters.fileId = fileValue;
  const cdr = document.getElementById("filter-cdr").value.trim();
  if (cdr) filters.cdrId = cdr;
  const mnc = document.getElementById("filter-mnc").value.trim();
  if (mnc) filters.mnc = mnc;
  const dmcc = document.getElementById("filter-dmcc").value.trim();
  if (dmcc) filters.dmcc = dmcc;
  const cell = document.getElementById("filter-cell").value.trim();
  if (cell) filters.cellId = cell;
  const ip = document.getElementById("filter-ip").value.trim();
  if (ip) filters.ip = ip;
  const text = document.getElementById("filter-text").value.trim();
  if (text) filters.text = text;
  filters.orderBy = orderSelect.value === "lineNumber" ? "lineNumber" : "createdAt";
  filters.direction = "desc";
  return filters;
}

function renderRecords(records) {
  recordsTableBody.innerHTML = "";
  if (!Array.isArray(records) || records.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 9;
    cell.textContent = "No records match the current filters.";
    row.append(cell);
    recordsTableBody.append(row);
    return;
  }

  records.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${record.fileId}</td>
      <td>${record.lineNumber}</td>
      <td>${record.id}</td>
      <td>${record.bytesUsed}</td>
      <td>${record.mnc ?? ""}</td>
      <td>${record.dmcc ?? ""}</td>
      <td>${record.cellId ?? ""}</td>
      <td>${record.ip ?? ""}</td>
      <td>${record.rawLine}</td>`;
    recordsTableBody.append(row);
  });
}

function updatePagination(offset, limit, total, count) {
  if (!total || total <= limit) {
    paginationEl.hidden = true;
    return;
  }

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = offset === 0;
  nextPageBtn.disabled = offset + count >= total;
  paginationEl.hidden = false;
}

async function runSearch(offsetOverride) {
  const filters = offsetOverride === undefined ? parseFiltersFromForm() : state.lastFilters;
  state.lastFilters = filters;
  state.limit = Number(limitSelect.value) || 50;
  state.offset = offsetOverride === undefined ? 0 : offsetOverride;

  const query = buildSearchParams(filters, state.limit, state.offset);

  recordsMeta.textContent = "Searching records…";
  try {
    const result = await fetchJSON(`/api/cdr/records?${query}`);
    const records = Array.isArray(result.records) ? result.records : [];
    state.total = typeof result.total === "number" ? result.total : undefined;
    renderRecords(records);

    if (state.total !== undefined) {
      const start = records.length > 0 ? state.offset + 1 : 0;
      const end = state.offset + records.length;
      recordsMeta.textContent = records.length
        ? `Showing ${start} – ${end} of ${state.total} record${state.total === 1 ? "" : "s"}`
        : "No records match the current filters.";
    } else {
      recordsMeta.textContent = records.length
        ? `Showing ${records.length} record${records.length === 1 ? "" : "s"}`
        : "No records match the current filters.";
    }

    updatePagination(state.offset, state.limit, state.total ?? 0, records.length);
  } catch (err) {
    console.error(err);
    recordsMeta.textContent = err instanceof Error ? err.message : "Failed to load records";
    renderRecords([]);
    paginationEl.hidden = true;
  }
}

function clearSearch() {
  searchForm.reset();
  limitSelect.value = "50";
  orderSelect.value = "createdAt";
  state.offset = 0;
  state.total = undefined;
  state.lastFilters = {};
  renderRecords([]);
  recordsMeta.textContent = "No results yet.";
  paginationEl.hidden = true;
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});

clearSearchBtn.addEventListener("click", () => {
  clearSearch();
});

prevPageBtn.addEventListener("click", () => {
  const nextOffset = Math.max(0, state.offset - state.limit);
  runSearch(nextOffset);
});

nextPageBtn.addEventListener("click", () => {
  runSearch(state.offset + state.limit);
});

loadFilesForFilter().finally(() => {
  runSearch();
});
