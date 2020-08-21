# nextTick
Method for queuing macrotasks and a sequence mesotasks immediately.

Macrotasks are function calls queued directly in the event loop. Mesotasks are a function calls queued directly in the event loop, but that will be queued immediately after each other the same way async event listeners are. 

## HowTo: `nextTick`

`nextTick(cb)` enables you to queue a method in the event loop with the priority of `ratechange`. This is most commonly *before* `setTimeout`, `setZeroTimeout`, `requestAnimationFrame`.


### `nextTick(cb)` Hello world (es5, sync script)

```html
<script src="https://cdn.jsdelivr.net/gh/orstavik/nextTick@1.1.0/src/nextTick.js"></script>
  
<script >
  console.log("hello ");
  nextTick(function(){
    console.log("sunshine!");
  });
  console.log("hello ")
</script>
```
Yields `hello hello sunshine!`.

### `nextTick(cb)` Hello world (es6 import)  

```html
<script type="module">
  import { nextTick } from "https://cdn.jsdelivr.net/gh/orstavik/nextTick@1.1.0/src/nextTick_es6.js";

  console.log("hello ");
  nextTick(function(){
    console.log("sunshine!");
  });
  console.log("hello ");
</script>
```
Yields `hello hello sunshine!`.

## HowTo: `macrotask(depth)`

The `macrotask(depth)` function enables you to allocate *one* macrotask upon which you can append several mesotasks. Mesotasks are essentially the level of a async event listener frame. Async event listeners will complete all microtasks before passing the control to the next macrotask. But, async event listeners will always run before any other event from the event loop is retrieved. Mesotasks/async event listener frames can thus be thought of as always-first-priority macrotasks.

### `macrotask` Hello world (es5, sync script)
```html
<script src="https://cdn.jsdelivr.net/gh/orstavik/nextTick@1.1.0/src/nextTick.js"></script>
  
<script >
  console.log("HELLO ");
  var macro = macrotask(2);
  var one = macro.ticks([function (){console.log(" hhee");}, function (){console.log("lloo");}])
  var two = macro.ticks([function (){console.log(" sunshine!");}]);
  console.log("hello ");
</script>
```
Yields `HELLO hello hheelloo sunshine!`.

### `macrotask` Hello world (es6, async script)
```html
<script type="module">
  import { macrotask } from "https://cdn.jsdelivr.net/gh/orstavik/nextTick@1.1.0/src/nextTick_es6.js";

  console.log("HELLO ");
  var macro = macrotask(2);
  var one = macro.ticks([function (){console.log(" hhee");}, function (){console.log("lloo");}])
  var two = macro.ticks([function (){console.log(" sunshine!");}]);
  console.log("hello ");
</script>
```
Yields `HELLO hello hheelloo sunshine!`.