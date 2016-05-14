(function () {

  var ROOT_CLASS = 'carousel';
  var SLIDES_CLASS = 'slides';
  var SLIDE_CLASS = 'slide';
  var INDICATORS_CLASS = 'indicators';
  var INDICATOR_CLASS = 'indicator';
  var ACTIVE_CLASS = 'active';
  var CONTROLS_CLASS = 'controls';
  var CONTROL_CLASS = 'control';
  var TRANSITION_SPEED = 300;
  var ACTIVE_INDICATOR_SELECTOR = ['.', INDICATOR_CLASS, '.', ACTIVE_CLASS].join('');
  var NAVIGATION_ACTIONS = ['prev', 'next'];

  var DIRECTION = {
    FORWARDS: 'forwards',
    BACKWARDS: 'backwards'
  };

  var POSITION = {
    CENTER: '0',
    LEFT: '-100%',
    RIGHT: '100%'
  };

  var DEFAULT_OPTIONS = {
    interval: 2000,
    direction: DIRECTION.FORWARDS
  };

  function positionSlide(slide, position, withTransition) {
    var transform = 'translate3d(' + position + ', 0, 0)';

    if (withTransition) {
      slide.style.transition = 'transform ' + TRANSITION_SPEED + 'ms';
      slide.style.WebkitTransition = '-webkit-transform ' + TRANSITION_SPEED + 'ms';
    }

    slide.style.transform = transform;
    slide.style.WebkitTransform = transform;
  }

  function Carousel(el, options) {
    this.element = el;
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.stateChangeListeners = [];
    this.state = {
      active: 0,
      navigating: false
    };

    this.render();
  }

  Carousel.prototype = {

    render: function () {
      var slidesContainer = this.element.querySelector('.' + SLIDES_CLASS);

      if (!this.element.classList.contains(ROOT_CLASS)) {
        this.element.classList.add(ROOT_CLASS); 
      }

      if (!slidesContainer) {
        throw new Error('no slides container find');
      }
      
      this.slides = slidesContainer.querySelectorAll('.' + SLIDE_CLASS);

      if (!this.slides.length) {
        throw new Error('no slides found');
      }

      this.listenForStateChange(this.update.bind(this));
      this.setupIndicators();
      this.setupControls();
      this.attachEventListeners();

      // Position initial slide.
      positionSlide(this.slides[this.state.active], POSITION.CENTER);
      this.updateIndicator();

      if (this.slides.length > 1) {
        this.scheduleNavigation();
      }

    },

    setupIndicators: function () {
      var indicatorContainer = this.element.querySelector('.' + INDICATORS_CLASS);
      var indicators;

      if (!indicatorContainer) {
        return;
      }

      indicators = indicatorContainer.querySelectorAll('.' + INDICATOR_CLASS);

      if (!indicators.length) {
        throw new Error('empty indicator container found.');
      }

      this.indicators = Array.prototype.slice.call(indicators);
      this.indicators.forEach(function (indicator) {
        var index = indicator.dataset.slide;

        if (index === undefined) {
          throw new Error('Indicator found without slide number, please use data-slide attribute.');
        }

        index = parseInt(index);

        if (isNaN(index) || index >= this.slides.length) {
          throw new Error('Wrong indicator slide value found.');
        }

        indicator.addEventListener('click', function (event) {
          // Do not bind show to filter input event.
          this.show(index);
        }.bind(this));
      }.bind(this));
    },

    setupControls: function () {
      var controlContainer = this.element.querySelector('.' + CONTROLS_CLASS);
      var controls;

      if (!controlContainer) {
        return;
      }

      controls = controlContainer.querySelectorAll('.' + CONTROL_CLASS);

      if (!controls.length) {
        throw new Error('empty control container found.');
      }

      controls = Array.prototype.slice.call(controls);
      controls.forEach(function (control) {
        var action = control.dataset.navigate;

        if (NAVIGATION_ACTIONS.indexOf(action) === -1) {
          throw new Error('Control found with unvalid navigation action.');
        }

        control.addEventListener('click', this[action].bind(this));
      }.bind(this));
    },

    attachEventListeners: function () {
      this.element.addEventListener('transitionend', this.onTransitionEnd.bind(this));
    },

    setState: function (update) {
      var oldState = Object.assign({}, this.state);
      var newState = Object.assign({}, this.state, update);

      this.state = newState;

      this.stateChangeListeners.forEach(function (listener) {
        listener(oldState, newState);
      });
    },

    listenForStateChange: function (listener) {
      this.stateChangeListeners.push(listener);
    },

    scheduleNavigation: function (direction, immediate) {
      var time = immediate ? 0 : this.options.interval;
      direction = direction || this.options.direction;

      if (this.scheduledNagivation) {
        clearTimeout(this.scheduledNagivation);
      }

      this.scheduledNagivation = setTimeout(function triggerNavigation() {
        this.scheduledNagivation = undefined;
        this.navigate(direction);
      }.bind(this), time);
    },

    show: function (index, direction) {
      if (this.state.navigating) {
        return;
      }

      this.setState({ 
        active: index,
        direction: direction,
        navigating: true
      });
    },

    navigate: function (direction) {
      var active = this.state.active;
      var next;

      if (direction === DIRECTION.FORWARDS) {
        if (active + 1 >= this.slides.length) {
          next = 0;
        } else {
          next = active + 1;
        }
      } else if (direction === DIRECTION.BACKWARDS) {
        if (active - 1 < 0) {
          next = this.slides.length - 1;
        } else {
          next = active - 1;
        }
      } else {
        return;
      }

      this.show(next, direction);
    },

    prev: function () {
      this.navigate(DIRECTION.BACKWARDS);
    },

    next: function () {
      this.navigate(DIRECTION.FORWARDS);
    },

    update: function (prevState, newState) {
      var needUpdate = prevState.active !== newState.active;

      if (!needUpdate) {
        return;
      }
      
      this.updateSlide(prevState.active, newState.active, newState.direction);
      this.updateIndicator();
    },

    updateSlide: function (prev, next, direction) {
      var activeIndex = this.state.active;

      if (!direction) {
        direction = next > prev ? DIRECTION.FORWARDS : DIRECTION.BACKWARDS;
      }

      prev = this.slides[prev];
      next = this.slides[next];

      this.leaving = prev;
      this.active = next;

      // Position the next slide correctly to appear on the correct side.
      positionSlide(next, direction === DIRECTION.FORWARDS ? POSITION.RIGHT : POSITION.LEFT);

      /*
        We need to let the browser first position the next slide on the correct side,
        so we scheduled the transition start in the browser's next frame.
        !Not sure why but it takes two animation frames to put the next slide in position.
      */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          positionSlide(prev, direction === DIRECTION.FORWARDS ? POSITION.LEFT : POSITION.RIGHT, true);
          positionSlide(next, POSITION.CENTER, true);
        });
      });
    },

    updateIndicator: function () {
      var activeIndex = this.state.active;
      var activeIndicator = this.element.querySelector(ACTIVE_INDICATOR_SELECTOR);

      if (activeIndicator) {
        activeIndicator.classList.remove(ACTIVE_CLASS);
      }

      activeIndicator = this.element.querySelector('.indicator[data-slide="' + activeIndex + '"]');

      if (activeIndicator) {
        activeIndicator.classList.add(ACTIVE_CLASS);
      }
    },

    onTransitionEnd: function (event) {
      event.target.style.transition = 'none';
      event.target.style.WebkitTransition = 'none';

      if (event.target === this.leaving) {
        this.leaving = undefined;
      }

      if (event.target === this.active) {
        this.active = undefined;
      }

      /*
        Once both slide's transitions are ended,
        we can consider that the navigation is finished.
      */
      if (!this.active && !this.leaving) {
        this.setState({ navigating: false });
        this.scheduleNavigation();
      }
    }

  };

  Carousel.DIRECTION = DIRECTION;

  window.Carousel = Carousel;

})(window);