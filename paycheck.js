"use strict";
var Promise = require('bluebird')
var _ = require('lodash')
_.mixin(require("lodash-deep"));
var jdp = require('jsondiffpatch')

var PayCheckError = class PayCheckError extends Error { }
var SubstitutionError = class SubstitutionError extends PayCheckError { }

var PayCheck = class PayCheck {
    constructor(opts, logger) {
        this.opts = _.defaultsDeep(opts, {
            pathKey: 'method', // default to JSON RPC 
        })
    }

    compile(templatesArr, substitutionsArr, contextsArr) {
        //merge contexts and substitutions
        var substitutions = this.mergeCompileData(substitutionsArr);
        var context = this.mergeCompileData(contextsArr);
        
        // retrieve the current substitutions
        return Promise.resolve().then(() => {
            return this.resolveDynamicSubstitutions(substitutions, context);
        }).then((substitutionsStatic) => {
            return Promise.reduce(templatesArr, (p, c) => {
                var subbed = this.substituteTemplate(c, substitutionsStatic);
                
                var path = _.flatMap(c)[0][this.opts.pathKey];
                var arr = (_.get(p, path) || [])
                arr.push(subbed)
                _.set(p, path, arr)

                return p;
            }, {})
        })
    }

    resolveDynamicSubstitutions(substitutions, context) {
        var keys = [];
        // convert values to array
        var arrSubs = _.flatMap(substitutions, (v, k) => {
            keys.push(k); // store the keys
            return  [v];
        }) 
        
        return Promise.map(arrSubs, (sub) => { 
            if (_.isFunction(sub)) {
                sub = sub.call(context) //if the value is dynamic, execute it
                return sub;  
            } else return sub
        }).reduce((p, c, i) => { // executed promises will be resolved at this point
            p[keys[i]] = c; // add the resolved values back into an object
            return p;
        },{})
    }

    mergeCompileData(arr) {
        var arrc = _.clone(arr);
        arrc.unshift({}); // add empty object as the first argument
        return _.merge.apply(null, arrc)
    }

    substituteTemplate(template, substitutions) {
        return _.deepMapValues(template, (v, p) => {
            if (_.isString(v)) {
                var regMatch = v.match(/<%= *(\w+) *%>/)
                if (regMatch != null && regMatch.length == 2) { // 2 indicates a capture
                    if (regMatch[1]) return substitutions(regMatch[1])
                    else throw new SubstitutionError(`template parameter ${regMatch[1]} not found in substitution: ${JSON.stringify(substitutions)}`);
                } else return v;
            } else return v;
        })
    }

    match(payloadIn, payloadTemplate) {
        var payload = _.cloneDeep(payloadIn);
        var template = _.cloneDeep(payloadTemplate);

        // strip all wildcards out of template and payload
        _.deepMapValues(payloadTemplate, (value, path) => {
            if (/\<\%\= *\* *\%\>/.test(value)) {
                _.unset(template, path);
                _.unset(payload, path);
            }
        });

        // compare for equality - partially matching on any array defined in template
        return _.isEqualWith(payload, template, (p, t, k) => { // p - from payload, t - from template, k - key 
            if (_.isArray(t)) { // 
                return _(p).compact() // if it is a single value eg "a", put it in an array: ["a"]. Does nothing if it is already in an array.
                    .intersectionWith(t, _.isEqual) // finds common
                    .value().length == p.length; // 
            }
        })
    }

    listenStart() { }
    listenStop() { }
    observe(payload) { }
    check(payload, payloadTemplates) {

        var toCheck = _.get(payloadTemplates, payload[this.opts.pathKey]);
        return !!toCheck && // return false if there is no template 
            toCheck.some((v) => {
                return this.match(payload, _.flatMap(v)[0]); // if there is a match, return true
            })
    }

}

module.exports = PayCheck
