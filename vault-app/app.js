(function () {
  const data = window.VAULT_DATA;
  const STORAGE_KEY = 'aiwithtracy-resource-vault-state-v1';
  const tierRank = { free: 0, starter: 1, vip: 2 };
  const progressStates = [
    { id: 'not-started', label: 'Not started', percent: 0 },
    { id: 'queued', label: 'Queued', percent: 24 },
    { id: 'active', label: 'In progress', percent: 62 },
    { id: 'complete', label: 'Complete', percent: 100 },
  ];

  const elements = {
    headerTier: document.getElementById('header-tier'),
    headerUser: document.getElementById('header-user'),
    heroStats: document.getElementById('hero-stats'),
    roadmapGrid: document.getElementById('roadmap-grid'),
    insightGrid: document.getElementById('insight-grid'),
    resourceSummary: document.getElementById('resource-summary'),
    resourceGrid: document.getElementById('resource-grid'),
    resourceSearch: document.getElementById('resource-search'),
    resourceAudienceFilter: document.getElementById('resource-audience-filter'),
    resourcePhaseFilter: document.getElementById('resource-phase-filter'),
    resourceTierFilter: document.getElementById('resource-tier-filter'),
    promptSummary: document.getElementById('prompt-summary'),
    promptGrid: document.getElementById('prompt-grid'),
    promptSearch: document.getElementById('prompt-search'),
    promptDomainFilter: document.getElementById('prompt-domain-filter'),
    promptGuideFilter: document.getElementById('prompt-guide-filter'),
    toolSummary: document.getElementById('tool-summary'),
    toolGrid: document.getElementById('tool-grid'),
    toolSearch: document.getElementById('tool-search'),
    toolCategoryFilter: document.getElementById('tool-category-filter'),
    toolAudienceFilter: document.getElementById('tool-audience-filter'),
    tierSummary: document.getElementById('tier-summary'),
    tierGrid: document.getElementById('tier-grid'),
    courseGrid: document.getElementById('course-grid'),
    dashboardMetrics: document.getElementById('dashboard-metrics'),
    dashboardFunnel: document.getElementById('dashboard-funnel'),
    automationGrid: document.getElementById('automation-grid'),
    assessmentGrid: document.getElementById('assessment-grid'),
    revenueGrid: document.getElementById('revenue-grid'),
    teamGrid: document.getElementById('team-grid'),
    leadForm: document.getElementById('lead-form'),
    leadName: document.getElementById('lead-name'),
    leadEmail: document.getElementById('lead-email'),
    leadSegment: document.getElementById('lead-segment'),
    leadTier: document.getElementById('lead-tier'),
    leadFeedback: document.getElementById('lead-feedback'),
    detailDialog: document.getElementById('detail-dialog'),
    dialogContent: document.getElementById('dialog-content'),
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function listMarkup(items) {
    return `<ul class="stack-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }

  function getDefaultState() {
    return {
      user: {
        name: '',
        email: '',
        segment: 'consumer',
        tier: 'free',
      },
      bookmarks: [],
      progress: {},
      favoritePrompts: [],
      copiedCount: 0,
      leads: [],
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultState();
      const parsed = JSON.parse(raw);
      const defaults = getDefaultState();
      return {
        ...defaults,
        ...parsed,
        user: { ...defaults.user, ...(parsed.user || {}) },
      };
    } catch (error) {
      return getDefaultState();
    }
  }

  let state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getProgressState(resourceId) {
    const stateId = state.progress[resourceId] || 'not-started';
    return progressStates.find((item) => item.id === stateId) || progressStates[0];
  }

  function cycleProgress(resourceId) {
    const current = getProgressState(resourceId);
    const index = progressStates.findIndex((item) => item.id === current.id);
    const next = progressStates[(index + 1) % progressStates.length];
    state.progress[resourceId] = next.id;
    saveState();
    render();
  }

  function toggleBookmark(resourceId) {
    if (state.bookmarks.includes(resourceId)) {
      state.bookmarks = state.bookmarks.filter((id) => id !== resourceId);
    } else {
      state.bookmarks = [...state.bookmarks, resourceId];
    }
    saveState();
    render();
  }

  function toggleFavoritePrompt(promptId) {
    if (state.favoritePrompts.includes(promptId)) {
      state.favoritePrompts = state.favoritePrompts.filter((id) => id !== promptId);
    } else {
      state.favoritePrompts = [...state.favoritePrompts, promptId];
    }
    saveState();
    render();
  }

  function currentTierName() {
    const tier = data.membershipTiers.find((item) => item.id === state.user.tier);
    return tier ? tier.name : 'Free Explorer';
  }

  function setTier(tierId) {
    state.user.tier = tierId;
    saveState();
    render();
  }

  function isResourceUnlocked(resource) {
    return tierRank[state.user.tier] >= tierRank[resource.tier];
  }

  function populateSelect(select, values, format) {
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = format ? format(value) : value;
      select.appendChild(option);
    });
  }

  function initFilters() {
    populateSelect(
      elements.resourceAudienceFilter,
      Array.from(new Set(data.resources.flatMap((resource) => resource.audience))).sort()
    );
    populateSelect(
      elements.resourcePhaseFilter,
      Array.from(new Set(data.resources.map((resource) => resource.phase))).sort()
    );
    populateSelect(
      elements.resourceTierFilter,
      Array.from(new Set(data.resources.map((resource) => resource.tier))),
      (value) => data.membershipTiers.find((tier) => tier.id === value)?.name || value
    );

    populateSelect(
      elements.promptDomainFilter,
      Array.from(new Set(data.prompts.map((prompt) => prompt.domain))).sort()
    );
    populateSelect(
      elements.promptGuideFilter,
      Array.from(new Set(data.prompts.map((prompt) => prompt.guide))).sort()
    );

    populateSelect(
      elements.toolCategoryFilter,
      Array.from(new Set(data.tools.map((tool) => tool.category))).sort()
    );
    populateSelect(
      elements.toolAudienceFilter,
      Array.from(new Set(data.tools.flatMap((tool) => tool.audiences))).sort()
    );
  }

  function renderHeader() {
    elements.headerTier.textContent = currentTierName();
    if (state.user.name || state.user.email) {
      elements.headerUser.textContent = state.user.name || state.user.email;
    } else {
      elements.headerUser.textContent = 'Demo mode';
    }
    elements.leadName.value = state.user.name || '';
    elements.leadEmail.value = state.user.email || '';
    elements.leadSegment.value = state.user.segment || 'consumer';
    elements.leadTier.value = state.user.tier || 'free';
  }

  function renderHeroStats() {
    const foundationCount = data.resources.filter((resource) => resource.phase === 'Foundation').length;
    const completedCount = Object.values(state.progress).filter((item) => item === 'complete').length;
    const stats = [
      {
        value: foundationCount,
        label: 'Foundation guides',
        note: 'Week 1 through Week 3 assets',
      },
      {
        value: data.prompts.length,
        label: 'Prompt library items',
        note: 'Ready for copy and favorite',
      },
      {
        value: state.bookmarks.length,
        label: 'Bookmarked resources',
        note: 'Saved in local demo state',
      },
      {
        value: completedCount,
        label: 'Completed assets',
        note: 'Progress tracking enabled',
      },
    ];

    elements.heroStats.innerHTML = stats
      .map(
        (stat) => `
          <article class="stat-card">
            <strong>${escapeHtml(stat.value)}</strong>
            <div class="metric-label">${escapeHtml(stat.label)}</div>
            <p>${escapeHtml(stat.note)}</p>
          </article>
        `
      )
      .join('');
  }

  function renderRoadmap() {
    elements.roadmapGrid.innerHTML = data.roadmap
      .map(
        (item) => `
          <article class="roadmap-card">
            <div class="card-topline">
              <span class="card-chip">${escapeHtml(item.title)}</span>
            </div>
            <h3>${escapeHtml(item.focus)}</h3>
            ${listMarkup(item.items)}
          </article>
        `
      )
      .join('');

    elements.insightGrid.innerHTML = data.insights
      .map(
        (item) => `
          <article class="insight-card">
            <div class="card-topline">
              <span class="mini-chip">${escapeHtml(item.title)}</span>
            </div>
            <p>${escapeHtml(item.summary)}</p>
          </article>
        `
      )
      .join('');
  }

  function filterResources() {
    const query = elements.resourceSearch.value.trim().toLowerCase();
    const audience = elements.resourceAudienceFilter.value;
    const phase = elements.resourcePhaseFilter.value;
    const tier = elements.resourceTierFilter.value;

    return data.resources.filter((resource) => {
      const searchable = [
        resource.title,
        resource.description,
        resource.type,
        resource.phase,
        resource.audience.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const matchesAudience = audience === 'all' || resource.audience.includes(audience);
      const matchesPhase = phase === 'all' || resource.phase === phase;
      const matchesTier = tier === 'all' || resource.tier === tier;
      return matchesQuery && matchesAudience && matchesPhase && matchesTier;
    });
  }

  function renderResources() {
    const resources = filterResources();
    const premiumCount = data.resources.filter((resource) => resource.phase === 'Premium').length;
    const expansionCount = data.resources.filter((resource) => resource.phase === 'Expansion').length;

    elements.resourceSummary.textContent = `${data.resources.length} resources seeded | ${premiumCount} premium | ${expansionCount} expansion`;

    if (!resources.length) {
      elements.resourceGrid.innerHTML = `<div class="empty-state">No resources match the current filters.</div>`;
      return;
    }

    elements.resourceGrid.innerHTML = resources
      .map((resource) => {
        const progress = getProgressState(resource.id);
        const unlocked = isResourceUnlocked(resource);
        const bookmarked = state.bookmarks.includes(resource.id);
        const audienceText = resource.audience.join(', ');
        return `
          <article class="resource-card ${escapeHtml(progress.id)}">
            <div class="resource-meta">
              <span class="card-chip">${escapeHtml(resource.phase)}</span>
              <span class="card-chip">${escapeHtml(resource.type)}</span>
              <span class="card-chip">${escapeHtml(resource.priceLabel)}</span>
              <span class="card-chip">${escapeHtml(resource.release)}</span>
              ${!unlocked ? '<span class="card-chip">Locked for current tier</span>' : ''}
            </div>
            <h3>${escapeHtml(resource.title)}</h3>
            <p>${escapeHtml(resource.description)}</p>
            <ul class="mini-list">
              <li>Audience: ${escapeHtml(audienceText)}</li>
              <li>CTA: ${escapeHtml(resource.cta)}</li>
            </ul>
            <div class="progress-row">
              <div class="section-meta">Progress: ${escapeHtml(progress.label)}</div>
              <div class="progress-track"><span style="width:${progress.percent}%"></span></div>
            </div>
            <div class="resource-actions">
              <button class="button button-secondary" data-action="open-resource" data-id="${escapeHtml(resource.id)}">
                Preview
              </button>
              <button class="button toggle-button ${bookmarked ? 'bookmarked' : ''}" data-action="bookmark-resource" data-id="${escapeHtml(resource.id)}">
                ${bookmarked ? 'Saved' : 'Save'}
              </button>
              <button class="button toggle-button" data-action="progress-resource" data-id="${escapeHtml(resource.id)}">
                ${escapeHtml(progress.label)}
              </button>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function filterPrompts() {
    const query = elements.promptSearch.value.trim().toLowerCase();
    const domain = elements.promptDomainFilter.value;
    const guide = elements.promptGuideFilter.value;

    return data.prompts.filter((prompt) => {
      const searchable = [prompt.title, prompt.text, prompt.domain, prompt.guide, prompt.tags.join(' ')].join(' ').toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const matchesDomain = domain === 'all' || prompt.domain === domain;
      const matchesGuide = guide === 'all' || prompt.guide === guide;
      return matchesQuery && matchesDomain && matchesGuide;
    });
  }

  function renderPrompts() {
    const prompts = filterPrompts();
    elements.promptSummary.textContent = `${data.prompts.length} prompts | ${state.favoritePrompts.length} favorites | ${state.copiedCount} copied`;

    if (!prompts.length) {
      elements.promptGrid.innerHTML = `<div class="empty-state">No prompts match the current filters.</div>`;
      return;
    }

    elements.promptGrid.innerHTML = prompts
      .map((prompt) => {
        const favorite = state.favoritePrompts.includes(prompt.id);
        return `
          <article class="prompt-card">
            <div class="prompt-meta">
              <span class="mini-chip">${escapeHtml(prompt.domain)}</span>
              <span class="mini-chip">${escapeHtml(prompt.guide)}</span>
            </div>
            <h3>${escapeHtml(prompt.title)}</h3>
            <p>${escapeHtml(prompt.text)}</p>
            <div class="prompt-actions">
              <button class="button button-secondary" data-action="copy-prompt" data-id="${escapeHtml(prompt.id)}">
                Copy prompt
              </button>
              <button class="button toggle-button ${favorite ? 'favorite' : ''}" data-action="favorite-prompt" data-id="${escapeHtml(prompt.id)}">
                ${favorite ? 'Favorited' : 'Favorite'}
              </button>
              <button class="button toggle-button" data-action="open-prompt" data-id="${escapeHtml(prompt.id)}">
                Details
              </button>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function filterTools() {
    const query = elements.toolSearch.value.trim().toLowerCase();
    const category = elements.toolCategoryFilter.value;
    const audience = elements.toolAudienceFilter.value;

    return data.tools.filter((tool) => {
      const searchable = [tool.name, tool.category, tool.summary, tool.tutorial, tool.monetization].join(' ').toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const matchesCategory = category === 'all' || tool.category === category;
      const matchesAudience = audience === 'all' || tool.audiences.includes(audience);
      return matchesQuery && matchesCategory && matchesAudience;
    });
  }

  function renderTools() {
    const tools = filterTools();
    elements.toolSummary.textContent = `${data.tools.length} tools | ${new Set(data.tools.map((tool) => tool.category)).size} categories`;

    if (!tools.length) {
      elements.toolGrid.innerHTML = `<div class="empty-state">No tools match the current filters.</div>`;
      return;
    }

    elements.toolGrid.innerHTML = tools
      .map(
        (tool) => `
          <article class="tool-card">
            <div class="tool-meta">
              <span class="card-chip">${escapeHtml(tool.category)}</span>
              <span class="card-chip">Rating ${escapeHtml(tool.rating)}/5</span>
            </div>
            <h3>${escapeHtml(tool.name)}</h3>
            <p>${escapeHtml(tool.summary)}</p>
            <ul class="mini-list">
              <li>Best for: ${escapeHtml(tool.audiences.join(', '))}</li>
              <li>Monetization angle: ${escapeHtml(tool.monetization)}</li>
            </ul>
            <div class="tool-actions">
              <button class="button button-secondary" data-action="open-tool" data-id="${escapeHtml(tool.id)}">
                View workflow
              </button>
              <a class="button button-ghost" href="${escapeHtml(tool.link)}" target="_blank" rel="noreferrer">
                Open tool
              </a>
            </div>
          </article>
        `
      )
      .join('');
  }

  function renderMembership() {
    elements.tierSummary.textContent = `${data.membershipTiers.length} tiers | ${data.courses.length} workshop and course lanes`;

    elements.tierGrid.innerHTML = data.membershipTiers
      .map((tier) => {
        const active = state.user.tier === tier.id;
        return `
          <article class="tier-card">
            <div class="tier-price">
              <span class="card-chip">${escapeHtml(tier.price)}</span>
              ${active ? '<span class="card-chip">Current tier</span>' : ''}
            </div>
            <h3>${escapeHtml(tier.name)}</h3>
            <p>${escapeHtml(tier.summary)}</p>
            <ul class="mini-list">
              <li>Best for: ${escapeHtml(tier.bestFor)}</li>
            </ul>
            ${listMarkup(tier.includes)}
            <div class="tier-actions">
              <button class="button button-secondary" data-action="set-tier" data-id="${escapeHtml(tier.id)}">
                ${escapeHtml(tier.cta)}
              </button>
            </div>
          </article>
        `;
      })
      .join('');

    elements.courseGrid.innerHTML = data.courses
      .map(
        (course) => `
          <article class="course-card">
            <div class="card-topline">
              <span class="mini-chip">${escapeHtml(course.audience)}</span>
            </div>
            <h3>${escapeHtml(course.title)}</h3>
            <p>${escapeHtml(course.summary)}</p>
            <ul class="mini-list">
              <li>Outcome: ${escapeHtml(course.outcome)}</li>
            </ul>
            <div class="course-actions">
              <button class="button button-secondary" data-action="open-course" data-id="${escapeHtml(course.id)}">
                View package
              </button>
            </div>
          </article>
        `
      )
      .join('');
  }

  function renderDashboard() {
    const localMetrics = [
      {
        label: 'Simulated leads',
        value: state.leads.length,
        note: 'Captured through the access form',
      },
      {
        label: 'Current tier',
        value: currentTierName(),
        note: 'Use tier cards to switch views',
      },
      {
        label: 'Bookmarks',
        value: state.bookmarks.length,
        note: 'Saved resources in demo state',
      },
      {
        label: 'Copied prompts',
        value: state.copiedCount,
        note: 'Clipboard actions recorded locally',
      },
    ];

    elements.dashboardMetrics.innerHTML = [...data.dashboard.metrics, ...localMetrics]
      .map(
        (metric) => `
          <article class="metric-card">
            <strong>${escapeHtml(metric.value)}</strong>
            <div class="metric-label">${escapeHtml(metric.label)}</div>
            <p>${escapeHtml(metric.note)}</p>
          </article>
        `
      )
      .join('');

    elements.dashboardFunnel.innerHTML = `
      <h3>Launch funnel targets</h3>
      <p>Forecasted path from broad lead magnet traffic into paid bundles and consulting.</p>
      ${data.dashboard.funnel
        .map(
          (step) => `
            <div class="funnel-row">
              <div class="section-meta">${escapeHtml(step.label)} | ${escapeHtml(step.value)} target</div>
              <div class="funnel-bar"><span style="width:${escapeHtml(step.percent)}%"></span></div>
            </div>
          `
        )
        .join('')}
    `;
  }

  function renderAutomation() {
    elements.automationGrid.innerHTML = data.automations
      .map(
        (item) => `
          <article class="automation-card">
            <div class="card-topline">
              <span class="mini-chip">${escapeHtml(item.owner)}</span>
              <span class="mini-chip">${escapeHtml(item.status)}</span>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.outcome)}</p>
            ${listMarkup(item.steps)}
            <div class="course-actions">
              <button class="button button-secondary" data-action="open-automation" data-id="${escapeHtml(item.id)}">
                Inspect flow
              </button>
            </div>
          </article>
        `
      )
      .join('');

    elements.assessmentGrid.innerHTML = data.assessments
      .map(
        (item) => `
          <article class="assessment-card">
            <div class="card-topline">
              <span class="mini-chip">${escapeHtml(item.audience)}</span>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.summary)}</p>
            <ul class="mini-list">
              <li>Output: ${escapeHtml(item.output)}</li>
            </ul>
            <div class="course-actions">
              <button class="button button-secondary" data-action="open-assessment" data-id="${escapeHtml(item.id)}">
                View scoring use
              </button>
            </div>
          </article>
        `
      )
      .join('');

    elements.revenueGrid.innerHTML = data.revenueLadders
      .map(
        (item) => `
          <article class="revenue-card">
            <div class="card-topline">
              <span class="mini-chip">${escapeHtml(item.title)}</span>
            </div>
            <p>${escapeHtml(item.summary)}</p>
            ${listMarkup(item.steps)}
            <div class="course-actions">
              <button class="button button-secondary" data-action="open-revenue" data-id="${escapeHtml(item.id)}">
                View ladder
              </button>
            </div>
          </article>
        `
      )
      .join('');
  }

  function renderTeam() {
    elements.teamGrid.innerHTML = data.team
      .map(
        (person) => `
          <article class="team-card">
            <div class="card-topline">
              <span class="mini-chip">${escapeHtml(person.role)}</span>
            </div>
            <h3>${escapeHtml(person.name)}</h3>
            <p>${escapeHtml(person.scope)}</p>
          </article>
        `
      )
      .join('');
  }

  function openDialog(html) {
    elements.dialogContent.innerHTML = html;
    elements.detailDialog.showModal();
  }

  function openResourceDetail(resourceId) {
    const resource = data.resources.find((item) => item.id === resourceId);
    if (!resource) return;
    const prompts = data.prompts.filter((prompt) => resource.featuredPromptIds.includes(prompt.id));
    const formulaMarkup =
      resource.id === 'prompting-made-simple'
        ? `
            <section class="detail-section">
              <h3>Five-part prompt formula</h3>
              ${listMarkup(data.promptFormula.map((item) => `${item.part}: ${item.summary}`))}
            </section>
          `
        : '';
    const lockNote = isResourceUnlocked(resource)
      ? '<span class="card-chip">Unlocked for current tier</span>'
      : '<span class="card-chip">Preview only for current tier</span>';

    openDialog(`
      <h2>${escapeHtml(resource.title)}</h2>
      <p>${escapeHtml(resource.description)}</p>
      <div class="card-topline">
        <span class="card-chip">${escapeHtml(resource.phase)}</span>
        <span class="card-chip">${escapeHtml(resource.type)}</span>
        <span class="card-chip">${escapeHtml(resource.priceLabel)}</span>
        ${lockNote}
      </div>
      <div class="detail-columns">
        <section class="detail-section">
          <h3>Outcomes</h3>
          ${listMarkup(resource.outcomes)}
        </section>
        <section class="detail-section">
          <h3>Modules</h3>
          ${listMarkup(resource.modules)}
        </section>
        <section class="detail-section">
          <h3>Featured prompts</h3>
          ${listMarkup(prompts.map((prompt) => prompt.title))}
        </section>
        <section class="detail-section">
          <h3>Launch route</h3>
          <p>${escapeHtml(resource.cta)}</p>
          <p>Audience: ${escapeHtml(resource.audience.join(', '))}</p>
          <p>Release: ${escapeHtml(resource.release)}</p>
        </section>
        ${formulaMarkup}
      </div>
    `);
  }

  function openPromptDetail(promptId) {
    const prompt = data.prompts.find((item) => item.id === promptId);
    if (!prompt) return;
    openDialog(`
      <h2>${escapeHtml(prompt.title)}</h2>
      <div class="card-topline">
        <span class="card-chip">${escapeHtml(prompt.domain)}</span>
        <span class="card-chip">${escapeHtml(prompt.guide)}</span>
      </div>
      <div class="detail-columns">
        <section class="detail-section">
          <h3>Ready-to-use prompt</h3>
          <p>${escapeHtml(prompt.text)}</p>
        </section>
        <section class="detail-section">
          <h3>Tags</h3>
          ${listMarkup(prompt.tags)}
        </section>
      </div>
    `);
  }

  function openToolDetail(toolId) {
    const tool = data.tools.find((item) => item.id === toolId);
    if (!tool) return;
    openDialog(`
      <h2>${escapeHtml(tool.name)}</h2>
      <div class="card-topline">
        <span class="card-chip">${escapeHtml(tool.category)}</span>
        <span class="card-chip">Rating ${escapeHtml(tool.rating)}/5</span>
      </div>
      <div class="detail-columns">
        <section class="detail-section">
          <h3>Why it belongs in the vault</h3>
          <p>${escapeHtml(tool.summary)}</p>
        </section>
        <section class="detail-section">
          <h3>Tutorial angle</h3>
          <p>${escapeHtml(tool.tutorial)}</p>
        </section>
        <section class="detail-section">
          <h3>Monetization angle</h3>
          <p>${escapeHtml(tool.monetization)}</p>
        </section>
        <section class="detail-section">
          <h3>Audience fit</h3>
          ${listMarkup(tool.audiences)}
        </section>
      </div>
    `);
  }

  function openCourseDetail(courseId) {
    const course = data.courses.find((item) => item.id === courseId);
    if (!course) return;
    openDialog(`
      <h2>${escapeHtml(course.title)}</h2>
      <div class="card-topline">
        <span class="card-chip">${escapeHtml(course.audience)}</span>
      </div>
      <div class="detail-columns">
        <section class="detail-section">
          <h3>Program summary</h3>
          <p>${escapeHtml(course.summary)}</p>
        </section>
        <section class="detail-section">
          <h3>Primary outcome</h3>
          <p>${escapeHtml(course.outcome)}</p>
        </section>
      </div>
    `);
  }

  function openAutomationDetail(id) {
    const item = data.automations.find((entry) => entry.id === id);
    if (!item) return;
    openDialog(`
      <h2>${escapeHtml(item.title)}</h2>
      <div class="card-topline">
        <span class="card-chip">${escapeHtml(item.owner)}</span>
        <span class="card-chip">${escapeHtml(item.status)}</span>
      </div>
      <div class="detail-columns">
        <section class="detail-section">
          <h3>Goal</h3>
          <p>${escapeHtml(item.outcome)}</p>
        </section>
        <section class="detail-section">
          <h3>Workflow steps</h3>
          ${listMarkup(item.steps)}
        </section>
      </div>
    `);
  }

  function openAssessmentDetail(id) {
    const item = data.assessments.find((entry) => entry.id === id);
    if (!item) return;
    openDialog(`
      <h2>${escapeHtml(item.title)}</h2>
      <div class="card-topline">
        <span class="card-chip">${escapeHtml(item.audience)}</span>
      </div>
      <div class="detail-columns">
        <section class="detail-section">
          <h3>Assessment purpose</h3>
          <p>${escapeHtml(item.summary)}</p>
        </section>
        <section class="detail-section">
          <h3>Output</h3>
          <p>${escapeHtml(item.output)}</p>
        </section>
      </div>
    `);
  }

  function openRevenueDetail(id) {
    const item = data.revenueLadders.find((entry) => entry.id === id);
    if (!item) return;
    openDialog(`
      <h2>${escapeHtml(item.title)}</h2>
      <div class="detail-columns">
        <section class="detail-section">
          <h3>Why it matters</h3>
          <p>${escapeHtml(item.summary)}</p>
        </section>
        <section class="detail-section">
          <h3>Revenue path</h3>
          ${listMarkup(item.steps)}
        </section>
      </div>
    `);
  }

  async function copyPrompt(promptId) {
    const prompt = data.prompts.find((item) => item.id === promptId);
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.text);
      state.copiedCount += 1;
      saveState();
      elements.leadFeedback.textContent = `Copied "${prompt.title}" to the clipboard.`;
      render();
    } catch (error) {
      elements.leadFeedback.textContent = 'Clipboard access was blocked in this browser session.';
    }
  }

  function handleLeadSubmit(event) {
    event.preventDefault();
    const name = elements.leadName.value.trim();
    const email = elements.leadEmail.value.trim();
    const segment = elements.leadSegment.value;
    const tier = elements.leadTier.value;

    if (!email) return;

    state.user = {
      name,
      email,
      segment,
      tier,
    };

    state.leads = [
      ...state.leads.filter((lead) => lead.email !== email),
      {
        name,
        email,
        segment,
        tier,
        savedAt: new Date().toISOString(),
      },
    ];

    saveState();
    elements.leadFeedback.textContent = `Saved ${email} as a ${segment} lead and routed them to the ${currentTierName()} tier path.`;
    render();
  }

  function render() {
    renderHeader();
    renderHeroStats();
    renderRoadmap();
    renderResources();
    renderPrompts();
    renderTools();
    renderMembership();
    renderDashboard();
    renderAutomation();
    renderTeam();
  }

  function addListeners() {
    [
      elements.resourceSearch,
      elements.resourceAudienceFilter,
      elements.resourcePhaseFilter,
      elements.resourceTierFilter,
      elements.promptSearch,
      elements.promptDomainFilter,
      elements.promptGuideFilter,
      elements.toolSearch,
      elements.toolCategoryFilter,
      elements.toolAudienceFilter,
    ].forEach((element) => {
      element.addEventListener('input', render);
      element.addEventListener('change', render);
    });

    elements.leadForm.addEventListener('submit', handleLeadSubmit);

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action], [data-scroll]');
      if (!button) return;

      const action = button.getAttribute('data-action');
      const id = button.getAttribute('data-id');
      const scrollTarget = button.getAttribute('data-scroll');

      if (scrollTarget) {
        const target = document.querySelector(scrollTarget);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (action === 'open-resource') openResourceDetail(id);
      if (action === 'bookmark-resource') toggleBookmark(id);
      if (action === 'progress-resource') cycleProgress(id);
      if (action === 'open-prompt') openPromptDetail(id);
      if (action === 'copy-prompt') copyPrompt(id);
      if (action === 'favorite-prompt') toggleFavoritePrompt(id);
      if (action === 'open-tool') openToolDetail(id);
      if (action === 'set-tier') setTier(id);
      if (action === 'open-course') openCourseDetail(id);
      if (action === 'open-automation') openAutomationDetail(id);
      if (action === 'open-assessment') openAssessmentDetail(id);
      if (action === 'open-revenue') openRevenueDetail(id);
    });
  }

  initFilters();
  addListeners();
  render();
})();
