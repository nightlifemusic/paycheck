"use strict";
var _ = require('lodash')

_.mixin(require("lodash-deep"));

var jdp = require('jsondiffpatch')

var PayCheck = class PayCheck {
    constructor(opts) {
        this.opts = _.defaultsDeep(opts, {
            pathKey : 'method', // default to JSON RPC 
        })
    }

    compile(payloads, substitutions, contexts) {

    }

    match(payloadIn, payloadTemplate) {
        var payload = _.cloneDeep(payloadIn);
        var template = _.cloneDeep(payloadTemplate);

        // strip all wildcards out of template and payload
        _.deepMapValues(payloadTemplate, (value, path) => {
            if(/\<\%\= *\* *\%\>/.test(value)) {
                _.unset(template, path);
                _.unset(payload, path);
            }
        });
        
        // compare for equality - partially matching on any array defined in template
        return _.isEqualWith(payload, template, (p, t, k) => { // p - from payload, t - from template, k - key 
            if(_.isArray(t)) { // 
                return _(p).compact() // if it is a single value eg "a", put it in an array: ["a"]. Does nothing if it is already in an array.
                .intersectionWith(t, _.isEqual) // finds common
                .value().length == p.length; // 
            }
        })
    }

    listenStart() {}
    listenStop() {}
    observe(payload) {}
    check(payload, payloadTemplates) {

        var toCheck = _.get(payloadTemplates, payload[this.opts.pathKey]);
        return !!toCheck && // return false if there is no template 
            toCheck.some((v) => {
                return this.match(payload, _.flatMap(v)[0]); // if there is a match, return true
            })
    }
    
}

module.exports = PayCheck
