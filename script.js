document.querySelectorAll('[data-gallery]').forEach((gallery) => {
  const track = gallery.querySelector('.video-gallery');
  gallery.querySelectorAll('[data-direction]').forEach((button) => {
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.direction);
      track.scrollBy({ left: direction * Math.min(track.clientWidth * 0.82, 430), behavior: 'smooth' });
    });
  });
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
setupMediaToggle('[data-fusion-view]', '[data-fusion-media]', 'fusionView', 'fusionMedia');

const teaserRegions = {
  A: {
    title: 'Single Policy',
    text: 'Directly merging multimodal inputs into a single policy makes the policy neither modular nor reactive.'
  },
  B: {
    title: 'Slow-fast Policy',
    text: 'A fast branch outputs actions at a higher frequency, improving reactiveness, but the policy remains non-modular.'
  },
  C: {
    title: 'Synchronous Fusion Policy',
    text: 'Modality-specific encoders make the policy modular, but every branch must wait for the slowest modality before fusion, making the overall policy non-reactive.'
  },
  D: {
    title: 'Our Asynchronous Fusion Policy',
    text: 'Modality-specific inference is decoupled and its outputs are composed with latency-aware guidance, preserving both modularity and high-frequency reactivity.'
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
