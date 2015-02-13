var events = require('events')
var path = require('path')
var util = require('util')

var debounce = require('debounce')
var filewatcher = require('filewatcher')
var find = require('findit')
var minimatch = require('minimatch')
var statdir = require('statdir')

var EventEmitter = events.EventEmitter

module.exports = function(dir, opts) {
  return new DirWatcher(dir, opts)
}

module.exports.filewatcher = filewatcher

function match(p) {
  if (typeof p == 'string') p = minimatch.makeRe(p)
  if (p instanceof RegExp) {
    var re = p
    p = function(f) {
      return re.test(path.basename(f))
    }
  }
  return p
}

function filesOnly(f, stat) {
  return stat.isFile()
}

function DirWatcher(root, opts) {
  var self = this

  // list of directory snapshots
  this.snapshots = {}

  EventEmitter.call(this)

  if (!opts
    || typeof opts == 'string'
    || typeof opts == 'function'
    || opts instanceof RegExp)
    opts = { include: opts }

  this.match = match(opts.include) || filesOnly

  var skip = match(opts.skip)

  // watcher to watch each dir
  var watcher = this.watcher = filewatcher()

  watcher.on('fallback', function(limit) {
    this.removeAll()
    self.emit('error', 'Ran out of file handles after watching '
      + limit + ' directories'
    )
  })

  var steady = debounce(function() {
    self.emit('steady')
  }, 10)

  /**
  * Emit an event of the given type for each file that matches the
  * configured pattern.
  */
  function emit(files, type) {
    self.filter(files).forEach(function(f) {
      self.emit(type, f.path, f.stat)
    })
    steady()
  }

  watcher.on('change', function(dir, stat) {
    var snapshots = self.snapshots
    if (stat.deleted) {
      delete snapshots[dir]
      watcher.remove(dir)
      return
    }
    statdir(dir, function(err, stats) {
      if (err) return self.emit('error', err)

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
    var finder = find(dir || root)
    finder.on('directory', function(d, stat, stop) {

      // skip this directory?
      if (dir && skip && skip(d, stat)) return stop()

      statdir(d, function(err, stats) {
        if (err) return self.emit('error', err)
        self.snapshots[d] = stats
        watcher.add(d)
      })
    })

    if (!dir) finder.on('end', function() {
      self.emit('ready')
      steady()
    })
  }

  process.nextTick(add)

}

util.inherits(DirWatcher, EventEmitter)

/* Stops watching and removes all listeners */
DirWatcher.prototype.stop = function() {
  this.watcher.removeAll()
  this.watcher.removeAllListeners()
  this.removeAllListeners()
  this.snapshots = {}
}

/* Returns a list of all watched files */
DirWatcher.prototype.files = function() {
  var all = []
  for (var d in this.snapshots) all.push.apply(all, this.snapshots[d])
  return this.filter(all).map(function(f) { return f.path })
}

DirWatcher.prototype.filter = function(files) {
  return files.filter(function(f) {
    return this.match(f.path, f.stat)
  }, this)
}
