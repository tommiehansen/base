/* -----------------------------------

  KORKLAR
  Demo runner

----------------------------------- */

var korklar = {

  isRunning: false,

  run: function(selector, event, delay, callback){

    if( !this.isRunning ){

      this.isRunning = true;

      callback = callback || false;

      if(selector.indexOf(',') > -1) {
        selector = ''+selector+'';
      }

      var time = 0,
          selector = $(selector),
          isClass = false,
          endSel = selector.last(),
          markerTime = 150,
          markerHTML = '<div id="korklarMarker" style="position:absolute;top:0;left:0;z-index:99;background:#000;opacity:0;width:30px;height:30px;border-radius:50%; transition:opacity .'+ markerTime +'s ease;transform:translateY(10px) translateX(10px)"></div>';

        // append marker get selector
        $('body').prepend(markerHTML);
        var marker = $('#korklarMarker');


        // run through all selectors
        selector.each(function(){

          var t = $(this);

          setTimeout(function(){

           // show marker
            var pos = t.offset();
            marker
              .css('opacity','0.5')
              .css('transform', 'translateX('+(pos.left+10)+'px) translateY('+(pos.top+10)+'px)')

            setTimeout(function(){ marker.css('opacity', 0); }, markerTime*2);

            // let the marker finish, then trigger event
            setTimeout(function(){

              // trigger
              t.trigger(event);

              // check if last and run callback
              if(t[0] == endSel[0]) {
                setTimeout(function(){
                  marker.remove();
                  callback();
                  korklar.isRunning = false; // reset isRunning
                }, delay*2);
              }

            }, markerTime*3);

          }, time);

          time = time + delay;

        }); // end each()

    } // end if !isRunning

  } // end run

}; // end korklar()
