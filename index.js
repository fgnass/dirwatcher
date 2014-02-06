var filewatcher = require('filewatcher')
  , minimatch = require('minimatch')
  , find = require('findit')
  , statdir = require('statdir')
  , util = require('util')
  , debounce = require('debounce')
  , events = require('events')
  , EventEmitter = events.EventEmitter

module.exports = function(dir, match) {
  return new DirWatcher(dir, match)
}

function DirWatcher(dir, match) {
  var self = this
    , watcher = this.watcher = filewatcher()
    , snapshots = this.snapshots = {}
    , ready

  EventEmitter.call(this)

  if (typeof match == 'string') match = minimatch.makeRe(match)
  if (!match) match = function(f) { return f.stat.isFile() }
  if (match.test) {
    re = match
    match = function(f) { return re.test(f.name) }
  }
  this.match = match

  var steady = debounce(function() {
    self.emit('steady')
  }, 10)

  function emit(files, type) {
    files.filter(match).forEach(function(f) { self.emit(type, f.path, f.stat) })
    steady()
  }

  watcher.on('change', function(dir, mtime) {
    if (mtime == -1) {
      delete snapshots[dir]
      watcher.remove(dir)
      return
    }
    statdir(dir, function(err, stats) {
      var diff = statdir.diff(snapshots[dir], stats)
      snapshots[dir] = stats
      diff.added.forEach(function(f) {
        if (f.stat.isDirectory()) add(f.path)
      })
      diff.removed.forEach(function(f) {
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

DirWatcher.prototype.stop = function() {
  this.watcher.removeAll()
  this.watcher.removeAllListeners()
  this.removeAllListeners()
}

DirWatcher.prototype.files = function() {
  var all = []
  for (var d in this.snapshots) all.push.apply(all, this.snapshots[d])
  return all.filter(this.match).map(function(f) { return f.path })
}

