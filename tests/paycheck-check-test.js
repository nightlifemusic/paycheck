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

        it('should be able to check JSON rpc payloads against templates, accepting the first template to match', function (done) {
            var jsonrpc = {
                jsonrpc: '2.0',
                method: 'service.controller.function',
                params: { "a": "b", "c": { "d": { "e": "f" } } },
                id: 1
            }

            var templates = {
                service: {
                    controller: {
                        function: [
                            {
                                myTemplate:
                                {
                                    jsonrpc: '2.0',
                                    method: 'service.controller.function',
                                    id: "<%=*%>",
                                    params: { "a": "<%=*%>", "c": { "d": { "e": ["f", "g"] } } }
                                }
                            },
                            {
                                myOtherTemplate:
                                {
                                    jsonrpc: '2.0',
                                    method: 'service.controller.function',
                                    id: "<%=*%>",
                                    params: { "a": ["b", "z"], "c": { "d": { "e": "f" } } }
                                }
                            }
                        ]
                    }
                }
            }

            var checkSpy = sinon.spy(paycheck, "match");

            expect(paycheck.check(jsonrpc, templates)).to.be.true

            checkSpy.should.have.been.calledOnce;
            checkSpy.should.have.been.calledWith(jsonrpc, templates.service.controller.function[0].myTemplate)

            checkSpy.restore();

            done();

        })

        it('should be able to check JSON rpc payloads against templates, accepting the second template to match', function (done) {
            var jsonrpc = {
                jsonrpc: '2.0',
                method: 'service.controller.function',
                params: { "a": "b", "c": { "d": { "e": "f" } } },
                id: 1
            }

            var templates = {
                service: {
                    controller: {
                        function: [
                            {
                                myTemplate:
                                {
                                    jsonrpc: '2.0',
                                    method: 'service.controller.function',
                                    id: "<%=*%>",
                                    params: { "a": "z", "c": { "d": { "e": ["f", "g"] } } }
                                }
                            },
                            {
                                myOtherTemplate:
                                {
                                    jsonrpc: '2.0',
                                    method: 'service.controller.function',
                                    id: "<%=*%>",
                                    params: { "a": ["b", "z"], "c": { "d": { "e": "f" } } }
                                }
                            }
                        ]
                    }
                }
            }

            var checkSpy = sinon.spy(paycheck, "match");

            expect(paycheck.check(jsonrpc, templates)).to.be.true

            checkSpy.should.have.been.calledTwice;
            checkSpy.should.have.been.calledWith(jsonrpc, templates.service.controller.function[0].myTemplate)
            checkSpy.should.have.been.calledWith(jsonrpc, templates.service.controller.function[1].myOtherTemplate)

            checkSpy.restore();

            done();
        })

        it('should be able to check JSON rpc payloads against templates, denying both', function (done) {
            var jsonrpc = {
                jsonrpc: '2.0',
                method: 'service.controller.function',
                params: { "a": "b", "c": { "d": { "e": "f" } } },
                id: 1
            }

            var templates = {
                service: {
                    controller: {
                        function: [
                            {
                                myTemplate:
                                {
                                    jsonrpc: '2.0',
                                    method: 'service.controller.function',
                                    id: "<%=*%>",
                                    params: { "a": "z", "c": { "d": { "e": ["f", "g"] } } }
                                }
                            },
                            {
                                myOtherTemplate:
                                {
                                    jsonrpc: '2.0',
                                    method: 'service.controller.function',
                                    id: "<%=*%>",
                                    params: { "a": ["b", "z"], "c": { "d": { "e": "z" } } }
                                }
                            }
                        ]
                    }
                }
            }

            var checkSpy = sinon.spy(paycheck, "match");

            expect(paycheck.check(jsonrpc, templates)).to.be.false

            checkSpy.should.have.been.calledTwice;
            checkSpy.should.have.been.calledWith(jsonrpc, templates.service.controller.function[0].myTemplate)
            checkSpy.should.have.been.calledWith(jsonrpc, templates.service.controller.function[1].myOtherTemplate)

            done();
        })

    })// describe
})