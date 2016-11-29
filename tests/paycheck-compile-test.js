
var Promise = require("bluebird")
var paycheck = new (require('../paycheck.js'))({})
var assert = require("assert");
var chai = require("chai");
var expect = chai.expect;
var _ = require('lodash')
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

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
            params: { "a": "<%=*%>", "c": { "d": { "e": "<%= subComp %>", "f": "<%= subCompOther %>" } } }
        }
    },
    {
        blank:
        {
            jsonrpc: '2.0',
            method: 'service1.controller2.function3',
            id: "<%=*%>",
            params: {}
        }
    },
]

Object.freeze(baseTemplates);

var substitutions = [
    { "sub": ["f", "g", "h", "i"] },
    {
        "subComp": function () {
            if (this.contextQualifier === "firstContext") return Promise.resolve("first").delay(2000)
            else if (this.contextQualifier === "secondContext") return Promise.resolve(["secondA", "secondB"]).delay(2000)
            else return Promise.resolve(["third"]).delay(2000)
        }
    },
    {
        "subCompOther": function () {
            if (this.otherQualifier === "otherQualifierValue") return Promise.resolve("hasOtherQualifierValue").delay(2000)
            else return Promise.resolve("doesNotHaveOtherQualifierValue").delay(2000)
        }
    }
]

Object.freeze(substitutions);

var contexts = [
    {
        contextQualifier: "firstContext",
        otherQualifier: "otherQualifierValue"
    },
    { contextQualifier: "secondContext" } // this will be overwrite the other
]

Object.freeze(contexts);

var expectedResolvedSubstitutions = {
    "sub": ["f", "g", "h", "i"],
    "subComp": ["secondA", "secondB"],
    "subCompOther": "hasOtherQualifierValue"    
}

Object.freeze(expectedResolvedSubstitutions);

var expectedTemplates = {
    service: {
        controller: {
            function: {
                myTemplate:
                {
                    jsonrpc: '2.0',
                    method: 'service.controller.function',
                    id: "<%=*%>",
                    params: { "a": "<%=*%>", "c": { "d": { "e": ["f", "g"] } } }
                },
                subTemplate:
                {
                    jsonrpc: '2.0',
                    method: 'service.controller.function',
                    id: "<%=*%>",
                    params: { "a": "<%=*%>", "c": { "d": { "e": ["f", "g", "h", "i"] } } }
                },
                subCompTemplate:
                {
                    jsonrpc: '2.0',
                    method: 'service.controller.function',
                    id: "<%=*%>",
                    params: { "a": "<%=*%>", "c": { "d": { "e": ["secondA", "secondB"], "f" : "hasOtherQualifierValue" } } }
                }
            },
            functionB: {
                myTemplate:
                {
                    jsonrpc: '2.0',
                    method: 'service.controller.functionB',
                    id: "<%=*%>",
                    params: { "a": "<%=*%>", "c": { "d": { "e": ["f", "g"] } } }
                }
            }
        }
    },
    service1: {
        controller2: {
            function3: {
                blank:
                {
                    jsonrpc: '2.0',
                    method: 'service1.controller2.function3',
                    id: "<%=*%>",
                    params: {}
                }
            }
        }
    }
}

Object.freeze(expectedTemplates);

describe('paycheck', function () {
    describe('check', function () {
        this.timeout(60000);

        it('should be able fully compile templates from base templates, substitutions and contexts', function (done) {

            paycheck.compile(baseTemplates, substitutions, contexts)
                .then((compiledTemplates) => {
                    expect(compiledTemplates.service.controller.function).to.deep.equal(expectedTemplates.service.controller.function)
                    expect(compiledTemplates.service.controller.functionB).to.deep.equal(expectedTemplates.service.controller.functionB)
                    expect(compiledTemplates.service1.controller2.function3).to.deep.equal(expectedTemplates.service1.controller2.function3)
                    done();
                })
        })

        it('should fail with incomplete templates', function (done) {

            var brokenBaseTemplates = _.cloneDeep(baseTemplates);
            brokenBaseTemplates[2].subTemplate.params.c.d.e = "<%= sub %" // break it
            paycheck.compile(brokenBaseTemplates, substitutions, contexts)
                .then((compiledTemplates) => {
                    expect(compiledTemplates.service.controller.function.myTemplate).to.deep.equal(expectedTemplates.service.controller.function.myTemplate)
                    expect(compiledTemplates.service.controller.function.subTemplate).to.deep.equal(
                        {
                            jsonrpc: '2.0',
                            method: 'service.controller.function',
                            id: "<%=*%>",
                            params: { "a": "<%=*%>", "c": { "d": { "e": "<%= sub %" } } }
                        }
                    )
                    expect(compiledTemplates.service.controller.function.subCompTemplate).to.deep.equal(expectedTemplates.service.controller.function.subCompTemplate)
                    expect(compiledTemplates.service.controller.functionB).to.deep.equal(expectedTemplates.service.controller.functionB)
                    done();
                })
        })

        it('should be able to substitute a template with a static substitution', function (done) {
            var subs = paycheck.mergeCompileData(substitutions)
            var substituted = paycheck.substituteTemplate(baseTemplates[2], subs, {});

            expect(substituted.subTemplate).to.deep.equal(expectedTemplates.service.controller.function.subTemplate)

            done();

        })

        it('should be able to resolve dynamic substitutions', function (done) {
            //var subs = paycheck.mergeCompileData(substitutions)
            var con = paycheck.mergeCompileData(contexts)

            paycheck.resolveDynamicSubstitutions(substitutions, con)
            .then((substitutionsStatic) => {
                expect(substitutionsStatic).to.deep.equal(expectedResolvedSubstitutions)
                done();
            })
             
        })

    })// describe
})