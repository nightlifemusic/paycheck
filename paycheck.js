"use strict";
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
        
        var templates = templatesArr.reduce((p, c, i, a) => {

            var subbed = this.substituteTemplate(c, substitutions, context);
            
            var path = _.flatMap(c)[0][this.opts.pathKey];
            var arr = (_.get(p, path) || [])
            arr.push(subbed)
            _.set(p, path, arr)

            return p;
        }, {})

        return templates;
    }

    mergeCompileData(arr) {
        var arrc = _.clone(arr);
        arrc.unshift({}); // add empty object as the first argument
        return _.merge.apply(null, arrc)
    }

    substituteTemplate(template, substitutions, context) {
        var templateCopy = _.cloneDeep(template)
        return _.deepMapValues(templateCopy, (v, p) => {
            if (_.isString(v)) {
                var regMatch = v.match(/<%= *(\w+) *%>/)
                if (regMatch != null && regMatch.length == 2) { // 2 indicates a capture
                    return this.createSubstitution(substitutions[regMatch[1]], context)
                } else return v;
            } else return v;
        })
    }

    createSubstitution(match, context) {
        if (match) {
            if (_.isFunction(match)) return match.call(context) //if the substitution is dynamic, execute it
            else  return match
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
