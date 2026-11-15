(() => {
  const grid = document.getElementById("draftsGrid");
  const template = document.getElementById("draftCardTemplate");
  const emptyState = document.getElementById("draftsEmptyState");
  const emptyMessage = document.getElementById("draftsEmptyMessage");
  const drawer = document.getElementById("previewDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const search = document.getElementById("draftSearch");
  const sort = document.getElementById("draftSort");
  const state = { drafts: [], status: "all", language: "all", platform: "all", query: "" };

  if (!grid || !template || !drawer || !backdrop) return;

  function notify(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    let node = document.getElementById("draftsNotice");
    if (!node) {
      node = document.createElement("div");
      node.id = "draftsNotice";
      node.setAttribute("role", "status");
      node.style.cssText = "position:fixed;z-index:99999;left:50%;bottom:24px;transform:translateX(-50%);max-width:min(90vw,520px);padding:12px 18px;border-radius:12px;background:#3a302a;color:white;font:500 14px Manrope,Arial,sans-serif;box-shadow:0 4px 24px #3a302a30";
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.hidden = false;
    clearTimeout(node._timer);
    node._timer = setTimeout(() => { node.hidden = true; }, 3500);
  }

  async function request(path, method, body) {
    const response = await fetch(path, {
      method: method || "GET",
      credentials: "same-origin",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Request failed (" + response.status + ").");
    return result;
  }

  function bodyOf(draft) {
    return draft && draft.content && typeof draft.content === "object" ? draft.content : {};
  }

  function mainText(draft) {
    const content = bodyOf(draft);
    return String(content.selectedText || content.hook || content.story || content.offer || content.hook1 || content.hook2 || content.story1 || content.story2 || content.offer1 || content.offer2 || content.caption || content.script || content.text || draft.idea || "No saved text in this item.");
  }

  function copyText(draft) {
    const content = bodyOf(draft);
    if (content.contentType === "caption") return [content.caption, content.hashtags].filter(Boolean).join("\n\n") || mainText(draft);
    return String(content.selectedText || [content.hook, content.story, content.offer, content.caption, content.hashtags].filter(Boolean).join("\n\n") || mainText(draft));
  }

  function languageKey(value) {
    const text = String(value || "").toLowerCase();
    if (text.includes("hindi") || text.includes("hinglish") || text.includes("हिन्दी")) return "hindi";
    if (text.includes("bengali") || text.includes("bangla") || text.includes("বাংলা")) return "bengali";
    if (text.includes("english")) return "english";
    return text;
  }

  function platformLabel(value) {
    const aliases = {
      "Instagram Reels": "Instagram Reels",
      "YouTube Shorts": "YouTube Shorts",
      "Facebook Reels": "Facebook Reels",
      "WhatsApp Broadcast": "WhatsApp Broadcast",
    };
    return aliases[value] || String(value || "Social Content");
  }

  function statusLabel(value) {
    return ({ draft: "Saved Draft", scheduled: "Scheduled", published: "Published" })[value] || "Saved Draft";
  }

  function displayDate(value) {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return "Saved in this workspace";
    return "Updated " + date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function setPreservingIcon(element, value) {
    if (!element) return;
    const icon = element.querySelector(".material-symbols-outlined") || element.querySelector(".w-1\\.5");
    if (icon) element.replaceChildren(icon, document.createTextNode(" " + value));
    else element.textContent = value;
  }

  function cardFor(draft) {
    const card = template.content.firstElementChild.cloneNode(true);
    const content = bodyOf(draft);
    card.dataset.draftId = draft.id;
    card.dataset.status = draft.status;
    card.dataset.language = languageKey(draft.language);
    card.dataset.platform = draft.platform || "";

    setPreservingIcon(card.querySelector(".draft-platform-label"), platformLabel(draft.platform));
    setPreservingIcon(card.querySelector(".draft-status-label"), statusLabel(draft.status));
    const languageNode = card.querySelector(".draft-language-label");
    if (languageNode) languageNode.textContent = draft.language || "Language not set";
    const titleNode = card.querySelector(".draft-title");
    if (titleNode) titleNode.textContent = draft.title || "Untitled draft";
    const previewNode = card.querySelector(".draft-preview");
    if (previewNode) previewNode.textContent = mainText(draft);
    setPreservingIcon(card.querySelector(".draft-updated-label"), displayDate(draft.updatedAt));
    const identifier = card.querySelector(".draft-identifier");
    if (identifier) identifier.textContent = "#" + String(draft.id).slice(0, 8).toUpperCase();

    const buttons = card.querySelectorAll("[data-action]");
    buttons.forEach((button) => { button.dataset.draftId = draft.id; });
    return card;
  }

  function filteredDrafts() {
    const q = state.query.toLowerCase();
    return state.drafts.filter((draft) => {
      const content = bodyOf(draft);
      const searchable = [draft.title, draft.idea, draft.businessDetails, draft.language, draft.platform, content.selectedText, content.hook, content.story, content.offer, content.hook1, content.hook2, content.story1, content.story2, content.offer1, content.offer2, content.caption, content.hashtags]
        .filter(Boolean).join(" ").toLowerCase();
      return (state.status === "all" || draft.status === state.status)
        && (state.language === "all" || languageKey(draft.language) === state.language)
        && (state.platform === "all" || draft.platform === state.platform)
        && (!q || searchable.includes(q));
    });
  }

  function updateCounts() {
    const count = (predicate) => state.drafts.filter(predicate).length;
    const counts = {
      total: state.drafts.length,
      draft: count((item) => item.status === "draft"),
      scheduled: count((item) => item.status === "scheduled"),
    };
    Object.keys(counts).forEach((key) => {
      const target = document.querySelector('[data-metric="' + key + '"]');
      if (target) target.textContent = String(counts[key]);
    });

    document.querySelectorAll("[data-language-filter]").forEach((button) => {
      const key = button.dataset.languageFilter;
      const label = button.dataset.filterLabel || button.textContent.replace(/\s*\(\d+\)\s*$/, "").trim();
      const total = key === "all" ? state.drafts.length : count((item) => languageKey(item.language) === key);
      button.dataset.filterLabel = label;
      button.textContent = label + " (" + total + ")";
    });
  }

  function render() {
    grid.querySelectorAll(".draft-card").forEach((card) => card.remove());
    const items = filteredDrafts();
    items.forEach((item) => grid.appendChild(cardFor(item)));

    if (emptyState) {
      emptyState.classList.toggle("hidden", items.length > 0);
      if (emptyMessage) {
        emptyMessage.textContent = state.drafts.length
          ? "No saved drafts match these filters. Adjust the search or filters and try again."
          : "Generate content in the Studio and save a hook, story, offer, or caption to see it here.";
      }
    }
  }

  function closeDrawer() {
    delete drawer.dataset.draftId;
    drawer.classList.remove("translate-x-0");
    drawer.classList.add("translate-x-full");
    backdrop.classList.remove("opacity-100", "pointer-events-auto");
    backdrop.classList.add("opacity-0", "pointer-events-none");
  }

  function openDrawer(draft) {
    drawer.dataset.draftId = draft.id;
    const content = bodyOf(draft);
    const hook = String(content.hook || content.hook1 || content.hook2 || "");
    const story = String(content.story || content.story1 || content.story2 || "");
    const offer = String(content.offer || content.offer1 || content.offer2 || "");
    const caption = String(content.caption || "");
    const hashtags = String(content.hashtags || "");
    const copy = String(content.selectedText || hook || story || offer || caption || hashtags || mainText(draft));

    document.getElementById("drawerTitle").textContent = draft.title || "Untitled draft";
    const artifact = document.getElementById("drawerArtifactId");
    if (artifact) artifact.textContent = "Artifact #" + String(draft.id).slice(0, 8).toUpperCase();

    const label = document.getElementById("drawerContentLabel");
    setPreservingIcon(label, content.selectedLabel || content.hookOption || (hook ? "Saved hook" : story ? "Story & Craft" : offer ? "Offer & CTA" : caption ? "Saved caption" : "Saved content"));
    const main = document.getElementById("drawerHookText");
    if (main) main.textContent = copy;
    const words = copy.trim() ? copy.trim().split(/\\s+/).length : 0;
    setPreservingIcon(document.getElementById("drawerWordCount"), words + (words === 1 ? " word" : " words"));
    setPreservingIcon(document.getElementById("drawerLanguage"), draft.language || "Language not set");
    setPreservingIcon(document.getElementById("drawerUpdated"), displayDate(draft.updatedAt));

    const captionBlock = document.getElementById("drawerCaptionBlock");
    const captionNode = document.getElementById("drawerCaption");
    const hashtagsNode = document.getElementById("drawerHashtags");
    if (captionBlock) captionBlock.classList.toggle("hidden", !caption && !hashtags);
    if (captionNode) {
      captionNode.textContent = caption;
      captionNode.classList.toggle("hidden", !caption);
    }
    if (hashtagsNode) hashtagsNode.textContent = hashtags;

    const status = document.getElementById("drawerStatusBadge");
    setPreservingIcon(status, statusLabel(draft.status));
    const language = document.getElementById("drawerLanguageBadge");
    if (language) language.textContent = draft.language || "Language not set";
    const platform = document.getElementById("drawerPlatformBadge");
    if (platform) platform.textContent = platformLabel(draft.platform);
    const beats = document.getElementById("drawerScriptSection");
    if (beats) beats.classList.toggle("hidden", !content.script);
    const scriptText = document.getElementById("drawerScriptText");
    if (scriptText) scriptText.textContent = String(content.script || "");
    const tags = document.getElementById("drawerTagsSection");
    if (tags) tags.classList.add("hidden");

    const photo = document.getElementById("drawerImage");
    if (photo) {
      const holder = photo.closest(".relative.w-full");
      if (holder) {
        holder.classList.add("bg-surface-container");
        photo.remove();
        const placeholder = document.createElement("div");
        placeholder.className = "flex h-full flex-col items-center justify-center gap-1 text-on-surface-variant";
        placeholder.innerHTML = '<span class="material-symbols-outlined text-2xl" style="font-size:24px">image</span><span class="text-xs font-label">No photo attached</span>';
        holder.appendChild(placeholder);
      }
    }

    document.getElementById("duplicateBtn").dataset.draftId = draft.id;
    document.getElementById("copyScriptBtn").dataset.draftId = draft.id;
    drawer.classList.remove("translate-x-full");
    drawer.classList.add("translate-x-0");
    backdrop.classList.remove("opacity-0", "pointer-events-none");
    backdrop.classList.add("opacity-100", "pointer-events-auto");
  }

  function setActive(selector, attribute, value) {
    document.querySelectorAll(selector).forEach((button) => {
      const active = button.getAttribute(attribute) === value;
      button.classList.toggle("font-semibold", active);
      if (selector === "[data-status-filter]") {
        button.classList.toggle("bg-primary-fixed", active);
        button.classList.toggle("text-on-primary-fixed", active);
        button.classList.toggle("bg-surface-container", !active);
      } else if (selector === "[data-platform-filter]") {
        button.classList.toggle("bg-primary-fixed", active);
        button.classList.toggle("text-on-primary-fixed", active);
        button.classList.toggle("bg-surface-container-lowest", !active);
        button.classList.toggle("text-primary", !active);
      } else {
        button.classList.toggle("bg-surface-container-lowest", active);
        button.classList.toggle("text-primary", active);
      }
    });
  }

  async function refresh() {
    const result = await request("/api/drafts");
    state.drafts = Array.isArray(result.drafts) ? result.drafts : [];
    updateCounts();
    render();
    const selectedId = new URLSearchParams(window.location.search).get("selected");
    const selected = state.drafts.find((item) => item.id === selectedId) || state.drafts[0];
    if (selected) openDrawer(selected);
    else closeDrawer();
  }

  async function duplicateDraft(id) {
    const original = state.drafts.find((item) => item.id === id);
    if (!original) return;
    await request("/api/drafts", "POST", {
      title: (String(original.title || "Untitled draft").slice(0, 170) + " (copy)").slice(0, 180),
      idea: original.idea || "",
      businessDetails: original.businessDetails || "",
      language: original.language || "English",
      platform: original.platform || "Instagram Reels",
      content: bodyOf(original),
    });
    notify("Draft duplicated.");
    await refresh();
  }

  async function removeDraft(id) {
    const draft = state.drafts.find((item) => item.id === id);
    if (!draft) return;
    await request("/api/drafts/" + encodeURIComponent(id), "DELETE");
    if (drawer.dataset.draftId === id) closeDrawer();
    notify("Draft deleted.");
    await refresh();
  }

  async function scheduleDraft(id) {
    const value = window.prompt("Enter a date and time in your local time (for example: 2026-11-12 18:30).");
    if (!value) return;
    const date = new Date(value.replace(" ", "T"));
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      notify("Enter a valid future date and time.");
      return;
    }
    await request("/api/calendar", "POST", { draftId: id, scheduledAt: date.toISOString() });
    notify("Draft added to the calendar.");
    await refresh();
  }

  grid.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (button) {
      event.stopPropagation();
      const id = button.dataset.draftId;
      try {
        if (button.dataset.action === "edit") {
          window.top.location.href = "/studio?draft=" + encodeURIComponent(id);
        } else if (button.dataset.action === "schedule") {
          await scheduleDraft(id);
        } else if (button.dataset.action === "delete") {
          await removeDraft(id);
        } else if (button.dataset.action === "copy") {
          const item = state.drafts.find((entry) => entry.id === id);
          if (item) {
            const text = copyText(item);
            await navigator.clipboard.writeText(text);
            notify("Draft text copied.");
          }
        }
      } catch (error) {
        notify(error.message || "That action could not be completed.");
      }
      return;
    }

    const card = event.target.closest(".draft-card");
    if (card) {
      const item = state.drafts.find((entry) => entry.id === card.dataset.draftId);
      if (item) openDrawer(item);
    }
  });

  document.querySelectorAll("[data-status-filter]").forEach((button) => button.addEventListener("click", () => {
    state.status = button.dataset.statusFilter;
    setActive("[data-status-filter]", "data-status-filter", state.status);
    render();
  }));
  document.querySelectorAll("[data-language-filter]").forEach((button) => button.addEventListener("click", () => {
    state.language = button.dataset.languageFilter;
    setActive("[data-language-filter]", "data-language-filter", state.language);
    render();
  }));
  document.querySelectorAll("[data-platform-filter]").forEach((button) => button.addEventListener("click", () => {
    state.platform = button.dataset.platformFilter;
    setActive("[data-platform-filter]", "data-platform-filter", state.platform);
    render();
  }));

  if (search) search.addEventListener("input", () => {
    state.query = search.value.trim();
    render();
  });
  if (sort) sort.addEventListener("change", () => {
    const order = sort.value.toLowerCase();
    state.drafts.sort((a, b) => {
      if (order.includes("creation")) return new Date(b.createdAt) - new Date(a.createdAt);
      if (order.includes("status")) return String(a.status).localeCompare(String(b.status));
      if (order.includes("platform")) return String(a.platform).localeCompare(String(b.platform));
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    render();
  });

  document.getElementById("viewGridBtn")?.addEventListener("click", () => {
    grid.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5";
  });
  document.getElementById("viewListBtn")?.addEventListener("click", () => {
    grid.className = "grid grid-cols-1 gap-3";
  });
  const refreshButtons = [document.getElementById("refreshDrafts"), document.getElementById("refreshDraftsFooter")].filter(Boolean);
  refreshButtons.forEach((button) => button.addEventListener("click", async () => {
    try { await refresh(); notify("Draft list refreshed."); }
    catch (error) { notify(error.message); }
  }));
  document.getElementById("emptyStateCreate")?.addEventListener("click", () => {
    window.top.location.href = "/studio";
  });

  document.getElementById("closeDrawerBtn")?.addEventListener("click", closeDrawer);
  document.getElementById("closeDrawerFooterBtn")?.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  document.getElementById("copyScriptBtn")?.addEventListener("click", async () => {
    const draft = state.drafts.find((item) => item.id === document.getElementById("copyScriptBtn").dataset.draftId);
    if (!draft) return;
    const content = bodyOf(draft);
    const text = copyText(draft);
    try {
      await navigator.clipboard.writeText(text);
      notify("Draft content copied.");
    } catch {
      notify("Clipboard access was unavailable.");
    }
  });
  document.getElementById("duplicateBtn")?.addEventListener("click", async () => {
    try { await duplicateDraft(document.getElementById("duplicateBtn").dataset.draftId); }
    catch (error) { notify(error.message); }
  });
  document.querySelectorAll("button").forEach((button) => {
    const text = (button.innerText || "").trim().toLowerCase();
    if (text.includes("new campaign") || text.includes("new draft") || text.includes("open in ai studio")) {
      button.addEventListener("click", () => { window.top.location.href = "/studio"; });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });

  refresh().catch((error) => {
    if (emptyState) emptyState.classList.remove("hidden");
    if (emptyMessage) emptyMessage.textContent = error.message || "Drafts could not be loaded.";
    closeDrawer();
  });
})();
