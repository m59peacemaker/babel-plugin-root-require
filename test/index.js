const test = require('tape')
const {transform} = require('babel-core')
const plugin = require('../')
const plugins = [plugin]

test('does not transform other functions', t => {
  t.plan(1)
  const code = 'foo("bar");'
  const result = transform(code, {
    plugins
  })
  t.equal(result.code, code)
})

test('does not transform require when there is no argument to require', t => {
  t.plan(1)
  const code = 'require();'
  const result = transform(code, {
    plugins
  })
  t.equal(result.code, code)
})

test('does not transform require when code is not from a file', t => {
  t.plan(1)
  const code = 'require("./foo");'
  const result = transform(code, {
    plugins
  })
  t.equal(result.code, code)
})

test('does not transform require when starts with variable', t => {
  t.plan(1)
  const code = 'require(myVar + "/foo");'
  const result = transform(code, {
    filename: 'foo/bar.js',
    plugins
  })
  t.equal(result.code, code)
})

test('does not transform require when path is not prefixed', t => {
  t.plan(1)
  const code = 'require("./foo");'
  const result = transform(code, {
    filename: 'foo/bar.js',
    plugins
  })
  t.equal(result.code, code)
})

test('transforms prefix from file in root directory', t => {
  t.plan(1)
  const code = 'require("~/foo");'
  const result = transform(code, {
    filename: 'file.js',
    plugins
  })
  t.equal(result.code, 'require("./foo");')
})

test('transforms prefix nested', t => {
  t.plan(1)
  const result = transform('require("~/app/utils/get-things");', {
    filename: 'app/views/the-light.js',
    plugins
  })
  t.equal(result.code, 'require("../../app/utils/get-things");')
})

test('transforms prefix nested with sourceRoot', t => {
  t.plan(1)
  const result = transform('require("~/app/utils/get-things");', {
    sourceRoot: 'src',
    filename: 'src/app/views/the-light.js',
    plugins
  })
  t.equal(result.code, 'require("../../app/utils/get-things");')
})

test('transforms prefix with absolute source root', t => {
  t.plan(1)
  const code = 'require("~/foo");'
  const result = transform(code, {
    sourceRoot: process.cwd() + '/a',
    filename: 'a/b/file.js',
    plugins
  })
  t.equal(result.code, 'require("../foo");')
})

test('transforms prefix with absolute filename set', t => {
  t.plan(1)
  const code = 'require("~/foo");'
  const result = transform(code, {
    filename: process.cwd() + '/file.js',
    plugins
  })
  t.equal(result.code, 'require("./foo");')
})

test('transforms prefix for expression starting with prefix', t => {
  t.plan(1)
  const result = transform('require("~/" + "/foo");', {
    filename: 'foo/bar/file.js',
    plugins
  })
  t.equal(result.code, 'require("../../" + "/foo");')
})

test('transforms prefix for argument with string and variable', t => {
  t.plan(1)
  const result = transform('require("~/" + myVar + "/test");', {
    filename: 'foo/bar/file.js',
    plugins
  })
  t.equal(result.code, 'require("../../" + myVar + "/test");')
})

test('transforms prefix when require path is in the same tree as source filename', t => {
  t.plan(1)
  const result = transform('require("~/foo/x");', {
    filename: 'foo/bar/file.js',
    plugins
  })
  t.equal(result.code, 'require("../../foo/x");')
})

test('transforms prefix when followed by a string not ending in a slash, followed by stuff', t => {
  t.plan(1)
  const result = transform('require("~/foo" + myVar + "/test");', {
    filename: 'foo/bar/file.js',
    plugins
  })
  t.equal(result.code, 'require("../../foo" + myVar + "/test");')
})

test('transforms prefix with template string interpolation', t => {
  t.plan(1)
  const result = transform('require(`~/${ myVar }`);', {
    filename: 'a/file.js',
    plugins
  })
  t.equal(result.code, 'require(`../${ myVar }`);')
})

test('uses `prefix` option', t => {
  t.plan(1)
  const result = transform('require("^/foo");', {
    filename: 'file.js',
    plugins: [[plugin, {prefix: '^'}]]
  })
  t.equal(result.code, 'require("./foo");')
})

test('`prefix` option can be several character long', t => {
  t.plan(1)
  const result = transform('require("hey-o/foo");', {
    filename: 'file.js',
    plugins: [[plugin, {prefix: 'hey-o'}]]
  })
  t.equal(result.code, 'require("./foo");')
})

test('throws error when `prefix` option is an object', t => {
  t.plan(1)
  try {
    const result = transform('require(`~/${ myVar }`);', {
      filename: 'a/file.js',
      plugins: [[plugin, {prefix: {}}]]
    })
    t.fail('did not throw')
  } catch (err) {
    t.pass(err)
  }
})

test('very nested', t => {
  t.plan(1)
  const result = transform('require("~/q/w/e/r/t/y");', {
    filename: 'a/b/c/d/e/file.js',
    plugins
  })
  t.equal(result.code, 'require("../../../../../q/w/e/r/t/y");')
})
