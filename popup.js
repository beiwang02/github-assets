/* Native DOM adapter; positioning provided by locally vendored Floating UI. */
(() => {
  let active = null, serial = 0;
  function close(restoreFocus = false) {
    const entry = active;
    if (!entry) return false;
    active = null;
    entry.cleanup?.();
    entry.observer?.disconnect();
    entry.trigger.setAttribute('aria-expanded', 'false');
    entry.trigger.removeAttribute('aria-controls');
    entry.owner.classList.remove('open');
    entry.menu.classList.remove('floating-menu');
    entry.menu.removeAttribute('style');
    if (entry.owner.isConnected) entry.owner.append(entry.menu);
    else entry.menu.remove();
    if (restoreFocus && entry.trigger.isConnected) entry.trigger.focus({preventScroll:true});
    return true;
  }
  function open(trigger, menu, {placement = 'bottom-start'} = {}) {
    if (active?.trigger === trigger) { close(true); return; }
    close();
    const owner = menu.parentElement;
    const entry = {trigger, menu, owner};
    active = entry;
    menu.id ||= `floating-menu-${++serial}`;
    trigger.setAttribute('aria-controls', menu.id);
    trigger.setAttribute('aria-expanded', 'true');
    owner.classList.add('open');
    menu.classList.add('floating-menu');
    // Portal escapes overflow/transform ancestors. Constrain BEFORE first measurement
    // so even the initial hidden layout never increases document width.
    Object.assign(menu.style, {position:'fixed', left:'0', top:'0', visibility:'hidden', maxWidth:'calc(100vw - 16px)', maxHeight:'calc(100dvh - 16px)'});
    document.body.append(menu);
    const {computePosition, offset, flip, shift, size, autoUpdate} = window.FloatingUIDOM;
    let generation = 0;
    const update = async () => {
      const version = ++generation;
      try {
      const result = await computePosition(trigger, menu, {
        strategy:'fixed', placement,
        middleware:[offset(7), flip({padding:8}), shift({padding:8}), size({padding:8, apply({availableWidth, availableHeight}) {
          if (active !== entry) return;
          menu.style.maxWidth = `${Math.max(0, availableWidth)}px`;
          menu.style.maxHeight = `${Math.max(0, availableHeight)}px`;
        }})]
      });
      if (active !== entry || version !== generation) return;
      Object.assign(menu.style, {left:`${result.x}px`, top:`${result.y}px`, visibility:'visible'});
      } catch { if(active===entry)close(true); }
    };
    entry.cleanup = autoUpdate(trigger, menu, update);
    entry.observer = new MutationObserver(() => {
      if (!trigger.isConnected || !owner.isConnected || !menu.isConnected) close();
    });
    entry.observer.observe(document.body, {childList:true, subtree:true});
    (menu.querySelector('[aria-checked="true"]') || menu.querySelector('button'))?.focus({preventScroll:true});
  }
  document.addEventListener('click', event => {
    if (active && !active.menu.contains(event.target) && !active.trigger.contains(event.target)) close();
  }, true);
  document.addEventListener('keydown', event => {
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); close(true); return;
    }
    if (event.key === 'Tab') { close(true); return; }
    const items = [...active.menu.querySelectorAll('button:not(:disabled)')];
    const index = items.indexOf(document.activeElement);
    if(!items.length)return;
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % items.length;
    if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next !== undefined) { event.preventDefault(); items[next]?.focus(); }
  }, true);
  window.AnchoredMenu = {open, close};
})();
