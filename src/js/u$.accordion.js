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

  multiOpen: true,

  togglerClass: 'js-toggler'
},

/**
 * Attaches click and keyup events to open/close folds.
 * Both the 'enter' and space bar keys can trigger the event.
 * All events are namespaced.
 *
 * @param name The name of the event for the namespace.
 * @param $elems The `$` element(s) to which the event will be bound.
 * @param sel The selector for event delegation.
 * @param event The event name. `click` (default) or `keyup`.
 */
setEvent = (function() {
  var callbacks = {
    toggle: function(e) {
      var index = this.$togglers.index(e.currentTarget),
        $fold = this.getFold($(e.currentTarget), index);

      e.preventDefault();
      this.toggle($fold, index);
    },

    keyToggle: function(e) {
      var $toggler = $(e.currentTarget);

      if ((e.which === 13 || e.which === 32) &&
            $toggler.hasClass(this.options.togglerClass)) {
        
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

  /**
   * Sets options, sets fold and toggler collections, and
   * attaches events.
   *
   * @param $container The `$` element that contains the togglers and folds.
   * @param options An object of options to override the defaults.
   */
  initialize: function($container, options) {
    this.options = $.extend({}, this.options, (options || null));
    this.$container = $container;

    this.reset();
    this.attach($container);
  },

  /**
   * Resets the togglers and folds collections, retrieving them
   * from the DOM.
   */
  reset: function() {
    var opts = this.options;

    this.$togglers = this.$container.find('.' + opts.togglerClass);
    this.$folds = this.$container.find('.' + opts.foldClass);
  },

  /**
   * Attaches `click` and `keyup` events to open/close the folds.
   *
   * @param $elems The `$` elements to which the events will be attached. 
   */
  attach: function($elems) {
    var togglerClass = this.options.togglerClass,
      selector = $.isFunction(togglerClass) ? null : '.' + togglerClass;

    // set the click event
    setEvent.call(this, 'toggle', $elems, selector);

    // set the keyup event
    setEvent.call(this, 'keyToggle', $elems, selector, 'keyup');
  },

  /**
   * Either removes togglers from the collection or completely
   * detaches the instance, cleaning it up for garbage collection.
   *
   * @param $togglers If provided, these will be removed from the collection.
   *                  Otherwise, all events will be detached from the instance.
   *
   * @fires `detach($togglers, $container, $folds);`
   */
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

  /**
   * Determines whether the passed-in $fold should be opened or closed.
   *
   * I'm not the biggest fan of the `this.options.url` bit, since it's
   * only ever used by `ajaxAccordionProto` instances, but duplicating
   * or separating out the method seemed unnecessary.
   *
   * @param $fold The `$` fold to open or close.
   * @param index The index of the fold in the collection.
   */
  toggle: function($fold, index) {
    var method = $fold.hasClass(this.options.expandedClass) ?
        'collapse' : this.options.url ? 'load' : 'expand';

    this[method]($fold, index);
  },

  /**
   * Opens a fold. If the fold's `data-maxheight` attribute is set, or
   * if the fold has a `max-height` CSS value, the fold will be expanded
   * to that. Otherwise, the fold will be expanded to its full height.
   *
   * @param $fold The `$` element to open.
   * @param index The index of the fold in the collection.
   *
   * @fires `beforeShow($fold, $togglers, index);`
   * @fires `show($fold, $togglers, index);`
   */
  expand: function($fold, index) {
    var height = $fold.data('maxheight') || $fold.css('max-height'),
      opts = this.options;

    this.emit('beforeShow', $fold, this.$togglers, index);
    $fold.removeClass(opts.collapsedClass).addClass(opts.expandedClass);
    
    u$.slideDown($fold, height);

    if (!this.options.multiOpen) {
      this.collapseAll($fold);
    }
    
    this.emit('show', $fold, this.$togglers, index);
  },

  /**
   * Collapses all folds except the optional passed-in fold.
   *
   * @param $current The `$` element currently being viewed. If sepcified,
   *                 this fold will not be collapsed with the others.
   */
  collapseAll: function($current) {
    this.$folds.each(function(i, fold) {
      if ($current && fold !== $current.get(0)) {
        this.collapse($(fold), i);
      }
    }.bind(this));
  },

  /**
   * Collapses a fold.
   *
   * @param $fold The `$` element to be collapsed.
   * @param index The index of the fold in the collection.
   *
   * @fires `beforeHide($fold, $togglers, index);`
   * @fires `hide($fold, $togglers, index);
   */
  collapse: function($fold, index) {
    this.emit('beforeHide', $fold, this.$togglers, index);
    $fold.slideUp({
      complete: function() {
        var opts = this.options;

        $fold.css('display', 'none').removeClass(opts.expandedClass).
            addClass(opts.collapsedClass);
      }.bind(this)
    });
    this.emit('hide', $fold, this.$togglers, index);
  },

  /**
   * Either fetches a fold from the DOM, or returns the fold
   * at the specified index in the collection. In order to
   * retrieve a fold from the DOM, the specified toggler must
   * have a `data-foldid` attribute, whose value represents the
   * `id` attribute of the fold.
   *
   * @param $toggler The `$` toggler element.
   * @param index The index of the fold in the collection.
   *
   * @returns The `$` fold element.
   */
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

  /**
   * Emits the specified event, executing any registered callbacks.
   * Either a Backbone-style event emitter can used in the options,
   * or functions added as options (e.g., `onBeforeShow: function() {}`)
   * can be registered.
   *
   * @param The event name.
   */
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

ajaxAccordionProto = $.extend(Object.create(accordionProto), u$.cacheMixin,
    u$.loaderMixin, {

  options: $.extend({}, defaults, {
    // loaderClass: 'loader--accordion',
    // loaderHTML: '<div />'
    // responseType: 'html', /* default; or 'json'*/
    // query: '' || function($toggler) {},
    // template: '<div>{{field}}</div>' || function($container, data) {}

    /**
     * Should the AJAX results be cached? If `true`, then the URL and the
     * `data` value passed to `$.ajax` will be used to set the cache.
     */
    cache: true
  }),

  /**
   * Translates the HTML or JSON response into HTML and injects it
   * into the fold, then expands it.
   *
   * @param response The HTML or JSON response text.
   * @param $fold The `$` fold element.
   * @param index The index of the fold in the collection.
   */
  render: function(response, $fold, index) {
    if (this.options.responseType === 'json') {
      u$.renderJSON($fold, response, this.options.template);
    } else {
      $fold.html(response);
    }

    this.expand($fold, index);
  },

  /**
   * Either loads the fold HTML from the cache or fetches it
   * from the server. Generates the query string for the cache,
   * either directly from a specified string, or from a function.
   *
   * @param $fold The `$` fold element to be populated and expanded.
   * @param index The index of the fold in the collection.
   */
  load: function($fold, index) {
    var query = this.options.query,
      cache;

    if ($.isFunction(query)) {
      query = query($fold, index, this.$togglers);
    }

    cache = this.getCache(query);

    if (cache) {
      this.render(cache, $fold, index);
    } else {
      this.send(query, $fold, index);
    }
  },

  /**
   * Fetches fold contents from the servers.
   *
   * @param query The `data` for the request.
   * @param $fold The `$` fold element to populate and expand.
   * @param index The index of the fold in the collection.
   *
   * @fires `beforeSend($fold, index, $togglers, xhr, settings);`
   * @fires `ajaxError($fold, index, $togglers, xhr, errorType, error);`
   */
  send: function(query, $fold, index) {
    $.ajax({
        url: this.options.url,
        data: query,
        beforeSend: function(xhr, settings) {
          this.showLoader();
          this.emit('beforeSend', $fold, index, this.$togglers, xhr, settings);
        }.bind(this),
        success: function(data, status, xhr) {
          this.hideLoader();
          this.setCache(query, xhr.responseText);
          this.render(xhr.responseText, $fold, index);
        }.bind(this),
        error: function(xhr, errorType, error) {
          this.emit('ajaxError', $fold, index, xhr, this.$togglers,
              errorType, error);
        }.bind(this)
      });
  }
});

/**
 * Factory that creates static/AJAX accordion instances.
 * 
 * @param $container The `$` element that contains the togglers and folds.
 * @param options An object of options to override the defaults.
 *
 * @returns The instance object.
 */
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

  instance.initialize(($container && $container.eq(0)), options);

  return instance;
};

})((window.Zepto || window.jQuery), window, document, u$);