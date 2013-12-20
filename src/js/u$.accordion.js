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
(function($, window, document) {
'use strict';

window.u$ || (window.u$ = {});

var defaults = {
  // EVENTS
  // detach($container, $togglers, $folds);
  // beforeShow($fold, $togglers, index)
  // show($fold, $togglers, index)
  // beforeHide($fold, $togglers, index)
  // hide($fold, $togglers, index)

  /**
   * The CSS class applied to folds after they are closed.
   */
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

  /**
   * The CSS class applied to folds before they are opened.
   */
  expandedClass: 'is-expanded',

  /**
   * The CSS class used to fetch folds from the DOM when instances
   * are created.
   */
  foldClass: 'js-fold',

  /**
   * Should multiple folds be allowed to be open at once?
   */
  multiOpen: true,

  /**
   * Since folds are hidden using `display: none`, ARIA attributes
   * are also used so that screenreader users can still access the
   * content. See the `setAriaAttributes` method for a complete list
   * of attributes added.
   *
   * If you prefer to add these attributes yourself, set this to `false`
   * and save the browser the additional processing requirement.
   */
  setAriaAttributes: true,

  /**
   * The CSS class used to fetch togglers from the DOM when instances
   * are created.
   */
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

    if (this.options.setAriaAttributes) {
      this.setAriaAttributes(this.$togglers);
    } else {
      // Reset the ARIA attributes option so that future
    // calls to `reset` will update these
    this.options.setAriaAttributes = true;
    }
  },

  /**
   * Adds ARIA attributes to the togglers and folds to make the accordion
   * more accessible. Since the `aria-controls` and `aria-labelledby`
   * attributes must be unique, it is important to specify a namespace
   * in the options.
   *
   * @param $togglers The `$` toggler elements. The corresponding fold
   *                  will be fetched via the `getFold` method.
   */
  setAriaAttributes: function($togglers) {
    var ns = (this.options.eventNamespace || '') + '-accordion-';

    $togglers.each(function(i, toggler) {
      var id = ns + i.toString(),
        $toggler = $(toggler),
        $fold = this.getFold($toggler, i),
        isExpanded = !$fold.hasClass(this.options.collapsedClass);

      $toggler.attr('aria-controls', id);
      $toggler.attr('role', 'tab');
      $toggler.attr('aria-selected', 'false');
      $toggler.attr('tabindex', '-1');

      $fold.attr('aria-labelledby', id);
      $fold.attr('role', 'tabpanel');
      $fold.attr('aria-expanded', isExpanded);
      $fold.attr('aria-hidden', !isExpanded);
    }.bind(this));
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
   * @fires `detach($container, $togglers, $folds);`
   */
  detach: function($togglers) {
    var ns = (this.options.eventNamespace || '') + 'Accordion',
      args;

    if ($togglers && $togglers.length) {
      $togglers.removeClass(this.options.togglerClass);
      this.$togglers = this.$togglers.not($togglers);
    } else {
      args = u$.detach(this, ns, '$container', '$togglers', '$folds');
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
    // EVENTS
    // beforeSend($fold, $togglers, index, xhr, settings)
    // ajaxError($fold, $togglers, index, xhr, errorType, error)

    /**
     * The CSS class applied to the loader element. Loaders also have
     * the class `loader`.
     */
    // loaderClass: 'loader--accordion',

    /**
     * The HTML for the loader element. `<div />` is used by default.
     */
    // loaderHTML: '<div />'

    /**
     * Function that generates the string passed to `$.ajax`'s `data`
     * attribute. If no function is provided, then an empty string is
     * used instead.
     *
     * @param $toggler The `$` element that was clicked.
     *
     * @returns The generated query string.
     */
    // query: function($toggler) {},

    /**
     * Is the AJAX data coming back as HTML or JSON? If JSON, then
     * either the built-in templating engine will be used (if the
     * `template` option is a string) or you can use another more
     * powerful engine like Handlebars (if `template` is a function).
     */
    // responseType: 'html', /* default; or 'json'*/
    
    /**
     * The template for converting JSON to HTML. Only needed if the
     * response type is 'json'. If a string, then the simple internal
     * engine is used. If a function, then you will be responsible
     * for calling a templating engine in that function and adding the
     * HTML to the passed-in fold.
     *
     * Function params:
     * @param $container The `$` element that will be populated with HTML.
     * @param data The JSON object (object, not JSON string)
     */
    // template: '<div>{{field}}</div>' || function($fold, data) {}

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
    var query = this.options.query || '',
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
          this.emit('beforeSend', $fold, this.$togglers, index, xhr, settings);
        }.bind(this),
        success: function(data, status, xhr) {
          this.hideLoader();
          this.setCache(query, xhr.responseText);
          this.render(xhr.responseText, $fold, index);
        }.bind(this),
        error: function(xhr, errorType, error) {
          this.emit('ajaxError', $fold, this.$togglers, index, xhr, errorType,
              error);
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
u$.accordion = function($container, options) {
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

})((window.Zepto || window.jQuery), window, document);