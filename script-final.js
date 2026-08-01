const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();


// Galerie BADAMAN TEE
const gallery = document.querySelector('[data-gallery="tee"]');
if (gallery) {
  const slides = [...gallery.querySelectorAll('.gallery-slide')];
  const thumbs = [...gallery.querySelectorAll('.gallery-thumb')];
  const counter = gallery.querySelector('.gallery-counter');
  const stage = gallery.querySelector('.gallery-stage');
  let current = 0;
  let touchStartX = 0;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    thumbs.forEach((thumb, i) => thumb.classList.toggle('is-active', i === current));
    counter.textContent = `${current + 1} / ${slides.length}`;
    thumbs[current]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    updateLightbox();
  };

  gallery.querySelector('.gallery-prev').addEventListener('click', () => show(current - 1));
  gallery.querySelector('.gallery-next').addEventListener('click', () => show(current + 1));
  thumbs.forEach((thumb) => thumb.addEventListener('click', () => show(Number(thumb.dataset.index))));
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  stage.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 45) show(current + (delta < 0 ? 1 : -1));
  }, { passive: true });

  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = lightbox.querySelector('img');
  const lightboxCounter = lightbox.querySelector('.lightbox-counter');
  const updateLightbox = () => {
    const img = slides[current].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCounter.textContent = `${current + 1} / ${slides.length}`;
  };
  const openLightbox = () => {
    updateLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };
  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };
  gallery.querySelector('.gallery-zoom').addEventListener('click', openLightbox);
  slides.forEach((slide) => slide.addEventListener('dblclick', openLightbox));
  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => show(current - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  show(0);
}

// Velikostní tabulka
const sizeGuideModal = document.getElementById('size-guide-modal');
const sizeGuideTrigger = document.querySelector('[data-size-guide]');
if (sizeGuideModal && sizeGuideTrigger) {
  const open = () => {
    sizeGuideModal.classList.add('is-open');
    sizeGuideModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };
  const close = () => {
    sizeGuideModal.classList.remove('is-open');
    sizeGuideModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };
  sizeGuideTrigger.addEventListener('click', open);
  sizeGuideModal.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sizeGuideModal.classList.contains('is-open')) close();
  });
}
