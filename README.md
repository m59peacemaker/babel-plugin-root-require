# babel-plugin-root-require

Transforms require module paths that have a prefix referring to the project root. Also works on `require.resolve`.

## install

```sh
npm install babel-plugin-root-require
```

## example

### file structure

- src (project root)
  - foo
    - a.js
  - bar
    - b.js
    - baz
      - c.js
  - d.js

### javascript

```js
// these paths will work from any file in the project root (src)
require('~/foo/a')
require('~/bar/b')
require('~/bar/baz/c')
require('~/d')

// foo/a.js
require('~/d') // -> require('../d')
```

### .babelrc

```json
{
  "plugins": [
    ["root-require", {
      "projectRoot": "src"
    }]
  ]
}
```

### terminal

```sh
babel src --out-dir build
```

## options

### prefix = '~'

Prefix that refers to the project root

### projectRoot = process.cwd()

Absolute path of project root or relative path from process.cwd() to the project root which `prefix` refers to. Module paths will not be resolved correctly if this option is not correct. In the typical case that the source code is under the `src` directory, but babel is executed in the parent directory of `src`, set `projectRoot: src`.

### long = false

By default, transformed module paths will be the most efficient path from the requiring file to the module. When `long` is `true`, the prefix will be transformed to the relative path up the tree to the project root and the rest of the path is untouched. In some cases, the module path will be longer this way, because the path goes up the tree to the project root and then back down the tree to the module.
