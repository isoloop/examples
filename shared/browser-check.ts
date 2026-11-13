// What every example page shows before, or instead of, the app: a plain-HTML
// notice that needs no script, and a small classic script that names what the
// browser lacks. The Vite plugin below puts the notice into each page's
// index.html and the script next to it, so a browser that can't parse the
// app's bundle (or throws as it starts) is left with a message, not a blank
// page.
//
// Why it's needed: the bundles target Vite 8's default, "Baseline Widely
// Available" (Chrome/Edge 111, Firefox 114, Safari 16.4), and the app code uses
// ES2023 array methods (`toSorted`, `toReversed`; Safari 16). On Safari 15 the
// native builds throw a TypeError as they start and the page stays blank; the
// Isoloop host's own `unsupported_browser` check only runs if the bundle gets
// that far.

/** What a build needs, from the least to the most. */
export type Needs = 'native' | 'native-workers' | 'isoloop';

/** The notice element's id; `boot()` removes it once the app has loaded. */
export const NOTICE_ID = 'browser-notice';

/** Set by the classic script: the features this browser lacks, or none. */
export const UNSUPPORTED_GLOBAL = '__examplesUnsupported';

const SUPPORT = 'These examples need Safari 16.4 or later, or a recent Chrome, Edge or Firefox.';

const NOTICE_HTML = `Loading… If this message stays, your browser isn't supported. ${SUPPORT}`;

// Fixed, so adding or removing it never moves the page's layout. Colours
// follow the reader's light or dark preference; the dashboards are dark.
const CSS = `#${NOTICE_ID}{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:2147483647;max-width:40rem;margin:0 auto;padding:.75rem 1rem;border-radius:.5rem;font:14px/1.4 system-ui,sans-serif;background:#f4f4f5;color:#18181b;border:1px solid #d4d4d8}@media (prefers-color-scheme:dark){#${NOTICE_ID}{background:#27272a;color:#f4f4f5;border-color:#3f3f46}}`;

/**
 * The check itself, in ES5 so any browser can parse it. Each entry is a
 * feature a build uses at start; the Safari version is where it first shipped.
 * RegExp lookbehind stands for the bundles' Safari 16.4 syntax target; it's a
 * constructor call, so it needs no `eval`, which the hosting policy doesn't
 * allow. OPFS isn't checked: the plant falls back to memory topics without it, and
 * says so on the page.
 */
function checkScript(needs: Needs): string {
  const isoloop = needs === 'isoloop';
  const workers = needs !== 'native';
  return `(function(){
var m=[];
function t(name,f){try{if(!f())m.push(name)}catch(e){m.push(name)}}
t("Array.prototype.toSorted (Safari 16)",function(){return typeof [].toSorted==="function"});
t("RegExp lookbehind (Safari 16.4)",function(){new RegExp("(?<=a)b");return true});
${
  workers
    ? `t("module workers",function(){var ok=false;try{var w=new Worker("data:,",{get type(){ok=true;return "classic"}});w.terminate()}catch(e){}return ok});`
    : ''
}
${
  isoloop
    ? `t("MessageChannel",function(){return typeof MessageChannel==="function"});
t("OffscreenCanvas (Safari 16.4)",function(){return typeof OffscreenCanvas==="function"&&"transferControlToOffscreen" in HTMLCanvasElement.prototype});
t("adopted stylesheets on a shadow root (Safari 16.4)",function(){return typeof ShadowRoot!=="undefined"&&"adoptedStyleSheets" in ShadowRoot.prototype&&typeof CSSStyleSheet==="function"&&"replaceSync" in CSSStyleSheet.prototype});`
    : ''
}
window.${UNSUPPORTED_GLOBAL}=m;
if(!m.length)return;
function show(){var n=document.getElementById("${NOTICE_ID}");if(n)n.textContent="Your browser isn't supported. ${SUPPORT} Missing: "+m.join(", ")+"."}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show);else show();
})();`;
}

interface HtmlTag {
  tag: string;
  attrs?: Record<string, string | boolean>;
  children?: string;
  injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend';
}

/** The check's file, next to each page. */
const FILE = 'browser-check.js';

/**
 * The Vite plugin. It puts the notice first in <body>, its style in <head>,
 * and the check as a classic `<script src>` in <head>. The check is a file,
 * not inline, because the Isoloop hosting guide's policy (`script-src 'self'`,
 * sent by @isoloop/vite) blocks inline scripts; inline styles are allowed. A
 * classic script runs as the parser reaches it, before any module script
 * (those are deferred), so the check always runs before the app. The build
 * writes the file into each build's output; the dev server serves it.
 */
export function browserCheck(needs: Needs): {
  name: string;
  transformIndexHtml: () => HtmlTag[];
  generateBundle(this: {
    emitFile(file: { type: 'asset'; fileName: string; source: string }): string;
  }): void;
  configureServer(server: {
    middlewares: {
      use(
        fn: (
          req: { url?: string },
          res: { setHeader(name: string, value: string): void; end(body: string): void },
          next: () => void,
        ) => void,
      ): void;
    };
  }): void;
} {
  const source = checkScript(needs);
  return {
    name: 'examples-browser-check',
    transformIndexHtml: () => [
      { tag: 'style', children: CSS, injectTo: 'head' },
      { tag: 'script', attrs: { src: `./${FILE}` }, injectTo: 'head' },
      {
        tag: 'div',
        attrs: { id: NOTICE_ID, role: 'status' },
        children: NOTICE_HTML,
        injectTo: 'body-prepend',
      },
    ],
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: FILE, source });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.split('?')[0]?.endsWith(`/${FILE}`)) return next();
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        res.end(source);
      });
    },
  };
}
