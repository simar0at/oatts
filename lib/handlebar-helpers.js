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

/**
 * @namespace templateHelpers
 */

module.exports = {
  notEmptyObject,
  json,
  isNotDefaultStatusCode,
  camelCase,
  ifCond
}

/**
 * determines if the given object is empty or not
 * @function notEmptyObject
 * @memberof templateHelpers
 * @instance
 * @param {object} obj object to be evaluated
 * @return {boolean}
 */
function notEmptyObject(obj) {
  if (arguments.length < 1) {
    throw new Error('Handlebars Helper \'notEmptyObject\' needs 1 parameter');
  }

  return obj !== undefined && Object.keys(obj).length !== 0
}

/**
 * stringifies the given JSON object
 * @function json
 * @memberof templateHelpers
 * @instance
 * @param {object} obj JSON object to be stringified
 * @return {string}
 */
function json(obj) {
  if (arguments.length < 1) {
    throw new Error('Handlebars Helper \'json\' needs 1 parameter');
  }

  return JSON.stringify(obj)
}

/**
 * determines if the given status code is the 'default' status
 * @function isNotDefaultStatusCode
 * @memberof templateHelpers
 * @instance
 * @param {(string | number)} code status code to check
 * @return {boolean}
 */
function isNotDefaultStatusCode(code) {
  if (arguments.length < 1) {
    throw new Error(
        'Handlebars Helper \'isNotDefaultStatusCode\' needs 1 parameter');
  }

  return code !== 'default'
}

/**
 * transforms a string containing / separators to CamelCase
 * @function camelCase
 * @memberof templateHelpers
 * @instance
 * @param {string} path a path like string that should be transformed
 * @return {string}
 */
function camelCase(path) {
  if (arguments.length < 1 || path === undefined) {
    throw new Error(
        'Handlebars Helper \'camelCase\' needs 1 parameter');
  }

  return path.startsWith('/') ? path.replace(/[\/{}]+(.)?/g, (_, v) => v ? v.toUpperCase() : '') : path[0].toUpperCase()+path.substring(1)
}

/**
 * https://stackoverflow.com/questions/8853396/logical-operator-in-a-handlebars-js-if-conditional
 * @param {(string | number)} v1 
 * @param {('=='|'!=')} operator 
 * @param {(string | number)} v2 
 * @param {*} options 
 * @returns 
 */
function ifCond (v1, operator, v2, options) {

  switch (operator) {
      case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
          return options.inverse(this);
  }
};