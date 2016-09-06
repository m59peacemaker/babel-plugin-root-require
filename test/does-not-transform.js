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


