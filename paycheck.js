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
        
        //TODO modify this to run the substitutions first
        

        //todo return promise with template in it
        return Promise.reduce(templatesArr, (p, c) => {
            var subbed = this.substituteTemplate(c, substitutions, context);
            
            var path = _.flatMap(c)[0][this.opts.pathKey];
            var arr = (_.get(p, path) || [])
            arr.push(subbed)
            _.set(p, path, arr)

            return p;
        }, {})

    }

    mergeCompileData(arr) {
        var arrc = _.clone(arr);
        arrc.unshift({}); // add empty object as the first argument
        return _.merge.apply(null, arrc)
    }

    substituteTemplate(template, substitutions, context) {
        var templateCopy = _.cloneDeep(template)
        var promises = [];
        var templateUnresolved = _.deepMapValues(templateCopy, (v, p) => {
            if (_.isString(v)) {
                var regMatch = v.match(/<%= *(\w+) *%>/)
                if (regMatch != null && regMatch.length == 2) { // 2 indicates a capture
                    var subUnresolved = this.createSubstitution(substitutions[regMatch[1]], context) // this may be a promise
                    if(typeof subUnresolved.then === 'function') { // if it is a promise
                        promises.push(subUnresolve)
                    } else return subUnresolved;
                } else return v;
            } else return v;
        })

        return Promise.all(promises).then((res) => {
            return _.deepMapValues(templateUnresolved, (v, p) => {
                if(typeof v.then === 'function') {
                    return v.value()
                } else return v;
            })
        })

    }

    createSubstitution(match, context) {
        if (match) {
            if (_.isFunction(match)) {
                return match.call(context) //if the substitution is dynamic, execute it
            } else  return match
        } else {
            throw new SubstitutionError(`template parameter ${regMatch[1]} not found in substitution: ${JSON.stringify(substitutions)}`);
        }
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
