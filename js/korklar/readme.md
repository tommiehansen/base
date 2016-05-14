## Körklar
##### Demo runner
Körklar (swedish for 'Runnable') is a simple function that takes a bounch of selectors and triggers events on them with a set delay between each iteration. It also adds a marker to each element before triggering. The usecase is showing someone something or a flow of something like an animation sequence or different states.

**Demo**  
https://cdn.rawgit.com/tommiehansen/base/449a670/js/korklar/demo.html

-

#### Howto  
1. include korklar.js or korklar.min.js
2. run the function on some element that does something

-

#### Example
```
korklar.run('.box', 'click', 2000, function(){
  alert('finished');
})
```

```
korklar.run('#myForm input:eq(0), #myForm input:eq(1)', 'focus', 1000, function(){
  alert('finished focusing first and second input in #myForm');
})
```

-

#### Params
The function takes these params  
korklar.run(selector, event, time, callback);  

Which rougly translates to  
1. selector or selectors  
2. event to trigger  
3. time between each event  
4. callback, what to do once completed   

#### Other  
The function limits each que to 1, meaning that if you run something you will not be able to run it once it is running.
