/*

    Stagger animations
    Simply add delays to any animation or transition

    ! Stagger animation (C) 2016 Tommie Hansen. MIT license --> en.wikipedia.org/wiki/MIT_License

*/

var stagger = {

    init: function(el, stag, stop, type){

        stag = stag || 60;
        stop = stop || null;
        type = type || 'animation-delay';

        var el = document.querySelectorAll(el),
            len = el.length, stagger;

        for(var i=0;i<len;i++){
            if(stop && stop < i) { stagger = stag * stop; }
            else { stagger = stag * i; }
            el[i].setAttribute('style', type + ':' + stagger + 'ms');
        }

    }

};
