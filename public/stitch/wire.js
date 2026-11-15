(() => {
  const screen = location.pathname.split("/").pop().replace(/\.html$/, "");
  const parentNavigate = (path) => { window.top.location.href = path; };
  const routeByName = {
    "landing-page": "/",
    login: "/auth",
    signup: "/auth",
    dashboard: "/dashboard",
    "dashboard-and-performance": "/dashboard",
    create: "/studio",
    "quick-create": "/studio",
    drafts: "/drafts",
    "my-drafts-and-posts": "/drafts",
    "brand-profile": "/dashboard",
    "brand-profile-and-personas": "/dashboard",
    calendar: "/calendar",
    "content-calendar": "/calendar",
    "media-library-and-assets": "/drafts",
    "settings-and-vernacular-setup": "/dashboard",
  };

  function enlargeSidebarOneStep() {
    const sidebar = document.querySelector("aside");
    if (!sidebar || sidebar.dataset.fontBumped === "true") return;
    sidebar.dataset.fontBumped = "true";

    const increaseFont = (element, amount = 2) => {
      if (!element) return;
      const computed = getComputedStyle(element);
      const fontSize = Number.parseFloat(computed.fontSize);
      const lineHeight = Number.parseFloat(computed.lineHeight);
      if (Number.isFinite(fontSize)) element.style.fontSize = `${fontSize + amount}px`;
      if (Number.isFinite(lineHeight) && lineHeight > 0) element.style.lineHeight = `${lineHeight + amount}px`;
    };

    const bumpLink = (link) => {
      if (!link) return;
      increaseFont(link);
      link.querySelectorAll(".material-symbols-outlined").forEach((icon) => increaseFont(icon));
    };

    sidebar.querySelectorAll("nav a").forEach(bumpLink);
    bumpLink(sidebar.querySelector('a[data-path="quick-create"]'));

    const brandName = Array.from(sidebar.querySelectorAll("span")).find((element) => element.textContent.trim() === "Bhasha Bloom");
    if (brandName) {
      increaseFont(brandName, 3);
      const brandBlock = brandName.parentElement?.parentElement;
      const subtitle = Array.from(brandBlock?.children || []).find((element) => element.tagName === "SPAN" && element.textContent.trim() === "Regional Creators Suite");
      increaseFont(subtitle, 2);
    }

    const businessName = sidebar.querySelector("[data-workspace-name]");
    if (businessName) {
      increaseFont(businessName);
      businessName.parentElement?.parentElement?.querySelectorAll(".material-symbols-outlined").forEach((icon) => increaseFont(icon));
    }
  }

  enlargeSidebarOneStep();

  let selectedBusinessPhoto = null;
  let businessPhotoIsReading = false;

  function toast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    let element = document.getElementById("creatorpilot-notice");
    if (!element) {
      element = document.createElement("div");
      element.id = "creatorpilot-notice";
      element.setAttribute("role", "status");
      element.style.cssText = "position:fixed;z-index:99999;left:50%;bottom:24px;transform:translateX(-50%);max-width:min(90vw,520px);padding:12px 18px;border-radius:12px;background:#3a302a;color:white;font:500 14px Manrope,Arial,sans-serif;box-shadow:0 4px 24px #3a302a30";
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.hidden = false;
    clearTimeout(element._timer);
    element._timer = setTimeout(() => { element.hidden = true; }, 4000);
  }

  async function jsonRequest(path, method = "GET", body) {
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function isLoginMode() {
    return document.getElementById("tab-login")?.classList.contains("bg-surface-container-lowest") || false;
  }

  function personalizeWorkspace(name) {
    const workspaceName = String(name || "").trim() || "Your business";
    document.querySelectorAll("[data-workspace-name]").forEach((element) => {
      element.textContent = workspaceName;
      element.title = workspaceName;
    });
  }

  function personalizeDashboard(name) {
    const displayName = String(name || "Creator").trim() || "Creator";
    const thought = document.querySelector("[data-creator-thought]");
    if (thought) {
      const thoughts = [
        "Your next loyal customer may be one honest story away.",
        "Every meaningful brand begins by listening closely to one customer.",
        "Your local perspective is a strength no template can copy.",
        "Consistency turns small creative steps into a brand people recognize.",
        "Show the care behind your product; people connect with the heart behind it.",
        "A clear story helps people remember what makes your business yours.",
        "Every post can start a conversation, not just fill a feed.",
      ];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayIndex = Math.floor(today.getTime() / 86400000);
      thought.textContent = thoughts[dayIndex % thoughts.length];
    }
    const heading = document.querySelector("[data-dashboard-greeting]") || Array.from(document.querySelectorAll("h1"))
      .find((element) => element.textContent.includes("Namaste Pooja"));
    if (heading) {
      const hindiGreeting = Array.from(heading.childNodes)
        .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.includes("नमस्ते"));
      if (hindiGreeting) hindiGreeting.textContent = `\n          नमस्ते ${displayName}! `;
      const englishGreeting = heading.querySelector("span.italic");
      if (englishGreeting) englishGreeting.textContent = `(Namaste ${displayName}!)`;
    }

    const sidebarName = Array.from(document.querySelectorAll("aside span"))
      .find((element) => element.textContent.trim() === "Pooja Sharma");
    if (sidebarName) sidebarName.textContent = displayName;
  }

  async function loadDashboardDraftCount() {
    const { stats } = await jsonRequest("/api/dashboard");
    const count = Number(stats?.total);
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error("The saved draft total was unavailable.");
    }
    const metric = document.querySelector("[data-dashboard-draft-count]");
    if (metric) metric.textContent = String(count);
  }

  async function restoreStudioDraft(draftId, user) {
    try {
      const { draft } = await jsonRequest("/api/drafts/" + encodeURIComponent(draftId));
      if (!draft) throw new Error("Draft not found.");
      const prompt = document.getElementById("creativePrompt");
      const details = document.getElementById("businessDetailsInput");
      if (prompt) prompt.value = draft.idea || "";
      if (details) details.value = draft.businessDetails || "";

      const languageValue = "english";
      const platformValue = { "Instagram Reels": "ig", "YouTube Shorts": "yt", "Facebook Reels": "fb" }[draft.platform] || "ig";
      document.querySelectorAll('input[name="core_lang"]').forEach((input) => { input.checked = input.value === languageValue; });
      document.querySelectorAll('input[name="core_platform"]').forEach((input) => { input.checked = input.value === platformValue; });

      const saved = draft.content && typeof draft.content === "object" ? draft.content : {};
      const hook = String(saved.hook || "");
      const isSecondHook = String(saved.hookOption || "").includes("#2");
      const selectedText = String(saved.selectedText || "");
      const hook1 = String(saved.hook1 || (saved.contentType === "hook" && !isSecondHook ? selectedText || hook : hook && !isSecondHook ? hook : ""));
      const hook2 = String(saved.hook2 || (saved.contentType === "hook" && isSecondHook ? selectedText || hook : hook && isSecondHook ? hook : ""));
      const story1 = String(saved.story1 || (saved.contentType === "story" && !String(saved.selectedLabel || "").includes("#2") ? selectedText || saved.story || "" : ""));
      const story2 = String(saved.story2 || (saved.contentType === "story" && String(saved.selectedLabel || "").includes("#2") ? selectedText || saved.story || "" : ""));
      const offer1 = String(saved.offer1 || (saved.contentType === "offer" && !String(saved.selectedLabel || "").includes("#2") ? selectedText || saved.offer || "" : ""));
      const offer2 = String(saved.offer2 || (saved.contentType === "offer" && String(saved.selectedLabel || "").includes("#2") ? selectedText || saved.offer || "" : ""));
      const caption = String(saved.caption || "");
      const hashtags = String(saved.hashtags || "");
      window._creatorPilotGenerated = {
        hook1, hook2, story1, story2, offer1, offer2, caption, hashtags,
        tone: String(saved.tone || "Warm & Hospitable"),
        businessName: String(saved.businessName || user?.name || ""),
      };
      const toneSelect = document.getElementById("toneSelect");
      if (toneSelect && saved.tone) toneSelect.value = saved.tone;

      const sectionVariations = {
        hooks: [hook1, hook2],
        story: [story1, story2],
        offer: [offer1, offer2],
      };
      Object.entries(sectionVariations).forEach(([section, variations]) => {
        document.querySelectorAll(`#section-${section} > div`).forEach((card, index) => {
          const copy = variations[index] || "";
          const target = card.querySelector("[data-generated-content]");
          if (target) target.textContent = copy;
          if (copy) card.querySelector(".copy-btn")?.setAttribute("data-copy", copy);
        });
      });
      if (saved.contentType === "story" || saved.contentType === "offer" || saved.contentType === "hook") {
        const section = saved.contentType === "hook" ? "hooks" : saved.contentType;
        const selector = document.getElementById("contentSectionSelect");
        if (selector) {
          selector.value = section;
          if (typeof window.switchContentSection === "function") window.switchContentSection(section);
        }
      }
      const captionNode = document.getElementById("generated-caption");
      if (captionNode) captionNode.textContent = caption;
      const hashtagNode = document.getElementById("generated-hashtags");
      if (hashtagNode) {
        hashtagNode.replaceChildren();
        (hashtags.match(/#[\p{L}\p{N}_]+/gu) || []).forEach((tag) => {
          const chip = document.createElement("span");
          chip.className = "px-2 py-0.5 rounded bg-surface-container text-[13px] font-mono text-primary font-medium";
          chip.textContent = tag;
          hashtagNode.append(chip);
        });
      }
      document.getElementById("generated-caption")?.closest(".bg-surface-container-lowest")?.querySelector(".copy-btn")
        ?.setAttribute("data-copy", [caption, hashtags].filter(Boolean).join("\n\n"));
      const generatedStatusIcon = document.getElementById("generatedStatusIcon");
      if (generatedStatusIcon) generatedStatusIcon.textContent = "check_circle";
      toast("Draft loaded. Edit the brief or generate a fresh version.");
    } catch (error) {
      toast(error.message || "This draft could not be opened.");
    }
  }

  const originalSetAuthMode = window.setAuthMode;
  if (originalSetAuthMode) {
    window.setAuthMode = (mode) => {
      originalSetAuthMode(mode);
      window._creatorPilotAuthMode = mode;
    };
  }

  if (screen === "auth") {
    const form = document.querySelector("form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const button = document.getElementById("auth-submit-btn");
      const name = document.querySelector("#field-name input")?.value.trim() || "";
      const email = document.querySelector('input[placeholder*="creator@studio.in"]')?.value.trim() || "";
      const language = document.querySelector("#field-language select")?.value || "English";
      const password = document.getElementById("password-input")?.value || "";
      const original = button?.innerHTML;
      if (button) { button.disabled = true; button.textContent = "Please wait…"; }
      try {
        const data = isLoginMode()
          ? await jsonRequest("/api/auth/login", "POST", { email, password })
          : await jsonRequest("/api/auth/register", "POST", { name, email, password, language });
        toast(`Welcome, ${data.user.name}. Your workspace is ready.`);
        const requestedPath = new URLSearchParams(window.top.location.search).get("next");
        const destination = requestedPath && requestedPath.startsWith("/") && !requestedPath.startsWith("//") && requestedPath !== "/auth"
          ? requestedPath
          : "/dashboard";
        setTimeout(() => parentNavigate(destination), 500);
      } catch (error) {
        toast(error.message);
        if (button) { button.disabled = false; button.innerHTML = original; }
      }
    }, true);

    document.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const text = button.innerText || "";
      if (/Continue with Google|WhatsApp.*OTP|Sign in with Google/i.test(text)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        toast("Google and WhatsApp sign-in are not connected yet. Use email and password for now.");
      }
      if (button.id === "forgot-password-link") {
        event.preventDefault();
        event.stopImmediatePropagation();
        toast("Password reset is not configured yet. Contact the workspace owner to reset access.");
      }
    }, true);
  }

  const protectedScreens = ["dashboard", "studio", "calendar", "drafts"];
  if (protectedScreens.includes(screen)) {
    jsonRequest("/api/auth/me")
      .then(({ user }) => {
        window._creatorPilotUser = user || null;
        personalizeWorkspace(user?.name);
        if (screen === "dashboard" || screen === "drafts") personalizeDashboard(user?.name);
        if (screen === "dashboard") {
          loadDashboardDraftCount().catch(() => {
            const metric = document.querySelector("[data-dashboard-draft-count]");
            if (metric) {
              metric.textContent = "—";
              metric.title = "Could not load the saved draft total.";
            }
          });
        }
        if (screen === "studio") {
          const query = new URLSearchParams(window.top.location.search || window.location.search);
          const draftId = query.get("draft");
          if (draftId) restoreStudioDraft(draftId, user);
        }
      })
      .catch((error) => {
        if (error.status === 401) {
          const requestedPath = window.top.location.pathname + window.top.location.search;
          const safePath = requestedPath.startsWith("/") && !requestedPath.startsWith("//")
            ? requestedPath
            : "/dashboard";
          parentNavigate("/auth?next=" + encodeURIComponent(safePath));
          return;
        }
        toast(error.message || "We couldn't check your sign-in. Please refresh and try again.");
      });
  }

  document.addEventListener("click", async (event) => {
    const anchor = event.target.closest("a");
    if (anchor) {
      const text = (anchor.innerText || "").trim().toLowerCase();
      const route = routeByName[anchor.dataset.path] ||
        (text.includes("get started") || text.includes("create account") || text === "log in" ? "/auth" :
          text.includes("dashboard") ? "/dashboard" :
            text.includes("draft") ? "/drafts" :
              text.includes("quick create") || text === "create" || text.includes("new campaign") ? "/studio" :
              text.includes("calendar") ? "/calendar" : null);
      if (route) {
        event.preventDefault();
        event.stopImmediatePropagation();
        parentNavigate(route);
        return;
      }
    }

    const button = event.target.closest("button");
    if (!button) return;
    const text = (button.innerText || "").trim().toLowerCase();

    if (button.id === "generateBtn") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const prompt = document.getElementById("creativePrompt")?.value.trim() || "";
      const platformValue = document.querySelector('input[name="core_platform"]:checked')?.value || "ig";
      const details = document.getElementById("businessDetailsInput")?.value.trim() || "";
      const language = "English";
      const tone = document.getElementById("toneSelect")?.value || "Warm & Hospitable";
      const platform = { ig: "Instagram Reels", yt: "YouTube Shorts", fb: "Facebook Reels" }[platformValue] || "Instagram Reels";
      if (!prompt) { toast("Add a short idea or brief before generating."); return; }
      if (businessPhotoIsReading) { toast("Your photo is still loading. Please wait a moment and try again."); return; }
      button.disabled = true;
      const original = button.dataset.idleMarkup || button.innerHTML;
      button.dataset.idleMarkup = original;
      button.dataset.state = "loading";
      const generatedStatusIcon = document.getElementById("generatedStatusIcon");
      if (generatedStatusIcon) generatedStatusIcon.textContent = "auto_awesome";
      window._creatorPilotGenerated = null;
      button.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span><span>Generating Content…</span>';
      let generatedSuccessfully = false;
      try {
        const result = await jsonRequest("/api/generate", "POST", {
          idea: prompt,
          businessDetails: details,
          language,
          platform,
          tone,
          image: selectedBusinessPhoto,
        });
        const content = result.content || {};
        const hook1 = String(content.hook1 || "").trim();
        const hook2 = String(content.hook2 || "").trim();
        const story1 = String(content.story1 || "").trim();
        const story2 = String(content.story2 || "").trim();
        const offer1 = String(content.offer1 || "").trim();
        const offer2 = String(content.offer2 || "").trim();
        const caption = String(content.caption || "").trim();
        const hashtags = String(content.hashtags || "").trim();
        const businessName = String(result.businessName || "").trim();
        if (![hook1, hook2, story1, story2, offer1, offer2, caption, hashtags, businessName].every(Boolean)) {
          throw new Error("The AI response was incomplete. Please generate again.");
        }

        window._creatorPilotGenerated = { hook1, hook2, story1, story2, offer1, offer2, caption, hashtags, tone, businessName };
        const sectionVariations = {
          hooks: [hook1, hook2],
          story: [story1, story2],
          offer: [offer1, offer2],
        };
        Object.entries(sectionVariations).forEach(([section, variations]) => {
          document.querySelectorAll(`#section-${section} > div`).forEach((card, index) => {
            const copy = variations[index] || "";
            const target = card.querySelector("[data-generated-content]");
            if (target) target.textContent = copy;
            card.querySelector(".copy-btn")?.setAttribute("data-copy", copy);
          });
        });

        const captionTarget = document.getElementById("generated-caption");
        if (captionTarget) captionTarget.textContent = caption;
        const hashtagList = document.getElementById("generated-hashtags");
        if (hashtagList) {
          hashtagList.replaceChildren();
          const tags = hashtags.match(/#[\p{L}\p{N}_]+/gu) || [];
          for (const tag of tags) {
            const chip = document.createElement("span");
            chip.className = "px-2 py-0.5 rounded bg-surface-container text-[13px] font-mono text-primary font-medium";
            chip.textContent = tag;
            hashtagList.append(chip);
          }
        }
        const captionCard = document.getElementById("generated-caption")?.closest(".bg-surface-container-lowest");
        captionCard?.querySelector(".copy-btn")?.setAttribute("data-copy", [caption, hashtags].join("\n\n"));
        button.dataset.state = "success";
        button.innerHTML = '<span>Content Generated</span><span class="material-symbols-outlined" aria-hidden="true" style="font-size:20px">check</span>';
        if (generatedStatusIcon) generatedStatusIcon.textContent = "check_circle";
        generatedSuccessfully = true;
        toast(result.factChecked === false
          ? (result.note || "Your draft is ready. Review business details before posting.")
          : "Your content is ready and fact-checked.");
      } catch (error) {
        if (error.status === 401) {
          const requestedPath = window.top.location.pathname + window.top.location.search;
          const safePath = requestedPath.startsWith("/") && !requestedPath.startsWith("//")
            ? requestedPath
            : "/studio";
          parentNavigate("/auth?next=" + encodeURIComponent(safePath));
          return;
        }
        toast(error.message);
      } finally {
        button.disabled = false;
        if (!generatedSuccessfully) {
          button.dataset.state = "idle";
          button.innerHTML = original;
        }
      }
      return;
    }

    if (text.includes("save to drafts")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const prompt = document.getElementById("creativePrompt")?.value.trim() || "";
      const businessDetails = document.getElementById("businessDetailsInput")?.value.trim() || "";
      const platformValue = document.querySelector('input[name="core_platform"]:checked')?.value || "ig";
      const language = "English";
      const platform = { ig: "Instagram Reels", yt: "YouTube Shorts", fb: "Facebook Reels" }[platformValue] || "Instagram Reels";
      const generated = window._creatorPilotGenerated;
      if (!generated) {
        toast("Generate content before saving a draft.");
        return;
      }

      const outputCard = button.closest("#section-hooks > div, #section-story > div, #section-offer > div");
      const sectionId = outputCard?.parentElement?.id || "";
      const sectionIndex = outputCard ? Array.from(outputCard.parentElement.children).indexOf(outputCard) : -1;
      const captionCard = button.closest(".bg-surface-container-lowest");
      const isCaptionCard = Boolean(captionCard?.querySelector("#generated-caption"));
      const sectionSpecs = {
        "section-hooks": { type: "hook", fields: ["hook1", "hook2"], label: "Hook Option" },
        "section-story": { type: "story", fields: ["story1", "story2"], label: "Story & Craft" },
        "section-offer": { type: "offer", fields: ["offer1", "offer2"], label: "Offer & CTA" },
      };
      const sectionSpec = sectionSpecs[sectionId];
      let content;
      let label;

      if (sectionSpec && sectionIndex >= 0 && sectionIndex < 2) {
        const selectedText = String(generated[sectionSpec.fields[sectionIndex]] || "");
        if (!selectedText) {
          toast("Generate this content before saving it to drafts.");
          return;
        }
        label = sectionSpec.label + " #" + (sectionIndex + 1);
        content = {
          ...generated,
          contentType: sectionSpec.type,
          selectedLabel: label,
          selectedText,
          [sectionSpec.type]: selectedText,
        };
        if (sectionSpec.type === "hook") content.hookOption = label;
      } else if (isCaptionCard) {
        if (!generated.caption || !generated.hashtags) {
          toast("Generate the caption and hashtags before saving.");
          return;
        }
        label = "Caption & Hashtags";
        content = {
          ...generated,
          contentType: "caption",
          selectedLabel: label,
          selectedText: generated.caption,
        };
      } else {
        toast("Generate content before saving this draft.");
        return;
      }

      try {
        await jsonRequest("/api/drafts", "POST", {
          title: ((prompt || "Social content draft") + " — " + label).slice(0, 180),
          idea: prompt,
          businessDetails,
          language,
          platform,
          content,
        });
        toast(label + " saved to your drafts.");
      } catch (error) {
        toast(error.message);
      }
    }
  }, true);

  const generateButton = document.getElementById("generateBtn");
  if (generateButton) generateButton.dataset.idleMarkup = generateButton.innerHTML;

  function clearGeneratedOutput() {
    window._creatorPilotGenerated = null;
    document.querySelectorAll("#section-hooks [data-generated-content], #section-story [data-generated-content], #section-offer [data-generated-content]").forEach((node) => { node.textContent = ""; });
    document.querySelectorAll("#section-hooks .copy-btn, #section-story .copy-btn, #section-offer .copy-btn").forEach((button) => button.removeAttribute("data-copy"));
    document.getElementById("generated-caption")?.replaceChildren();
    document.getElementById("generated-hashtags")?.replaceChildren();
    document.querySelectorAll("#section-hooks > div .copy-btn").forEach((button) => button.removeAttribute("data-copy"));
    document.getElementById("generated-caption")?.closest(".bg-surface-container-lowest")?.querySelector(".copy-btn")?.removeAttribute("data-copy");
  }

  function resetGenerateButtonForEdits() {
    const button = document.getElementById("generateBtn");
    if (!button || button.dataset.state === "loading") return;
    clearGeneratedOutput();
    if (button.dataset.state === "success") {
      button.innerHTML = button.dataset.idleMarkup || '<span class="material-symbols-outlined" style="font-size:20px">auto_awesome</span><span>Generate Content</span>';
      button.dataset.state = "idle";
      const generatedStatusIcon = document.getElementById("generatedStatusIcon");
      if (generatedStatusIcon) generatedStatusIcon.textContent = "auto_awesome";
    }
  }

  const businessPhotoInput = document.getElementById("businessPhotoInput");
  const businessPhotoStatus = document.getElementById("businessPhotoStatus");
  const businessPhotoPreview = document.getElementById("businessPhotoPreview");

  function setBusinessPhotoStatus(message, isError = false) {
    if (!businessPhotoStatus) return;
    businessPhotoStatus.textContent = message;
    businessPhotoStatus.classList.toggle("text-error", isError);
    businessPhotoStatus.classList.toggle("text-on-surface-variant", !isError);
  }

  function clearBusinessPhoto() {
    selectedBusinessPhoto = null;
    businessPhotoIsReading = false;
    if (businessPhotoInput) businessPhotoInput.value = "";
    if (businessPhotoPreview) {
      businessPhotoPreview.classList.add("hidden");
      businessPhotoPreview.classList.remove("flex");
    }
    const thumbnail = document.getElementById("businessPhotoThumbnail");
    if (thumbnail) thumbnail.removeAttribute("src");
    const filename = document.getElementById("businessPhotoFilename");
    if (filename) filename.textContent = "";
    setBusinessPhotoStatus("The photo is sent for this generation only and is not saved with drafts.");
  }

  document.getElementById("businessPhotoBrowse")?.addEventListener("click", () => businessPhotoInput?.click());
  document.getElementById("businessPhotoRemove")?.addEventListener("click", () => {
    clearBusinessPhoto();
    resetGenerateButtonForEdits();
  });

  businessPhotoInput?.addEventListener("change", () => {
    const file = businessPhotoInput.files?.[0];
    if (!file) return;

    const extensionType = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    }[file.name.split(".").pop()?.toLowerCase() || ""];
    let mimeType = file.type.toLowerCase();
    if (mimeType === "image/jpg") mimeType = "image/jpeg";
    if (!mimeType || mimeType === "application/octet-stream") mimeType = extensionType || "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      clearBusinessPhoto();
      setBusinessPhotoStatus("Choose a JPG, PNG or WebP image.", true);
      toast("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      clearBusinessPhoto();
      setBusinessPhotoStatus("That photo is over 2 MB. Choose a smaller image.", true);
      toast("That photo is over 2 MB. Choose a smaller image.");
      return;
    }

    selectedBusinessPhoto = null;
    businessPhotoIsReading = true;
    businessPhotoPreview?.classList.add("hidden");
    businessPhotoPreview?.classList.remove("flex");
    const oldThumbnail = document.getElementById("businessPhotoThumbnail");
    if (oldThumbnail) oldThumbnail.removeAttribute("src");
    const oldFilename = document.getElementById("businessPhotoFilename");
    if (oldFilename) oldFilename.textContent = "";
    setBusinessPhotoStatus("Reading your photo…");
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const commaIndex = dataUrl.indexOf(",");
      if (commaIndex < 0) {
        businessPhotoIsReading = false;
        setBusinessPhotoStatus("This photo could not be read. Choose it again.", true);
        return;
      }
      const data = dataUrl.slice(commaIndex + 1);
      if (!data) {
        businessPhotoIsReading = false;
        setBusinessPhotoStatus("This photo could not be read. Choose it again.", true);
        return;
      }
      selectedBusinessPhoto = { mimeType, data };
      businessPhotoIsReading = false;
      const thumbnail = document.getElementById("businessPhotoThumbnail");
      if (thumbnail) thumbnail.src = dataUrl;
      const filename = document.getElementById("businessPhotoFilename");
      if (filename) filename.textContent = file.name;
      businessPhotoPreview?.classList.remove("hidden");
      businessPhotoPreview?.classList.add("flex");
      setBusinessPhotoStatus("Your photo will be used only for visible appearance and is not saved with drafts.");
      resetGenerateButtonForEdits();
    });
    reader.addEventListener("error", () => {
      businessPhotoIsReading = false;
      selectedBusinessPhoto = null;
      setBusinessPhotoStatus("This photo could not be read. Choose it again.", true);
      toast("This photo could not be read. Choose it again.");
    });
    reader.readAsDataURL(file);
  });

  document.addEventListener("input", (event) => {
    if (event.target?.id === "creativePrompt" || event.target?.id === "businessDetailsInput") resetGenerateButtonForEdits();
  });
  document.addEventListener("change", (event) => {
    if (event.target?.name === "core_lang" || event.target?.name === "core_platform" || event.target?.id === "toneSelect") resetGenerateButtonForEdits();
  });

  function enableStudioNotifications() {
    if (screen !== "studio" && screen !== "drafts") return;
    const button = document.getElementById("create-notifications-button");
    if (!button) return;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const existingPanel = document.getElementById("create-notification-panel");
      if (existingPanel) {
        existingPanel.remove();
        button.setAttribute("aria-expanded", "false");
        return;
      }

      const panel = document.createElement("div");
      const bounds = button.getBoundingClientRect();
      const panelWidth = Math.min(320, window.innerWidth - 32);
      panel.id = "create-notification-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "Notifications");
      panel.tabIndex = -1;
      panel.style.cssText = [
        "position:fixed",
        `top:${Math.min(bounds.bottom + 8, window.innerHeight - 196)}px`,
        `left:${Math.max(16, Math.min(window.innerWidth - panelWidth - 16, bounds.right - panelWidth))}px`,
        `width:${panelWidth}px`,
        "height:180px",
        "box-sizing:border-box",
        "background:#ffffff",
        "border:1px solid #e6e0d6",
        "border-radius:16px",
        "box-shadow:0 8px 24px rgba(58,48,42,0.14)",
        "z-index:99999",
      ].join(";");
      document.body.append(panel);
      button.setAttribute("aria-expanded", "true");
    });

    window.addEventListener("click", (event) => {
      const panel = document.getElementById("create-notification-panel");
      if (!panel || panel.contains(event.target) || button.contains(event.target)) return;
      panel.remove();
      button.setAttribute("aria-expanded", "false");
    }, true);
  }

  enableStudioNotifications();
})();
