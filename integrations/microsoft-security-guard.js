(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const toast = message => {
    const node = document.createElement('div');
    node.className = 'mlb-toast';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2800);
  };

  function secureAgentUrl() {
    return localStorage.getItem('questCopilotSecureAgentUrl') || '';
  }

  function demoIframeUrl() {
    return localStorage.getItem('questCopilotEmbedUrl') || '';
  }

  function patchPanel() {
    const body = $('#mlbBody');
    if (!body) return;

    const config = $('#mlbCopilotConfig');
    const open = $('#mlbCopilotOpen');
    if (config) config.textContent = 'Configure demo iframe';
    if (open) open.textContent = 'Open demo iframe';

    const copilotHeading = [...body.querySelectorAll('h3')].find(node => /Quest Insights Engine/i.test(node.textContent));
    const card = copilotHeading?.closest('.mlb-card');
    if (card && !card.querySelector('[data-secure-agent-actions]')) {
      const actions = document.createElement('div');
      actions.className = 'mlb-actions';
      actions.dataset.secureAgentActions = 'true';
      actions.innerHTML = `<button class="mlb-btn" id="mlbSecureAgentOpen">Open secure agent</button><button class="mlb-btn secondary" id="mlbSecureAgentConfig">Set Teams / Microsoft 365 link</button>`;
      card.appendChild(actions);
      const note = document.createElement('div');
      note.className = 'mlb-note';
      note.innerHTML = 'Use the authenticated Teams or Microsoft 365 channel for the SharePoint-enabled confidential agent. The default Copilot Studio iframe requires a separate <strong>No authentication</strong> agent and must contain only nonconfidential demonstration knowledge.';
      card.appendChild(note);
    }

    const area = $('#mlbCopilotArea');
    if (area && !area.querySelector('[data-copilot-security-note]')) {
      const note = document.createElement('div');
      note.className = 'mlb-note';
      note.dataset.copilotSecurityNote = 'true';
      note.innerHTML = demoIframeUrl()
        ? '<strong>Demo iframe configured.</strong> Confirm that this is a separate no-authentication agent with no confidential SharePoint source.'
        : 'No demo iframe is configured. This is the safe default for the confidential SharePoint-enabled agent.';
      area.prepend(note);
    }
  }

  document.addEventListener('click', event => {
    const target = event.target.closest?.('button');
    if (!target) return;

    if (target.id === 'mlbCopilotConfig') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const approved = confirm('Only configure an iframe for a separate No authentication agent that contains no confidential SharePoint knowledge. Continue?');
      if (!approved) return;
      const value = prompt('Paste the HTTPS iframe src for the nonconfidential demonstration agent.', demoIframeUrl());
      if (value == null) return;
      const clean = value.trim().replace(/^src=["']|["']$/g, '');
      if (clean && !/^https:\/\//i.test(clean)) return toast('Please paste a valid HTTPS iframe URL.');
      if (clean) localStorage.setItem('questCopilotEmbedUrl', clean); else localStorage.removeItem('questCopilotEmbedUrl');
      toast(clean ? 'Nonconfidential demo iframe saved.' : 'Demo iframe removed.');
      setTimeout(() => location.reload(), 400);
      return;
    }

    if (target.id === 'mlbSecureAgentConfig') {
      event.preventDefault();
      const value = prompt('Paste the authenticated “See agent in Microsoft 365” or Teams link.', secureAgentUrl());
      if (value == null) return;
      const clean = value.trim();
      if (clean && !/^https:\/\//i.test(clean) && !/^msteams:/i.test(clean)) return toast('Please paste a valid Microsoft 365 or Teams link.');
      if (clean) localStorage.setItem('questCopilotSecureAgentUrl', clean); else localStorage.removeItem('questCopilotSecureAgentUrl');
      toast(clean ? 'Secure agent link saved on this device.' : 'Secure agent link removed.');
      return;
    }

    if (target.id === 'mlbSecureAgentOpen') {
      event.preventDefault();
      const url = secureAgentUrl();
      if (!url) {
        toast('Set the Teams or Microsoft 365 agent link first.');
        return;
      }
      window.open(url, '_blank', 'noopener');
    }
  }, true);

  const observer = new MutationObserver(patchPanel);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchPanel, { once:true }); else patchPanel();
})();
