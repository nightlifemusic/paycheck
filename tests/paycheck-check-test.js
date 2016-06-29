var paycheck = new (require('../paycheck.js'))({})
var assert = require("assert");
var chai = require("chai");
var expect = chai.expect;
var _ = require('lodash')
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

describe('paycheck', function () {
    describe('check', function () {
        this.timeout(60000);

        it('should be able to check JSON rpc payloads against templates', function (done) {
            var jsonrpc = {
                jsonrpc : '2.0',
                method : 'service.controller.function',
                params : {"a" : "b", "c" : {"d" : {"e" : "f"}}},
                id : 1
            }
            
            var templates = {
                service : { controller : { function : [
                    {myTemplate: 
                        {
                            jsonrpc : '2.0', 
                            method: 'service.controller.function', 
                            id : "<%=*%>", 
                            params: {"a" : "<%=*%>", "c" : {"d" : {"e" : ["f", "g"]}}}
                        }
                    },
                    {myOtherTemplate: 
                        {
                            jsonrpc : '2.0', 
                            method: 'service.controller.function', 
                            id : "<%=*%>", 
                            params: {"a" : ["b","z"], "c" : {"d" : {"e" : "f"}}}
                        }
                    }
                ]}}
            }

            var checkSpy = sinon.spy(paycheck, "match");

            paycheck.check(jsonrpc, templates)

            checkSpy.should.have.been.calledOnce;
            checkSpy.should.have.been.calledWith(jsonrpc, templates.service.controller.function[0].myTemplate)

            done();

        })
    })
})