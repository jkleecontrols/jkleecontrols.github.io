// A UGV carrying a wireless charging pad and a UAV that rendezvous with it to recharge.
// The pair tracks the scroll position, docks at the top of the page, and drives/flies
// off-screen when navigating to another page.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return;

  var PAD_TOP = 25;     // px from the wheels' baseline up to the charging pad surface
  var HOVER = 74;       // px above the baseline while airborne
  var MARGIN = 26;      // px kept clear at both ends of the drive
  var UGV_W = 78;
  var DRONE_W = 54;
  var EXIT_MS = 430;    // how long the pair drives off-screen before navigating

  var DRAIN = 0.028;    // battery per second while airborne (~27 s per sortie)
  var CHARGE = 0.26;    // battery per second on the pad
  var RETURN_AT = 0.25; // battery level that sends the drone back to the pad
  var LAUNCH_AT = 0.98;

  var scene, ugvEl, droneEl, batteryEl;
  var ugvX = 0, droneX = 0, droneY = PAD_TOP;
  var battery = 1;
  var mode = 'docked';  // docked | flying
  var entering = false;
  var exiting = false;
  var last = 0;

  function store(key, value) {
    try { sessionStorage.setItem(key, value); } catch (e) {}
  }
  function read(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }

  function build() {
    scene = document.createElement('div');
    scene.className = 'rover-scene';
    scene.setAttribute('aria-hidden', 'true');
    scene.innerHTML =
      '<div class="rover-ugv">' +
        '<svg viewBox="0 0 78 34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
          '<path class="rover-charge" d="M31 5a8 8 0 0 1 16 0M35 1.8a4.4 4.4 0 0 1 8 0"/>' +
          '<rect class="rover-pad" x="20" y="8" width="38" height="5" rx="2.5"/>' +
          '<path d="M26 13v3M52 13v3"/>' +
          '<rect x="9" y="16" width="60" height="10" rx="4"/>' +
          '<path d="M14 21h8M56 21h6"/>' +
          '<circle cx="21" cy="27" r="5.6"/><circle cx="57" cy="27" r="5.6"/>' +
          '<circle cx="21" cy="27" r="1.6" fill="currentColor" stroke="none"/>' +
          '<circle cx="57" cy="27" r="1.6" fill="currentColor" stroke="none"/>' +
        '</svg>' +
      '</div>' +
      '<div class="rover-drone">' +
        '<svg viewBox="0 0 54 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect class="rover-batt-shell" x="20" y="1" width="14" height="6" rx="2"/>' +
          '<rect class="rover-batt-level" x="21.6" y="2.6" width="10.8" height="2.8" rx="1.2" fill="currentColor" stroke="none"/>' +
          '<rect x="20" y="11" width="14" height="7" rx="3"/>' +
          '<path d="M20 14 8 11M34 14l12-3"/>' +
          '<ellipse class="rover-rotor" cx="8" cy="11" rx="7.5" ry="1.5"/>' +
          '<ellipse class="rover-rotor" cx="46" cy="11" rx="7.5" ry="1.5"/>' +
          '<path d="M23 18v3h-4M31 18v3h4"/>' +
        '</svg>' +
      '</div>';
    document.body.appendChild(scene);
    ugvEl = scene.querySelector('.rover-ugv');
    droneEl = scene.querySelector('.rover-drone');
    batteryEl = scene.querySelector('.rover-batt-level');
    document.documentElement.classList.add('has-rover');
  }

  // The scene is scaled down on small screens, so measure it rather than the window.
  function sceneWidth() {
    return scene.clientWidth || window.innerWidth;
  }

  function driveWidth() {
    return Math.max(0, sceneWidth() - UGV_W - MARGIN * 2);
  }

  function scrollProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 4) return 0;
    return Math.min(1, Math.max(0, window.scrollY / max));
  }

  function padCenter() {
    return ugvX + UGV_W / 2 - DRONE_W / 2;
  }

  function lerp(a, b, t) {
    return a + (b - a) * Math.min(1, t);
  }

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;

    var atTop = scrollProgress() < 0.02;
    var targetUgv = MARGIN + scrollProgress() * driveWidth();

    if (exiting) {
      targetUgv = sceneWidth() + 160;
    } else if (entering && Math.abs(ugvX - targetUgv) < 2) {
      entering = false;
    }
    ugvX = lerp(ugvX, targetUgv, (entering || exiting ? 3.2 : 2.6) * dt);

    if (mode === 'docked') {
      battery = Math.min(1, battery + CHARGE * dt);
      if (!atTop && !exiting && battery >= LAUNCH_AT) mode = 'flying';
    } else {
      battery = Math.max(0, battery - DRAIN * dt);
      if (!exiting && (atTop || battery <= RETURN_AT) &&
          Math.abs(droneX - padCenter()) < 6 && droneY < PAD_TOP + 3) {
        mode = 'docked';
      }
    }

    var wantsPad = !exiting && (mode === 'docked' || atTop || battery <= RETURN_AT);
    var targetDroneX = wantsPad ? padCenter() : ugvX + UGV_W - DRONE_W + 34;
    var targetY = PAD_TOP;

    if (exiting) {
      targetDroneX = sceneWidth() + 200;
      targetY = HOVER + 26;
    } else if (!wantsPad) {
      targetY = HOVER + Math.sin(now / 460) * 5;
    } else if (Math.abs(droneX - padCenter()) > 8) {
      targetY = HOVER * 0.7;   // stay up until it is over the pad, then settle
    }

    droneX = lerp(droneX, targetDroneX, (exiting ? 3.4 : 2.4) * dt);
    droneY = lerp(droneY, targetY, (mode === 'docked' ? 3.4 : 2.2) * dt);

    ugvEl.style.transform = 'translate3d(' + ugvX.toFixed(1) + 'px,0,0)';
    droneEl.style.transform = 'translate3d(' + droneX.toFixed(1) + 'px,' + (-droneY).toFixed(1) + 'px,0)';
    batteryEl.setAttribute('width', (10.8 * Math.max(0.04, battery)).toFixed(2));

    scene.classList.toggle('is-charging', mode === 'docked' && battery < 1);
    scene.classList.toggle('is-landed', mode === 'docked');
    scene.classList.toggle('is-low', mode !== 'docked' && battery <= RETURN_AT);

    requestAnimationFrame(frame);
  }

  function isInternalLink(a) {
    if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return false;
    if (a.origin !== location.origin) return false;
    if ((a.getAttribute('href') || '').charAt(0) === '#') return false;
    return /\.html$/.test(a.pathname) || /\/$/.test(a.pathname);
  }

  function onClick(event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest ? event.target.closest('a') : null;
    if (!isInternalLink(link)) return;
    event.preventDefault();
    exiting = true;
    store('rover:enter', '1');
    store('rover:battery', String(battery));
    setTimeout(function () { location.href = link.href; }, EXIT_MS);
  }

  function start() {
    build();
    var saved = parseFloat(read('rover:battery'));
    if (saved >= 0 && saved <= 1) battery = saved;

    if (read('rover:enter')) {
      store('rover:enter', '');
      entering = true;
      mode = battery > RETURN_AT ? 'flying' : 'docked';
      ugvX = -UGV_W - 80;
      droneX = -DRONE_W - 150;
      droneY = mode === 'flying' ? HOVER : PAD_TOP;
    } else {
      ugvX = MARGIN + scrollProgress() * driveWidth();
      droneX = padCenter();
    }

    document.addEventListener('click', onClick);
    window.addEventListener('pageshow', function (e) { if (e.persisted) exiting = false; });
    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener('change', function (e) { if (e.matches) location.reload(); });
    }
    last = performance.now();
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
