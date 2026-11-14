/*
 * The theme script (ADR 0002, decision 8; ADR 0003, decision 4). A classic,
 * same-origin file in <head>, so it runs before first paint and under
 * `script-src 'self'`. Plain JS with JSDoc types, no build step.
 *
 * - Sets <html data-theme> from ?theme=, else localStorage['isoloop-theme'],
 *   else the system setting.
 * - Follows changes live: a `storage` event (the toggle on this or any other
 *   same-origin page or frame) and the system setting, with no reload.
 * - Wires every [data-ui-theme-toggle] button, which stays hidden without JS.
 * - ?embed=1 sets <html data-embed>, which shell.css uses to hide the header,
 *   the footer and the outer margins inside an iframe.
 * - On a copied Archify diagram (this script tag carries data-archify), keeps
 *   the viewer's own `archify-theme` key in step, both ways.
 * Every storage access is guarded: it throws in blocked or sandboxed contexts,
 * and the system setting applies then. Nothing else is stored or sent.
 */
(function () {
  var KEY = 'isoloop-theme';
  var ARCHIFY = 'archify-theme';
  var root = document.documentElement;
  var script = document.currentScript;
  var archify = !!(script && script.hasAttribute('data-archify'));
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  /** @typedef {'light' | 'dark'} Theme */

  /** @param {string | null} v @returns {Theme | null} */
  function valid(v) {
    return v === 'light' || v === 'dark' ? v : null;
  }
  /** @param {string} key @returns {Theme | null} */
  function read(key) {
    try {
      return valid(window.localStorage.getItem(key));
    } catch {
      return null;
    }
  }
  /** @param {string} key @param {Theme} v */
  function write(key, v) {
    try {
      window.localStorage.setItem(key, v);
    } catch {
      // Storage is blocked: the choice lasts for this page only.
    }
  }
  /** @param {string} name @returns {string | null} */
  function param(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch {
      return null;
    }
  }

  var override = valid(param('theme'));
  if (param('embed') === '1') root.setAttribute('data-embed', '');

  /** @returns {Theme} */
  function system() {
    return media && media.matches ? 'dark' : 'light';
  }
  /** @returns {Theme} */
  function current() {
    return override || read(KEY) || system();
  }

  /** @param {Theme} theme */
  function paintToggles(theme) {
    var buttons = document.querySelectorAll('button[data-ui-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].hidden = false;
      buttons[i].setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }
  /** @param {Theme} theme */
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    if (archify && read(ARCHIFY) !== theme) write(ARCHIFY, theme);
    paintToggles(theme);
  }

  apply(current());

  window.addEventListener('storage', function (e) {
    if (e.key === KEY || e.key === null) apply(current());
    else if (archify && e.key === ARCHIFY) {
      // The viewer's own toggle, on this or another diagram page.
      var v = read(ARCHIFY);
      if (v && v !== read(KEY)) write(KEY, v);
      apply(current());
    }
  });
  if (media) {
    media.addEventListener('change', function () {
      apply(current());
    });
  }

  function wire() {
    paintToggles(current());
    var buttons = document.querySelectorAll('button[data-ui-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        override = null;
        write(KEY, next);
        apply(next);
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
