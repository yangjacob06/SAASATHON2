/* Live summaries are drafted from reviewed facts; calculations stay in Mandate. */
(function (global) {
  'use strict';
  const P = global.MandatePitch, R = global.MandateReview, e = P.escape;
  const states = new Map();
  let demoCode = '';
  const current = () => global.MandateCreatedDeals?.[global.MandateActiveDealId] || global.MandateWorkingDeals?.[global.MandateActiveDealId];
  const state = deal => {
    if (!states.has(deal)) states.set(deal, { busy: false, error: '' });
    return states.get(deal);
  };
  const fresh = deal => deal.pitchSummary?.basedOn === R.signature(deal);
  const ready = deal => !state(deal).busy && fresh(deal) && (!!deal.sampleSubmission || deal.pitchSummaryChoice === R.signature(deal));
  const provenance = deal => {
    if (!fresh(deal) || !deal.pitchAi || deal.pitchAi.basedOn !== R.signature(deal)) return 'Local template with adviser review. No AI-generated draft used.';
    return `Drafted with OpenAI (${deal.pitchAi.model}) from adviser-confirmed figures${deal.pitchSummary.text !== deal.pitchAi.originalText ? '; wording edited by adviser' : ''}. Charts and lender fit use Mandate calculations.`;
  };
  global.MandateAI = { ready, provenance };
  const previousReset = global.MandateResetPitchFlow;
  global.MandateResetPitchFlow = function () {
    for (const entry of states.values()) entry.controller?.abort();
    states.clear(); demoCode = ''; previousReset?.();
  };
  function panel(deal) {
    const s = state(deal), ai = fresh(deal) && deal.pitchAi?.basedOn === R.signature(deal);
    return `<section class="ai-summary-control" aria-labelledby="aiSummaryTitle" aria-busy="${s.busy}">
      <div><h3 id="aiSummaryTitle">${ai ? 'Live AI draft ready for review' : 'Prepare the broker’s summary'}</h3>
      <p>${ai ? e(provenance(deal)) : 'Generate a draft from your confirmed figures, annual history and source notes. Review and edit it before continuing.'}</p></div>
      <p class="ai-status" role="status">${s.busy ? 'Drafting your summary with OpenAI… This may take up to 45 seconds.' : ready(deal) ? ai ? 'Read the draft below, then confirm the final check.' : 'Local summary selected. No live AI call was used for this wording.' : 'Choose live AI or the local summary before confirming.'}</p>
      ${s.error ? `<p class="ai-error" role="alert">${e(s.error)}</p>` : ''}
      <form id="aiSummaryForm"><div class="ai-code-field"><label for="demoAccessCode">Private demo access code</label><input id="demoAccessCode" name="demo_access_code" type="password" autocomplete="off" maxlength="256" ${s.busy ? 'disabled' : ''} aria-describedby="aiCodeHelp"><small id="aiCodeHelp">Supplied by the demo owner. This is not your OpenAI API key.</small></div>
      <div class="ai-actions"><button type="submit" class="button button-dark" ${s.busy || !R.progress(deal).complete ? 'disabled' : ''}>${s.busy ? 'Generating…' : ai ? 'Generate again' : 'Generate live AI summary'}</button><button type="button" class="review-choice" data-use-local-summary ${s.busy ? 'disabled' : ''}>Use local summary</button></div></form>
      <p class="ai-data-note">Live generation sends these synthetic, confirmed figures and source labels to OpenAI. Original CSV files stay in this browser. The access code is remembered only until you refresh or reset the demo.</p>
    </section>`;
  }
  function payload(deal) {
    const data = P.analyze(deal);
    return {
      version: 1, currency: 'NZD',
      fields: R.rows(deal).map(row => {
        const ids = deal.review?.fields?.[row.path]?.sourceIds || [];
        const sourceDocs = (deal.documents || []).filter(d => ids.includes(d.id));
        const record = row.path.split('.').reduce((value, part) => value?.[part], deal);
        return { path: row.path, value: row.current ?? null, periodEnd: record?.periodEnd || null, sources: sourceDocs.length ? sourceDocs.map(d => d.name) : ['Adviser-confirmed entry'] };
      }),
      history: data.history.map(p => ({ end: p.end, source: p.source, ...Object.fromEntries(['revenue', 'ebitda', 'grossProfit', 'netProfit', 'operatingCash', 'interest', 'assets', 'liabilities', 'equity'].map(key => [key, p[key] ?? null])) })),
      missingDocuments: (deal.documents || []).filter(d => d.status !== 'provided').map(d => d.name || d.kind || 'Missing document'),
      reviewNotes: data.warnings
    };
  }
  function compose(sections) {
    const lists = (title, values) => `${title}\n${values.length ? values.map(value => '• ' + value).join('\n') : 'None identified from the supplied information; adviser review required.'}`;
    return [sections.executiveSummary, `Financial commentary\n${sections.financialCommentary}`, `Repayment considerations\n${sections.repaymentConsiderations}`, lists('Potential strengths', sections.strengths), lists('Risks to review', sections.risks), lists('Missing information', sections.missingInformation)].join('\n\n');
  }
  const originalRender = global.renderDeal;
  global.renderDeal = function () {
    originalRender();
    const deal = current(), summary = document.querySelector('.final-summary');
    if (!deal || !summary) return;
    summary.insertAdjacentHTML('beforebegin', panel(deal));
    document.getElementById('demoAccessCode').value = demoCode;
    document.getElementById('finalSummaryText').disabled = state(deal).busy;
    const ack = document.getElementById('finalAcknowledgement');
    ack.disabled = !ready(deal);
    const confirm = document.querySelector('[data-final-confirm]');
    confirm.disabled = !ready(deal) || !ack.checked;
  };
  const repaint = deal => { if (current() === deal && document.querySelector('.flow-workspace')) global.renderDeal(); };
  async function generate(deal) {
    const s = state(deal);
    if (s.busy || !R.progress(deal).complete) return;
    if (!demoCode.trim()) { s.error = 'Enter the private demo access code to generate a live summary.'; repaint(deal); document.getElementById('demoAccessCode')?.focus(); return; }
    const basedOn = R.signature(deal);
    s.busy = true; s.error = ''; s.controller = new AbortController();
    delete deal.pitchConfirmation;
    repaint(deal);
    const timeout = setTimeout(() => s.controller.abort(), 55000);
    try {
      const response = await fetch('/api/analyze', { method: 'POST', signal: s.controller.signal, headers: { 'Content-Type': 'application/json', 'X-Mandate-Demo-Code': demoCode }, body: JSON.stringify(payload(deal)) });
      let data;
      try { data = await response.json(); }
      catch { throw Error('The live summary endpoint is unavailable. Check the deployment or choose the local summary.'); }
      if (!response.ok) {
        if (response.status === 401) demoCode = '';
        throw Error(data.error || 'The AI summary could not be generated. Please retry.');
      }
      if (states.get(deal) !== s) return;
      if (R.signature(deal) !== basedOn || !R.progress(deal).complete) throw Error('The deal changed while the summary was being drafted. Confirm the updated details and generate again.');
      if (data.method !== 'openai' || !data.sections) throw Error('The server did not return a live AI draft. Try again.');
      const text = compose(data.sections);
      deal.pitchSummary = { text, basedOn };
      deal.pitchSummaryChoice = basedOn;
      deal.pitchAi = { basedOn, originalText: text, model: data.model, requestId: data.requestId, generatedAt: data.generatedAt };
      global.notify('Live AI draft ready. Review the wording before confirming.');
    } catch (error) {
      if (states.get(deal) === s) s.error = error.name === 'AbortError' ? 'The request timed out. Retry, or choose the local summary.' : error.message;
    } finally {
      clearTimeout(timeout); s.busy = false;
      if (states.get(deal) === s) repaint(deal);
    }
  }
  document.addEventListener('submit', event => {
    if (event.target.id !== 'aiSummaryForm') return;
    event.preventDefault();
    demoCode = document.getElementById('demoAccessCode').value;
    generate(current());
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'demoAccessCode') demoCode = event.target.value;
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.hasAttribute('data-final-confirm') && !ready(current())) {
      event.preventDefault(); event.stopImmediatePropagation();
      global.notify('Generate a live summary or choose the local summary first.');
    }
    if (button.hasAttribute('data-use-local-summary')) {
      const deal = current(); if (state(deal).busy || !R.progress(deal).complete) return;
      deal.pitchSummary = { text: global.MandateDealAnalysis.analyzeDeal(deal, []).summary.text, basedOn: R.signature(deal) };
      deal.pitchSummaryChoice = R.signature(deal);
      delete deal.pitchAi; delete deal.pitchConfirmation;
      state(deal).error = ''; repaint(deal);
    }
    // Once the private code is entered, subsequent deals draft on Done automatically.
    if (button.hasAttribute('data-flow-done') && demoCode) {
      const deal = current();
      queueMicrotask(() => { if (current() === deal && !ready(deal)) generate(deal); });
    }
  }, true);
})(window);
