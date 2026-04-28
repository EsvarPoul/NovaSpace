document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-loaded");

  const splitScreen = document.querySelector(".split-screen");
  const splitPanels = document.querySelectorAll(".split-panel");
  const revealBlocks = document.querySelectorAll(".panel-content, .nova-center");

  revealBlocks.forEach((block, index) => {
    setTimeout(() => {
      if (block.classList.contains("panel-content")) {
        block.closest(".split-panel")?.classList.add("is-visible");
      }
      if (block.classList.contains("nova-center")) {
        block.classList.add("is-visible");
      }
    }, 120 + index * 120);
  });

  splitPanels.forEach((panel) => {
    const state = panel.dataset.panel;
    const activeClass = `is-${state}-active`;

    const activatePanel = () => {
      if (!splitScreen) {
        return;
      }
      splitScreen.classList.remove("is-studio-active", "is-vr-active");
      splitScreen.classList.add(activeClass);
    };

    const resetPanels = () => {
      if (!splitScreen) {
        return;
      }
      splitScreen.classList.remove("is-studio-active", "is-vr-active");
    };

    panel.addEventListener("mouseenter", activatePanel);
    panel.addEventListener("focus", activatePanel);
    panel.addEventListener("mouseleave", resetPanels);
    panel.addEventListener("blur", resetPanels);
  });
});
