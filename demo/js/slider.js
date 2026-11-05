(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var slider = document.querySelector('.hero-slider');
    if (!slider) return;

    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('.hero-dots button'));
    var current = 0;
    var timer;

    function goTo(index) {
      slides[current].classList.remove('is-active');
      dots[current].classList.remove('is-active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current].classList.add('is-active');
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function restart() {
      clearInterval(timer);
      timer = setInterval(next, 5000);
    }

    slider.querySelector('.hero-arrow.next').addEventListener('click', function () { next(); restart(); });
    slider.querySelector('.hero-arrow.prev').addEventListener('click', function () { prev(); restart(); });
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { goTo(i); restart(); });
    });

    restart();
  });
})();
