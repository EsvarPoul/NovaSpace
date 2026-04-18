document.addEventListener('DOMContentLoaded', () => {
  const blocks = document.querySelectorAll('.hero-card, .inner-hero, .matrix-pill');
  blocks.forEach((block, index) => {
    block.classList.add('reveal-on-load');
    setTimeout(() => {
      block.classList.add('is-visible');
    }, 120 + index * 120);
  });
});
