"use strict";
var _ = require('lodash')

_.mixin(require("lodash-deep"));

var jdp = require('jsondiffpatch')

module.exports = (opts) => {
    return {
        opts : _.defaultsDeep(opts, {
            key : 'method' // default to JSON RPC
        }),

        compile : (payloads, substitutions, contexts) => {

        },

        check : (payload, payloadTemplates) => {
            var toCheck = _.get(payloadTemplates, payload[this.opts.key]);
            return !!toCheck || // return false if there is no template 
                toCheck.some((v) => {
                    this.match(payload, v); // if there is a match, return true
                })
        },

        match : (payloadIn, payloadTemplate) => {
            
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
        },
        listenStart : () => {},
        listenStop : () => {},
        observe : (payload) => {}
    }
}



            // var merged = _.mergeWith(payload, payloadTemplate, (v1, v2, key, object, source, stack) => {
            //     //if(/\<\%\= *\* *\%\>/.test(v2)) {    
            //     return undefined;
            // }) 
            
            // not deep
            // var merged = _.transform(payload, (acc, v, k, o) => {
            //     //if(/\<\%\= *\* *\%\>/.test(v2)) {    
            //     return undefined;
            // }, payloadTemplate) 

            // return merged;
            // var diff = jdp.diff(payload, payloadTemplate);
            // return !!diff;
            
            /*
            return _.isEqualWith(payload, template, (p, t, k) => { // p - from payload, t - from template, k - key 
                if(_.isArray(t)) { // 
                    return _(p).compact // if it is a single value eg "a", put it in an array: ["a"]. Does nothing if it is already in an array.
                    .intersectionWith(t, _.isEqual) // finds common
                    .value().length == p.length; // 
                } else if(_.isObject(t)) {
                    var diffKeys = _.difference(Object.keys(t), Object.keys(p)); 
                    return undefined
                    //if(_.isEmpty(diffKeys)) return undefined
                    //else return diffKeys.every((k) => {return /\<\%\= *\* *\%\>/.test(t[k])});
                } else {
                    return /\<\%\= *\* *\%\>/.test(t) || undefined // wildcard means that any value is accepted
                }
            })
            */