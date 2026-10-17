// Presentation only: no routing state, simulated network delay or booking logic.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let entering;

export function animateScreen(name, previous) {
  entering?.cancel();
  if (name === previous || reducedMotion.matches || document.documentElement.classList.contains('is-launching')) return;
  // Transforming a parent of fixed controls changes their containing block.
  // Animate just the guide card so its bottom actions remain viewport-anchored.
  const selector = name === 'home' ? '.planner-column' : name === 'guide' ? '.current-guide-step' : `#${name}-screen`;
  const target = document.querySelector(selector);
  entering = target?.animate([
    { opacity: 0, transform: 'translateY(14px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { duration: 340, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}

reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) entering?.cancel(); });

export function presentHomeMap(section) {
  section.querySelector('summary').hidden = true;
  const toolbar = section.querySelector('.map-toolbar');
  toolbar.insertAdjacentHTML('beforebegin', `<div class="home-map-heading"><span class="home-map-city">Cagayan de Oro</span><span class="home-map-mode"><span aria-hidden="true"></span> Landmark preview · GPS off</span></div>`);
  // Keep the full data-accuracy note and tile privacy information available
  // without making them compete with the trip controls on the home screen.
  const info = document.createElement('details');
  info.className = 'home-map-info';
  info.innerHTML = '<summary>About this map <span aria-hidden="true">+</span></summary>';
  info.append(section.querySelector('.map-connection-note'), section.querySelector('.map-privacy'));
  section.querySelector('.map-content').append(info);
}
