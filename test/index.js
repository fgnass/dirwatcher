var dirwatcher = require('..')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')

var tap = require('tap')

var dir = __dirname + '/tmp'
var w
var timer

function cleanup() {
  if (timer) clearTimeout(timer)
  if (w) w.stop()
  rimraf.sync(dir)
}

function test(name, conf, cb) {
  return tap.test(name, conf, cb)
    .once('end', cleanup)

}

function create(f) {
  f = path.resolve(dir, f)
  mkdirp.sync(path.dirname(f))
  fs.writeFileSync(f, new Date())
  return f
}

test('should report added files', function(t) {
  t.plan(3)
  create('t1.txt')
  w = dirwatcher(dir, '*.txt')
  w.on('error', function(err) { throw err })
  w.once('steady', function() {
    t.equals(this.files().length, 1)
    w.on('changed', function(file) {
      t.fail('must not be called ' + file)
    })
    w.once('added', function(file) {
      w.on('added', function(file, stat) {
        t.equal(path.basename(file), 'baz.txt')
        t.ok(stat.isFile(), 'isFile')
      })
      create('t1/baz.boo')
      create('t1/baz.txt')
    })
    create('t1/foo.txt')
  })
})

test('should report modified files', function(t) {
  t.plan(2)
  create('t2/bar.txt')
  w = dirwatcher(dir, '*.txt')
  w.on('error', function(err) { throw err })
  w.on('ready', function(file) {
    w.on('changed', function(file, stat) {
      t.ok(true, 'fire changed event')
      t.ok(stat.isFile())
    })
    timer = setTimeout(function() { 
      create('t2/bar.txt')
    }, 1000)
  })
})

test('should report removed files', function(t) {
  t.plan(2)
  var f = create('t3.txt')
  w = dirwatcher(dir, '*.txt')
  w.on('error', function(err) { throw err })
  w.on('ready', function(file) {
    w.on('removed', function(file, stat) {
      t.ok(file, 'fire removed event')
      t.ok(stat.isFile())
    })
    fs.unlinkSync(f)
  })
})

test('should report files in removed dirs', function(t) {
  t.plan(1)
  create('t4/bar.txt')
  w = dirwatcher(dir, '*.txt')
  w.on('error', function(err) { throw err })
  w.on('ready', function() {
    w.on('removed', function(file) {
      t.ok(file, 'fire removed event')
    })
    rimraf.sync(path.join(dir, 't4'))
  })
})


test('ignore skipped directories', function(t) {
  t.plan(1)

  create('t5/foo')
  create('t5/bar.txt')
  create('t5/skip/me.txt')
  create('t5/skip/me/too.txt')

  w = dirwatcher(dir, { include: '*.txt', skip: /skip/ })

  w.on('error', function(err) { throw err })
  w.on('ready', function() {
    t.equal(this.files().length, 1)
  })
})

//process.on('exit', cleanup)
