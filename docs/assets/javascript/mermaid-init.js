// Initialize Mermaid
document.addEventListener("DOMContentLoaded", function () {
  if (typeof mermaid !== "undefined") {
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
    });

    // Manually render any mermaid diagrams that might not be auto-rendered
    const mermaidElements = document.querySelectorAll(".mermaid");
    mermaidElements.forEach(function (element) {
      if (!element.hasAttribute("data-processed")) {
        mermaid.init(undefined, element);
        element.setAttribute("data-processed", "true");
      }
    });
  } else {
    console.warn("Mermaid library not loaded");
  }
});

// Re-initialize on navigation (for MkDocs Material instant loading)
if (typeof document$ !== "undefined") {
  document$.subscribe(function () {
    if (typeof mermaid !== "undefined") {
      const mermaidElements = document.querySelectorAll(".mermaid");
      mermaidElements.forEach(function (element) {
        if (!element.hasAttribute("data-processed")) {
          mermaid.init(undefined, element);
          element.setAttribute("data-processed", "true");
        }
      });
    }
  });
}
