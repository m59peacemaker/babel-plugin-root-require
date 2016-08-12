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

test('transforms prefix when file is nested 1 level', t => {
  t.plan(1)
  const code = 'require("~/foo");'
  const result = transform(code, {
    filename: 'a/file.js',
    plugins
  })
  t.equal(result.code, 'require("../foo");')
})

test('transforms prefix when file is nested 2 levels', t => {
  t.plan(1)
  const code = 'require("~/foo");'
  const result = transform(code, {
    filename: 'a/b/file.js',
    plugins
  })
  t.equal(result.code, 'require("../../foo");')
})

test('transforms prefix with relative source root', t => {
  t.plan(1)
  const code = 'require("~/foo");'
  const result = transform(code, {
    sourceRoot: 'a',
    filename: 'file.js',
    plugins
  })
  t.equal(result.code, 'require("./foo");')
})

test('transforms prefix with absolute source root', t => {
  t.plan(1)
  const code = 'require("~/foo");'
  const result = transform(code, {
    sourceRoot: process.cwd() + '/a',
    filename: 'b/file.js',
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
  t.equal(result.code, 'require("../x");')
})

test('', t => {
  t.plan(1)
  const result = transform('require("~/foo" + myVar + "/test");', {
    filename: 'foo/bar/file.js',
    plugins
  })
  t.equal(result.code, 'require("./../foo" + myVar + "/test");')
})
