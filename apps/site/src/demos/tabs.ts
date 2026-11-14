// The framework tabs on /features/: without JS every sample shows, one after
// another; with it, a tablist (arrow keys, Home, End) shows one at a time.
export function startTabs(root: HTMLElement): void {
  const list = root.querySelector<HTMLElement>('[role="tablist"]');
  if (!list) return;
  const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls') ?? ''));
  const select = (i: number, focus: boolean): void => {
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(i === j));
      t.tabIndex = i === j ? 0 : -1;
      const p = panels[j];
      if (p) p.hidden = i !== j;
    });
    if (focus) tabs[i]?.focus();
  };
  list.hidden = false;
  root.classList.add('tabs-on');
  for (const p of panels) p?.setAttribute('tabindex', '0');
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i, false));
    t.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const to =
        e.key === 'ArrowRight'
          ? (i + 1) % n
          : e.key === 'ArrowLeft'
            ? (i - 1 + n) % n
            : e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? n - 1
                : -1;
      if (to < 0) return;
      e.preventDefault();
      select(to, true);
    });
  });
  select(0, false);
}
