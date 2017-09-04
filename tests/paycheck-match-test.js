var paycheck = new (require('../paycheck.js'))({}, console)
var assert = require("assert");
var expect = require("chai").expect;
var _ = require('lodash')

var payloadsAllTypes =
    [
        { "a": "a" },
        { "a": 0 },
        { "a": 1 },
        { "a": { "b": "c" } },
        { "a": ["a", "b", "c"] },
        { "a": [{ "a": "b" }, { "c": "d" }] }
    ]
var payloadsDeep = [
    {"a": "z", "b":{"c":"y", "d":"e"}},
    { "b": { "d": "e" } }
]

var payloadsDeepArrays = [
    {"a": "z", "b":{"c":"y", "d":["e", "f", "g"]}},
    {"a": ["z", "x", "y"], "b": { "d": "e" } }
]


Object.freeze(payloadsAllTypes);

describe('paycheck', function () {
    describe('match', function () {
        this.timeout(60000);

        it('should be able to match payloads to template with wildcards', function (done) {
            var template = { "a": "<%=*%>" }

            payloadsAllTypes.forEach((v) => {
                expect(paycheck.match(v, template)).to.be.true
            })

            var template = { "a": "<%= *   %>" }

            payloadsAllTypes.forEach((v) => {
                expect(paycheck.match(v, template)).to.be.true
            })

            done();

        })

        it('should be able to reject payloads with unexpected parameters', function (done) {
            var template = { "a": "<%=*%>" }

            var payloadsB = _.map(_.cloneDeep(payloadsAllTypes), (v, k) => { return { "b": v.a } })

            payloadsB.forEach((v) => {
                expect(paycheck.match(v, template)).to.be.false
            })

            var payloadsMergedAB = _.merge(payloadsAllTypes, payloadsB);

            payloadsMergedAB.forEach((v) => {
                expect(paycheck.match(v, template)).to.be.false
            })

            done();

        })

        it('should be able to accpet payloads with more than one wild card parameters', function (done) {
            var template = { "a": "<%=*%>", "b": "<%=    *  %>" }

            var payloadsB = _.map(_.cloneDeep(payloadsAllTypes), (v, k) => { return { "b": v.a } })

            payloadsB.forEach((v) => {
                expect(paycheck.match(v, template)).to.be.true
            })

            var payloadsMergedAB = _.merge(payloadsAllTypes, payloadsB);

            payloadsMergedAB.forEach((v) => {
                expect(paycheck.match(v, template)).to.be.true

            })

            done();

        })

        it('should be able to accept deep payloads with more than one wild card parameters', function (done) {
            var template = { "a": "<%=*%>", "b": { "c": "<%= * %>", "d": "e" } }

            payloadsDeep.forEach((v) => {
                expect(paycheck.match(v, template)).to.be.true
            })

            done();

        })

        it('should be able to fail deep payloads with more than one wild card parameters', function (done) {
            var template = { "a": "<%=*%>", "b": { "c": "<%= * %>", "d": "f" } } // payloads have d: e

            payloadsDeep.forEach((v) => {
                expect(paycheck.match(v, template)).to.be.false
            })

            template2 = { "a": "x", "b": { "c": "<%= * %>", "d": "e" } } // payloads have  a:z

            payloadsDeep.forEach((v) => {
                expect(paycheck.match(v, template2)).to.be.false
            })

            done();

        })

        it('should be able to accept deep payloads with arrays in template', function (done) {
            var template = { "a": "<%=*%>", "b": { "c": "<%= * %>", "d": ["e", "f", "g"] } }

            payloadsDeep.forEach((v) => {
                expect(paycheck.match(v, template)).to.be.true
            })

            done();

        })

        it('should be able to fail deep payloads with arrays in template', function (done) {
            var template = { "a": "<%=*%>", "b": { "c": "<%= * %>", "d": ["f", "g", "h"] } }

            payloadsDeep.forEach((v) => {
                expect(paycheck.match(v, template)).to.be.false
            })

            template2 = { "a": ["x", "y"], "b": { "c": "<%= * %>", "d": "e" } }

            payloadsDeep.forEach((v) => {
                expect(paycheck.match(v, template2)).to.be.false
            })

            done();

        })

        it('should be able to accept deep payloads with arrays and with arrays in template', function (done) {
            var templates = [
                { "a": "<%=*%>", "b": { "c": "<%= * %>", "d": ["e", "f", "g"] } },
                { "a": "<%=*%>", "b": { "c": "<%= * %>", "d": ["e", "f", "g", "h"] } },
                { "a": ["z", "x", "y"], "b": { "c": "<%= * %>", "d": ["e", "f", "g", "h"] } }
            ]

            payloadsDeepArrays.forEach((v) => {
                expect(paycheck.match(v, templates[0])).to.be.true
            })

            payloadsDeepArrays.forEach((v) => {
                expect(paycheck.match(v, templates[1])).to.be.true
            })

            payloadsDeepArrays.forEach((v) => {
                expect(paycheck.match(v, templates[2])).to.be.true
            })

            done();

        })

        it('should be able to fail deep payloads with arrays and with arrays in template', function (done) {
            var templates = [
                { "a": "<%=*%>", "b": { "c": "<%= * %>", "d": ["f", "g", "h"] } }, // not d: e
                { "a": ["w", "x", "y"], "b": { "c": "<%= * %>", "d": "<%= * %>"} }, // not a: z
            ]

            payloadsDeep.forEach((v) => {
                expect(paycheck.match(v, templates[0])).to.be.false
            })

            payloadsDeep.forEach((v) => {
                expect(paycheck.match(v, templates[1])).to.be.false
            })

            done();
        })

    })
})