var dirwatcher = require('..')
  , fs = require('fs')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , should = require('should')

var dir = __dirname + '/tmp'
  , w

describe('dirwatcher', function() {

  beforeEach(function() {
    mkdirp.sync(dir)
  })

  afterEach(function() {
    w.stop()
    rimraf.sync(dir)
  })

  it('should report added files', function(done) {
    create('foo.txt')
    w = dirwatcher(dir, '*.txt')
    w.on('ready', function(files) {
      w.on('changed', function(file) {
        throw Error('must not be called ' +file)
      })
      w.once('added', function(file) {
        w.on('added', function(file, stat) {
          path.basename(file).should.equal('baz.txt')
          done()
        })
        create('bar/baz.boo')
        create('bar/baz.txt')
      })
      create('bar.txt')
    })
  })

  it('should report modified files', function(done) {
    create('foo.txt')
    w = dirwatcher(dir, '*.txt')
    w.on('ready', function(file) {
      w.on('changed', function(file) {
        done()
      })
      setTimeout(function() { create('foo/bar.txt') }, 1000)
    })
    create('foo/bar.txt')
  })

  it('should report removed files', function(done) {
    var f = create('foo.txt')
    w = dirwatcher(dir, '*.txt')
    w.on('ready', function(file) {
      w.on('removed', function(file) {
        done()
      })
      fs.unlinkSync(f)
    })
  })

  it('should report files in removed dirs', function(done) {
    var f = create('foo/bar.txt')
    w = dirwatcher(dir, '*.txt')
    w.on('ready', function(file) {
      w.on('removed', function(file) {
        done()
      })
      rimraf.sync(path.join(dir, 'foo'))
    })
  })

})

function create(f) {
  f = path.resolve(dir, f)
  mkdirp.sync(path.dirname(f))
  fs.writeFileSync(f, new Date())
  return f
}