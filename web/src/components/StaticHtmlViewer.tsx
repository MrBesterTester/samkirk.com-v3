"use client";

import { useEffect, useRef, useState } from "react";

interface StaticHtmlViewerProps {
  /** Path to the static HTML file (relative to /static/) */
  src: string;
  /** Title for accessibility */
  title: string;
  /** Minimum height for the iframe (default: 400px) */
  minHeight?: number;
}

/**
 * Component that renders static HTML files in an iframe with auto-height adjustment.
 * The iframe loads files from the /static/ directory in the public folder.
 */
export function StaticHtmlViewer({
  src,
  title,
  minHeight = 400,
}: StaticHtmlViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoaded(true);
      // Attempt to auto-resize based on content height
      try {
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const contentHeight = iframeDoc.body.scrollHeight;
          if (contentHeight > minHeight) {
            setHeight(contentHeight + 32); // Add some padding
          }
        }
      } catch {
        // Cross-origin restriction may prevent access - use default height
        console.debug("Could not auto-resize iframe - using default height");
      }
    };

    // Check if already loaded (e.g. cached iframe loaded before effect ran)
    try {
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc?.readyState === "complete" && iframeDoc.body?.innerHTML) {
        handleLoad();
        return;
      }
    } catch {
      // Cross-origin — fall through to listener
    }

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [minHeight]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {!isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900"
          style={{ minHeight }}
        >
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading content...
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={`/static/${src}`}
        title={title}
        className="w-full border-0"
        style={{
          height,
          minHeight,
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.2s ease-in-out",
        }}
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}
