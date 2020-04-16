const define = require('requirejs')

define.config({
  baseUrl: __dirname
});

const testr = require('../../unit/lib/testr');

testr.config({
  root: '../',
  baseUrl: 'lib',
  specUrl: 'test/unit',
  stubUrl: 'stub',
  ignore: ['jquery', 'underscore'],
  whitelist: ['path/to/allowed/actual', 'underscore', 'backbone']
})

const test = require('ava')

define([], (testr) => {

  // module instancing
  const utils = testr('utils', { 'fs': {} })

  test('foo', t => {
    utils.isFileExists('path')
    t.pass()
  })

  test('bar', async t => {
    const bar = Promise.resolve('bar')
    t.is(await bar, 'bar')
  })
})
