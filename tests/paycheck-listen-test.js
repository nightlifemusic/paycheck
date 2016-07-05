var paycheck = new (require('../paycheck.js'))({})
var assert = require("assert");
var expect = require("chai").expect;
var _ = require('lodash')

var payloads =
    [
        { "method" : "service.controller.method", "a": "va"},
        { "method" : "service.controller.method", "a": "vavar" },
        { "method" : "service.controller.method", "a": { "b": "vab" }},
        { "method" : "service.controller.method", "a": { "b": "vabvar" }},
        { "method" : "service.controller.method", "a": { "b": "vabvar"}, "a2" : "va2"},
        { "method" : "service.controller.method", "a": { "b": {"c": "vabc"}}, "a2": "va2"},
        { "method" : "service.controller.method", "a": { "b": {"c": "vabc"}}, "a2": "va2bvar"},
        { "method" : "service.controller.method", "a": { "b": {"c": "vabcvar"}}, "a2": "va2bvar"},
        { "method" : "service.controller.method", "a": { "b": {"c": "vdvar"}}, "a2": "a2bvar3"},
        { "method" : "service.controller.method", "a3" : "va3"},
        { "method" : "service.controller.method", "a3" : ["va3var", "va3var2"]},
        { "method" : "service.controller.method", "a3" : [{"b3": "vb3"}, {"c3" : "vc3"}]},
        { "method" : "service.controller.otherMethod", "a3" : [{"b3": "vb3"}, {"c3" : "vc3"}]}
    ]

Object.freeze(payloads);

describe('paycheck', function () {
    describe('listen', function () {
        this.timeout(60000);

        it('should create observed payloads from stream of listened payloads', function (done) {
            paycheck.listenStart();
            var i = 0;
            
            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [{ "method" : "service.controller.method", "a": "va"}]
                    }
                }   
            }
            expect(paycheck.observed).to.deep.equal(exp)

            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [{ "method" : "service.controller.method", "a": "<%=*%>"}]
                    }
                }   
            }
            expect(paycheck.observed).to.deep.equal(exp)

            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [
                            { "method" : "service.controller.method", "a": "<%=*%>"},
                            { "method" : "service.controller.method", "a": { "b": "vab" }}
                        ]
                    }
                }   
            }
            expect(paycheck.observed).to.deep.equal(exp)

            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [
                            { "method" : "service.controller.method", "a": "<%=*%>"},
                            { "method" : "service.controller.method", "a": { "b": "<%=*%>" }}
                        ]
                    }
                }   
            }
            expect(paycheck.observed).to.deep.equal(exp)

            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [
                            { "method" : "service.controller.method", "a": "<%=*%>"},
                            { "method" : "service.controller.method", "a": { "b": "<%=*%>" }},
                            { "method" : "service.controller.method", "a": { "b": "vabvar"}, "a2" : "va2"}
                        ]
                    }
                }   
            }
            expect(paycheck.observed).to.deep.equal(exp)


            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [
                            { "method" : "service.controller.method", "a": "<%=*%>"},
                            { "method" : "service.controller.method", "a": { "b": "<%=*%>" }},
                            { "method" : "service.controller.method", "a": { "b": "vabvar"}, "a2" : "va2"},
                            { "method" : "service.controller.method", "a": { "b": {"c": "vabc"}}, "a2": "va2"},
                        ]
                    }
                }   
            }
            expect(paycheck.observed).to.deep.equal(exp)
            

            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [
                            { "method" : "service.controller.method", "a": "<%=*%>"},
                            { "method" : "service.controller.method", "a": { "b": "<%=*%>" }},
                            { "method" : "service.controller.method", "a": { "b": "vabvar"}, "a2" : "va2"},
                            { "method" : "service.controller.method", "a": { "b": {"c": "vabc"}}, "a2": "<%=*%>"},
                        ]
                    }
                }   
            }
            expect(paycheck.observed).to.deep.equal(exp)

            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [
                            { "method" : "service.controller.method", "a": "<%=*%>"},
                            { "method" : "service.controller.method", "a": { "b": "<%=*%>" }},
                            { "method" : "service.controller.method", "a": { "b": "vabvar"}, "a2" : "va2"},
                            { "method" : "service.controller.method", "a": { "b": {"c": "<%=*%>"}}, "a2": "<%=*%>"},
                        ]
                    }
                }   
            }
            expect(paycheck.observed).to.deep.equal(exp)

            //
            paycheck.observe(payloads[i++]);
            expect(paycheck.observed).to.deep.equal(exp)

            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [
                            { "method" : "service.controller.method", "a": "<%=*%>"},
                            { "method" : "service.controller.method", "a": { "b": "<%=*%>" }},
                            { "method" : "service.controller.method", "a": { "b": "vabvar"}, "a2" : "va2"},
                            { "method" : "service.controller.method", "a": { "b": {"c": "<%=*%>"}}, "a2": "<%=*%>"},
                            { "method" : "service.controller.method", "a3" : "va3"},
                        ]
                    }
                }   
            }
            expect(paycheck.observed).to.deep.equal(exp) 

            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [
                            { "method" : "service.controller.method", "a": "<%=*%>"},
                            { "method" : "service.controller.method", "a": { "b": "<%=*%>" }},
                            { "method" : "service.controller.method", "a": { "b": "vabvar"}, "a2" : "va2"},
                            { "method" : "service.controller.method", "a": { "b": {"c": "<%=*%>"}}, "a2": "<%=*%>"},
                            { "method" : "service.controller.method", "a3" : "<%=*%>"},
                        ]
                    }
                }   
            }
            expect(paycheck.observed).to.deep.equal(exp) 

            //
            paycheck.observe(payloads[i++]);
            expect(paycheck.observed).to.deep.equal(exp)

            //
            paycheck.observe(payloads[i++]);
            var exp = {
                "service" : {
                    "controller" : {
                        "method" : [
                            { "method" : "service.controller.method", "a": "<%=*%>"},
                            { "method" : "service.controller.method", "a": { "b": "<%=*%>" }},
                            { "method" : "service.controller.method", "a": { "b": "vabvar"}, "a2" : "va2"},
                            { "method" : "service.controller.method", "a": { "b": {"c": "<%=*%>"}}, "a2": "<%=*%>"},
                            { "method" : "service.controller.method", "a3" : "<%=*%>"},
                        ],
                        "otherMethod" : [
                            { "method" : "service.controller.otherMethod", "a3" : [{"b3": "vb3"}, {"c3" : "vc3"}]}
                        ]
                    }
                }   
            }

            var arr = paycheck.listenStop();
            var expArr = 
            [
                { "method" : "service.controller.method", "a": "<%=*%>"},
                { "method" : "service.controller.method", "a": { "b": "<%=*%>" }},
                { "method" : "service.controller.method", "a": { "b": "vabvar"}, "a2" : "va2"},
                { "method" : "service.controller.method", "a": { "b": {"c": "<%=*%>"}}, "a2": "<%=*%>"},
                { "method" : "service.controller.method", "a3" : "<%=*%>"},
                { "method" : "service.controller.otherMethod", "a3" : [{"b3": "vb3"}, {"c3" : "vc3"}]}
            ]

            expect(arr).to.deep.equal(expArr);
            expect(paycheck.isListening).to.be.false;
            expect(paycheck.observed).to.be.empty;
            expect(paycheck.observedPaths).to.be.empty;

            done();
        })

    }) // describe
})