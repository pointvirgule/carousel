(function () {
  var Carousel = window.Carousel;
  var doc = window.document;
  var carouselEl = doc.getElementById('carousel');

  new Carousel(carouselEl, {
  	interval: 5000
  	//direction: Carousel.DIRECTION.BACKWARDS
  });

})(window);

