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
        this.isListening = false;
        this.observed = {};
    }

    compile(templatesArr, substitutionsArr, contextsArr) {
        //merge contexts and substitutions
        var context = this.mergeCompileData(contextsArr);
        
        // retrieve the current substitutions
        return Promise.resolve().then(() => {
            return this.resolveDynamicSubstitutions(substitutionsArr, context);
        }).then((substitutionsStatic) => {
            return substituteTemplates(templatesArr, substitutionsStatic)
        })
    }

    /**
     * expects substitutions of the form:
      [
        {subParam: value},
        {otherSubParam: value}
      ]
     */
    resolveDynamicSubstitutions(substitutions, context) {
        var keys = [];
        return Promise.map(substitutions, (sub) => { 
            keys.push(Object.keys(sub)[0])
            var subVal = sub[_.last(keys)]
            if (_.isFunction(subVal)) {
                return subVal.call(context) //if the value is dynamic, execute it  
            } else return subVal
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

    substituteTemplates(substitutionsStatic) {
        return Promise.reduce(templatesArr, (p, c) => {
            var subbed = this.substituteTemplate(c, substitutionsStatic);
            
            var path = _.flatMap(c)[0][this.opts.pathKey];
            var arr = (_.get(p, path) || [])
            arr.push(subbed)
            _.set(p, path, arr)

            return p;
        }, {})
    }

    substituteTemplate(template, substitutions) {
        return _.deepMapValues(template, (v, p) => {
            if (_.isString(v)) {
                var regMatch = v.match(/<%= *(\w+) *%>/)
                if (regMatch != null && regMatch.length == 2) { // 2 indicates a capture
                    if (regMatch[1]) return substitutions[regMatch[1]]
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

    listenStart() {
        this.isListening = true;
     }

    listenStop() {
        this.isListening = false;
    }

    observe(payload) {
        if(this.isListening) {
            if(_.has(this.observed, payload[this.opts.pathKey])) {
                var existing = _.get(this.observed, payload[this.opts.pathKey])
                if(existing.every((existingTemplate, i, a) => { // merge into existing, aborting if a merge is sucessful
                    // if the structure is not the same, 
                    if(!this.isStructureSame(existingTemplate, payload)) 
                        return true // continue

                    // if the structure is the same, replace different values with wildcard
                    a[i] = _.deepMapValues(existingTemplate, function(value, path) {
                        if(!_.isEqual(_.get(payload, path), value)) { // includes wildcards
                            return "<%=*%>"; // replace with wildcard
                        } 
                        return value;
                    })

                    return false; // break
                    
                })) {  // if it couldn't be merged, add it to end
                    existing.push(payload);
                }
            } else { // if the payload couldn't be merged into the existing structure, append it
                _.set(this.observed, payload[this.opts.pathKey], [payload])
            }
        }
    }

    isStructureSame(a, b) { // same structure, excluding arrays
        return _.isEqualWith(a, b, 
            (a, b) => { 
                // is object and not an array, ie, arrays are considered as values
                if(!(_.isObject(a) && !_.isArray(a)) && 
                   !(_.isObject(b) && !_.isArray(b)))
                    return true;
            }
        )
    }

    check(payload, payloadTemplates) {

        var toCheck = _.get(payloadTemplates, payload[this.opts.pathKey]);
        return !!toCheck && // return false if there is no template 
            toCheck.some((v) => {
                return this.match(payload, _.flatMap(v)[0]); // if there is a match, return true
            })
    }

}

module.exports = PayCheck
