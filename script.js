const STORAGE_KEY = "campusfix-demo-reports";
const form = document.getElementById("issueForm");
const reportsList = document.getElementById("reportsList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const totalCount = document.getElementById("totalCount");
const openCount = document.getElementById("openCount");
const resolvedCount = document.getElementById("resolvedCount");

function loadReports() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}
function safeText(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[ch]));
}
function render() {
  const reports = loadReports();
  totalCount.textContent = reports.length;
  openCount.textContent = reports.filter(r => r.status !== "Resolved").length;
  resolvedCount.textContent = reports.filter(r => r.status === "Resolved").length;
  const term = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const filtered = reports.filter(r =>
    (status === "All" || r.status === status) &&
    [r.title, r.category, r.location, r.description].join(" ").toLowerCase().includes(term)
  );
  if (!filtered.length) {
    reportsList.innerHTML = '<div class="empty">No reports found.<br>Submit a sample issue using the form above.</div>';
    return;
  }
  reportsList.innerHTML = filtered.slice().reverse().map(r => {
    const statusClass = r.status === "Resolved" ? "resolved" : r.status === "In Progress" ? "progress" : "";
    return `<article class="report">
      <div class="report-top"><div><h3>${safeText(r.title)}</h3><div class="report-meta">${safeText(r.category)} · ${safeText(r.location || "Location not specified")} · ${safeText(r.date)}</div></div>
      <span class="status ${statusClass}">${safeText(r.status)}</span></div>
      <p class="report-desc">${safeText(r.description)}</p>
      <div class="report-actions"><span class="report-meta">Priority: ${safeText(r.priority)}</span>
      <div><select aria-label="Update report status" data-status-id="${r.id}">
        ${["Submitted","In Progress","Resolved"].map(s => `<option ${r.status===s?"selected":""}>${s}</option>`).join("")}
      </select> <button class="delete-btn" data-delete-id="${r.id}">Delete</button></div></div>
    </article>`;
  }).join("");
}
form.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(form);
  const reports = loadReports();
  reports.push({
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
    title: data.get("title").trim(),
    category: data.get("category"),
    priority: data.get("priority"),
    location: data.get("location").trim(),
    description: data.get("description").trim(),
    status: "Submitted",
    date: new Date().toLocaleDateString()
  });
  saveReports(reports);
  form.reset();
  render();
});
reportsList.addEventListener("change", event => {
  const id = event.target.dataset.statusId;
  if (!id) return;
  saveReports(loadReports().map(r => r.id === id ? {...r, status: event.target.value} : r));
  render();
});
reportsList.addEventListener("click", event => {
  const id = event.target.dataset.deleteId;
  if (!id) return;
  saveReports(loadReports().filter(r => r.id !== id));
  render();
});
searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Clear all demo reports saved in this browser?")) {
    localStorage.removeItem(STORAGE_KEY);
    render();
  }
});
render();
