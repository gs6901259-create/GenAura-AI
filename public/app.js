/**
 * @file GenAura AI - Frontend Application Controller
 */

import { Platform, Categories, FollowerTier, ShortlistStatus } from '/src/types/index.js';
import { calculateBriefMatch } from '/src/services/scoringEngine.js';
import { DiscoveryService } from '/src/services/discoveryService.js';
import { ShortlistService } from '/src/services/shortlistService.js';
import { persistence } from '/src/services/persistenceService.js';

// Initialize services
const discovery = new DiscoveryService();
const shortlist = new ShortlistService(persistence);

// Application State
const state = {
  creators: [],
  briefs: [],
  activeBrief: null,
  shortlist: null,
  filters: {
    query: '',
    platforms: [],
    categories: [],
    tiers: [],
    minEngagement: 0,
    maxBudget: 8000,
    verifiedOnly: false,
    minBrandSafety: 80,
    sortBy: 'matchScore_desc',
  },
  modalCreator: null,
};

// DOM Elements
const el = {
  activeBriefSelect: document.getElementById('activeBriefSelect'),
  viewBriefBtn: document.getElementById('viewBriefBtn'),
  shortlistToggleBtn: document.getElementById('shortlistToggleBtn'),
  shortlistBadgeCount: document.getElementById('shortlistBadgeCount'),
  resetDataBtn: document.getElementById('resetDataBtn'),
  clearFiltersBtn: document.getElementById('clearFiltersBtn'),
  searchInput: document.getElementById('searchInput'),
  platformFilterContainer: document.getElementById('platformFilterContainer'),
  categoryFilterContainer: document.getElementById('categoryFilterContainer'),
  tierFilterContainer: document.getElementById('tierFilterContainer'),
  engagementSlider: document.getElementById('engagementSlider'),
  engagementValueDisplay: document.getElementById('engagementValueDisplay'),
  budgetSlider: document.getElementById('budgetSlider'),
  budgetValueDisplay: document.getElementById('budgetValueDisplay'),
  verifiedOnlyCheckbox: document.getElementById('verifiedOnlyCheckbox'),
  safetySlider: document.getElementById('safetySlider'),
  safetyValueDisplay: document.getElementById('safetyValueDisplay'),
  resultsCountBadge: document.getElementById('resultsCountBadge'),
  sortBySelect: document.getElementById('sortBySelect'),
  activeFilterChips: document.getElementById('activeFilterChips'),
  briefContextBanner: document.getElementById('briefContextBanner'),
  briefContextTitle: document.getElementById('briefContextTitle'),
  briefContextDesc: document.getElementById('briefContextDesc'),
  creatorsGrid: document.getElementById('creatorsGrid'),
  emptyStateContainer: document.getElementById('emptyStateContainer'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateMessage: document.getElementById('emptyStateMessage'),
  emptyStateSuggestion: document.getElementById('emptyStateSuggestion'),
  emptyStateResetBtn: document.getElementById('emptyStateResetBtn'),
  // Modal
  matchModalOverlay: document.getElementById('matchModalOverlay'),
  modalCreatorName: document.getElementById('modalCreatorName'),
  modalBriefTitle: document.getElementById('modalBriefTitle'),
  modalScoreCircle: document.getElementById('modalScoreCircle'),
  modalScoreValue: document.getElementById('modalScoreValue'),
  modalMatchTier: document.getElementById('modalMatchTier'),
  modalFactorBreakdown: document.getElementById('modalFactorBreakdown'),
  modalExplanationsList: document.getElementById('modalExplanationsList'),
  modalShortlistActionBtn: document.getElementById('modalShortlistActionBtn'),
  modalCloseActionBtn: document.getElementById('modalCloseActionBtn'),
  closeMatchModalBtn: document.getElementById('closeMatchModalBtn'),
  // Drawer
  shortlistDrawer: document.getElementById('shortlistDrawer'),
  drawerOverlay: document.getElementById('drawerOverlay'),
  closeDrawerBtn: document.getElementById('closeDrawerBtn'),
  drawerItemsCount: document.getElementById('drawerItemsCount'),
  metricTotalReach: document.getElementById('metricTotalReach'),
  metricTotalCost: document.getElementById('metricTotalCost'),
  metricAvgEngagement: document.getElementById('metricAvgEngagement'),
  metricAvgMatch: document.getElementById('metricAvgMatch'),
  shortlistItemsContainer: document.getElementById('shortlistItemsContainer'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  clearShortlistBtn: document.getElementById('clearShortlistBtn'),
  // Brief Modal
  briefModalOverlay: document.getElementById('briefModalOverlay'),
  briefModalTitle: document.getElementById('briefModalTitle'),
  briefModalContent: document.getElementById('briefModalContent'),
  closeBriefModalBtn: document.getElementById('closeBriefModalBtn'),
  closeBriefModalActionBtn: document.getElementById('closeBriefModalActionBtn'),
};

// --- INITIALIZATION ---
async function initApp() {
  try {
    state.creators = persistence.getCreators();
    state.briefs = persistence.getBriefs();
    state.activeBrief = state.briefs[0] || null;
    state.shortlist = shortlist.getShortlist();

    renderFilterOptions();
    renderBriefSelect();
    setupEventListeners();
    applyFiltersAndRender();
    updateShortlistUI();
  } catch (err) {
    console.error('Initialization error:', err);
  }
}

// --- RENDER FILTER CONTROLS ---
function renderFilterOptions() {
  // Platforms
  const platforms = Object.values(Platform);
  el.platformFilterContainer.innerHTML = platforms
    .map(
      (p) => `
      <label class="pill-check">
        <input type="checkbox" name="platform" value="${p}">
        <span>${p}</span>
      </label>`
    )
    .join('');

  // Categories
  el.categoryFilterContainer.innerHTML = Categories.map(
    (c) => `
    <label class="pill-check">
      <input type="checkbox" name="category" value="${c}">
      <span>${c}</span>
    </label>`
  ).join('');

  // Tiers
  const tiers = Object.values(FollowerTier);
  el.tierFilterContainer.innerHTML = tiers
    .map(
      (t) => `
      <label class="tier-check-item">
        <input type="checkbox" name="tier" value="${t}">
        <span>${t}</span>
      </label>`
    )
    .join('');
}

function renderBriefSelect() {
  el.activeBriefSelect.innerHTML = state.briefs
    .map((b) => `<option value="${b.id}">${b.title}</option>`)
    .join('');

  if (state.activeBrief) {
    el.activeBriefSelect.value = state.activeBrief.id;
    updateBriefContextBanner();
  }
}

function updateBriefContextBanner() {
  if (!state.activeBrief) {
    el.briefContextBanner.style.display = 'none';
    return;
  }
  el.briefContextBanner.style.display = 'flex';
  el.briefContextTitle.textContent = state.activeBrief.title;
  el.briefContextDesc.textContent = `${state.activeBrief.description} | Target: ${state.activeBrief.requiredCategories.join(', ')} | Max Rate: $${state.activeBrief.maxCreatorBudget} | Min Eng: ${state.activeBrief.minEngagementRate}%`;
}

// --- FILTER & RENDER ENGINE ---
function applyFiltersAndRender() {
  const criteria = {
    query: state.filters.query,
    platforms: state.filters.platforms,
    categories: state.filters.categories,
    tiers: state.filters.tiers,
    minEngagement: state.filters.minEngagement > 0 ? state.filters.minEngagement : null,
    maxBudget: state.filters.maxBudget < 8000 ? state.filters.maxBudget : null,
    verifiedOnly: state.filters.verifiedOnly,
    minBrandSafety: state.filters.minBrandSafety > 80 ? state.filters.minBrandSafety : null,
    sortBy: state.filters.sortBy,
  };

  const { results, total, activeFiltersCount, emptyState } = discovery.filterAndSort(
    state.creators,
    criteria,
    state.activeBrief
  );

  renderActiveChips(activeFiltersCount);
  renderResultsCounter(results.length, state.creators.length);

  if (results.length === 0 && emptyState) {
    el.creatorsGrid.style.display = 'none';
    el.emptyStateContainer.style.display = 'flex';
    el.emptyStateTitle.textContent = emptyState.title;
    el.emptyStateMessage.textContent = emptyState.message;
    el.emptyStateSuggestion.textContent = emptyState.suggestion;
    el.emptyStateResetBtn.style.display = emptyState.canReset ? 'inline-flex' : 'none';
  } else {
    el.emptyStateContainer.style.display = 'none';
    el.creatorsGrid.style.display = 'grid';
    renderCreatorCards(results);
  }
}

function renderResultsCounter(visibleCount, totalCount) {
  el.resultsCountBadge.textContent = `Showing ${visibleCount} of ${totalCount} creators`;
}

function renderActiveChips() {
  const chips = [];

  if (state.filters.query) {
    chips.push({ label: `"${state.filters.query}"`, clear: () => { state.filters.query = ''; el.searchInput.value = ''; } });
  }

  state.filters.platforms.forEach((p) => {
    chips.push({
      label: p,
      clear: () => {
        state.filters.platforms = state.filters.platforms.filter((x) => x !== p);
        const input = el.platformFilterContainer.querySelector(`input[value="${p}"]`);
        if (input) input.checked = false;
      },
    });
  });

  state.filters.categories.forEach((c) => {
    chips.push({
      label: c,
      clear: () => {
        state.filters.categories = state.filters.categories.filter((x) => x !== c);
        const input = el.categoryFilterContainer.querySelector(`input[value="${c}"]`);
        if (input) input.checked = false;
      },
    });
  });

  state.filters.tiers.forEach((t) => {
    chips.push({
      label: t,
      clear: () => {
        state.filters.tiers = state.filters.tiers.filter((x) => x !== t);
        const input = el.tierFilterContainer.querySelector(`input[value="${t}"]`);
        if (input) input.checked = false;
      },
    });
  });

  if (state.filters.minEngagement > 0) {
    chips.push({
      label: `Eng >= ${state.filters.minEngagement}%`,
      clear: () => {
        state.filters.minEngagement = 0;
        el.engagementSlider.value = 0;
        el.engagementValueDisplay.textContent = '0%';
      },
    });
  }

  if (state.filters.maxBudget < 8000) {
    chips.push({
      label: `Rate <= $${state.filters.maxBudget.toLocaleString()}`,
      clear: () => {
        state.filters.maxBudget = 8000;
        el.budgetSlider.value = 8000;
        el.budgetValueDisplay.textContent = 'Any';
      },
    });
  }

  if (state.filters.verifiedOnly) {
    chips.push({
      label: 'Verified Only',
      clear: () => {
        state.filters.verifiedOnly = false;
        el.verifiedOnlyCheckbox.checked = false;
      },
    });
  }

  if (state.filters.minBrandSafety > 80) {
    chips.push({
      label: `Safety >= ${state.filters.minBrandSafety}`,
      clear: () => {
        state.filters.minBrandSafety = 80;
        el.safetySlider.value = 80;
        el.safetyValueDisplay.textContent = 'Any';
      },
    });
  }

  el.activeFilterChips.innerHTML = chips
    .map(
      (chip, idx) => `
      <div class="filter-chip">
        <span>${chip.label}</span>
        <span class="filter-chip-remove" data-chip-idx="${idx}">&times;</span>
      </div>`
    )
    .join('');

  // Attach clear handlers
  el.activeFilterChips.querySelectorAll('.filter-chip-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.chipIdx, 10);
      if (chips[idx]) {
        chips[idx].clear();
        applyFiltersAndRender();
      }
    });
  });
}

function renderCreatorCards(creators) {
  const briefTags = ((state.activeBrief && state.activeBrief.requiredTags) || []).map((t) =>
    t.toLowerCase()
  );

  el.creatorsGrid.innerHTML = creators
    .map((c) => {
      const isShortlisted = shortlist.isShortlisted('shortlist-default', c.id);
      const matchScore = c.matchScore ?? 0;
      let tierClass = 'tier-low';
      let tierLabel = 'Low Fit';

      if (matchScore >= 88) {
        tierClass = 'tier-exceptional';
        tierLabel = 'Exceptional';
      } else if (matchScore >= 72) {
        tierClass = 'tier-strong';
        tierLabel = 'Strong Fit';
      } else if (matchScore >= 52) {
        tierClass = 'tier-moderate';
        tierLabel = 'Moderate';
      }

      const platformIcons = {
        YouTube: '▶️',
        Instagram: '📸',
        TikTok: '🎵',
        LinkedIn: '💼',
        X: '𝕏',
      };
      const pIcon = platformIcons[c.primaryPlatform] || '🌐';

      return `
      <div class="creator-card" data-creator-id="${c.id}">
        <div class="card-top">
          <div class="creator-avatar-wrap">
            <img src="${c.avatar}" alt="${c.name}" class="creator-avatar" loading="lazy">
            <span class="platform-badge-mini" title="${c.primaryPlatform}">${pIcon}</span>
          </div>
          <div class="creator-meta">
            <h4 class="creator-name">
              ${c.name}
              ${c.verified ? '<span class="verified-icon" title="Verified Creator">✓</span>' : ''}
            </h4>
            <span class="creator-handle">${c.handle}</span>
          </div>
          ${
            state.activeBrief
              ? `
            <div class="match-score-badge ${tierClass}" data-action="explain" data-creator-id="${c.id}" title="Click to view explainable score breakdown">
              <span class="score-badge-val">${matchScore}%</span>
              <span class="score-badge-lbl">${tierLabel}</span>
            </div>`
              : ''
          }
        </div>

        <p class="creator-bio">${c.bio}</p>

        <div class="creator-tags">
          <span class="tag-pill" style="color: var(--accent-cyan); font-weight: 600;">${c.category}</span>
          ${(c.tags || [])
            .slice(0, 4)
            .map((tag) => {
              const isMatch = briefTags.includes(tag.toLowerCase());
              return `<span class="tag-pill ${isMatch ? 'matching-tag' : ''}">#${tag}</span>`;
            })
            .join('')}
        </div>

        <div class="creator-stats-row">
          <div class="stat-item">
            <span class="stat-val">${formatNumber(c.followers)}</span>
            <span class="stat-lbl">Reach</span>
          </div>
          <div class="stat-item">
            <span class="stat-val" style="color: var(--accent-green);">${c.engagementRate}%</span>
            <span class="stat-lbl">Eng. Rate</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">$${(c.rateCard && (c.rateCard.postRate || c.rateCard.videoRate)) || 0}</span>
            <span class="stat-lbl">Est. Rate</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-shortlist ${isShortlisted ? 'is-shortlisted' : ''}" data-action="shortlist" data-creator-id="${c.id}">
            <span>${isShortlisted ? '✓ Shortlisted' : '+ Shortlist'}</span>
          </button>
          ${
            state.activeBrief
              ? `
            <button class="btn-explain" data-action="explain" data-creator-id="${c.id}">
              Why this match?
            </button>`
              : ''
          }
        </div>
      </div>`;
    })
    .join('');

  // Card Event Listeners
  el.creatorsGrid.querySelectorAll('[data-action="shortlist"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const creatorId = btn.dataset.creatorId;
      const creator = state.creators.find((c) => c.id === creatorId);
      if (creator) {
        shortlist.toggleShortlist('shortlist-default', creator);
        updateShortlistUI();
        applyFiltersAndRender();
      }
    });
  });

  el.creatorsGrid.querySelectorAll('[data-action="explain"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const creatorId = btn.dataset.creatorId;
      const creator = state.creators.find((c) => c.id === creatorId);
      if (creator) {
        openExplainModal(creator);
      }
    });
  });
}

// --- EXPLAINABILITY MODAL ---
function openExplainModal(creator) {
  if (!state.activeBrief) return;
  state.modalCreator = creator;

  const match = calculateBriefMatch(creator, state.activeBrief);

  el.modalCreatorName.textContent = `${creator.name} (${creator.handle})`;
  el.modalBriefTitle.textContent = `Campaign: ${state.activeBrief.title}`;
  el.modalScoreValue.textContent = `${match.overallScore}%`;
  el.modalMatchTier.textContent = match.matchTier;

  // Set conic gradient
  el.modalScoreCircle.style.background = `conic-gradient(var(--accent-green) 0% ${match.overallScore}%, var(--bg-surface) ${match.overallScore}% 100%)`;

  // Render Factor Breakdown
  const factorLabels = {
    nicheRelevance: 'Niche & Category Fit (25%)',
    platformFit: 'Platform & Format Alignment (15%)',
    audienceDemographicFit: 'Audience Demographics (20%)',
    performanceFit: 'Engagement & Reach Tier (20%)',
    budgetFit: 'Budget & Pricing Fit (10%)',
    brandSafetyFit: 'Brand Safety & Quality (10%)',
  };

  el.modalFactorBreakdown.innerHTML = Object.entries(match.breakdown)
    .map(([key, val]) => `
      <div class="factor-bar-item">
        <div class="factor-bar-header">
          <span class="factor-bar-name">${factorLabels[key] || key}</span>
          <span class="factor-bar-score">${val}/100</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${val}%;"></div>
        </div>
      </div>
    `)
    .join('');

  // Render Explanations
  const iconMap = { positive: '✅', warning: '⚠️', neutral: 'ℹ️' };
  el.modalExplanationsList.innerHTML = match.explanations
    .map(
      (exp) => `
      <div class="explanation-item ${exp.type}">
        <span class="exp-icon">${iconMap[exp.type]}</span>
        <div class="exp-content">
          <strong class="exp-factor">${exp.factor}</strong>
          <p class="exp-detail">${exp.detail}</p>
        </div>
      </div>
    `
    )
    .join('');

  // Shortlist action button in modal
  const isShortlisted = shortlist.isShortlisted('shortlist-default', creator.id);
  el.modalShortlistActionBtn.textContent = isShortlisted
    ? 'Remove from Shortlist'
    : 'Add to Campaign Shortlist';
  el.modalShortlistActionBtn.className = isShortlisted ? 'btn btn-outline' : 'btn btn-primary';

  el.matchModalOverlay.style.display = 'flex';
}

function closeExplainModal() {
  el.matchModalOverlay.style.display = 'none';
  state.modalCreator = null;
}

// --- SHORTLIST DRAWER & METRICS ---
function updateShortlistUI() {
  const metrics = shortlist.getAggregateMetrics('shortlist-default');
  const currentList = shortlist.getShortlist('shortlist-default');
  const items = (currentList && currentList.items) || [];

  el.shortlistBadgeCount.textContent = metrics.totalCreators;
  el.drawerItemsCount.textContent = `${metrics.totalCreators} Creators`;

  el.metricTotalReach.textContent = formatNumber(metrics.totalReach);
  el.metricTotalCost.textContent = `$${metrics.estimatedTotalCost.toLocaleString()}`;
  el.metricAvgEngagement.textContent = `${metrics.averageEngagement}%`;
  el.metricAvgMatch.textContent = metrics.averageMatchScore > 0 ? `${metrics.averageMatchScore}%` : 'N/A';

  if (items.length === 0) {
    el.shortlistItemsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--text-dim);">
        <p style="font-size: 28px; margin-bottom: 8px;">📋</p>
        <strong>Your shortlist is empty</strong>
        <p style="font-size: 12px; margin-top: 4px;">Explore creators from the directory and click "+ Shortlist" to curate your campaign lineup.</p>
      </div>`;
    return;
  }

  const statuses = Object.values(ShortlistStatus);

  el.shortlistItemsContainer.innerHTML = items
    .map((item) => {
      const c = item.creator;
      return `
      <div class="shortlist-item-card" data-creator-id="${c.id}">
        <div class="item-top">
          <div class="item-creator-info">
            <img src="${c.avatar}" alt="${c.name}" class="item-avatar">
            <div>
              <div class="item-name">${c.name}</div>
              <div class="item-handle">${c.handle}</div>
            </div>
          </div>
          <button class="item-remove-btn" data-action="remove-item" data-creator-id="${c.id}" title="Remove creator">&times;</button>
        </div>

        <div class="item-meta-row">
          <span>${c.primaryPlatform} • ${formatNumber(c.followers)} reach</span>
          <span style="color: var(--accent-cyan); font-weight: 600;">$${(c.rateCard && (c.rateCard.postRate || c.rateCard.videoRate)) || 0}</span>
        </div>

        <div class="item-meta-row">
          <label style="font-size: 10px; color: var(--text-dim); text-transform: uppercase;">Status:</label>
          <select class="status-select" data-creator-id="${c.id}">
            ${statuses
              .map((s) => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`)
              .join('')}
          </select>
        </div>

        <input type="text" class="item-notes-input" placeholder="Add outreach notes or requirements..." value="${item.notes || ''}" data-creator-id="${c.id}">
      </div>`;
    })
    .join('');

  // Shortlist Item Event Listeners
  el.shortlistItemsContainer.querySelectorAll('[data-action="remove-item"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      shortlist.removeFromShortlist('shortlist-default', btn.dataset.creatorId);
      updateShortlistUI();
      applyFiltersAndRender();
    });
  });

  el.shortlistItemsContainer.querySelectorAll('.status-select').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      shortlist.updateItemStatus('shortlist-default', sel.dataset.creatorId, e.target.value);
    });
  });

  el.shortlistItemsContainer.querySelectorAll('.item-notes-input').forEach((input) => {
    input.addEventListener('change', (e) => {
      shortlist.updateItemNotes('shortlist-default', input.dataset.creatorId, e.target.value);
    });
  });
}

function openShortlistDrawer() {
  el.shortlistDrawer.classList.add('open');
  el.drawerOverlay.style.display = 'block';
}

function closeShortlistDrawer() {
  el.shortlistDrawer.classList.remove('open');
  el.drawerOverlay.style.display = 'none';
}

// --- BRIEF DETAILS MODAL ---
function openBriefModal() {
  if (!state.activeBrief) return;
  const b = state.activeBrief;
  el.briefModalTitle.textContent = b.title;
  el.briefModalContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <p style="font-size: 13px; color: var(--text-muted);">${b.description}</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; background: var(--bg-secondary); padding: 14px; border-radius: var(--radius-sm);">
        <div><strong>Objective:</strong> ${b.objective.toUpperCase()}</div>
        <div><strong>Max Budget / Creator:</strong> $${b.maxCreatorBudget.toLocaleString()}</div>
        <div><strong>Required Categories:</strong> ${b.requiredCategories.join(', ')}</div>
        <div><strong>Required Platforms:</strong> ${b.requiredPlatforms.join(', ')}</div>
        <div><strong>Min Engagement:</strong> ${b.minEngagementRate}%</div>
        <div><strong>Min Brand Safety:</strong> ${b.minBrandSafetyScore}/100</div>
        <div><strong>Target Age:</strong> ${b.targetAgeBrackets.join(', ')}</div>
        <div><strong>Target Geos:</strong> ${b.targetCountries.join(', ')}</div>
      </div>
      <div>
        <strong style="font-size: 11px; text-transform: uppercase; color: var(--text-dim);">Campaign Keywords:</strong>
        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px;">
          ${b.requiredTags.map((t) => `<span class="tag-pill matching-tag">#${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
  el.briefModalOverlay.style.display = 'flex';
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Search with debounced input
  let searchTimeout = null;
  el.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.query = e.target.value;
      applyFiltersAndRender();
    }, 150);
  });

  // Brief Selector
  el.activeBriefSelect.addEventListener('change', (e) => {
    const briefId = e.target.value;
    state.activeBrief = state.briefs.find((b) => b.id === briefId) || null;
    updateBriefContextBanner();
    applyFiltersAndRender();
  });

  el.viewBriefBtn.addEventListener('click', openBriefModal);
  el.closeBriefModalBtn.addEventListener('click', () => (el.briefModalOverlay.style.display = 'none'));
  el.closeBriefModalActionBtn.addEventListener('click', () => (el.briefModalOverlay.style.display = 'none'));

  // Platforms
  el.platformFilterContainer.addEventListener('change', () => {
    const checked = Array.from(
      el.platformFilterContainer.querySelectorAll('input:checked')
    ).map((i) => i.value);
    state.filters.platforms = checked;
    applyFiltersAndRender();
  });

  // Categories
  el.categoryFilterContainer.addEventListener('change', () => {
    const checked = Array.from(
      el.categoryFilterContainer.querySelectorAll('input:checked')
    ).map((i) => i.value);
    state.filters.categories = checked;
    applyFiltersAndRender();
  });

  // Tiers
  el.tierFilterContainer.addEventListener('change', () => {
    const checked = Array.from(
      el.tierFilterContainer.querySelectorAll('input:checked')
    ).map((i) => i.value);
    state.filters.tiers = checked;
    applyFiltersAndRender();
  });

  // Engagement Slider
  el.engagementSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.filters.minEngagement = val;
    el.engagementValueDisplay.textContent = val > 0 ? `${val}%` : '0%';
    applyFiltersAndRender();
  });

  // Budget Slider
  el.budgetSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.filters.maxBudget = val;
    el.budgetValueDisplay.textContent = val < 8000 ? `$${val.toLocaleString()}` : 'Any';
    applyFiltersAndRender();
  });

  // Verified Only
  el.verifiedOnlyCheckbox.addEventListener('change', (e) => {
    state.filters.verifiedOnly = e.target.checked;
    applyFiltersAndRender();
  });

  // Safety Slider
  el.safetySlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.filters.minBrandSafety = val;
    el.safetyValueDisplay.textContent = val > 80 ? `${val}+` : 'Any';
    applyFiltersAndRender();
  });

  // Sorting
  el.sortBySelect.addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    applyFiltersAndRender();
  });

  // Clear filters
  el.clearFiltersBtn.addEventListener('click', resetAllFilters);
  el.emptyStateResetBtn.addEventListener('click', resetAllFilters);

  // Shortlist Drawer Toggle
  el.shortlistToggleBtn.addEventListener('click', openShortlistDrawer);
  el.closeDrawerBtn.addEventListener('click', closeShortlistDrawer);
  el.drawerOverlay.addEventListener('click', closeShortlistDrawer);

  // Export CSV
  el.exportCsvBtn.addEventListener('click', () => {
    const csvContent = shortlist.exportCsv('shortlist-default');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `genaura-shortlist-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Clear Shortlist
  el.clearShortlistBtn.addEventListener('click', () => {
    if (confirm('Clear all creators from this shortlist?')) {
      shortlist.clearShortlist('shortlist-default');
      updateShortlistUI();
      applyFiltersAndRender();
    }
  });

  // Modal Actions
  el.closeMatchModalBtn.addEventListener('click', closeExplainModal);
  el.modalCloseActionBtn.addEventListener('click', closeExplainModal);
  el.modalShortlistActionBtn.addEventListener('click', () => {
    if (state.modalCreator) {
      shortlist.toggleShortlist('shortlist-default', state.modalCreator);
      updateShortlistUI();
      applyFiltersAndRender();
      openExplainModal(state.modalCreator); // Refresh modal button
    }
  });

  // Reset Sample Data
  el.resetDataBtn.addEventListener('click', () => {
    if (confirm('Reset creators and briefs database to initial seed data?')) {
      persistence.resetToDefaults();
      initApp();
    }
  });
}

function resetAllFilters() {
  state.filters.query = '';
  state.filters.platforms = [];
  state.filters.categories = [];
  state.filters.tiers = [];
  state.filters.minEngagement = 0;
  state.filters.maxBudget = 8000;
  state.filters.verifiedOnly = false;
  state.filters.minBrandSafety = 80;
  state.filters.sortBy = state.activeBrief ? 'matchScore_desc' : 'followers_desc';

  el.searchInput.value = '';
  el.platformFilterContainer.querySelectorAll('input').forEach((i) => (i.checked = false));
  el.categoryFilterContainer.querySelectorAll('input').forEach((i) => (i.checked = false));
  el.tierFilterContainer.querySelectorAll('input').forEach((i) => (i.checked = false));
  el.engagementSlider.value = 0;
  el.engagementValueDisplay.textContent = '0%';
  el.budgetSlider.value = 8000;
  el.budgetValueDisplay.textContent = 'Any';
  el.verifiedOnlyCheckbox.checked = false;
  el.safetySlider.value = 80;
  el.safetyValueDisplay.textContent = 'Any';
  el.sortBySelect.value = state.filters.sortBy;

  applyFiltersAndRender();
}

function formatNumber(num) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
  return num ? num.toString() : '0';
}

// Start Application
window.addEventListener('DOMContentLoaded', initApp);
