# Zepto-Compatible jQuery Accordion

First, this is not a plugin. I do a lot of development that requires combining objects together, so I need access to the underlying object.
`$elem.accordion().data('accordion').methodName()` seems inelegant to me, so I chose not to implement this as a plugin.

## Dependencies
As much as possible, I separate functionality common across objects into separate functions. These functions are methods of the `u$` object, and can be found in the [u$ library](https://github.com/mwistrand/zepto-jquery-utilities). Specifically used are the `detach`, `slideDown`, `slideUp`, `renderJSON`, and `is$` methods, as well as the `loaderMixin` and `cacheMixin` mixins. 

## Usage
I like to store functionality like this in a single global variable: `u$`. So a new accordion instance is created by a call to `u$.accordion($container, options)`.

### Note About Accessibility
`display: none` is used to hide folds, but ARIA attributes are added to toggles and folds so that users can still view the content. The `aria-controls` and `aria-labelledby` attributes are generated as follows: `this.options.namespace + '-accordion-' + {{the toggler/fold index}}`. Like `id` or `for` attributes, these two attributes need to be unique, so it's important to include a namespace with your instance options. If you prefer to manage this yourself, this whole process can be turned off by setting the `setAriaAttributes` to `false`. After the instance is created, however, this option is reset to `true` so that if the `reset` method is called, the togglers/folds can be re-numbered. See the source (specifically, the `setAriaAttributes` method) for a complete list of attributes added.

Also, accordions can be opened/closed when either the space or enter keys are typed when focus is on one of the togglers.

### Creating instances
Event delegation is used extensively, so rather than passing in a collection of togglers and folds, a wrapper element is used instead. For example, suppose you have the following HTML:

```HTML
<div class="container">
  <h3 class="js-toggler">Click to open</h3>
  <div class="js-fold is-collapsed">Fold contents</div>
</div>
```

The events are attached to the container, and delegated to the togglers:

```javascript
// Note that the instance object is returned, rather than a `$` object
var accordion = u$.accordion($('.container'), {
  foldClass: 'js-fold',
  togglerClass: 'js-toggler'
});
```

When a new instance is created, the togglers and folds are fetched from the DOM. So by default, a fold is associated with a toggler by its index in the `$` collection. Alternatively, a toggler can be associated with a fold by giving the toggler a `data-foldid` attribute whose value is the `id` of the corresponding fold:

```HTML
<div class="container">
  <h3 class="js-toggler" data-foldid="fold1">Open Fold</h3>
  <div id="fold1" class="js-fold is-collapsed">Fold Contents</div>
</div>
```

### AJAX Accordions
Accordion instances created with a `url` option (see below) are treated as AJAX accordions. Note that AJAX accordions must still have in-page folds, but those elements will simply be populated with AJAX data.

### Options
`collapsedClass: 'is-collapsed'`
The CSS class applied to folds when they are closed.

`eventNamespace: null`
The prefix for the event namespace. The namespace is generated as follows:
`eventNamespace + 'Accordion.' + name + 'Event'`
For example, `myAppAccordion.showEvent`.
    
`events: null`
A Backbone style events object that will be integrated with the `accordion` object (on instantiation, via `$.extend`). Any such object must implement a `trigger` method in order to function properly. If this is `null` (the default), then a basic internal emitter will be used (and event callbacks specified as options).

`expandedClass: 'is-expanded'`
The CSS class applied to folds when they are opened.

`foldClass: 'js-fold'`
The CSS class applied to all folds.

`multiOpen: true`
Should multiple folds be allowed to be open at once?

`setAriaAttributes: true`
Since folds are hidden using `display: none`, ARIA attributes are also used so that screenreader users can still access the content. See the `setAriaAttributes` method for a complete list of attributes added.

If you prefer to add these attributes yourself, set this to `false` and save the browser the additional processing requirement.

`togglerClass: 'js-toggler'`
The CSS class applied to all togglers.

#### AJAX-specific options
`cache: true`
Whether the AJAX requests should be cached. Note that the full URL (domain, path, and query/data) for the request is used to build the cache.

`loaderClass: 'loader--accordion`
The CSS class that will be added to the optional loader/spinner (`<div class="loader" />`)

`loaderHTML: <div />`
The HTML that will be used to generate the optional loader/spinner element.

`query: function($trigger) {}`
Function that generates the string passed to `$.ajax`'s `data` attribute. If no function is provided, then an empty string is used instead.

`responseType: 'html' // or 'json'`
Is the AJAX data coming back as HTML or JSON? If JSON, then either the built-in templating engine will be used (if the `template` option is a string) or you can use another more powerful engine like Handlebars (if `template` is a function).

`template: '<div>{{field}}</div>' || function($fold, data) {}`
The template that will be used to generate the accordion HTML from the fetched JSON data. If the JSON is very simple and only one level deep (for example, `[{"id": 1, title: "Article 1"}, {"id": 2, "Article 2"}]` or `{"id": 1, title: "Article 1"}`, then the built-in template parser will suffice. Otherwise, you can specify a function that takes the container and JSON object (not string) and use a more powerful templating engine like Handlebars:

```javascript
function($fold, data) {
  var source = $('#handlebars-template').html(),
    template = Handlebars.compile(source);

  $fold.html(template(data));
}
```

### Events
`detach: function($container, $togglers, $folds) {}`
When togglers are detached, or the whole instance is detached.

`beforeShow: function($fold, $togglers, index) {}`
Before a fold is opened.

`show: function($fold, $togglers, index) {}`
When a fold is opened (after the HTML has been rendered and the fold is fully expanded).

`beforeHide: function($fold, $togglers, index) {}`
Before a fold is collapsed.

`hide: function($fold, $togglers, index) {}`
After a fold is collapsed.

#### AJAX Events
`beforeSend: function($fold, $togglers, index, xhr, settings) {}`
Before the AJAX request is sent, but after the loader is displayed.

`ajaxError: function($fold, $togglers, index, xhr, errorType, error) {}`
When there is a problem with the AJAX request.