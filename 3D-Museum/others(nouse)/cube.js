$(document).ready(function() {
  // with minimal configuration and default setting
  var slides = [];
  slides.push({
    src: 'https://i.imgur.com/gINAASV.jpg'
  });
  for (var i = 0; i < 5; i++) {
    slides.push({
      src: 'http://i.imgur.com/iwUEtVb.jpg'
    })
  }
  
  $('.jR3DCarouselGalleryDefault').jR3DCarousel({
      slides: slides,
      slideLayout: 'cover',
  });

  // Or with options
  $('.jR3DCarouselGalleryCustom').jR3DCarousel({
    height: 600,
    width: 800,
    slideLayout: 'cover',
    /* "contain" (fit according to aspect ratio), "fill" (stretches object to fill) and "cover" (overflows box but maintains ratio) */
    animation: 'slide3D',
    /* slide | scroll | fade | zoomInSlide | zoomInScroll */
    animationCurve: 'ease',
    animationDuration: 700,
    animationInterval: 1000,
    slideClass: 'jR3DCarouselCustomSlide',
    autoplay: false,
    onSlideShow: shown,
    /* callback when Slide show event occurs */
    navigation: 'circles' /* circles | squares */ ,
    perspective: 4000
  });

  function shown(slide) {
    console.log("Slide shown: ", slide.find('img').attr('src'));
  }
});

new Vue({
  el: '#example',
  data: {
    slides: 7
  },
  components: {
    'carousel-3d': Carousel3d.Carousel3d,
    'slide': Carousel3d.Slide
  }
})