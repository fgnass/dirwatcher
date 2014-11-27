var filewatcher = require('filewatcher')
var minimatch = require('minimatch')
var find = require('findit')
var statdir = require('statdir')
var util = require('util')
var debounce = require('debounce')
var events = require('events')
var EventEmitter = events.EventEmitter

module.exports = function(dir, match) {
  return new DirWatcher(dir, match)
}

function DirWatcher(dir, match) {
  var self = this

  // watcher to watch each dir
  var watcher = this.watcher = filewatcher()

  // list of directorx snapshots
  var snapshots = this.snapshots = {}

  // ready means the inital scan has finished
  var ready

  EventEmitter.call(this)

  // match all files by default
  if (!match) match = function(f) { return f.stat.isFile() }

  // convert strings to a globbing regexp
  if (typeof match == 'string') match = minimatch.makeRe(match)

  if (match.test) {
    var re = match
    match = function(f) { return re.test(f.name) }
  }

  this.match = match

  var steady = debounce(function() {
    self.emit('steady')
  }, 10)

  /**
  * Emit an event of the given type for each file that matches the
  * configured pattern.
  */
  function emit(files, type) {
    files.filter(match).forEach(function(f) {
      self.emit(type, f.path, f.stat)
    })
    steady()
  }

  watcher.on('change', function(dir, stat) {
    if (!stat) {
      delete snapshots[dir]
      watcher.remove(dir)
      return
    }
    statdir(dir, function(err, stats) {
      var diff = statdir.diff(snapshots[dir], stats)
      snapshots[dir] = stats
      diff.added.forEach(function(f) {
        // if a directory was added add it to the watch list
        if (f.stat.isDirectory()) add(f.path)
      })
      diff.removed.forEach(function(f) {
        // if a directory was removed emit remove events for each file
        if (f.stat.isDirectory()) emit(snapshots[f], 'removed')
      })

      for (var type in diff) emit(diff[type], type)
    })
  })

  function add(dir) {
    var finder = find(dir)
    finder.on('directory', function(dir) {
      statdir(dir, function(err, stats) {
        emit(stats, 'added')
        snapshots[dir] = stats
        watcher.add(dir)
      })
    })
    if (!ready) finder.on('end', function() {
      ready = true
      self.emit('ready')
      steady()
    })
  }

  add(dir)
}

util.inherits(DirWatcher, EventEmitter)

/* Stops watching and removes all listeners */
DirWatcher.prototype.stop = function() {
  this.watcher.removeAll()
  this.watcher.removeAllListeners()
  this.removeAllListeners()
}

/* Returns a list of all watched files */
DirWatcher.prototype.files = function() {
  var all = []
  for (var d in this.snapshots) all.push.apply(all, this.snapshots[d])
  return all.filter(this.match).map(function(f) { return f.path })
}
