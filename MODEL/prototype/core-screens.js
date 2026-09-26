/* Polished, searchable list screens for the Mandate workspace prototype. */
(() => {
  const stageLabel = (deal) => ['Preparing', 'In review', 'With lender'][Math.min(deal.stage, 2)];
  const stageClass = (deal) => ['preparing', 'review', 'waiting'][Math.min(deal.stage, 2)];
  const stepLabel = (deal) => ['Confirm deal information', 'Review deal pack', 'Follow up with lender'][Math.min(deal.stage, 2)];

  function statusPill(deal) {
    return `<span class="table-status status-${stageClass(deal)}"><span aria-hidden="true">●</span> ${stageLabel(deal)}</span>`;
  }

  function listToolbar({ placeholder, filters, type }) {
    return `<div class="list-toolbar">
      <label class="list-search"><span aria-hidden="true">⌕</span><span class="sr-only">Search ${type}</span><input type="search" data-list-search="${type}" placeholder="${placeholder}" autocomplete="off"><kbd>⌘ K</kbd></label>
      <div class="list-filters" role="group" aria-label="Filter ${type}">${filters.map((filter, i) => `<button class="filter-chip${i === 0 ? ' active' : ''}" type="button" data-filter="${filter.key}" aria-pressed="${i === 0}">${filter.label}</button>`).join('')}</div>
      <span class="list-result" aria-live="polite" data-list-result></span>
    </div>`;
  }

  function setEmptyState(container, empty, count, label) {
    const visibleCount = container.querySelectorAll('[data-filter-row]:not([hidden])').length;
    if (empty) empty.hidden = visibleCount !== 0;
    if (count) count.textContent = `${visibleCount} ${label}${visibleCount === 1 ? '' : 's'}`;
    return visibleCount;
  }

  function bindSearch({ type, rows, empty, result, searchable, categorise, label }) {
    const input = appContent.querySelector(`[data-list-search="${type}"]`);
    const chips = [...appContent.querySelectorAll('.list-filters [data-filter]')];
    let filter = 'all';
    const update = () => {
      const query = input.value.trim().toLocaleLowerCase();
      rows.forEach((row) => {
        const matchesQuery = searchable(row).toLocaleLowerCase().includes(query);
        const matchesFilter = filter === 'all' || categorise(row).includes(filter);
        row.hidden = !(matchesQuery && matchesFilter);
      });
      setEmptyState(appContent, empty, result, label);
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && input.value) {
        input.value = '';
        update();
      }
    });
    input.addEventListener('input', update);
    chips.forEach((chip) => chip.addEventListener('click', () => {
      filter = chip.dataset.filter;
      chips.forEach((item) => {
        const active = item === chip;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      update();
    }));
    empty?.querySelector('[data-clear-list]')?.addEventListener('click', () => {
      input.value = '';
      filter = 'all';
      chips.forEach((chip, i) => {
        chip.classList.toggle('active', i === 0);
        chip.setAttribute('aria-pressed', String(i === 0));
      });
      update();
      input.focus();
    });
    update();
  }

  window.renderDeals = function renderDeals() {
    crumbTitle.textContent = 'Deals';
    const entries = Object.entries(deals);
    const statusCounts = ['all', 0, 1, 2].map((stage) => stage === 'all' ? entries.length : entries.filter(([, deal]) => deal.stage === stage).length);
    const filters = [
      { key: 'all', label: `All deals <b>${statusCounts[0]}</b>` },
      { key: 'preparing', label: `Preparing <b>${statusCounts[1]}</b>` },
      { key: 'review', label: `In review <b>${statusCounts[2]}</b>` },
      { key: 'waiting', label: `With lender <b>${statusCounts[3]}</b>` },
    ];
    appContent.innerHTML = `<div class="page-title"><div><div class="eyebrow">YOUR WORKSPACE</div><h1>Deals</h1><p>Keep the important details and next steps together.</p></div><button class="button button-dark" id="newDeal"><span>＋</span> New deal</button></div>
      ${listToolbar({ type: 'deals', placeholder: 'Search company, purpose or location', filters, })}
      <section class="panel table-overflow list-panel" aria-label="Deals list"><table class="full-table"><thead><tr><th scope="col">COMPANY</th><th scope="col">FINANCE SOUGHT</th><th scope="col">PURPOSE</th><th scope="col">STATUS</th><th scope="col">NEXT STEP</th><th scope="col"><span class="sr-only">Open deal</span></th></tr></thead><tbody>${entries.map(([id, deal]) => `<tr data-filter-row data-deal="${id}" role="button" tabindex="0" aria-label="Open ${deal.name}"><td><span class="table-company"><i class="company-icon">${deal.initial}</i><span><b>${deal.name}</b><small>${deal.location} · ${deal.industry}</small></span></span></td><td><b>${deal.amount}</b></td><td>${deal.purpose}</td><td>${statusPill(deal)}</td><td>${stepLabel(deal)}</td><td class="row-arrow" aria-hidden="true">↗</td></tr>`).join('')}</tbody></table>
      <div class="empty-state" data-empty-state hidden><span class="empty-state-icon">⌕</span><h2>No deals match that search</h2><p>Try another company name, location, purpose, or status.</p><button class="button button-outline" type="button" data-clear-list>Clear search and filters</button></div></section>
      <div class="app-disclaimer">Fictional demo data only · No real borrower or lender information.</div>`;
    bindPage();
    const rows = [...appContent.querySelectorAll('[data-filter-row]')];
    bindSearch({ type: 'deals', rows, empty: appContent.querySelector('[data-empty-state]'), result: appContent.querySelector('[data-list-result]'), label: 'deal', searchable: (row) => row.textContent, categorise: (row) => [stageClass(deals[row.dataset.deal])] });
    rows.forEach((row) => row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDeal(row.dataset.deal); }
    }));
    document.getElementById('newDeal')?.addEventListener('click', () => notify('Creating a new deal is outside this demo flow.'));
  };

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      const input = appContent.querySelector(`[data-list-search="${currentPage}"]`);
      if (input) { event.preventDefault(); input.focus(); }
    }
  });

  window.renderLenders = function renderLenders() {
    crumbTitle.textContent = 'Lender criteria';
    const deal = deals[selectedDeal];
    const filters = [
      { key: 'all', label: 'All criteria' },
      { key: 'secured', label: 'Secured lending' },
      { key: 'asset', label: 'Asset finance' },
      { key: 'working', label: 'Working capital' },
    ];
    appContent.innerHTML = `<div class="page-title"><div><div class="eyebrow">ILLUSTRATIVE DIRECTORY</div><h1>Lender criteria</h1><p>Compare fictional lender preferences with the selected sample deal.</p></div><button class="button button-outline" data-page="deals">Change deal <span>↗</span></button></div>
      ${listToolbar({ type: 'lenders', placeholder: 'Search lender or criteria', filters })}
      <div class="lender-grid">${deal.matches.map((match) => `<article class="lender-card list-filter-row" data-filter-row><div class="lender-title"><span class="lender-logo">${match[1]}</span><b>${match[0]}</b><span class="fit-label">${match[2]}</span></div><p>Example private credit provider profile. Review the full deal and confirm current lending criteria with the lender directly.</p><div class="lender-criteria">${match.slice(3).map((item) => `<span>${item}</span>`).join('')}</div><button class="view-lender" type="button" data-lender="${match[0]}">View criteria comparison <span>↗</span></button></article>`).join('')}</div>
      <div class="empty-state" data-empty-state hidden><span class="empty-state-icon">⌕</span><h2>No criteria match those filters</h2><p>Try a different phrase or view all lender criteria.</p><button class="button button-outline" type="button" data-clear-list>Show all criteria</button></div>
      <div class="lender-note"><b>How this comparison works</b><p>Example criteria overlapping with details for ${deal.name}. This does not rank creditworthiness, predict approval, provide an offer, or contact lenders. Verify current requirements directly with each lender.</p></div>`;
    bindPage();
    const rows = [...appContent.querySelectorAll('[data-filter-row]')];
    const categoryFor = (row) => {
      const text = row.textContent.toLocaleLowerCase();
      return [
        ...( /property security|senior secured|secured/.test(text) ? ['secured'] : [] ),
        ...( /asset backed|equipment|inventory security/.test(text) ? ['asset'] : [] ),
        ...( /working capital|inventory/.test(text) ? ['working'] : [] ),
      ];
    };
    bindSearch({ type: 'lenders', rows, empty: appContent.querySelector('[data-empty-state]'), result: appContent.querySelector('[data-list-result]'), label: 'lender', searchable: (row) => row.textContent, categorise: categoryFor });
  };

  window.renderActivity = function renderActivity() {
    crumbTitle.textContent = 'Activity';
    const history = activityItems.concat([
      { title: 'Deal created', detail: 'Northstar Civil Ltd · sample workspace', when: 'Sep 20', icon: 'N', tone: 'green' },
      { title: 'Lender criteria reviewed', detail: 'Kauri Capital · sample workspace', when: 'Sep 20', icon: 'K', tone: 'blue' },
    ]);
    const filters = [
      { key: 'all', label: 'All activity' },
      { key: 'deal', label: 'Deal updates' },
      { key: 'lender', label: 'Lender updates' },
      { key: 'documents', label: 'Documents' },
    ];
    appContent.innerHTML = `<div class="page-title"><div><div class="eyebrow">WORKSPACE HISTORY</div><h1>Activity</h1><p>Recent updates across your sample deals.</p></div></div>
      ${listToolbar({ type: 'activity', placeholder: 'Search updates or deal names', filters })}
      <section class="activity-feed list-panel" aria-label="Workspace activity">${history.map((item) => `<div class="activity-item list-filter-row" data-filter-row><span class="activity-avatar activity-avatar-${item.tone}">${item.icon}</span><div><b>${item.title}</b><p>${item.detail}</p></div><time>${item.when}</time></div>`).join('')}
      <div class="empty-state" data-empty-state hidden><span class="empty-state-icon">◷</span><h2>No activity found</h2><p>Try another search or clear the current filters.</p><button class="button button-outline" type="button" data-clear-list>Clear search and filters</button></div></section>
      <div class="app-disclaimer">Activity is held only in this browser session and uses fictional sample details.</div>`;
    bindPage();
    const rows = [...appContent.querySelectorAll('[data-filter-row]')];
    const categoryFor = (row) => {
      const text = row.textContent.toLocaleLowerCase();
      if (/document|deal pack|summary/.test(text)) return ['documents', 'deal'];
      if (/lender|criteria|provider/.test(text)) return ['lender'];
      return ['deal'];
    };
    bindSearch({ type: 'activity', rows, empty: appContent.querySelector('[data-empty-state]'), result: appContent.querySelector('[data-list-result]'), label: 'update', searchable: (row) => row.textContent, categorise: categoryFor });
  };
})();
