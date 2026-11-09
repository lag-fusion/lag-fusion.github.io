// Autoplay visible clips; preserve manual pauses until a clip leaves the view.
const demoVideos = [...document.querySelectorAll('video')];
const visibleDemoVideos = new Set();
const resumeAfterBackground = new Set();
const isVideoVisible = (video) => {
  const rect = video.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const track = video.closest('.video-gallery')?.getBoundingClientRect();
  const left = Math.max(0, rect.left, track?.left ?? 0);
  const right = Math.min(innerWidth, rect.right, track?.right ?? innerWidth);
  const top = Math.max(0, rect.top, track?.top ?? 0);
  const bottom = Math.min(innerHeight, rect.bottom, track?.bottom ?? innerHeight);
  return Math.max(0, right - left) * Math.max(0, bottom - top) / (rect.width * rect.height) >= 0.25;
};
const playDemo = (video) => {
  video.muted = true;
  video.play().then(() => {
    if (document.hidden || !isVideoVisible(video)) video.pause();
  }).catch(() => {}); // Native controls remain available if autoplay is blocked.
};
let playbackFrame = 0;
const updateDemoPlayback = () => {
  playbackFrame = 0;
  demoVideos.forEach((video) => {
    const wasVisible = visibleDemoVideos.has(video);
    if (isVideoVisible(video)) {
      visibleDemoVideos.add(video);
      if (!wasVisible && !document.hidden) playDemo(video);
    } else {
      visibleDemoVideos.delete(video);
      resumeAfterBackground.delete(video);
      video.pause();
    }
  });
};
const schedulePlaybackUpdate = () => {
  if (!playbackFrame) playbackFrame = requestAnimationFrame(updateDemoPlayback);
};
demoVideos.forEach((video) => {
  video.muted = true;
  video.addEventListener('play', () => {
    if (document.hidden || !isVideoVisible(video)) video.pause();
  });
});
// Capture scroll events from both the page and each horizontal carousel.
document.addEventListener('scroll', schedulePlaybackUpdate, { capture: true, passive: true });
window.addEventListener('resize', schedulePlaybackUpdate);
window.addEventListener('load', schedulePlaybackUpdate);
schedulePlaybackUpdate();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    demoVideos.forEach((video) => {
      if (!video.paused) resumeAfterBackground.add(video);
      video.pause();
    });
  } else {
    updateDemoPlayback();
    resumeAfterBackground.forEach((video) => {
      if (isVideoVisible(video)) playDemo(video);
    });
    resumeAfterBackground.clear();
  }
});
const resolveDemoAlias = () => {
  const aliases = { '#vision-force': 'flip-videos', '#vision-vision': 'pnp-videos' };
  const target = document.getElementById(aliases[location.hash]);
  if (target) target.scrollIntoView({ block: 'start' });
};
window.addEventListener('hashchange', resolveDemoAlias);
resolveDemoAlias();

document.querySelectorAll('[data-gallery]').forEach((gallery) => {
  const track = gallery.querySelector('.video-gallery');
  const buttons = [...gallery.querySelectorAll('[data-direction]')];
  const updateButtons = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    buttons.forEach((button) => {
      button.disabled = Number(button.dataset.direction) < 0
        ? track.scrollLeft <= 1
        : track.scrollLeft >= maxScroll - 1;
    });
  };
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.direction);
      const step = track.firstElementChild.getBoundingClientRect().width
        + (parseFloat(getComputedStyle(track).columnGap) || 0);
      track.scrollBy({ left: direction * step, behavior: 'smooth' });
    });
  });
  track.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();
});

const setupMediaToggle = (buttonSelector, mediaSelector, viewDataKey, mediaDataKey) => {
  const viewButtons = document.querySelectorAll(buttonSelector);
  const mediaItems = document.querySelectorAll(mediaSelector);

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedView = button.dataset[viewDataKey];

      viewButtons.forEach((viewButton) => {
        const isActive = viewButton === button;
        viewButton.classList.toggle('active', isActive);
        viewButton.setAttribute('aria-pressed', String(isActive));
      });

      mediaItems.forEach((media) => {
        const isActive = media.dataset[mediaDataKey] === selectedView;
        media.hidden = !isActive;

        if (media instanceof HTMLVideoElement) {
          if (isActive) {
            media.currentTime = 0;
            media.play().catch(() => {});
          } else {
            media.pause();
          }
        }
      });
    });
  });
};

setupMediaToggle('[data-method-view]', '[data-method-media]', 'methodView', 'methodMedia');

const teaserRegions = {
  A: {
    title: 'Unified Policies',
    text: 'Multiple inputs share one pipeline, without independent components or native-rate inference.'
  },
  B: {
    title: 'Slow-fast & Hierarchical Policies',
    text: 'Components run at different rates within a coupled architecture.'
  },
  C: {
    title: 'Synchronous Policy Composition',
    text: 'Independent policies share one inference rate, limited by the slower components.'
  },
  D: {
    title: 'MATE: Modular & Rate-preserving',
    text: 'Independent policies retain their native rates, with guidance aligned and fused asynchronously.'
  }
};

document.querySelectorAll('[data-teaser-explorer]').forEach((explorer) => {
  const hotspots = [...explorer.querySelectorAll('[data-teaser-region]')];
  const tooltip = explorer.querySelector('.teaser-tooltip');
  const kicker = tooltip.querySelector('.teaser-tooltip-kicker');
  const title = tooltip.querySelector('h3');
  const description = tooltip.querySelector('p');
  let pinned = false;

  const hideTooltip = () => {
    tooltip.hidden = true;
    hotspots.forEach((hotspot) => hotspot.classList.remove('active'));
  };

  const showTooltip = (hotspot) => {
    const region = hotspot.dataset.teaserRegion;
    const content = teaserRegions[region];
    kicker.textContent = `Region ${region}`;
    title.textContent = content.title;
    description.textContent = content.text;
    tooltip.classList.toggle('teaser-tooltip-right', region === 'C' || region === 'D');
    tooltip.hidden = false;
    hotspots.forEach((item) => item.classList.toggle('active', item === hotspot));
  };

  hotspots.forEach((hotspot) => {
    hotspot.addEventListener('pointerenter', () => showTooltip(hotspot));
    hotspot.addEventListener('focus', () => showTooltip(hotspot));
    hotspot.addEventListener('click', () => {
      pinned = true;
      showTooltip(hotspot);
    });
  });

  explorer.addEventListener('pointerleave', () => {
    if (!pinned && !explorer.contains(document.activeElement)) hideTooltip();
  });
  explorer.addEventListener('focusout', (event) => {
    if (!pinned && !explorer.contains(event.relatedTarget)) hideTooltip();
  });
  explorer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      pinned = false;
      hideTooltip();
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!explorer.contains(event.target)) {
      pinned = false;
      hideTooltip();
    }
  });
});

const tocLinks = [...document.querySelectorAll('.toc a')];
const sectionMap = new Map(tocLinks.map((link) => [link.getAttribute('href').slice(1), link]));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    tocLinks.forEach((link) => link.classList.remove('active'));
    sectionMap.get(entry.target.id)?.classList.add('active');
  });
}, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });

document.querySelectorAll('section[id]').forEach((section) => observer.observe(section));

document.querySelectorAll('[data-bibtex-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const code = button.parentElement?.querySelector('code');
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code.textContent);
      const previous = button.textContent;
      button.textContent = 'Copied';
      window.setTimeout(() => {
        button.textContent = previous;
      }, 1600);
    } catch {
      button.textContent = 'Failed';
      window.setTimeout(() => {
        button.textContent = 'Copy';
      }, 1600);
    }
  });
});
