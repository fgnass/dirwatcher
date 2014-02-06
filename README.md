# dirwatcher

Recursively watch a directory for modifications.

Uses [findit](https://npmjs.org/package/findit) to walk the directory tree,
[filewatcher](https://npmjs.org/package/filewatcher) to watch each dir
and [minimatch](https://npmjs.org/package/minimatch) to match the files.

## Usage

Pass a `dir` and either a RegExp, function or a glob pattern:

```js
w = dirwatcher(dir, '*.txt')
w.on('changed', function(file, stat) {
  console.log(file, stat.mtime)
})
```

## Events

A dirwatcher emits the following events:

* `ready` - when the inital directory scan is completed.
* `added` - when a file is added. Also fires during the initial scan.
* `changed` - when the mtime of a file modified. Does not take the actual file content into account.
* `removed` - when a file has been removed
* `steady` - 30 ms after the last event was fired.

### The MIT License (MIT)

Copyright (c) 2014 Felix Gnass

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
