import Script from "next/script";
import { loadStaticHtml, STATIC_SCOPE_CLASS } from "@/lib/static-html";

/**
 * Renders a standalone document from `public/static` directly into the page.
 *
 * Replaces the iframe-based `StaticHtmlViewer` for SEO: search engines do not
 * attribute iframe content to the embedding page, so these write-ups — 30–100 KB
 * of real technical writing each — were being indexed as ~200-word stubs.
 *
 * This is a server component, so for statically-rendered routes the file is read
 * and inlined at build time: the markup ships in the initial HTML, with no
 * client fetch and no layout shift.
 *
 * The document's own stylesheet is rewritten by `loadStaticHtml` so every
 * selector is confined to the wrapper element; without that, its bare `body`
 * and `*` rules would restyle the entire site.
 */

export type StaticHtmlContentProps = {
  /** Filename within `public/static`, e.g. `"physics-of-lora.html"`. */
  src: string;
  /** Accessible label for the region wrapping the document. */
  title: string;
  /**
   * Load KaTeX to typeset `$…$` math. Only the documents that actually contain
   * math should set this — it pulls in a stylesheet and two scripts.
   */
  katex?: boolean;
};

export async function StaticHtmlContent({ src, title, katex = false }: StaticHtmlContentProps) {
  const { bodyHtml, scopedCss } = await loadStaticHtml(src);

  return (
    <section aria-label={title}>
      {/* Scoped to `.static-html-content` — see lib/static-html.ts. */}
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />

      {katex && (
        <>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          />
          <Script
            src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"
            strategy="afterInteractive"
          />
          <Script
            src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
            strategy="afterInteractive"
            onReady={undefined}
          />
          <Script id={`katex-render-${src}`} strategy="afterInteractive">
            {`
              (function () {
                function render() {
                  var el = document.querySelector('.${STATIC_SCOPE_CLASS}');
                  if (el && window.renderMathInElement) {
                    window.renderMathInElement(el, {
                      delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                      ],
                      throwOnError: false
                    });
                    return true;
                  }
                  return false;
                }
                if (!render()) {
                  var tries = 0;
                  var timer = setInterval(function () {
                    if (render() || ++tries > 40) clearInterval(timer);
                  }, 100);
                }
              })();
            `}
          </Script>
        </>
      )}

      <div
        className={STATIC_SCOPE_CLASS}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </section>
  );
}
