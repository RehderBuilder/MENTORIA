(function () {
  'use strict';

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const backToTop = document.getElementById('backToTop');
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');
  const watchedCountEl = document.getElementById('watchedCount');
  const progressFill = document.getElementById('progressFill');
  const videoCards = document.querySelectorAll('.video-card');

  const STORAGE_KEY = 'mentoria-cursor-videos';
  const TOTAL_VIDEOS = 3;
  const IS_LOCAL_FILE = window.location.protocol === 'file:';
  /* ----- Mobile navigation ----- */
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ----- Back to top ----- */
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        backToTop.hidden = false;
      } else {
        backToTop.hidden = true;
      }
    });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ----- Video progress tracking ----- */
  function getWatchedVideos() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveWatchedVideos(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  function updateProgressUI(watched) {
    const count = watched.length;
    if (watchedCountEl) watchedCountEl.textContent = String(count);
    if (progressFill) progressFill.style.width = (count / TOTAL_VIDEOS * 100) + '%';

    videoCards.forEach(function (card) {
      const id = card.getAttribute('data-video');
      if (watched.includes(id)) {
        card.classList.add('watched');
      }
    });
  }

  function markVideoWatched(id) {
    const watched = getWatchedVideos();
    if (!watched.includes(id)) {
      watched.push(id);
      saveWatchedVideos(watched);
      updateProgressUI(watched);
    }
  }

  function buildEmbedUrl(youtubeId, startSeconds) {
    const params = new URLSearchParams({
      start: String(startSeconds),
      rel: '0',
      modestbranding: '1',
      autoplay: '1',
      playsinline: '1'
    });

    params.set('origin', window.location.origin);

    return 'https://www.youtube.com/embed/' + youtubeId + '?' + params.toString();
  }

  function buildWatchUrl(youtubeId, startSeconds) {
    return 'https://www.youtube.com/watch?v=' + youtubeId + '&t=' + startSeconds + 's';
  }

  function showVideoFallback(wrapper, youtubeId, start) {
    if (wrapper.querySelector('.video-fallback')) {
      return;
    }

    const fallback = document.createElement('div');
    fallback.className = 'video-fallback';
    fallback.innerHTML =
      '<p>Não foi possível carregar o player aqui.</p>' +
      '<a href="' + buildWatchUrl(youtubeId, start) + '" target="_blank" rel="noopener noreferrer">Assistir no YouTube</a>';

    wrapper.appendChild(fallback);
  }

  function openOnYouTube(youtubeId, start, videoId) {
    window.open(buildWatchUrl(youtubeId, start), '_blank', 'noopener,noreferrer');
    if (videoId) {
      markVideoWatched(videoId);
    }
  }

  function loadVideo(wrapper) {
    if (wrapper.classList.contains('is-loaded')) {
      return;
    }

    const youtubeId = wrapper.getAttribute('data-youtube-id');
    const start = wrapper.getAttribute('data-start') || '0';
    const title = wrapper.getAttribute('data-title') || 'Tutorial Cursor';
    const card = wrapper.closest('.video-card');
    const videoId = card ? card.getAttribute('data-video') : null;

    if (IS_LOCAL_FILE) {
      openOnYouTube(youtubeId, start, videoId);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = buildEmbedUrl(youtubeId, start);
    iframe.title = title;
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';

    iframe.addEventListener('error', function () {
      showVideoFallback(wrapper, youtubeId, start);
    });

    window.setTimeout(function () {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc && iframeDoc.body && iframeDoc.body.textContent.indexOf('153') !== -1) {
          showVideoFallback(wrapper, youtubeId, start);
        }
      } catch (e) {
        /* cross-origin — iframe loaded normally */
      }
    }, 3000);

    wrapper.classList.add('is-loaded');
    wrapper.appendChild(iframe);

    if (videoId) {
      markVideoWatched(videoId);
    }
  }

  document.querySelectorAll('.video-wrapper').forEach(function (wrapper) {
    const playBtn = wrapper.querySelector('.video-play');
    if (!playBtn) {
      return;
    }

    playBtn.addEventListener('click', function () {
      loadVideo(wrapper);
    });
  });

  videoCards.forEach(function (card) {
    const videoInfo = card.querySelector('.video-info');
    if (videoInfo) {
      videoInfo.addEventListener('click', function () {
        const id = card.getAttribute('data-video');
        markVideoWatched(id);
      });
    }
  });

  updateProgressUI(getWatchedVideos());

  /* ----- Contact form ----- */
  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const nome = document.getElementById('nome');
      const email = document.getElementById('email');
      const nivel = document.getElementById('nivel');
      let valid = true;

      [nome, email, nivel].forEach(function (field) {
        field.classList.remove('error');
        if (!field.value.trim()) {
          field.classList.add('error');
          valid = false;
        }
      });

      if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.classList.add('error');
        valid = false;
      }

      if (!valid) {
        formFeedback.textContent = 'Preencha todos os campos obrigatórios corretamente.';
        formFeedback.className = 'form-feedback error';
        return;
      }

      formFeedback.textContent =
        'Obrigado, ' + nome.value.trim() + '! Sua solicitação foi registrada. Entraremos em contato em breve.';
      formFeedback.className = 'form-feedback success';
      contactForm.reset();
    });
  }

  /* ----- Smooth highlight on scroll (nav active state) ----- */
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  function highlightNav() {
    const scrollPos = window.scrollY + 100;

    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navAnchors.forEach(function (anchor) {
          anchor.style.color = '';
          if (anchor.getAttribute('href') === '#' + id) {
            anchor.style.color = 'var(--text)';
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNav);
  highlightNav();
})();
