const test = require('tape')
const {transform} = require('babel-core')
const plugin = require('../')
const plugins = [plugin]
const rimraf = require('rimraf')
const exec = require('child_process').exec
const reloadRequire = require('require-reload')(require)

const fixtures = __dirname + '/fixtures'
const fixture = name => fixtures + '/' + name
const tmpDir = '/tmp/test-root-require'

const resetState = () => rimraf.sync(tmpDir)
const compile = (src, cwd, cb) => {
  return exec(`${require.resolve('babel-cli/bin/babel')} ${src} -d ${tmpDir} --plugins ${__dirname}/../index`, {cwd}, (err, body) => {
    console.log(body)
    cb(err, body)
  })
}

require('./does-not-transform')

test('transforms prefixed module path to relative path to module', t => {
  t.plan(1)
  const result = transform('require("~/a/b/c");', {
    filename: 'a/b/d',
    plugins
  })
  t.equal(result.code, 'require("./c");')
})

test('opts.longPath replaces prefix with relative path to project root', t => {
  t.plan(1)
  const result = transform('require("~/a/b/c");', {
    filename: 'a/b/d',
    plugins: [[plugin, {long: true}]]
  })
  t.equal(result.code, 'require("../../a/b/c");')
})

test('transforms prefix from file in root directory', t => {
  t.plan(1)
  compile('./', fixture('a'), err => {
    if (err) { return t.fail(err) }
    const result = reloadRequire(tmpDir + '/req-a')
    resetState()
    t.equal(result, 'a')
  })
})

test('transforms prefix nested', t => {
  t.plan(1)
  compile('./', fixture('b'), err => {
    if (err) { return t.fail(err) }
    const result = reloadRequire(tmpDir + '/nest/nest/b')
    resetState()
    t.equal(result, 'b')
  })
})

test('transforms prefix for expression starting with prefix', t => {
  t.plan(1)
  compile('./', fixture('c'), err => {
    if (err) { return t.fail(err) }
    const result = reloadRequire(tmpDir)
    resetState()
    t.equal(result, 'c')
  })
})

test('transforms prefix for argument with string and variable', t => {
  t.plan(1)
  compile('./', fixture('d'), err => {
    if (err) { return t.fail(err) }
    const result = reloadRequire(tmpDir)
    resetState()
    t.equal(result, 'd')
  })
})

test('transforms prefix when followed by a string not ending in a slash, followed by stuff', t => {
  t.plan(1)
  compile('./', fixture('e'), err => {
    if (err) { return t.fail(err) }
    const result = reloadRequire(tmpDir)
    resetState()
    t.equal(result, 'e')
  })
})

test('transforms prefix with template string interpolation', t => {
  t.plan(1)
  compile('./', fixture('f'), err => {
    if (err) { return t.fail(err) }
    const result = reloadRequire(tmpDir)
    resetState()
    t.equal(result, 'f')
  })
})

test('works with relative projectRoot opt and relative filename', t => {
  t.plan(1)
  const result = transform('require("~/foo");', {
    filename: 'src/file.js',
    plugins: [[plugin, {projectRoot: './src'}]]
  })
  t.equal(result.code, 'require("./foo");')
})

test('works with relative projectRoot opt and absolute filename', t => {
  t.plan(1)
  const result = transform('require("~/foo");', {
    filename: process.cwd() + '/src/file.js',
    plugins: [[plugin, {projectRoot: './src'}]]
  })
  t.equal(result.code, 'require("./foo");')
})

test('works with absolute projectRoot opt and relative filename', t => {
  t.plan(1)
  const result = transform('require("~/foo");', {
    filename: 'src/file.js',
    plugins: [[plugin, {projectRoot: process.cwd() + '/src'}]]
  })
  t.equal(result.code, 'require("./foo");')
})

test('works with absolute projectRoot opt and absolute filename', t => {
  t.plan(1)
  const result = transform('require("~/foo");', {
    filename: process.cwd() + '/src/file.js',
    plugins: [[plugin, {projectRoot: process.cwd() + '/src'}]]
  })
  t.equal(result.code, 'require("./foo");')
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

test('transforms require.resolve', t => {
  t.plan(1)
  const result = transform('require.resolve("~/foo");', {
    filename: 'file.js',
    plugins
  })
  t.equal(result.code, 'require.resolve("./foo");')
})

test('transform require that is in a function scope', t => {
  t.plan(1)
  const code = `const foo = () => {
  function bar() {
    return require("~/a");
  }
  return bar;
};`
  const result = transform(code, {
    filename: 'b',
    plugins
  })
  t.equal(result.code, code.replace('~', '.'))
})

test('preserves trailing slash', t => {
  t.plan(1)
  const result = transform('require("~/foo/" + bar);', {
    filename: 'a',
    plugins
  })
  t.equal(result.code, 'require("./foo/" + bar);')
})
