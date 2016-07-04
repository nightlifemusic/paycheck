
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
            params: { "a": "<%=*%>", "c": { "d": { "e": "<%= subComp %>", "f": "<%= subCompOther" } } }
        }
    }
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
                        params: { "a": "<%=*%>", "c": { "d": { "e": ["f", "g", "h", "i"] } } }
                    }
                },
                {
                    subCompTemplate:
                    {
                        jsonrpc: '2.0',
                        method: 'service.controller.function',
                        id: "<%=*%>",
                        params: { "a": "<%=*%>", "c": { "d": { "e": ["secondA", "secondB"] } } }
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

Object.freeze(expectedTemplates);

describe('paycheck', function () {
    describe('check', function () {
        this.timeout(60000);

        xit('should be able fully compile templates from base templates, substitutions and contexts', function (done) {

            paycheck.compile(baseTemplates, substitutions, contexts)
                .then((compiledTemplates) => {
                    expect(compiledTemplates).to.deep.equal(expectedTemplates);
                    done();
                })

        })

        // it('should be able to compile templates, just the compile step', function (done) {

        //     var substituteTemplateStub = sinon.stub(paycheck, 'substituteTemplate')
        //     substituteTemplateStub.returns(expectedTemplates.service.controller.function[0])

        //     var compiledTemplates = paycheck.compile(baseTemplates, substitutions, contexts)

        //     expect(compiledTemplates).to.exist
        //     expect(compiledTemplates.service.controller.function).to.exist
        //     expect(compiledTemplates.service.controller.function.length).to.equal(3)
        //     expect(compiledTemplates.service.controller.functionB).to.exist
        //     expect(compiledTemplates.service.controller.functionB.length).to.equal(1)

        //     substituteTemplateStub.release(); // important

        //     done()

        // })

        it('should be able to substitute a template with a static substitution', function (done) {
            var subs = paycheck.mergeCompileData(substitutions)
            var substituted = paycheck.substituteTemplate(baseTemplates[2], subs, {});

            expect(substituted).to.deep.equal(expectedTemplates.service.controller.function[1])

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