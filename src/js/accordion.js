/*
<a class="js-toggler" data-foldid="myFold"></a>
<div id="myFold" class="js-fold"></a>
u$.accordion($(document.body));

<div class="container">
  <a class="js-toggler">1</a>
  <a class="js-toggler">2</a>

  <div class="js-fold">fold 1</div>
  <div class="js-fold">fold 2</div>
</div>
u$.accordion($('.container'));

<!-- list collections -->
<a class="js-toggler" data-type="article" data-id="12345"></a>
u$.accordion($(document.body), {
  url: 'path/to/get_article_list.html',
  folds: '<div class="fold js-fold"></div>' // appended after
});

*/
window.u$ || (window.u$ = {});

(function($, window, document, ns) {
'use strict';

ns || (ns = window);

var defaults = {
  collapsedClass: 'is-collapsed',

  /**
   * The prefix for the event namespace. The namespace is generated
   * as follows: `eventNamespace + 'Accordion:' + name + 'Event'`
   * For example, 'myAppAccordion:showEvent'.
   */
  eventNamespace: null,

  /**
   * A Backbone style events object that will be integrated
   * with the `accordion` object (on instantiation, via `$.extend`).
   * Any such object must implement a `trigger` method in order
   * to function properly.
   */
  events: null,

  expandedClass: 'is-expanded',

  /**
   * Either the existing fold `$` elements, a selector to fetch
   * existing folds from the DOM, or an HTML string that will be
   * passed to `$`, or an array of data that will be passed to `$`
   * to create a new fold when the AJAX data is fetched.
   *
      `folds: '.js-fold'`
   * - OR -
      `folds: $('.js-fold')`
   * - OR -
      `folds: ['<div />', {
        'class': 'js-fold'
      }]`
   * - OR -
      `folds: '<div class="fold"></div>'`
   */
  //folds: null,

  foldClass: 'js-fold',
  togglerClass: 'js-toggler'
},

initialize = function($container, options) {
  this.options = $.extend({}, this.options, (options || null));
  //this.$body = $(document.body);
  this.$container = $container;
  this.reset();

  this.attach($container);
},

setEvent = (function() {
  var callbacks = {
    toggle: function(e) {
      var index = this.$togglers.index(e.currentTarget),
        fold = this.getFold($(e.currentTarget), index);

      e.preventDefault();
      this.toggle(fold, index);
    },

    enterToggle: function(e) {
      var clicked = $(e.target);

      if (!clicked.hasClass(this.options.togglerClass)) {
        clicked = clicked.parent(this.options.togglerClass);
      }

      if (e.which === 13 && document.activeElement === clicked.get(0)) {
        e.preventDefault();
        callbacks.toggle.call(this, e);
      }
    }
  };

  return function(name, $elems, sel, event) {
    var base = this.options.eventNamespace || '',
      ns = base + 'Accordion.' + name + 'Event',
      callback = $.proxy(callbacks[name], this);

    $elems.on((event || 'click') + '.' + ns, sel, callback);
  };
})(),

accordionProto = {
  options: defaults,

  reset: function() {
    var opts = this.options;

    this.$togglers = this.$container.find('.' + opts.togglerClass);
    this.$folds = this.$container.find('.' + opts.foldClass);
  },

  attach: function($togglers) {
    var togglerClass = this.options.togglerClass,
      selector = $.isFunction(togglerClass) ? null : '.' + togglerClass;

    setEvent.call(this, 'toggle', $togglers, selector);
  },

  detach: function($togglers) {
    var ns = (this.options.eventNamespace || '') + 'Accordion',
      args;

    if ($togglers && $togglers.length) {
      $togglers.removeClass(this.options.togglerClass);
      this.$togglers = this.$togglers.not($togglers);
    } else {
      args = u$.detach(this, ns, '$togglers', '$container', '$folds');
    }

    args || (args = [$togglers]);
    args.unshift('detach');
    this.emit.apply(this, args);
  },

  toggle: function($fold, index) {
    var method = $fold.hasClass(this.options.expandedClass) ?
        'collapse' : 'expand';

    this[method]($fold, index);
  },

  expand: function($fold, index) {
    var height = $fold.data('maxheight') || $fold.css('max-height'),
      opts = this.options;

    this.emit('beforeShow', $fold, this.$togglers, index);
    $fold.removeClass(opts.collapsedClass).addClass(opts.expandedClass);
    
    u$.slideDown($fold, height);
    this.emit('show', $fold, this.$togglers, index);
  },

  collapse: function($fold, index) {
    this.emit('beforeHide', $fold, this.$togglers, index);
    $fold.slideUp({
      complete: function() {
        var opts = this.options;

        $fold.css('display', 'none').removeClass(opts.expandedClass).addClass(opts.collapsedClass);
      }.bind(this)
    });
    this.emit('hide', $fold, this.$togglers, index);
  },

  getFold: function($toggler, index) {
    var foldId = $toggler.data('foldid');

    return foldId ?  $('#' + foldId) : this.$folds.eq(index);
  },

  /**
   * Adds new togglers to `this.$togglers` and attaches events. If
   * `isDelegate` is deliberately set to `false`, then it is assumed
   * that the passed-in triggers are child elements of existing triggers.
   *
   * @param $togglers The new elements that will toggle accordion folds.
   * @param isDelegate Ignored by default. If set to Boolean `false`, then
   *        no click event will be added, just `this.options.togglerClass`.
   */
  add: function($togglers, isDelegate) {
    if (this.$togglers && isDelegate === false) {
      $togglers.addClass(this.options.togglerClass);
    } else {
      this.$togglers = this.$togglers?
          this.$togglers.add($togglers) : $togglers;
      
      this.attach($togglers);
    }
  },

  emit: function(name) {
    var events = this.options.events,
      start = events ? 0 : 1,
      method = events ? this.trigger : this.options['on' +
          name.charAt(0).toUpperCase() + name.slice(1)];

    if ($.isFunction(method)) {
      method.apply(this, [].slice.call(arguments, start));
    }
  }
},

ajaxAccordionProto = $.extend({}, u$.cacheMixin, u$.loaderMixin,
    accordionProto, {

  options: $.extend({}, defaults, {
    // loaderClass: 'loader--accordion',
    // loaderHTML: '<div />'
    // responseType: 'json', /* default; or 'HTML'*/
    // query: '' || function($toggler) {},
    // template: '<div>{{field}}</div>' || function($container, data) {}

    cache: true,
    folds: ['<div />', {
      'class': 'fold js-fold'
    }]
  }),

  toggle: function($fold, index) {

  },

  expand: function($fold, index) {

  },

  load: function($trigger) {
    var query = this.options.query,
      cache;

    if ($.isFunction(query)) {
      query = query($trigger);
    }

    cache = this.getCache(query);

    if (cache) {
      this.show(cache, $trigger);
    } else {
      $.ajax({
        url: this.options.url,
        data: query,
        beforeSend: function(xhr, settings) {
          this.showLoader();
          this.emit('beforeSend', $trigger, xhr, settings);
        }.bind(this),
        success: function(data, status, xhr) {
          this.hideLoader();
          this.setCache(query, xhr.responseText);
          this.show(xhr.responseText, $trigger);
        }.bind(this),
        error: function(xhr, errorType, error) {
          this.emit('ajaxError', $trigger, xhr, errorType, error);
        }.bind(this)
      });
    }
  }
});

ns.accordion = function($container, options) {
  var proto = accordionProto,
    instance;

  if (!u$.is$($container)) {
    options = $container;
    $container = null;
  }

  if (options && options.url) {
    proto = ajaxAccordionProto;
  }

  instance = Object.create(proto);

  if (options && options.events) {
    $.extend(instance, options.events);
  }

  initialize.call(instance, ($container && $container.eq(0)), options);

  return instance;
};

})((window.Zepto || window.jQuery), window, document, u$);