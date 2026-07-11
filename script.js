/* ==========================================================================
   SEKINAH SALIU — PORTFOLIO SCRIPT
   Sections:
     1. Theme toggle (dark / light, persisted)
     2. Mobile navigation
     3. Scroll progress bar
     4. Scroll-reveal animations (IntersectionObserver)
     5. Animated stat counters
     6. Skill proficiency bars
     7. Back-to-top button
     8. Academic Planner (planner.html)
     9. Contact form validation (contact.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ------------------------------------------------------------------
     1. THEME TOGGLE
  ------------------------------------------------------------------ */
  (function initTheme() {
    const STORAGE_KEY = 'sekinah-theme';
    const toggle = document.getElementById('themeToggle');
    const root = document.documentElement;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light') {
      root.setAttribute('data-theme', 'light');
    }
    updateIcon();

    if (toggle) {
      toggle.addEventListener('click', function () {
        const isLight = root.getAttribute('data-theme') === 'light';
        if (isLight) {
          root.removeAttribute('data-theme');
          localStorage.setItem(STORAGE_KEY, 'dark');
        } else {
          root.setAttribute('data-theme', 'light');
          localStorage.setItem(STORAGE_KEY, 'light');
        }
        updateIcon();
      });
    }

    function updateIcon() {
      if (!toggle) return;
      const isLight = root.getAttribute('data-theme') === 'light';
      toggle.textContent = isLight ? '☾' : '☀';
      toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    }
  })();


  /* ------------------------------------------------------------------
     2. MOBILE NAVIGATION TOGGLE
  ------------------------------------------------------------------ */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }


  /* ------------------------------------------------------------------
     3. SCROLL PROGRESS BAR
  ------------------------------------------------------------------ */
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }


  /* ------------------------------------------------------------------
     4. SCROLL-REVEAL ANIMATIONS
  ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }


  /* ------------------------------------------------------------------
     5. ANIMATED STAT COUNTERS
     Reads the target number from data-count and animates from 0.
     Preserves any suffix (+, %, or decimal) already in the markup.
  ------------------------------------------------------------------ */
  const statEls = document.querySelectorAll('[data-count]');
  if (statEls.length && 'IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    statEls.forEach(function (el) { statObserver.observe(el); });
  }

  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const isDecimal = target % 1 !== 0;
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = (isDecimal ? current.toFixed(2) : Math.round(current)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }


  /* ------------------------------------------------------------------
     6. SKILL PROFICIENCY BARS
     Fills each .skill-bar-fill to its data-level (%) once in view.
  ------------------------------------------------------------------ */
  const skillBars = document.querySelectorAll('.skill-bar-fill');
  if (skillBars.length && 'IntersectionObserver' in window) {
    const barObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.width = (el.dataset.level || '0') + '%';
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });

    skillBars.forEach(function (el) { barObserver.observe(el); });
  }


  /* ------------------------------------------------------------------
     7. BACK-TO-TOP BUTTON
  ------------------------------------------------------------------ */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ------------------------------------------------------------------
     8. ACADEMIC PLANNER
     Tasks are kept as an in-memory array and persisted to localStorage
     so the list survives a page reload.
  ------------------------------------------------------------------ */
  const taskForm = document.getElementById('taskForm');

  if (taskForm) {
    const STORAGE_KEY = 'sekinah-planner-tasks';

    const taskTitleInput = document.getElementById('taskTitle');
    const taskDueInput = document.getElementById('taskDue');
    const taskPriorityInput = document.getElementById('taskPriority');
    const taskListEl = document.getElementById('taskList');
    const emptyStateEl = document.getElementById('emptyState');
    const statTotal = document.getElementById('statTotal');
    const statDone = document.getElementById('statDone');
    const statPending = document.getElementById('statPending');

    let tasks = loadTasks();

    function loadTasks() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        console.warn('Could not read saved tasks, starting fresh.', err);
        return [];
      }
    }

    function saveTasks() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (err) {
        console.warn('Could not save tasks.', err);
      }
    }

    function formatDate(dateStr) {
      if (!dateStr) return 'No due date';
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function render() {
      taskListEl.innerHTML = '';

      if (tasks.length === 0) {
        taskListEl.appendChild(emptyStateEl);
        emptyStateEl.style.display = 'block';
      } else {
        emptyStateEl.style.display = 'none';

        tasks.forEach(function (task) {
          const item = document.createElement('div');
          item.className = 'task-item' + (task.completed ? ' completed' : '');
          item.dataset.id = task.id;

          item.innerHTML =
            '<button class="task-check ' + (task.completed ? 'checked' : '') + '" ' +
              'aria-label="Toggle task completed" title="Mark ' + (task.completed ? 'incomplete' : 'complete') + '">' +
              (task.completed ? '✓' : '') +
            '</button>' +
            '<div class="task-main">' +
              '<div class="task-title"></div>' +
              '<div class="task-meta"></div>' +
            '</div>' +
            '<span class="task-priority ' + task.priority + '">' + task.priority + '</span>' +
            '<button class="task-delete" aria-label="Delete task" title="Delete task">✕</button>';

          item.querySelector('.task-title').textContent = task.title;
          item.querySelector('.task-meta').textContent = 'Due: ' + formatDate(task.due);

          taskListEl.appendChild(item);
        });
      }

      const total = tasks.length;
      const done = tasks.filter(function (t) { return t.completed; }).length;
      statTotal.textContent = total;
      statDone.textContent = done;
      statPending.textContent = total - done;
    }

    taskForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const title = taskTitleInput.value.trim();
      if (!title) return;

      tasks.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: title,
        due: taskDueInput.value,
        priority: taskPriorityInput.value,
        completed: false
      });

      saveTasks();
      render();
      taskForm.reset();
      taskPriorityInput.value = 'medium';
      taskTitleInput.focus();
    });

    taskListEl.addEventListener('click', function (e) {
      const item = e.target.closest('.task-item');
      if (!item) return;
      const id = item.dataset.id;

      if (e.target.closest('.task-check')) {
        const task = tasks.find(function (t) { return t.id === id; });
        if (task) task.completed = !task.completed;
        saveTasks();
        render();
      }

      if (e.target.closest('.task-delete')) {
        tasks = tasks.filter(function (t) { return t.id !== id; });
        saveTasks();
        render();
      }
    });

    render();
  }


  /* ------------------------------------------------------------------
     9. CONTACT FORM VALIDATION
     Rules: no empty fields, valid email format (regex), phone must be
     digits only. Feedback is written into the DOM — no alert() calls.
  ------------------------------------------------------------------ */
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    const fields = {
      name: { input: document.getElementById('name'), error: document.getElementById('nameError') },
      email: { input: document.getElementById('email'), error: document.getElementById('emailError') },
      phone: { input: document.getElementById('phone'), error: document.getElementById('phoneError') },
      message: { input: document.getElementById('message'), error: document.getElementById('messageError') }
    };
    const formMsg = document.getElementById('formMsg');

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const DIGITS_ONLY_REGEX = /^\d+$/;

    function setFieldError(field, text) {
      field.error.textContent = text;
      field.input.classList.toggle('invalid', Boolean(text));
    }

    function validateField(key) {
      const field = fields[key];
      const value = field.input.value.trim();

      if (!value) {
        setFieldError(field, 'This field cannot be empty.');
        return false;
      }

      if (key === 'email' && !EMAIL_REGEX.test(value)) {
        setFieldError(field, 'Enter a valid email address (e.g. name@example.com).');
        return false;
      }

      if (key === 'phone' && !DIGITS_ONLY_REGEX.test(value)) {
        setFieldError(field, 'Phone number must contain digits only, no spaces or symbols.');
        return false;
      }

      setFieldError(field, '');
      return true;
    }

    Object.keys(fields).forEach(function (key) {
      fields[key].input.addEventListener('blur', function () { validateField(key); });
    });

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const results = Object.keys(fields).map(validateField);
      const allValid = results.every(Boolean);

      formMsg.classList.remove('success', 'error', 'show');

      if (!allValid) {
        formMsg.textContent = 'Please fix the highlighted fields before sending.';
        formMsg.classList.add('error', 'show');
        return;
      }

      formMsg.textContent = 'Message sent — thanks for reaching out! I will get back to you soon.';
      formMsg.classList.add('success', 'show');
      contactForm.reset();
    });
  }

});
