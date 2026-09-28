/* ============================================================
   Sections: menu, countdown, RSVP, wishes, calendar, gallery, header
   Extracted from the original single-file invitation.
   Depends on: none
   ============================================================ */

/* ============================================================
   MENU DRAWER + BOTTOM SHEETS  (fixed)
   ============================================================ */
(function() {
  const drawer = document.getElementById('menuDrawer');
  const menuBtn = document.getElementById('menuBtn');
  const langSheet = document.getElementById('langSheet');
  const langBtn = document.getElementById('langBtn');
  const calSheet = document.getElementById('calSheet');

  function openDrawer() {
    drawer.hidden = false;
    // Force reflow so transition runs
    void drawer.offsetWidth;
    drawer.classList.add('open');
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    setTimeout(() => { drawer.hidden = true; }, 320);
  }
  function openSheet(sheet) {
    sheet.hidden = false;
    void sheet.offsetWidth;
    sheet.classList.add('open');
  }
  function closeSheet(sheet) {
    sheet.classList.remove('open');
    setTimeout(() => { sheet.hidden = true; }, 320);
  }

  menuBtn.addEventListener('click', openDrawer);
  document.querySelectorAll('[data-close-drawer]').forEach(el => {
    el.addEventListener('click', closeDrawer);
  });
  document.querySelectorAll('.drawer-link').forEach(a => {
    a.addEventListener('click', closeDrawer);
  });

  langBtn.addEventListener('click', () => openSheet(langSheet));

  langSheet.querySelectorAll('[data-close-sheet]').forEach(el => {
    el.addEventListener('click', () => closeSheet(langSheet));
  });

  langSheet.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      document.querySelectorAll('[data-active-lang]').forEach(el => {
        el.classList.toggle('active', el.dataset.activeLang === lang);
      });
      const labels = { en: 'EN', hi: 'हि', mr: 'म' };
      document.getElementById('langLabel').textContent = labels[lang] || 'EN';
      document.body.classList.remove('lang-en','lang-hi','lang-mr');
      document.body.classList.add('lang-' + lang);
      document.documentElement.lang = lang;
      setTimeout(() => closeSheet(langSheet), 200);
    });
  });

  calSheet.querySelectorAll('[data-close-sheet]').forEach(el => {
    el.addEventListener('click', () => closeSheet(calSheet));
  });

  window.__sheets = { openSheet, closeSheet, calSheet };
})();

/* ============================================================
   COUNTDOWN
   ============================================================ */
(function() {
  const target = new Date('2026-11-25T11:26:00+05:30').getTime();
  const dEl = document.getElementById('cdDays');
  const hEl = document.getElementById('cdHours');
  const mEl = document.getElementById('cdMins');
  const sEl = document.getElementById('cdSecs');
  const pad = n => String(n).padStart(2, '0');

  function setText(el, next) { if (el.textContent !== next) el.textContent = next; }
  function tickSeconds(el, next) {
    if (el.textContent === next) return;
    el.textContent = next;
    el.classList.remove('seconds-tick');
    void el.offsetWidth;
    el.classList.add('seconds-tick');
  }
  function tick() {
    const now = Date.now();
    let diff = Math.max(0, target - now);
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
    const m = Math.floor(diff / 60000);    diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    setText(dEl, pad(d));
    setText(hEl, pad(h));
    setText(mEl, pad(m));
    tickSeconds(sEl, pad(s));
  }
  tick();
  setInterval(tick, 1000);
})();

/* ============================================================
   RSVP
   ============================================================ */
(function() {
  const form = document.getElementById('rsvpForm');
  const success = document.getElementById('rsvpSuccess');
  const swapYes = document.getElementById('swapYes');
  const swapNo = document.getElementById('swapNo');
  const submitBtn = document.getElementById('submitBtn');
  let currentState = null;

  function updateAttendance() {
    const value = form.querySelector('input[name="attending"]:checked')?.value || null;
    if (value === currentState) return;
    if (value === 'yes') {
      swapYes.classList.add('active');
      swapNo.classList.remove('active');
      submitBtn.textContent = 'Send RSVP';
      swapNo.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);
      swapYes.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);
    } else if (value === 'no') {
      swapNo.classList.add('active');
      swapYes.classList.remove('active');
      submitBtn.textContent = 'Send Your Blessings';
      swapYes.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);
      swapNo.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);
    }
    currentState = value;
  }
  form.querySelectorAll('input[name="attending"]').forEach(r => r.addEventListener('change', updateAttendance));
  updateAttendance();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const attending = form.querySelector('input[name="attending"]:checked')?.value;
    if (!form.name.value.trim() || !form.contact.value.trim() || !attending) {
      form.reportValidity();
      return;
    }
    if (attending === 'yes') {
      document.getElementById('successIcon').textContent = '🙏';
      document.getElementById('successTitle').textContent = 'Thank You';
      document.getElementById('successMsg').innerHTML = "Your RSVP has been received.<br>We can't wait to celebrate with you.";
      document.getElementById('successActions').hidden = false;
    } else {
      document.getElementById('successIcon').textContent = '💌';
      document.getElementById('successTitle').textContent = 'With Love';
      document.getElementById('successMsg').innerHTML = "Thank you for your blessings.<br>You'll be dearly missed at the celebration.";
      document.getElementById('successActions').hidden = true;
    }
    form.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    form.style.opacity = '0';
    form.style.transform = 'translateY(-12px)';
    setTimeout(() => {
      form.hidden = true;
      success.hidden = false;
    }, 400);
  });
})();

/* ============================================================
   WISHES
   ============================================================ */
(function() {
  const form = document.getElementById('wishForm');
  const inner = document.getElementById('wishFormInner');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.name.value.trim() || !form.message.value.trim()) {
      form.reportValidity();
      return;
    }
    inner.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    inner.style.opacity = '0';
    inner.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      inner.innerHTML = `
        <div class="wish-form-success">
          <p class="icon">💌</p>
          <p class="title">With Love</p>
          <p class="msg">Your blessing has been received.<br>It will appear on the wall shortly.</p>
        </div>
      `;
      inner.style.opacity = '1';
      inner.style.transform = 'translateY(0)';
    }, 400);
  });

  /* Guarded for file://, where storage access throws and would otherwise
     abort this block before the listeners below are attached. */
  let loved = [];
  try { loved = JSON.parse(localStorage.getItem('wedding-loved') || '[]'); } catch (e) { loved = []; }
  if (!Array.isArray(loved)) loved = [];
  document.querySelectorAll('.wish-love').forEach((btn, i) => {
    const countEl = btn.querySelector('.count');
    const id = 'wish-' + i;
    if (loved.includes(id)) btn.classList.add('loved');
    btn.addEventListener('click', () => {
      if (btn.classList.contains('loved')) return;
      btn.classList.add('loved');
      countEl.textContent = parseInt(countEl.textContent, 10) + 1;
      loved.push(id);
      try { localStorage.setItem('wedding-loved', JSON.stringify(loved)); } catch (e) {}
    });
  });

  document.getElementById('moreBtn').addEventListener('click', (e) => {
    e.target.disabled = true;
    e.target.style.opacity = '0.4';
    e.target.textContent = 'All Wishes Shown';
  });
})();

/* ============================================================
   CALENDAR
   ============================================================ */
(function() {
  const EVENTS = {
    engagement: {
      title: 'Engagement — Atharva weds Gautami',
      start: '2026-11-24T17:00:00+05:30', end: '2026-11-24T21:00:00+05:30',
      startUTC: '20261124T113000Z', endUTC: '20261124T153000Z',
      location: 'Ratnapriya Hotel & Resort, Indore–Ujjain Road, Ujjain (M.P.)',
      description: 'साखरपुडा · Atharva weds Gautami · Contact: 8319772196',
      uid: 'engagement-atharva-gautami-2026'
    },
    wedding: {
      title: 'Wedding — Atharva weds Gautami',
      start: '2026-11-25T11:26:00+05:30', end: '2026-11-25T15:00:00+05:30',
      startUTC: '20261125T055600Z', endUTC: '20261125T093000Z',
      location: 'Ratnapriya Hotel & Resort, Indore–Ujjain Road, Ujjain (M.P.)',
      description: 'विवाह · Atharva weds Gautami · Contact: 8319772196',
      uid: 'wedding-atharva-gautami-2026'
    }
  };

  function toICSDate(iso) {
    const d = new Date(iso);
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
  }

  function buildICS(events) {
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//AtharvaWedsGautami//Wedding//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'
    ];
    events.forEach(e => {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${e.uid}`);
      lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:.]/g,'').slice(0,15)}Z`);
      lines.push(`DTSTART;TZID=Asia/Kolkata:${toICSDate(e.start)}`);
      lines.push(`DTEND;TZID=Asia/Kolkata:${toICSDate(e.end)}`);
      lines.push(`SUMMARY:${e.title}`);
      lines.push(`LOCATION:${e.location}`);
      lines.push(`DESCRIPTION:${e.description}`);
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  function downloadICS(events) {
    const blob = new Blob([buildICS(events)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'atharva-weds-gautami.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function googleCalURL(e) {
    const params = new URLSearchParams({
      action: 'TEMPLATE', text: e.title,
      dates: `${e.startUTC}/${e.endUTC}`,
      details: e.description, location: e.location, ctz: 'Asia/Kolkata'
    });
    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  let pendingEvents = null;

  document.querySelectorAll('[data-calendar]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.calendar;
      if (key === 'both') {
        pendingEvents = [EVENTS.engagement, EVENTS.wedding];
        document.getElementById('calSubtitle').textContent = 'Engagement + Wedding';
      } else {
        pendingEvents = [EVENTS[key]];
        document.getElementById('calSubtitle').textContent = key === 'engagement' ? 'Engagement · 24 Nov' : 'Wedding · 25 Nov';
      }
      window.__sheets.openSheet(window.__sheets.calSheet);
    });
  });

  document.querySelectorAll('#calSheet [data-cal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.cal;
      if (!pendingEvents) return;
      if (type === 'ics' || type === 'apple') {
        downloadICS(pendingEvents);
      } else if (type === 'google') {
        pendingEvents.forEach((e, i) => setTimeout(() => window.open(googleCalURL(e), '_blank'), i * 300));
      }
      window.__sheets.closeSheet(window.__sheets.calSheet);
    });
  });
})();

/* ============================================================
   GALLERY + LIGHTBOX
   ============================================================ */
(function() {
  const tiles = Array.from(document.querySelectorAll('.gallery-tile'));
  const lightbox = document.getElementById('lightbox');
  const caption = document.getElementById('lbCaption');
  const indexEl = document.getElementById('lbIndex');
  let current = 0;

  function open(idx) {
    current = idx;
    caption.textContent = tiles[current].dataset.caption;
    indexEl.textContent = (current + 1) + ' / ' + tiles.length;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  function prev() { current = (current - 1 + tiles.length) % tiles.length; open(current); }
  function next() { current = (current + 1) % tiles.length; open(current); }

  tiles.forEach((t, i) => t.addEventListener('click', () => open(i)));
  document.getElementById('lightboxClose').addEventListener('click', close);
  document.getElementById('lightboxPrev').addEventListener('click', prev);
  document.getElementById('lightboxNext').addEventListener('click', next);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });
})();

/* ============================================================
   HEADER SCROLL + TOAST + HASHTAG COPY
   ============================================================ */
(function() {
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

(function() {
  const toast = document.getElementById('toast');
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  const tag = '#AtharvaWedsGautami';
  document.getElementById('hashtagBtn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(tag); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = tag; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e2) {}
      document.body.removeChild(ta);
    }
    showToast('Hashtag copied');
  });
  document.getElementById('drawerHashtag').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(tag); } catch (e) {}
    showToast('Hashtag copied');
  });
})();

/* ============================================================
   MAPS / DIRECTIONS
   ============================================================ */
(function() {
  /* Full name + address, not just the name: it pins the exact place even when a
     venue name is not unique. Google's guidance is query=PLACE_NAME, ADDRESS. */
  const DESTINATION = 'Ratnapriya Hotel & Resort, Indore-Ujjain Road, Ujjain, Madhya Pradesh';
  const UTM = 'utm_source=atharva-weds-gautami&utm_campaign=directions_request';

  /* Directions, not search. The old links were https://maps.google.com/?q=...,
     which is the legacy search form: it cannot produce a route, so "Get
     Directions" only ever opened a search result. With origin omitted, Maps
     defaults to the user's own location as the starting point. */
  function googleDirectionsUrl() {
    return 'https://www.google.com/maps/dir/?api=1'
      + '&destination=' + encodeURIComponent(DESTINATION)
      + '&travelmode=driving&' + UTM;
  }

  /* On iOS, Google Maps is often not installed, so craft an Apple Maps route
     instead. The name after 'q' keeps the pin labelled; the address after 'daddr'
     is what actually resolves. */
  function appleDirectionsUrl() {
    return 'https://maps.apple.com/?daddr=' + encodeURIComponent(DESTINATION)
      + '&q=' + encodeURIComponent('Ratnapriya Hotel & Resort') + '&dirflg=d';
  }

  function applyMapLinks() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const url = isIOS ? appleDirectionsUrl() : googleDirectionsUrl();
    const links = document.querySelectorAll('a[data-directions], a[href*="maps.google.com"], a[href*="maps.apple.com"]');
    links.forEach(function(a) { a.href = url; });
  }

  applyMapLinks();
})();

