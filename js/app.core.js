/* ============================================================
   Core: envelope intro + background music globals
   Extracted from the original single-file invitation.
   Depends on: none — must load first (defines tryStartMusic)
   ============================================================ */

/* ============================================================
   ENVELOPE
   ============================================================ */
(function() {
  const overlay = document.getElementById('envelopeOverlay');
  const env = document.getElementById('envelope');
  const wrap = document.getElementById('envelopeWrap');
  const replay = document.getElementById('replayBtn');

  /* localStorage throws a SecurityError under file:// — never let storage
     access break the envelope, so the listener below always attaches. */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    remove(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  const hasSeen = store.get('wedding-envelope-seen') === '1';

  function hideEnvelope(immediate) {
    overlay.classList.add('hidden');
    document.body.classList.remove('envelope-closed');
    setTimeout(() => { overlay.style.display = 'none'; }, immediate ? 50 : 700);
  }

  function openEnvelope() {
    if (env.classList.contains('open')) return;
    env.classList.add('open');
    if (typeof tryStartMusic === 'function') tryStartMusic();
    setTimeout(() => hideEnvelope(false), 1400);
    store.set('wedding-envelope-seen', '1');
  }

  wrap.addEventListener('click', openEnvelope);
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); }
  });

  if (hasSeen) {
    hideEnvelope(true);
  } else {
    document.body.classList.add('envelope-closed');
  }

  if (replay) {
    replay.addEventListener('click', () => {
      store.remove('wedding-envelope-seen');
      location.reload();
    });
  }
})();

/* ============================================================
   MUSIC (must be defined before envelope calls it)
   ============================================================ */
const music = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicBtn');
let musicStarted = false;

/* Play the track at 90% speed. pitch is left at its default ('preserve'), so the
   slower tempo does not also flatten the pitch. The rate sticks across pause and
   resume, so setting it once here is enough. */
const MUSIC_RATE = 0.9;
music.playbackRate = MUSIC_RATE;

/* The music file is NOT committed to the repository (it is a third-party
   recording). If it is absent the browser fires an error on the <audio> element
   and the button would sit there doing nothing, so hide it and disable the
   feature cleanly. Add the track at audio/background-music.mp3 to restore it. */
let musicUnavailable = false;
function musicFailed() {
  if (musicUnavailable) return;
  musicUnavailable = true;
  musicStarted = false;
  if (musicBtn) musicBtn.hidden = true;
}
music.addEventListener('error', musicFailed, true);

/* The error may already have fired before this script ran (the audio element
   precedes it in the document), so re-check once the page has settled. */
window.addEventListener('load', function() {
  if (music.error) musicFailed();
});

function fadeVolume(audio, from, to, duration) {
  const steps = 30;
  const stepTime = duration / steps;
  let i = 0;
  const interval = setInterval(() => {
    i++;
    audio.volume = Math.min(1, Math.max(0, from + (to - from) * (i / steps)));
    if (i >= steps) clearInterval(interval);
  }, stepTime);
}

function tryStartMusic() {
  if (musicUnavailable) return;
  if (musicStarted || !music.paused) return;
  music.volume = 0;
  // Never swallow this rejection: if the browser blocks playback we must know,
  // so the gesture-retry fallback below can take over.
  music.play().then(() => {
    musicStarted = true;
    fadeVolume(music, 0, TARGET_VOLUME, 2000);
    updateMusicBtn(true);
  }).catch((err) => {
    // A missing or undecodable file is not an autoplay problem, so retrying on
    // the next gesture would never succeed — hide the control instead.
    if (music.error || (err && err.name === 'NotSupportedError')) { musicFailed(); return; }
    music.volume = TARGET_VOLUME;
    updateMusicBtn(false);
    if (window.console && console.debug) console.debug('Autoplay blocked:', err && err.name);
    armMusicGestureFallback();
  });
}

/* Browsers only allow audio to begin from a real user gesture. If the tap that
   opened the envelope was not recognised as one, arm a one-shot listener that
   starts the music on the guest's next interaction anywhere on the page. */
let musicFallbackArmed = false;
function armMusicGestureFallback() {
  if (musicFallbackArmed || musicStarted) return;
  musicFallbackArmed = true;
  const attempt = () => {
    removeEventListener('pointerdown', attempt, true);
    removeEventListener('keydown', attempt, true);
    removeEventListener('touchstart', attempt, true);
    musicFallbackArmed = false;
    tryStartMusic();
  };
  addEventListener('pointerdown', attempt, true);
  addEventListener('keydown', attempt, true);
  addEventListener('touchstart', attempt, true);
}

function updateMusicBtn(playing) {
  musicBtn.classList.toggle('playing', playing);
  musicBtn.classList.toggle('paused', !playing);
}

const TARGET_VOLUME = 0.8;

function pauseMusic(fadeMs) {
  fadeVolume(music, music.volume, 0, fadeMs);
  setTimeout(() => music.pause(), fadeMs + 20);
  // tryStartMusic() is guarded by musicStarted, so clearing it here is what lets
  // the button resume playback after a pause.
  musicStarted = false;
  musicFallbackArmed = false;
  updateMusicBtn(false);
}

musicBtn.addEventListener('click', () => {
  if (music.paused) {
    tryStartMusic();
  } else {
    pauseMusic(400);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && !music.paused) {
    pauseMusic(120);
    music.dataset.wasPlaying = '1';
  } else if (!document.hidden && music.dataset.wasPlaying === '1') {
    music.volume = TARGET_VOLUME; // pauseMusic faded it to 0; restore before playing
    music.play().catch(() => {});
    music.dataset.wasPlaying = '';
  }
});

