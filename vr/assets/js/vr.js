document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".vr-header");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const filterChips = document.querySelectorAll("[data-filter]");
  const gameCards = document.querySelectorAll("[data-game-category]");
  const faqItems = document.querySelectorAll(".faq-item");
  const revealItems = document.querySelectorAll(".reveal");
  const timeChips = document.querySelectorAll("[data-time-chip]");
  const timeInput = document.querySelector("[data-time-input]");

  if (menuToggle && header) {
    menuToggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("is-menu-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.filter;
      filterChips.forEach((item) => item.classList.toggle("is-active", item === chip));

      gameCards.forEach((card) => {
        const categories = (card.dataset.gameCategory || "").split(" ");
        const isVisible = filter === "all" || categories.includes(filter);
        card.hidden = !isVisible;
      });
    });
  });

  faqItems.forEach((item) => {
    const button = item.querySelector(".faq-question");
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const isOpen = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });

  timeChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      timeChips.forEach((item) => item.classList.remove("is-active"));
      chip.classList.add("is-active");

      if (timeInput) {
        timeInput.value = chip.dataset.timeChip || "";
      }
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
});
