### Stagger animations
A light 190 bytes pure javascript helper to add stagger to css animations or transitions.

Demo: http://codepen.io/tommiehansen/full/ZWNRoY/

-

#### Use 
1. Create animation or transition  
2. Download animation.stagger.js or animation.stagger.min.js  
3. Include the helper in your page  
4. Call it ie stagger.init(".color"); // use default options  
5. Start your animation or transition with any method you desire  

-

##### Options

**Stagger** in ms _(milliseconds, 1000 = 1 second)_  
stagger.init(".myClass", 120); // stagger 120ms  

**Stop after** _n_ elements  
stagger.init(".myClass", null, 4); // stop after 4th element  

**Delay type**  
stagger.init(".myClass", null, null, 'transition-delay'); // Use transition-delay  
