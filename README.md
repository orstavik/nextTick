# nextTick
Method for queuing macrotasks and a sequence mesotasks immediately.

Macrotasks are function calls queued directly in the event loop. Mesotasks are a function calls queued directly in the event loop, but that will be queued immediately after each other the same way async event listeners are. 
