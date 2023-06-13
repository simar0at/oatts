// Copyright 2018 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var handlebars = require('handlebars');
var helpers = require('./handlebar-helpers')
var fs = require('fs')
var path = require('path')

var DefaultTemplateDirectory = path.join(__dirname, '..', 'templates');
var TopLevelTemplateName = 'topLevel.handlebars';
var PathTemplateName = 'pathLevel.handlebars';
var OperationTemplateName = 'operationLevel.handlebars';
var TransactionTemplateName = 'transactionLevel.handlebars';

/**
 * @namespace compilation
 */

module.exports = compile

handlebars.registerHelper('notEmptyObject', helpers.notEmptyObject)
handlebars.registerHelper('json', helpers.json)
handlebars.registerHelper('isNotDefaultStatusCode',
    helpers.isNotDefaultStatusCode)

/**
 * GeneratedTest is the set of results from procressing a spec & compiling the test code
 * @typedef {object} GeneratedTest
 * @memberof compilation
 * @property {string} filename A file name based off of the path being tested
 * @property {string} contents Generated test file contents
 */

/**
 * Compiles the templated test files with the given processed API spec data
 * @function compile
 * @memberof compilation
 * @instance
 * @param {processing.ProcessedSpec} processed the API spec data processed for test generation
 * @param {object} options for use in compilation of the tests
 * @return {compilation.GeneratedTest[]}
 */
function compile(processed, options) {
  var tests = []

  processed.tests.forEach(function (processedPath, ndx, arr) {
    var pathTest = compilePathLevel(processedPath, processed, options)

    if (pathTest !== null) {
      tests.push({
        'filename': processedPath.name + '-test.js',
        'contents': pathTest
      })
    }
  });

  if (tests.length === 0) {
    return null
  }

  return tests
}

/**
 * GeneratedPath is the result of procressing a path & compiling the path-level test code
 * @typedef {object} GeneratedPath
 * @memberof compilation
 * @property {string} test the generated test code portion
 */

/**
 * Compiles the path level 'describe' content
 * @function compilePathLevel
 * @memberof compilation
 * @instance
 * @param {processing.ProcessedPath} processedPath the processed path object to be compiled
 * @param {processing.ProcessedSpec} processed the entire processed API spec
 * @param {object} options for use in test compilation
 * @return {compilation.GeneratedPath}
 */
function compilePathLevel(processedPath, processed, options) {
  var requireLevelCompiler = prepareTemplate('requireLevel',
      path.join(
          options.templates ? options.templates : DefaultTemplateDirectory,
          TopLevelTemplateName
      )
  )

  prepareTemplate('pathLevel',
      path.join(
          options.templates ? options.templates : DefaultTemplateDirectory,
          PathTemplateName
      )
  )

  prepareTemplate('operationLevel',
      path.join(
          options.templates ? options.templates : DefaultTemplateDirectory,
          OperationTemplateName
      )
  )

  prepareTemplate('transactionLevel',
    path.join(
        options.templates ? options.templates : DefaultTemplateDirectory,
        TransactionTemplateName
    )
  )

  return requireLevelCompiler({
    processedPath
  })
}

/**
 * GeneratedOp is the result of procressing an operation & compiling the operation-level test code
 * @typedef {object} GeneratedOp
 * @memberof compilation
 * @property {string} operationLevelDescription the operation level description to use incompilation
 * @property {compilation.GeneratedTransaction[]} operationLevelTests Generated test file contents
 */

/**
 * GeneratedTransaction is the compiled unit test code for a specific transaction
 * @typedef {string} GeneratedTransaction
 * @memberof compilation
 */

/**
 * prepares a handlebars template for the template given by the path
 * @function prepareTemplate
 * @memberof compilation
 * @instance
 * @param {string} name a name this template is registered as partial
 * @param {string} templatePath path to the template to load
 * @return {function}
 */
function prepareTemplate(name, templatePath) {
  var source = fs.readFileSync(templatePath, 'utf8'),
      ret = handlebars.compile(source, {noEscape: true});
  handlebars.registerPartial(name, ret);
  return ret
}
