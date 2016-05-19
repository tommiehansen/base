
console.clear();

var camelCase = (function(){
  var camelRegex = /(?:^\w|[A-Z]|\b\w)/g,
      whiteSpace = /[\s-_]+/g
  return function(str) {
    return str.replace(camelRegex, function(letter, index) {
      return letter[ index === 0 ? 'toLowerCase' : 'toUpperCase' ]();
    }).replace(whiteSpace, '');
  }
}());

var getPrefixedProp = (function() {
  var cache = {},
      doc = document,
      div = doc.createElement('div'),
      style = div.style;

  return function(prop) {
    prop = camelCase(prop);
    if ( cache[prop] ) { return cache[prop]; }

    var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
        prefixes = ['webkit', 'moz', 'ms', 'o'],
        props = (prop + ' ' + (prefixes).join(ucProp + ' ') + ucProp).split(' ');

    $.each(props,p => {
      if ( p in style ) {
        cache[p] = prop = cache[prop] = p;
        return false;
      }
    });

    return cache[prop];
  };
}());

$.prefixedProp = getPrefixedProp;
$.camelCase = camelCase;

// @todo: Convert % to px
// @todo: Use Element.Animate in supported browsers?
// @todo: Ensure compatibility between Element.animate & requestAnimationFrame version
// @todo: Compatibility in ease functions & Element.animate
// @todo: transform: rotate compatibility. Element.animate seems to rotate the quickest possible way, not the correct way.

(function($){

  /** Group all `requestAnimationFrame` calls into one for better performance. */
  var animations = [];
  animations.play = function(){
    animations.frame = animations.frame || requestAnimationFrame(animate);
    animations.playing = true;
  };

  /** One requestAnimationFrame function */
  function animate(){

    var i = animations.length,
        el, index;

    if ( !animations.playing || i === 0  ) {
      animations.playing = false;
      animations.frame = null;
      return;
    }

    while( i-- ){
      el = animations[i];
      if ( el && el.playing && !el.render() ) {
        el.playing = false;
        index = animations.indexOf(el);
        if ( index > -1 ) { animations.splice(index, 1); }
      }
    }

    animations.frame = requestAnimationFrame(animate);
  }

  window.animations = animations;

  /** Easing delta functions */
  var easing = {

    linear: function(t){ return t; },

    easeInQuad: function(t){ return t*t; },
    easeOutQuad: function(t){ return t*(2-t); },
    easeInOutQuad: function(t){ return t<0.5 ? 2*t*t : -1+(4-2*t)*t; },

    easeInCubic: function(t){ return t*t*t; },
    easeOutCubic: function(t){ return (--t)*t*t+1; },
    easeInOutCubic: function(t){ return t<0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },

    easeInQuart: function (t){ return t*t*t*t; },
    easeOutQuart: function (t){ return 1-(--t)*t*t*t; },
    easeInOutQuart: function(t){ return t<0.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; }

  };
  $.easing = easing;


  ////////////////////////////////////////

  /** Build transform conversion functions with defaults values */

  var transformProp = $.prefixedProp('transform');
  var transforms = {};

  function makeTransformFn(name, defaultValue){
    return function(value, onlyValue) {
      value = ( value || value == 0 ? value : defaultValue );
      return ( onlyValue ? value : ' '+name+'('+value+')' );
    }
  }

  $.each('rotate rotateX rotateY rotateZ skew skewX skewY'.split(' '),function(val){
    transforms[val] = makeTransformFn(val, '0deg');
  });

  $.each('x y z'.split(' '),function(val){
    transforms[val] = makeTransformFn('translate'+val.toUpperCase(), 0);
  });

  $.each('translateX translateY translateZ perspective'.split(' '),function(val){
    transforms[val] = makeTransformFn(val, 0);
  });

  $.each('scale scaleX scaleY scaleZ'.split(' '),function(val){
    transforms[val] = makeTransformFn(val, 1);
  });


  ////////////////////////////////////////

  /** Split a string from the number and the unit to allow tweening the number. */
  var unitRegex = /(-?[0-9]+(?:\.[0-9]+)?)([a-z%]+)?$/i;

  function getNumberUnit(val){
    var ret = unitRegex.exec( val );
    if ( !ret && ret !== 0 ) {
      ret = [0,'px'];
    } else {
      ret = ret.slice(1,3);
      ret[0] = parseFloat(ret[0]);
    }

    return ret;
  }


  // http://stackoverflow.com/a/10624656/1012919

  function percentwidth(elem){
    var pa= elem.offsetParent || elem;
    return ((elem.offsetWidth/pa.offsetWidth)*100).toFixed(2)+'%';
  }

  ////////////////////////////////////////


  var transformRegex = /([a-z]+)\((.*?)\)/ig;
  function getCurrentTransforms(obj){
    var transformObj = { from: { translateZ: 0 }, to: { translateZ: 0 } };
    while ( _transform = transformRegex.exec(obj[transformProp]) ){
      key = _transform[1];

      val = transforms[key]( _transform[2], true );
      transformObj.from[ key ] = val;
      transformObj.to[ key ] = val;
    }
    return transformObj;
  }

  function getDeltaValue(delta,start,to){
      var end = to,
          suffix = 0;

      start = ( start && start.length === 2 ? start[0] : start );

      if ( to && to.length === 2 ) {
        end = to[0];
        suffix = to[1] || 0;
      }

      return (start + (end - start) * delta) + suffix;
    }

  ////////////////////////////////////////

  function Animation(target, to, duration, opts){

    var me = this,key;

    if ( isNaN(duration) ) {
      opts = duration;
      duration = null;
    } else {
      me.duration = duration;
    }

    opts = opts || {};
    $.extend(me, opts);

    me.target = target;
    me.isElement = target.nodeType;
    me.supportAnimate = me.isElement && (opts.supportAnimate && target.animate);

    /** Object to apply the animation to. If element, use the style, otherwise apply it to the target itself. */
    me.obj = ( me.isElement ? me.target.style : me.target );
    me.build(to);
    me.play();

    return me;
  }

  Animation.fn = Animation.prototype = {

    iterations: 1,
    duration: 400,
    easing: 'linear',
    reversed: false,
    delay: 0,
    direction: 'normal',
    supportAnimate: true,

    build: function(to){
      var me = this,
          from = me.obj,
          key, propName, val, start, end, hasTransforms, transformFn;

      // Set from & to as empty objects to be filled
      me.from = {};
      me.to = {};

      if ( !me.isElement ) {
        for (key in to) {
          me.from[key] = from[key];
          me.to[key] = to[key];
        }
      } else {

        from = window.getComputedStyle(me.target);

        for (key in to){

          if ( transforms[key] ) {
            hasTransforms = true;
          } else {

            propName = $.prefixedProp(key);

            start = from[propName];
            end = to[key];

            /** If not using Element.animate, split the values into an array containing the number and the unit, e.g. [100,'px'] */
            if ( !me.supportAnimate ) {
              start = getNumberUnit(start);
              end = getNumberUnit(end);

/*
              if ( start[1] !== end[1] ) {
                console.log('conversion needed!',start,end);
              }
*/
            }

            me.from[propName] = start;
            me.to[propName] = end;

            delete to[key];
          }

        }

        // Set up leftover transforms.
        if ( hasTransforms ){

          // Get current transform values if element to preserve existing transforms and to animate smoothly to new transform values.
          me.transforms = getCurrentTransforms(me.obj);

          for (key in to){
            /** Get the current value of the transform or get the default value from our transforms object */
            me.transforms.from[key] = me.transforms.from[key] || transforms[key](null,true);
            me.transforms.to[key] = to[key];
          }

          // If using Element.animate, flatten the transforms object to a single transform string.
          if ( me.supportAnimate ) {
            me.from[transformProp] = me.obj[transformProp];
            me.to[transformProp] = '';

            for (key in me.transforms.to){
              transformFn = transforms[key];
              //me.from[transformProp] += transformFn(me.transforms.from[key]);
              me.to[transformProp] += transformFn(me.transforms.to[key]);
            }

            delete me.transforms;
          } else {

            for (key in me.transforms.to){
              me.transforms.from[key] = getNumberUnit(me.transforms.from[key]);
              me.transforms.to[key] = getNumberUnit(me.transforms.to[key]);
            }

          }
        }

      }

    },

    play: function(repeat){
      var me = this;

      if ( !me.playing ) {
        me._s = Date.now() + ( repeat ? 0 : me.delay );
        me.playing = true;
      }
      if ( me.start ) { me.start(); }

      // Use element.animate if supported
      if ( me.supportAnimate && me.target.animate ) {

        me.obj['animation-fill-mode'] = 'none';

        // Use Element.animate to tween the properties.
        me._anim = me.target.animate([me.from,me.to],{
          duration: me.duration,
          easing: me.easing,
          iterations: me.iterations,
          direction: me.direction,
          delay: me.delay
        });

        /** Prevent issues with `fill: both` preventing animations of transforms from working */
        var endState;
        if ( (me.direction === 'alternate' && me.iterations % 2 ) || (me.direction === 'normal') ) {
          endState = me.to;
        }

        me._anim.addEventListener('finish',function(e){

          if ( endState ) {
            /** Apply the end state */
            for (key in endState){
              me.obj[key] = endState[key];
            }
          }

          if ( me.complete ) { me.complete(); }
        });


      } else {
        if ( me.direction === 'reverse' ) { me.reversed = true; }
        me.easing = $.isString(me.easing) ? easing[me.easing] : me.easing;
        var index = animations.indexOf(me);
        if ( index == -1 ) { animations.push(me); }
        animations.play();
      }

      return me;
    },

    stop: function(){
      this.playing = false;
      if ( me._anim ) { me._anim.cancel(); }
      return this;
    },

    render: function(){

      var me = this,
          now = Date.now(),
          progress, delta, key, from, to, transform;

      if ( !me.playing ) { return; }
      /** If a delay was set, the animation may be 'rendering' while the current time is still less than start time. */
      if ( now < me._s ) { return true; }

      progress = ( now - me._s ) / me.duration;
      if ( progress > 1 ) { progress = 1; }

      delta = me.easing( me.reversed ? 1 - progress : progress );

      // Animate all normal properties or styles
      for (key in me.to){
        me.obj[key] = getDeltaValue(delta, me.from[key], me.to[key]);
      }

      // Animate all transforms, grouped together.
      if ( me.isElement && me.transforms ) {
        transform = '';
        for (key in me.transforms.to){
          from = me.transforms.from[key];
          to = me.transforms.to[key];
          transform += transforms[key]( getDeltaValue(delta, from, to) );
        }
        me.obj[transformProp] = transform;
      }

      if ( me.progress && me.progress() === false ) { return false; }

      if ( progress >= 1 ) {
        me.playing = false;
        if ( me.direction === 'alternate' ) { me.reversed = !me.reversed; }
        if ( me.iterations <= 1 ) {
          if ( me.complete ) { me.complete(); }
          return false;
        } else {
          if ( me.iterations > 1 ) { me.iterations--; }
          me.play(true);
        }
      }

      return true;
    }

  };

  $.animate = function(obj,to,duration,opts){
    return new Animation(obj,to,duration,opts);s
  };

  $.fn.animate = function(to,duration,opts){
    return this.each(function(v,i){
      return new Animation(v,to,duration,opts,i);
    })
  };
})(window.$);
