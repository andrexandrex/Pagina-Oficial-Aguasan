(function () {
  'use strict';

  var gallery = document.querySelector('[data-story-gallery]');
  if (!gallery) return;

  var links = Array.prototype.slice.call(document.querySelectorAll('[data-story-gallery-item]'));
  if (!links.length) return;

  var image = gallery.querySelector('[data-story-gallery-image]');
  var caption = gallery.querySelector('[data-story-gallery-caption]');
  var count = gallery.querySelector('[data-story-gallery-count]');
  var closeButton = gallery.querySelector('[data-story-gallery-close].story-lightbox-close');
  var previousButton = gallery.querySelector('[data-story-gallery-prev]');
  var nextButton = gallery.querySelector('[data-story-gallery-next]');
  var activeIndex = 0;
  var lastFocused = null;

  function render(index) {
    activeIndex = (index + links.length) % links.length;
    var link = links[activeIndex];
    var thumbnail = link.querySelector('img');
    image.src = link.getAttribute('href');
    image.alt = thumbnail ? thumbnail.getAttribute('alt') || '' : '';
    caption.textContent = link.getAttribute('data-story-caption') || 'Registro visual';
    count.textContent = (activeIndex + 1) + ' / ' + links.length;
  }

  function open(index) {
    lastFocused = document.activeElement;
    render(index);
    gallery.hidden = false;
    document.body.classList.add('story-gallery-open');
    closeButton.focus();
  }

  function close() {
    gallery.hidden = true;
    document.body.classList.remove('story-gallery-open');
    image.removeAttribute('src');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  links.forEach(function (link, index) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      open(index);
    });
  });

  previousButton.addEventListener('click', function () { render(activeIndex - 1); });
  nextButton.addEventListener('click', function () { render(activeIndex + 1); });

  gallery.addEventListener('click', function (event) {
    if (event.target.hasAttribute('data-story-gallery-close')) close();
  });

  document.addEventListener('keydown', function (event) {
    if (gallery.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') render(activeIndex - 1);
    if (event.key === 'ArrowRight') render(activeIndex + 1);
    if (event.key === 'Tab' && event.shiftKey && document.activeElement === closeButton) {
      event.preventDefault();
      nextButton.focus();
    } else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === nextButton) {
      event.preventDefault();
      closeButton.focus();
    }
  });
}());
