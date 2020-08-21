(function () {
  //levels: starts as [ audio, span ], then grows when needed into [ audio, span , span , ... , span ]
  var levels = [document.createElement("audio"), document.createElement("span")];
  levels[1].appendChild(levels[0]);

  function getClone(depth) {
    while (depth > levels.length) {
      var span = document.createElement("span");
      span.appendChild(levels[levels.length - 1]);
      levels.push(span);
    }
    return levels[depth - 1].cloneNode(true);
  }

  function dispatchErrorEvent(error, message) {
    var uncaught = new ErrorEvent('error', {error: error, message: message});
    window.dispatchEvent(uncaught);
    !uncaught.defaultPrevented && console.error(uncaught);
  }

  function runMesoLevelTask(e) {
    if (!this._mesoLevelTasks)
      return e.stopImmediatePropagation();
    try {
      var task = this._mesoLevelTasks.shift();
      if (this._mesoLevelTasks.length === 0)
        task("completed");
      task();
    } catch (error) {
      dispatchErrorEvent(error, "Uncaught Error: a function called async via 'macrotask.ticks(tasks)' broke down.");
    }
  }

  function addMesoTasks(tasks, span) {
    var resolve;
    //no mesotask error causes the rest of the mesotasks to falter, thus no reject should be possible.
    var promise = new Promise(function (resolveImpl) {
      return resolve = resolveImpl;
    });
    span._mesoLevelTasks = tasks.concat(resolve);//makes the _mesoLevelTasks immutable.
    for (var i = 0; i < span._mesoLevelTasks.length; i++)
      span.addEventListener("ratechange", runMesoLevelTask.bind(span), true);
    return promise;
  }

//macrotask promises return true when completed, and "cancelled" when cancelled, they never fail.
  function macrotask(depth) {
    if (depth <= 0 || !(depth === (depth ^ 0)))
      throw new TypeError("'depth' in 'macrotask(depth)' must be a positive integer");
    var span = getClone(depth + 1);
    var audio = span.querySelector("audio");
    var finalPromise = addMesoTasks([], audio);
    audio.playbackRate = 2;

    finalPromise.ticks = function (tasks) {
      if (!audio._mesoLevelTasks.length)
        throw new Error("This macrotask has already completed. You cannot add more tasks. You must either add the tasks sooner, or make a new macrotask.");
      if (span instanceof HTMLAudioElement)
        throw new Error("This macrotask is full. You cannot add more tasks. You must either give the macrotask more depth, or make a new macrotask.");
      if (!(tasks instanceof Array) || tasks.indexOf(function (fun) {
        return !(fun instanceof Function);
      }) >= 0)
        throw new TypeError("'tasks' in 'macrotask.ticks(tasks)' must be an array of Functions.");
      if (!tasks.length)
        return true;
      var promise = addMesoTasks(tasks, span);
      span = span.children[0];
      return promise;
    };

    // to flush a macroTask, you call cancel() which returns an array of not yet done methods,
    //                       and then you call these returned functions.
    //returns an array with the functions that were cancelled
    finalPromise.cancel = function () {
      if (!audio._mesoLevelTasks || !audio._mesoLevelTasks.length)
        throw new Error("This macrotask is already completed or cancelled. Cannot cancel it (again).");
      var undone = [];
      var resolves = [];
      //start with span, it is the deepest one that has added mesotasks
      while (span && span._mesoLevelTasks && span._mesoLevelTasks.length) {
        resolves.unshift(span._mesoLevelTasks.pop());         //take out the listener that will call the resolve on the element.
        undone = span._mesoLevelTasks.concat(undone);      //take the rest of the listeners out into undone
        span._mesoLevelTasks = undefined;                  //set to undefined to communicate the method being removed.
        span = span.parentNode;
      }
      if (audio._mesoLevelTasks) {
        resolves.unshift(audio._mesoLevelTasks.pop());
        span = audio;
        audio._mesoLevelTasks = undefined;
      }
      for (var i = 0; i < resolves.length; i++)
        resolves[i]("cancelled");
      return undone;
    };

    return finalPromise;
  }


//nextTick
  var reusables = [];
  var tasks = [];

  function doTask() {
    var task = tasks.shift();
    task.isResolved = true;
    reusables.push(task.audio);
    task.resolve(task.cb());
  }

  function nextTick(cb) {

    var resolve;
    var promise = new Promise(function (resolveImpl) {
      return resolve = resolveImpl;
    });

    var audio;
    if (reusables.length)
      audio = reusables.shift();
    else {
      audio = document.createElement("audio");
      audio.onratechange = doTask;
    }
    audio.playbackRate = audio.playbackRate === 2 ? 1 : 2;
    var task = {cb: cb, resolve: resolve, audio: audio};
    tasks.push(task);

    Object.defineProperty(promise, "cancel", {
      value: function () {
        if (task.isResolved)
          throw new Error("The 'nextTick(cb)' has already completed. Cannot '.cancel()' it.");
        tasks.splice(tasks.indexOf(task), 1);//remove the task from the list of tasks
        task.audio.onratechange = undefined; //note!! drops the event dispatch too!
        task.resolve(nextTick.CANCELLED);    //alert any .then(...) or await ... that the task is CANCELLED
        return task.cb;
      }
    });

    return promise;
  }

  Object.defineProperty(nextTick, "CANCELLED", {value: {}}); //nextTick.CANCELLED is an empty object used as key.2

  window.nextTick = nextTick;
  window.macrotask = macrotask;
})();