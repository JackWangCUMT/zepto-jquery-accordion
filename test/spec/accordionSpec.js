describe('Zepto-Compatible jQuery Accordion', function() {
  'use strict';

  var $togglers,
    $folds,
    instance;

  beforeEach(function() {
    $.fx.off = true;
  });
  afterEach(function() {
    // `instance` is created in the `beforeEach` block of each
    // nested `describe` block.
    instance.detach();
  });

  function clickToggler(i) {
    i || (i = 0);
    $togglers.eq(i).trigger('click');
  }

  function before() {
    loadFixtures('static.html');
    $togglers = $('.js-toggler');
    $folds = $('.js-fold');
  }

  function after() {
    $togglers.empty().remove();
    $folds.empty().remove();
  }

  describe('An instance', function() {

    beforeEach(function() {
      before();

      instance = u$.accordion($(document.body), {
        folds: $folds
      });
    });
    afterEach(function() {
      after();
    });

    it('can detach all events', function() {
      spyOn(instance, 'toggle');
      instance.detach();
      clickToggler();
      expect(instance.toggle).not.toHaveBeenCalled();
    });
  });

  describe('A toggler', function() {
    beforeEach(function() {
      before();

      instance = u$.accordion($(document.body), {
        folds: $folds
      });
    });
    afterEach(function() {
      after();
    });
    
    it('can be clicked to change the accordion', function() {
      spyOn(instance, 'toggle');

      clickToggler();
      expect(instance.toggle).toHaveBeenCalled();
    });
  });

  describe('A fold', function() {
    beforeEach(function() {
      before();

      instance = u$.accordion($(document.body), {
        folds: $folds
      });
    });
    afterEach(function() {
      after();
    });

    it('can be expanded', function() {
      clickToggler();
      expect($folds.first()).not.toHaveClass('is-collapsed');
    });

    it('can be expanded to its `data-maxheight` property', function() {
      var $fold = $folds.first();

      $fold.data('maxheight', '100px');
      clickToggler();
      expect($fold.css('height')).toEqual('100px');
    });

    it('can be expanded to its `max-height` CSS value', function() {
      var $fold = $folds.first();

      $fold.css('max-height', '100px');
      clickToggler();
      expect($fold.css('height')).toEqual('100px');
    });

    it('can be collapsed', function() {
      clickToggler();
      clickToggler();
      expect($folds.first()).toHaveClass('is-collapsed');
    });
  });

  /*describe('Event Emitter', function() {
    var onShow;

    beforeEach(function() {
      onShow = jasmine.createSpy('onShow');
 
      instance = u$.accordion({
        events: Backbone.Events
      });
    });

    it('can take a Backbone-style events object', function() {
      instance.on('show', onShow);

      instance.show($modals.eq(0));

      expect(onShow).toHaveBeenCalled();
    });

    it('can emit a callback set in the options', function() {
      instance.options.events = null;
      instance.options.onShow = onShow;

      instance.show($modals.eq(0));
      
      expect(onShow).toHaveBeenCalled()
    });
  });*/
});