# root require

Replaces a prefix in `require` calls with the relative path from the file to the project root.

## install

```sh
npm install babel-plugin-root-require
```

## example

```sh
babel src --source-root src --plugins root-require --out-dir build
```

- src (project root)
  - foo
    - a.js
  - bar
    - b.js
    - baz
      - c.js
  - d.js

```js
// these paths will work from any file in the project root (src)
require('~/foo/a')
require('~/bar/b')
require('~/bar/baz/c')
require('~/d')

// foo/a.js
require('~/d') // -> require('../d')

// bar/baz/c.js
require('~/bar/b') // -> require('../../bar/b')
```

## options

### prefix = '~'

The string which, when followed by a forward slash `/`, will be replaced with the relative path from the file to the project root.
