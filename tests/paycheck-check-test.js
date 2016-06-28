var paycheck = require('../paycheck.js')({})
var assert = require("assert");
var expect = require("chai").expect;
var _ = require('lodash')
var sinon = require("sinon");
var sinonChai = require("sinon-chai");

describe('paycheck', function () {
    describe('check', function () {
        this.timeout(60000);

        it('should be able to check JSON rpc payloads against templates', function (done) {
            //TODO mock out match method and unit test the check method
            done();

        })

        

    })
})