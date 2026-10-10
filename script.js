const SUBSCRIBERS_KEY = "coreveritas_subscribers";

const starterEntries = [
  {
    id: "start-01",
    type: "Buch",
    title: "Die Wahrheit, die du kennst",
    excerpt: "Ein Anfang dort, wo du aufgehört hast, dir selbst auszuweichen.",
    body: "Es gibt einen Moment, in dem die Erklärung nicht mehr trägt. Du kennst ihn.\n\nDieses Buch handelt nicht davon, dich neu zu erfinden. Es handelt davon, wieder hinzusehen: auf das, was du weißt, auf das, was du brauchst, und auf alles, was du viel zu lange klein geredet hast.\n\nKlarheit ist kein lauter Entschluss. Manchmal ist sie nur der erste ehrliche Satz.",
    image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80",
    date: "Ein Gedanke zum Bleiben"
  },
  {
    id: "start-02",
    type: "Artikel",
    title: "Wenn dein Schweigen schwerer wird",
    excerpt: "Nicht jedes Schweigen ist Frieden. Manches ist nur der Preis, den du zahlst, um niemanden zu enttäuschen.",
    body: "Du hast gelernt, den richtigen Moment abzuwarten. Den richtigen Ton. Die richtige Formulierung, die niemanden erschreckt.\n\nUnd während du wartest, wird das Ungesagte nicht kleiner. Es sitzt mit am Tisch. Es fährt mit nach Hause. Es entscheidet mit, was du dir noch erlaubst.\n\nDu musst nicht alles heute aussprechen. Aber du darfst aufhören, so zu tun, als wäre nichts da.",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80",
    date: "Ein Text über Grenzen"
  },
  {
    id: "start-03",
    type: "Artikel",
    title: "Du schuldest nicht jedem eine Erklärung",
    excerpt: "Eine Grenze wird nicht erst gültig, wenn alle sie verstehen.",
    body: "Du darfst Nein sagen, bevor du erschöpft bist. Du darfst gehen, bevor du beweisen kannst, dass es schlimm genug war.\n\nNicht jede Grenze braucht eine Verhandlung. Nicht jede Entscheidung muss von den Menschen abgesegnet werden, die mit ihr nicht leben müssen.\n\nDein Nein ist kein Angriff. Es ist eine Information darüber, wo du aufhörst, dich selbst zu verlassen.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    date: "Ein Text über Selbstachtung"
  },
  {
    id: "start-04",
    type: "Buch",
    title: "Was bleibt, wenn du aufhörst",
    excerpt: "Über Rollen, die nicht mehr passen, und über das Leben dahinter.",
    body: "Du warst verlässlich. Vernünftig. Die Person, die es schon irgendwie richtet. Vielleicht warst du darin gut. Vielleicht warst du darin vor allem allein.\n\nAufhören bedeutet nicht, dass alles umsonst war. Es bedeutet, dass du nicht mehr jede alte Rolle mit in deine Zukunft nehmen musst.\n\nWas bleibt, wenn du aufhörst? Vielleicht zum ersten Mal: du.",
    image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
    date: "Ein Buch über Veränderung"
  }
];

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function formatPrice(priceCents) {
  if (!priceCents) return "Kostenlos";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceCents / 100);
}

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

async function readApiResponse(response) {
  const body = await response.text();
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error("Der Server lieferte keine gültige JSON-Antwort (HTTP " + response.status + "). Prüfe, ob die Netlify-Funktion für /api/* bereitgestellt wurde.");
  }
}

function createEntryCard(entry, index, openEntry) {
  const article = document.createElement("article");
  article.className = "entry-card";

  const imageWrap = document.createElement("div");
  imageWrap.className = "entry-image";
  const image = document.createElement("img");
  image.src = entry.image || starterEntries[index % starterEntries.length].image;
  image.alt = "Landschaft als Titelbild für " + entry.title;
  image.loading = "lazy";
  imageWrap.append(image);

  const number = document.createElement("span");
  number.className = "entry-number";
  number.textContent = String(index + 1).padStart(2, "0");
  imageWrap.append(number);

  const meta = document.createElement("div");
  meta.className = "entry-meta";
  const type = document.createElement("span");
  type.textContent = entry.type;
  const date = document.createElement("span");
  date.className = "entry-date";
  date.textContent = entry.date || "Gerade veröffentlicht";
  meta.append(type, date);

  const title = document.createElement("h2");
  title.textContent = entry.title;
  const excerpt = document.createElement("p");
  excerpt.textContent = entry.excerpt;
  const price = document.createElement("p");
  price.className = "entry-price";
  price.textContent = entry.attachmentName ? formatPrice(entry.priceCents) + " · " + entry.attachmentName : formatPrice(entry.priceCents);
  const openButton = document.createElement("button");
  openButton.className = "entry-open";
  openButton.type = "button";
  openButton.innerHTML = (entry.attachmentName ? "Zum Download" : "Weiterlesen") + " <span aria-hidden=\"true\">→</span>";
  openButton.addEventListener("click", () => openEntry(entry));

  article.append(imageWrap, meta, title, excerpt, price, openButton);
  return article;
}

function openReader(entry, startCheckout, downloadFreeFile) {
  const dialog = document.getElementById("reader-dialog");
  setMessage(document.getElementById("reader-status"), "");
  document.getElementById("reader-type").textContent = entry.type;
  document.getElementById("reader-title").textContent = entry.title;
  document.getElementById("reader-excerpt").textContent = entry.excerpt;
  document.getElementById("reader-body").textContent = entry.body;
  const actions = document.getElementById("reader-actions");
  const actionButton = document.getElementById("reader-download");
  actions.hidden = !entry.attachmentName;
  if (entry.attachmentName) {
    document.getElementById("reader-price").textContent = formatPrice(entry.priceCents);
    actionButton.textContent = entry.priceCents > 0 ? "Mit Karte kaufen" : "Datei herunterladen";
    actionButton.onclick = entry.priceCents > 0 ? () => startCheckout(entry) : () => downloadFreeFile(entry);
  }
  dialog.showModal();
}

async function initArticles() {
  const grid = document.getElementById("entry-grid");
  if (!grid) return;

  const message = document.getElementById("shop-message");
  const emptyState = document.getElementById("empty-state");
  let activeFilter = "Alle";
  let entries = [];

  async function startCheckout(entry) {
    setMessage(document.getElementById("reader-status"), "Sichere Weiterleitung zum Kartenkauf …");
    try {
      const response = await fetch("/api/checkout/" + encodeURIComponent(entry.id), { method: "POST" });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "Der Bezahlvorgang konnte nicht gestartet werden.");
      window.location.assign(result.url);
    } catch (error) {
      setMessage(document.getElementById("reader-status"), error.message, true);
    }
  }

  function downloadFreeFile(entry) {
    window.location.assign("/api/download/" + encodeURIComponent(entry.id));
  }

  function render() {
    const visible = activeFilter === "Alle" ? entries : entries.filter((entry) => entry.type === activeFilter);
    grid.replaceChildren(...visible.map((entry, index) => createEntryCard(entry, index, (selectedEntry) => openReader(selectedEntry, startCheckout, downloadFreeFile))));
    emptyState.hidden = visible.length > 0;
    document.querySelector('[data-count="Alle"]').textContent = entries.length;
    document.querySelector('[data-count="Buch"]').textContent = entries.filter((entry) => entry.type === "Buch").length;
    document.querySelector('[data-count="Artikel"]').textContent = entries.filter((entry) => entry.type === "Artikel").length;
  }

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((filterButton) => {
        const selected = filterButton === button;
        filterButton.classList.toggle("is-selected", selected);
        filterButton.setAttribute("aria-pressed", String(selected));
      });
      render();
    });
  });

  document.querySelector("[data-close-dialog]").addEventListener("click", () => document.getElementById("reader-dialog").close());
  document.getElementById("reader-dialog").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });
  try {
    const response = await fetch("/api/entries");
    if (!response.ok) throw new Error("Das Archiv konnte nicht geladen werden.");
    entries = await readApiResponse(response);
    render();
    await handleCheckoutReturn(entries, message);
  } catch (error) {
    setMessage(message, error.message + " Bitte prüfe, ob die COREVERITAS-API bei Netlify bereitgestellt wurde.", true);
    emptyState.hidden = false;
  }
}

async function handleCheckoutReturn(entries, message) {
  const parameters = new URLSearchParams(window.location.search);
  const sessionId = parameters.get("session_id");
  const productId = parameters.get("product_id");
  if (parameters.has("abgebrochen")) setMessage(message, "Der Bezahlvorgang wurde abgebrochen.");
  if (sessionId && productId) {
    const entry = entries.find((item) => item.id === productId);
    if (!entry) {
      setMessage(message, "Die gekaufte Veröffentlichung wurde nicht gefunden.", true);
    } else {
      setMessage(message, "Zahlung wird bestätigt …");
      try {
        const downloadUrl = "/api/download/" + encodeURIComponent(productId) + "?session_id=" + encodeURIComponent(sessionId);
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          const result = await readApiResponse(response);
          throw new Error(result.error || "Der Download konnte nicht freigegeben werden.");
        }
        const file = await response.blob();
        const objectUrl = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = entry.attachmentName || entry.title;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        setMessage(message, "Zahlung bestätigt. Dein Download startet.");
      } catch (error) {
        setMessage(message, error.message, true);
      }
    }
  }
  if (sessionId || productId || parameters.has("abgebrochen")) window.history.replaceState({}, "", window.location.pathname);
}

function initSubscription() {
  const form = document.getElementById("subscribe-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = new FormData(form).get("email").trim().toLowerCase();
    const message = document.getElementById("subscribe-message");
    const subscribers = readStoredArray(SUBSCRIBERS_KEY);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.textContent = "Bitte gib eine gültige E-Mail-Adresse ein.";
      message.classList.add("is-error");
      return;
    }
    if (subscribers.some((subscriber) => subscriber.email === email || subscriber === email)) {
      message.textContent = "Diese Adresse ist bereits angemeldet.";
      message.classList.remove("is-error");
      return;
    }
    subscribers.push({ email, subscribedAt: new Date().toISOString() });
    localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subscribers));
    form.reset();
    message.textContent = "Du bist dabei. Danke für dein Vertrauen.";
    message.classList.remove("is-error");
  });
}

function initAdmin() {
  const loginPanel = document.getElementById("login-panel");
  if (!loginPanel) return;

  const dashboard = document.getElementById("admin-dashboard");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const entryForm = document.getElementById("entry-form");
  let entries = [];
  const entryMessage = document.getElementById("entry-message");

  function renderManageList() {
    const list = document.getElementById("manage-list");
    const emptyState = document.getElementById("admin-empty-state");
    list.replaceChildren();
    document.getElementById("admin-entry-count").textContent = entries.length + (entries.length === 1 ? " Eintrag" : " Einträge");
    emptyState.hidden = entries.length > 0;
    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "manage-row";
      const copy = document.createElement("div");
      copy.className = "manage-row-copy";
      const type = document.createElement("span");
      type.textContent = entry.type + " · " + formatPrice(entry.priceCents) + (entry.attachmentName ? " · " + entry.attachmentName : "");
      const title = document.createElement("strong");
      title.textContent = entry.title;
      copy.append(type, title);
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-button";
      deleteButton.textContent = "Löschen";
      deleteButton.setAttribute("aria-label", entry.title + " löschen");
      deleteButton.addEventListener("click", async () => {
        try {
          const response = await fetch("/api/admin/entries/" + encodeURIComponent(entry.id), { method: "DELETE" });
          const result = await readApiResponse(response);
          if (!response.ok) throw new Error(result.error || "Die Veröffentlichung konnte nicht gelöscht werden.");
          await loadEntries();
        } catch (error) {
          setMessage(entryMessage, error.message, true);
        }
      });
      row.append(copy, deleteButton);
      list.append(row);
    });
  }

  function showDashboard() {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    loadEntries();
  }

  async function loadEntries() {
    try {
      const response = await fetch("/api/entries");
      if (!response.ok) throw new Error("Die Veröffentlichungen konnten nicht geladen werden.");
      entries = await readApiResponse(response);
      renderManageList();
    } catch (error) {
      setMessage(entryMessage, error.message, true);
    }
  }

  fetch("/api/admin/session")
    .then(readApiResponse)
    .then((result) => { if (result.authenticated) showDashboard(); })
    .catch(() => {});

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = new FormData(loginForm).get("password");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "Die Anmeldung ist fehlgeschlagen.");
      loginMessage.textContent = "";
      loginMessage.classList.remove("is-error");
      loginForm.reset();
      showDashboard();
    } catch (error) {
      setMessage(loginMessage, error.message, true);
    }
  });

  document.getElementById("logout-button").addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    dashboard.hidden = true;
    loginPanel.hidden = false;
  });

  entryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(entryForm);
    const hasFile = formData.get("file").size > 0;
    if (!formData.get("title").trim() || !formData.get("excerpt").trim() || (!formData.get("body").trim() && !hasFile)) {
      setMessage(entryMessage, "Bitte gib Titel, Kurztext und entweder Inhalt oder eine Datei an.", true);
      return;
    }
    if (Number(formData.get("price")) > 0 && !hasFile) {
      setMessage(entryMessage, "Für kostenpflichtige Veröffentlichungen ist eine Datei erforderlich.", true);
      return;
    }
    try {
      const response = await fetch("/api/admin/entries", { method: "POST", body: formData });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "Die Veröffentlichung konnte nicht gespeichert werden.");
      entryForm.reset();
      document.getElementById("entry-price").value = "0";
      setMessage(entryMessage, "Veröffentlicht. Der Eintrag ist jetzt im Archiv sichtbar.");
      await loadEntries();
    } catch (error) {
      setMessage(entryMessage, error.message, true);
    }
  });
}

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

initSubscription();
initArticles();
initAdmin();
