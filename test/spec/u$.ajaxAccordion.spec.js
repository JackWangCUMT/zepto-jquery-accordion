describe('Zepto-Compatible jQuery AJAX Accordion', function() {
  'use strict';

  var html = '<div data-id="12345">Test accordion contents</div>',
    jsonObj = '{"id": 12345, "text": "Test accordion contents"}',
    jsonArr = '[{"id": 12345,"text": "Test accordion contents"}]',
    $togglers,
    $folds,
    instance;

  function clickToggler(i) {
    i || (i = 0);
    $togglers.eq(i).trigger('click');
  }

  function openClose(instance) {
    if (instance) {
      clickToggler();
      $folds = instance.$folds;
      instance.collapse($folds.first());
    }
  }

  beforeEach(function() {
    loadFixtures('static.html');
    $togglers = $('.js-toggler');
    $folds = $('.js-fold');
    $.fx.off = true;

    instance = u$.accordion($(document.body), {
      folds: $folds,
      responseType: 'json',
      url: '/path/to/ajax.json',
      template: '<div data-id="{{id}}">{{text}}</div>',
      setAriaAttributes: false
    });
  });
  afterEach(function() {
    // `instance` is created in the `beforeEach` block of each
    // nested `describe` block.
    instance.detach();
    $togglers.remove();
    $folds.remove();
    $togglers = $folds = null;
  });

  it('can be generated with a JSON Array', function() {
    spyOn($, 'ajax').andCallFake(function(params) {
      params.success(null, null, {responseText: jsonArr});
    });

    clickToggler();

    expect(instance.$folds.first().html()).toEqual(html);
  });

  it('can build AJAX data from a function', function() {
    var query;

    instance.options.query = function($fold, index, $togglers) {
      return 'a=1&b=2&c=e';
    };

    spyOn(instance, 'send').andCallFake(function(data) {
      query = data;
    });

    clickToggler();
    expect(query).toEqual('a=1&b=2&c=e');
  });

  it('can be generated with a JSON Object', function() {
    spyOn($, 'ajax').andCallFake(function(params) {
      params.success(null, null, {responseText: jsonObj});
    });

    clickToggler();

    expect(instance.$folds.first().html()).toEqual(html);
  });

  it('can be generated from an HTML string', function() {
    instance.options.responseType = 'html';

    spyOn($, 'ajax').andCallFake(function(params) {
      params.success(null, null, {responseText: html});
    });

    clickToggler();

    expect(instance.$folds.first().html()).toEqual(html);
  });

  it('can be generated from a template function', function() {
    var $div;
    
    appendLoadFixtures('template.html');

    instance.options.template = function($container, data) {
      var source = $('#handlebars-template').html(),
        template = Handlebars.compile(source);

      $container.html(template(data));
    };

    spyOn($, 'ajax').andCallFake(function(params) {
      params.success(null, null, {responseText: jsonObj});
    });

    clickToggler();

    $div = instance.$folds.first().find('div');
    expect($div.data('id')).toEqual(12345);
    expect($div.text()).toEqual('Test accordion contents');
  });

  it('can be rendered from the cache', function() {
    var i = 0,
      $fold;

    spyOn($, 'ajax').andCallFake(function(params) {
      i += 1;
      params.success(null, null, {responseText: jsonObj});
    });

    // 1. Load HTML from AJAX data
    // 2. Collapse the fold
    // 3. Clear out the fold HTML
    // 4. Reload the fold from cache
    openClose(instance);
    
    $fold = instance.$folds.first().html('');
    clickToggler();

    expect(i).toBe(1);
    expect($fold.html()).toEqual(html);
  });

  it('can be displayed with an AJAX loader image', function() {
    instance.options.loaderClass = 'loader--accordion';
    instance.showLoader();

    expect(instance.$loader).toHaveClass('loader--accordion');

    instance.hideLoader();

    expect(instance.$loader).toBe(null);
  });
});