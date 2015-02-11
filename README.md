# dirwatcher

Recursively watch a directory for modifications.

Uses [findit](https://npmjs.org/package/findit) to walk the directory tree,
[filewatcher](https://npmjs.org/package/filewatcher) to watch each dir
and [minimatch](https://npmjs.org/package/minimatch) to match the files.

This method is very resource-friendly for large numbers of files since only
one file handle per directory is used.

## Usage

Pass a the path of a `dir` to watch:

```js
var dirwatcher = require('dirwatcher');

w = dirwatcher(dir, opts);
w.on('changed', function(file, stat) {
  console.log(file, stat.mtime);
});
```

## Events

A dirwatcher emits the following events:

* `ready` - when the inital directory scan is completed.
* `added` - when a file is added.
* `changed` - when the mtime of a file modified. Does not take the actual file content into account.
* `removed` - when a file has been removed.
* `steady` - 10 ms after the last event was fired.

## Options

You can specify a RegExp, String (a glob pattern) or function to control which
files are inclued and which sub-directories should be skipped.

```js
w = dirwatcher(dir, {
  include: '*.js',
  skip: 'node_modules'
});
```

If you just want to specify the `include` option you can pass it as 2nd argument:

```js
w = dirwatcher(dir, '*.js');
```

__Note__: If no `include` option is given, the following default implementation is used:

```js
function filesOnly(f, stat) {
  return stat.isFile();
}
```

Regular expressions and glob patterns are tested against a file's basename. If
you need to take the full path into account you have to pass a function instead.


### The MIT License (MIT)

Copyright (c) 2015 Felix Gnass

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
