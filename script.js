/* =========================================================================
   COS 106 · Student Portfolio & Academic Management Website
   Shared application script
   -------------------------------------------------------------------------
   Organised into small, focused modules that each own one feature. Every
   module checks for the DOM nodes it needs before running, so this single
   file can be safely included on every page of the site.
   ========================================================================= */

(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     Module: Loader
     Hides the full-screen loading overlay once the page has painted.
     ----------------------------------------------------------------------- */
  function initLoader() {
    const loader = document.querySelector("[data-loader]");
    if (!loader) return;

    window.addEventListener("load", () => {
      setTimeout(() => loader.setAttribute("data-hidden", "true"), 350);
    });

    // Safety net: never let the loader block the page for more than 2.5s.
    setTimeout(() => loader.setAttribute("data-hidden", "true"), 2500);
  }

  /* -----------------------------------------------------------------------
     Module: Theme toggle (light / dark)
     Persists the chosen theme in localStorage so it survives page loads.
     ----------------------------------------------------------------------- */
  function initTheme() {
    const STORAGE_KEY = "portfolio-theme";
    const toggleButtons = document.querySelectorAll("[data-theme-toggle]");
    const root = document.documentElement;

    function applyTheme(theme) {
      root.setAttribute("data-theme", theme);
      toggleButtons.forEach((btn) => {
        btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
        btn.textContent = theme === "dark" ? "☀" : "☾";
        btn.setAttribute(
          "aria-label",
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        );
      });
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));

    toggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
      });
    });
  }

  /* -----------------------------------------------------------------------
     Module: Mobile navigation + sticky header shadow + active link
     ----------------------------------------------------------------------- */
  function initNav() {
    const nav = document.querySelector("[data-nav]");
    const toggle = document.querySelector("[data-nav-toggle]");
    const header = document.querySelector("[data-site-header]");

    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const isOpen = nav.getAttribute("data-open") === "true";
        nav.setAttribute("data-open", String(!isOpen));
        toggle.setAttribute("aria-expanded", String(!isOpen));
      });

      // Close the mobile menu after a link is chosen.
      nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          nav.setAttribute("data-open", "false");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    if (header) {
      const onScroll = () => {
        header.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  /* -----------------------------------------------------------------------
     Module: Scroll progress bar + back-to-top button
     ----------------------------------------------------------------------- */
  function initScrollUI() {
    const progressBar = document.querySelector("[data-progress-bar]");
    const backToTop = document.querySelector("[data-back-to-top]");

    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (progressBar) progressBar.style.width = pct + "%";
      if (backToTop) backToTop.setAttribute("data-visible", scrollTop > 480 ? "true" : "false");
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (backToTop) {
      backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  /* -----------------------------------------------------------------------
     Module: Scroll-reveal animations
     Uses IntersectionObserver to add a class when elements enter view.
     ----------------------------------------------------------------------- */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach((el, i) => {
      el.style.setProperty("--i", i % 6);
      observer.observe(el);
    });
  }

  /* -----------------------------------------------------------------------
     Module: Typing animation for the hero headline
     ----------------------------------------------------------------------- */
  function initTypingEffect() {
    const el = document.querySelector("[data-typing]");
    if (!el) return;

    const phrases = JSON.parse(el.getAttribute("data-typing") || "[]");
    if (!phrases.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      el.textContent = phrases[0];
      return;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const current = phrases[phraseIndex];

      if (!deleting) {
        charIndex++;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(tick, 1500);
          return;
        }
      } else {
        charIndex--;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }
      setTimeout(tick, deleting ? 45 : 85);
    }

    tick();
  }

  /* -----------------------------------------------------------------------
     Module: Animated skill bars (About page)
     Bars fill to their data-level percentage once scrolled into view.
     ----------------------------------------------------------------------- */
  function initSkillBars() {
    const bars = document.querySelectorAll("[data-skill-fill]");
    if (!bars.length) return;

    if (!("IntersectionObserver" in window)) {
      bars.forEach((bar) => (bar.style.width = bar.dataset.skillFill + "%"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.width = entry.target.dataset.skillFill + "%";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    bars.forEach((bar) => observer.observe(bar));
  }

  /* -----------------------------------------------------------------------
     Module: Academic Planner
     Full CRUD task manager backed by localStorage, built with vanilla JS
     arrays/functions per the assessment's JavaScript requirements.
     ----------------------------------------------------------------------- */
  function initPlanner() {
    const form = document.querySelector("[data-planner-form]");
    const list = document.querySelector("[data-task-list]");
    if (!form || !list) return;

    const STORAGE_KEY = "portfolio-planner-tasks";
    const titleInput = form.querySelector("#taskTitle");
    const dueInput = form.querySelector("#taskDue");
    const priorityInput = form.querySelector("#taskPriority");
    const countEl = document.querySelector("[data-task-count]");
    const emptyState = document.querySelector("[data-empty-state]");
    const filterChips = document.querySelectorAll("[data-filter]");

    let tasks = loadTasks();
    let activeFilter = "all";

    function loadTasks() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : seedTasks();
      } catch (err) {
        return seedTasks();
      }
    }

    function seedTasks() {
      return [
        { id: cryptoId(), title: "Submit COS 106 term project", due: "2026-07-25", priority: "high", done: false },
        { id: cryptoId(), title: "Review lecture notes on Flexbox", due: "2026-07-15", priority: "medium", done: false },
        { id: cryptoId(), title: "Back up portfolio to GitHub", due: "2026-07-13", priority: "low", done: true },
      ];
    }

    function cryptoId() {
      return "t-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    }

    function saveTasks() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    function formatDate(iso) {
      if (!iso) return "No due date";
      const date = new Date(iso + "T00:00:00");
      if (isNaN(date)) return "No due date";
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }

    function getFilteredTasks() {
      if (activeFilter === "active") return tasks.filter((t) => !t.done);
      if (activeFilter === "completed") return tasks.filter((t) => t.done);
      return tasks;
    }

    function render() {
      const visible = getFilteredTasks();
      list.innerHTML = "";

      if (visible.length === 0) {
        if (emptyState) emptyState.style.display = "block";
      } else {
        if (emptyState) emptyState.style.display = "none";
      }

      visible.forEach((task) => {
        const li = document.createElement("li");
        li.className = "task";
        li.setAttribute("data-done", String(task.done));
        li.setAttribute("data-id", task.id);

        li.innerHTML = `
          <button class="task__check" type="button" role="checkbox"
            aria-checked="${task.done}" aria-label="Mark '${escapeHtml(task.title)}' as ${task.done ? "not completed" : "completed"}">
          </button>
          <div class="task__body">
            <div class="task__title">${escapeHtml(task.title)}</div>
            <div class="task__meta">Due ${formatDate(task.due)}</div>
          </div>
          <span class="task__priority" data-level="${task.priority}">${task.priority}</span>
          <button class="task__delete" type="button" aria-label="Delete task '${escapeHtml(task.title)}'">✕</button>
        `;

        list.appendChild(li);
      });

      if (countEl) {
        const remaining = tasks.filter((t) => !t.done).length;
        countEl.textContent = `${remaining} of ${tasks.length} task${tasks.length === 1 ? "" : "s"} remaining`;
      }
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    // Add task
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        return;
      }

      tasks.push({
        id: cryptoId(),
        title,
        due: dueInput.value,
        priority: priorityInput.value || "medium",
        done: false,
      });

      saveTasks();
      render();
      form.reset();
      titleInput.focus();
    });

    // Complete / delete via event delegation
    list.addEventListener("click", (event) => {
      const item = event.target.closest(".task");
      if (!item) return;
      const id = item.getAttribute("data-id");

      if (event.target.closest(".task__check")) {
        tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
        saveTasks();
        render();
      }

      if (event.target.closest(".task__delete")) {
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks();
        render();
      }
    });

    // Filters
    filterChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        filterChips.forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        activeFilter = chip.getAttribute("data-filter");
        render();
      });
    });

    render();
  }

  /* -----------------------------------------------------------------------
     Module: Contact form validation
     Validates on submit (and re-validates on blur) without any library.
     ----------------------------------------------------------------------- */
  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const status = document.querySelector("[data-form-status]");
    const fields = {
      name: form.querySelector("#contactName"),
      email: form.querySelector("#contactEmail"),
      phone: form.querySelector("#contactPhone"),
      message: form.querySelector("#contactMessage"),
    };

    const validators = {
      name: (value) => (value.trim().length >= 2 ? "" : "Please enter your full name."),
      email: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Please enter a valid email address.",
      phone: (value) =>
        /^[0-9]{7,15}$/.test(value.trim()) ? "" : "Phone number must contain digits only (7–15 digits).",
      message: (value) => (value.trim().length >= 10 ? "" : "Message should be at least 10 characters."),
    };

    function showError(field, message) {
      const wrapper = field.closest(".field");
      const errorEl = wrapper.querySelector("[data-field-error]");
      wrapper.classList.toggle("has-error", Boolean(message));
      if (errorEl) errorEl.textContent = message;
      return !message;
    }

    function validateField(key) {
      const field = fields[key];
      if (!field) return true;
      const message = validators[key](field.value);
      return showError(field, message);
    }

    Object.keys(fields).forEach((key) => {
      const field = fields[key];
      if (!field) return;
      field.addEventListener("blur", () => validateField(key));
      field.addEventListener("input", () => {
        if (field.closest(".field").classList.contains("has-error")) validateField(key);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const results = Object.keys(fields).map(validateField);
      const allValid = results.every(Boolean);

      if (!status) return;

      if (allValid) {
        status.setAttribute("data-kind", "success");
        status.setAttribute("data-visible", "true");
        status.textContent = "Thanks! Your message has been captured. I'll get back to you soon.";
        form.reset();
        Object.values(fields).forEach((f) => f && f.closest(".field").classList.remove("has-error"));
      } else {
        status.setAttribute("data-kind", "error");
        status.setAttribute("data-visible", "true");
        status.textContent = "Please fix the highlighted fields before sending.";
      }
    });
  }

  /* -----------------------------------------------------------------------
     Module: Footer year
     ----------------------------------------------------------------------- */
  function initFooterYear() {
    const el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* -----------------------------------------------------------------------
     Boot
     ----------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initLoader();
    initTheme();
    initNav();
    initScrollUI();
    initReveal();
    initTypingEffect();
    initSkillBars();
    initPlanner();
    initContactForm();
    initFooterYear();
  });
})();
