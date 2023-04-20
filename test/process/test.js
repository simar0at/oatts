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

var chai = require('chai');
var expect = chai.expect
chai.use(require('chai-match'));
var process = require('../../lib/process.js')
var mocha = require('mocha')
var util = require('util')
var sway = require('sway')
const OpenAPIParser = require("@readme/openapi-parser");
var specPath = './node_modules/@readme/oas-examples/3.0/yaml/petstore.yaml'

describe('process', function () {
  var api;

  before(function (done) {
    OpenAPIParser.validate(specPath)
      .then(function (specObj) {
    sway.create({ 'definition': specObj })
      .then(function (spec) {
        api = spec;
      })
      .then(done, done);
  })
  })

  describe('no options', function () {
    it('should process all correctly', function (done) {
      try {
        var data = process(api, {})
        expect(data).to.not.be.null
        expect(data.host).to.equal("petstore.swagger.io",
          "host property did not match the spec")
        expect(data.scheme).to.equal("http")
        expect(data.tests).to.not.be.empty
        expect(data.tests.length).to.equal(api.getPaths().length)
        done()
      } catch (err) {
        done(err)
      }
    })
  })

  describe('option-based', function () {
    it('should process just \'/pet\' correctly', function (done) {
      try {
        var data = process(api, { 'paths': ['/pet'] })
        expect(data).to.not.be.null
        expect(data.host).to.equal("petstore.swagger.io",
          "host property did not match the spec")
        expect(data.scheme).to.equal("http")
        expect(data.consumes).to.be.empty
        expect(data.tests.length).to.equal(
          1, "returned tests set was expected to have 1 item, but it had "
        + data.tests.length)
        done()
      } catch (err) {
        done(err)
      }
    })

    it('should process with option.host correctly', function (done) {
      var optionHost = 'test.acme.net'
      try {
        var data = process(api, { 'host': optionHost })
        expect(data).to.not.be.null
        expect(data.host).to.equal(
          optionHost, "generated host property expected to be " + optionHost
          + " but was " + data.host)
        expect(data.scheme).to.equal("http")
        expect(data.tests).to.not.be.empty
        done()
      } catch (err) {
        done(err)
      }
    })

    it('should process \'/pet/{petId}\' & \'/pet\' with option.samples active correctly',
      function (done) {
        try {
          var data = process(api,
            { 'samples': true, 'paths': ['/pet', '/pet/{petId}'] })
          expect(data).to.not.be.null
          expect(data.host).to.equal("petstore.swagger.io",
            "host property did not match the spec")
          expect(data.scheme).to.equal("http")
          expect(data.tests.length).to.equal(2)
          done()
        } catch (err) {
          done(err)
        }
      })

    it('should process \'/pet\' with first operation consumes',
      function (done) {
        try {
          var data = process(api, { 'samples': true, 'paths': ['/pet'] })
          expect(data).to.not.be.null
          expect(data.host).to.equal("petstore.swagger.io",
            "host property did not match the spec")
          expect(data.scheme).to.equal("http")
          expect(data.tests).to.not.be.empty
          expect(
            data.tests[0].operations[0].transactions[0].headers['Content-Type']).to.equal(
              'application/json')
          done()
        } catch (err) {
          done(err)
        }
      })

    it('should process \'/pet/findByStatus\' correctly with customValues headers, query param, & response body',
      function (done) {
        var expectedHeaders = {
          GlobalShow: 'global',
          PathOverride: 'path',
          OpOverrideFromGlobal: 'op',
          PathShow: 'path',
          OpOverrideFromPath: 'op',
          OpShow: 'op',
          Accept: 'application/xml',
          StatusCodeShow: "statusCode",
          StatusCodeOverrideFromGlobal: "statusCode",
          StatusCodeOverrideFromPath: "statusCode",
          StatusCodeOverrideFromOp: "statusCode"
        }

        try {
          var customVals = require('./documents/customValuesTest.json')
          var data = process(api, {
            'customValues': customVals,
            'paths': ['/pet/findByStatus']
          })

          expect(data).to.not.be.null
          expect(data.host).to.equal("petstore.swagger.io",
            "host property did not match the spec")
          expect(data.scheme).to.equal("http")
          expect(data.tests).to.not.be.empty
          data.tests[0].operations[0].transactions.forEach(
            function (item, ndx, arr) {
              // 400 has no Accept header specified
              if (arr[ndx].testLevelDescription.match(/400/)) {
                delete expectedHeaders.Accept
              }
              expect(item.headers).to.deep.equal(expectedHeaders, 'Expected headers don\'t match for ' + arr[ndx].testLevelDescription)
            })

          expect(
            data.tests[0].operations[0].transactions[0].query).to.deep.equal(
              customVals['/pet/findByStatus']['get']['200'][0]['query'])
          expect(
            data.tests[0].operations[0].transactions[0].expected.res).to.deep.equal(
              customVals['/pet/findByStatus']['get']['200'][0]['response'])
          expect(
            data.tests[0].operations[0].transactions[1].query).to.deep.equal(
              customVals['/pet/findByStatus']['get']['200'][1]['query'])
          expect(
            data.tests[0].operations[0].transactions[1].expected.res).to.deep.equal(
              customVals['/pet/findByStatus']['get']['200'][1]['response'])
          expect(
            data.tests[0].operations[0].transactions[2].query).to.deep.equal(
              customVals['/pet/findByStatus']['get']['query'])

          done()
        } catch (err) {
          done(err)
        }
      })

    it('should process \'/pet/findByStatus\' correctly with in-line example query param, with explicit exclusion',
      function (done) {
        try {
          var data = process(api, {
            'customValues': {
              '/pet/findByStatus': {
                'query': {
                  petName: 'some other name'
                },
                'get': {
                  'query': {
                    petName: 'your pet name here <3'
                  }
                }
              }
            },
            'paths': ['/pet/findByStatus']
          })

          expect(data).to.not.be.null
          expect(data.host).to.equal("petstore.swagger.io",
            "host property did not match the spec")
          expect(data.scheme).to.equal("http")
          expect(data.tests).to.not.be.empty
          expect(
            data.tests[0].operations[0].transactions[0].query).to.deep.equal(
              { petName: 'your pet name here <3' })
          done()
        } catch (err) {
          done(err)
        }
      })

    it('should process \'/pet/findByStatus\' correctly with in-line example query param',
      function (done) {
        try {
          var data = process(api, {
            'paths': ['/pet/findByStatus']
          })

          expect(data).to.not.be.null
          expect(data.host).to.equal("petstore.swagger.io",
            "host property did not match the spec")
          expect(data.scheme).to.equal("http")
          expect(data.tests).to.not.be.empty
          expect(data.tests[0].operations[0].transactions[0].query).to.have.all.keys('status')
          data.tests[0].operations[0].transactions[0].query.status.forEach(status => {
            expect(status).to.be.oneOf(['pending', 'available', 'sold']);
          });
          done()
        } catch (err) {
          done(err)
        }
      })

    it('should process \'/pet/{petId}/uploadImage\' correctly with in-line null example formData param',
      function (done) {
        try {
          var data = process(api, {
            'paths': ['/pet/{petId}/uploadImage']
          })

          expect(data).to.not.be.null
          expect(data.host).to.equal("petstore.swagger.io",
            "host property did not match the spec")
          expect(data.scheme).to.equal("http")
          expect(data.tests).to.not.be.empty
          expect(
            data.tests[0].operations[0].transactions[0].path).to.match(/\/v2\/pet\/-?\d+\/uploadImage/)
          expect(
            data.tests[0].operations[0].transactions[0].query).to.deep.equal(
              {})

          done()
        } catch (err) {
          done(err)
        }
      })

    it('should process \'/pet\' correctly with custom body params from a file',
      function (done) {
        try {
          var customVals = require('./documents/customValuesTest.json')
          var data = process(api, {
            'customValues': customVals,
            'paths': ['/pet']
          })

          expect(data).to.not.be.null
          expect(data.host).to.equal("petstore.swagger.io",
            "host property did not match the spec")
          expect(data.scheme).to.equal("http")
          expect(data.tests).to.not.be.empty
          expect(
            data.tests[0].operations[0].transactions[0].body).to.deep.equal(
              customVals['/pet']['post']['405']['body']['body'])

          done()
        } catch (err) {
          done(err)
        }
      })

    it('should process \'/pet/{petId}\' correctly with custom path params from a file',
      function (done) {
        try {
          var customVals = require('./documents/customValuesTest.json')
          var data = process(api, {
            'customValues': customVals,
            'paths': ['/pet/{petId}']
          })

          expect(data).to.not.be.null
          expect(data.host).to.equal("petstore.swagger.io",
            "host property did not match the spec")
          expect(data.scheme).to.equal("http")
          expect(data.tests).to.not.be.empty
          expect(
            data.tests[0].operations[0].transactions[0].path).to.equal('/v2/pet/'
              + customVals['/pet/{petId}']['get']['200']['path']['petId'])
          expect(
            data.tests[0].operations[0].transactions[1].path).to.equal('/v2/pet/'
              + customVals['/pet/{petId}']['get']['path']['petId'])
          expect(
            data.tests[0].operations[1].transactions[0].path).to.equal('/v2/pet/'
              + customVals['/pet/{petId}']['post']['405']['path']['petId'])
          expect(
            data.tests[0].operations[1].transactions[0].formData).to.deep.equal({ status: 'pending' })
          done()
        } catch (err) {
          done(err)
        }
      })

    it('should process \'/pet/{petId}\' with in-line example path and formData param',
      function (done) {
        try {
          var data = process(api, {
            'paths': ['/pet/{petId}']
          })

          expect(data).to.not.be.null
          expect(data.host).to.equal("petstore.swagger.io",
            "host property did not match the spec")
          expect(data.scheme).to.equal("http")
          expect(data.tests).to.not.be.empty
          expect(
            data.tests[0].operations[0].transactions[0].path).to.matches(/\/v2\/pet\/-?\d+/)
          expect(data.tests[0].operations[1].transactions[0].formData).to.deep.equal(
            { name: undefined, status: undefined })
          done()
        } catch (err) {
          done(err)
        }
      })

    it('should process /pet/{petId} correctly with header params',
      function (done) {
        try {
          var data = process(api, {
            'paths': ['/pet/{petId}']
          })

          expect(data).to.not.be.null
          expect(data.tests).to.not.be.empty
          expect(
            data.tests[0].operations[2].transactions[0].headers).to.have.property(
              'api_key')

          done()
        } catch (err) {
          done(err)
        }
      })

    it('should process /pet/{petId} correctly with in-line example header params',
      function (done) {
        try {
          var data = process(api, {
            'paths': ['/pet/{petId}']
          })

          expect(data).to.not.be.null
          expect(data.tests).to.not.be.empty
          expect(
            data.tests[0].operations[2].transactions[0].headers).to.have.property(
              'api_key')
          expect(
            typeof data.tests[0].operations[2].transactions[0].headers['api_key']).to.equal('string')
          done()
        } catch (err) {
          done(err)
        }
      })

    it('should only process /pet 405 tests', function (done) {
      try {
        var data = process(api, {
          'paths': ['/pet'],
          'statusCodes': ['405']
        })

        expect(data).to.not.be.null
        expect(data.tests).to.not.be.empty
        expect(data.tests.length).to.equal(1)
        expect(data.tests[0].name).to.equal('pet')

        done()
      } catch (err) {
        done(err)
      }
    })

    it('should not have spaces in path params of type string', function (done) {
      try {
        var data = process(api, {
          'paths': ['/store/order/{orderId}'],
          'statusCodes': ['200']
        })

        expect(data).to.not.be.null
        expect(data.tests).to.not.be.empty
        expect(data.tests[0].operations[0].transactions[0].path.includes(
          ' '), 'Actual: ' + data.tests[0].operations[0].transactions[0].path
        + ' ').to.be.false;

        done();
      } catch (err) {
        done(err)
      }
    })
  })
})
