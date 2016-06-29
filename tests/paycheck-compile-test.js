
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

        it('should be able compile templates from base templates, substitutions and contexts', function (done) {
            var baseTemplates = [
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
                    myTemplate:
                    {
                        jsonrpc: '2.0',
                        method: 'service.controller.functionB',
                        id: "<%=*%>",
                        params: { "a": "<%=*%>", "c": { "d": { "e": ["f", "g"] } } }
                    }
                },
                {
                    subTemplate:
                    {
                        jsonrpc: '2.0',
                        method: 'service.controller.function',
                        id: "<%=*%>",
                        params: { "a": "<%=*%>", "c": { "d": { "e": "<%= sub %>" } } }
                    }
                },
                {
                    subCompTemplate:
                    {
                        jsonrpc: '2.0',
                        method: 'service.controller.function',
                        id: "<%=*%>",
                        params: { "a": "<%=*%>", "c": { "d": { "e": "<%= subComp %>", "f" : "<%= subCompOther"} } }
                    }
                }
            ]

            var substitutions = [
                {"sub" : ["f", "g", "h", "i"]},
                {"subComp": () => {
                    if(this.contextQualifier === "firstContext") return Promise.resolve("first")
                    else if (this.contextQualifier === "secondContext") return Promise.resolve(["secondA", "secondB"])
                    else return Promise.resolve(["third"]) 
                }},
                {"subCompOther": () => {
                    if(this.otherQualifier === "otherQualifierValue") return Promise.resolve("hasOtherQualifierValue")
                    else return Promise.resolve("doesNotHaveOtherQualifierValue")
                }}
            ]

            var contexts = [
                {contextQualifier : "firstContext",
                 otherQualifier : "otherQualifierValue"
                },
                {contextQualifier : "secondContext"} // this will be overwrite the other
            ]

            var expectedTemplates = {
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
                                subTemplate:
                                {
                                    jsonrpc: '2.0',
                                    method: 'service.controller.function',
                                    id: "<%=*%>",
                                    params: { "a": ["b", "z"], "c": { "d": { "e": ["f", "g", "h", "i"] } } }
                                }
                            },
                            {
                                subCompTemplate:
                                {
                                    jsonrpc: '2.0',
                                    method: 'service.controller.function',
                                    id: "<%=*%>",
                                    params: { "a": ["b", "z"], "c": { "d": { "e": ["secondA", "secondB"] } } }
                                }
                            }
                        ],
                        functionB: [
                        {
                            myTemplate:
                            {
                                jsonrpc: '2.0',
                                method: 'service.controller.functionB',
                                id: "<%=*%>",
                                params: { "a": "<%=*%>", "c": { "d": { "e": ["f", "g"] } } }
                            }
                        }]
                    }
                }
            }

            var compiledTemplates = paycheck.compile(templates, substitutions, contexts)
            
            expect(compiledTemplates).to.deep.equal(expectedTemplates);
            
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