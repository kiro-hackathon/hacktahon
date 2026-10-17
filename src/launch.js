// The brand intro is independent of maps and application startup. An unavailable
// network or an application error must never leave the commuter on the splash.
document.documentElement.classList.add('is-launching');
document.addEventListener('DOMContentLoaded', () => {
  const splash = document.querySelector('#launch-splash');
  if (!splash) { document.documentElement.classList.remove('is-launching'); return; }
  splash.addEventListener('cancel', event => event.preventDefault());
  splash.showModal();
  // Includes the 200 ms exit in the requested three-second launch experience.
  setTimeout(() => splash.classList.add('is-leaving'), 2800);
  setTimeout(() => {
    splash.close();
    splash.remove();
    document.documentElement.classList.remove('is-launching');
    document.documentElement.classList.add('is-launched');
    window.dispatchEvent(new Event('routa:launched'));
  }, 3000);
}, { once: true });
