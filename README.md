# Skeptic - a JSON payload authorization middleware

Lightweight, low footprint, compatible with any storage and server mechanism, allowing code reuse between frontend and backend. 

## How does it work

A backend API receives payloads. For example, an express server, websocket server or a worker that consumes a queue.

Different users and/or user roles or groups are authorized to send different types of payloads with different sets of parameters and values. You heard right - this isn't just about routes, it's also about authorizing resources.

As part of the login process, skeptic can be invoked to generate a JSON object containing templates of expected payloads and the associated routes or JSON RPC methods. This can be stored by the invoking application, for example in a signed JSON Web Token, or redis. 

For subsequent requests, skeptic can be invoked to check the incoming payload against the templates generated earlier. Skeptic either rejects or accepts the payload based on if the template can be matched.

How do the JSON payload templates get specified in the first place?

### Payload templates

Payload templates are compiled from 'templates', 'substitutions' and 'contexts' that are all associated with the user who is logging in. 
Basic templates can be created automatically by Skeptic via the 'listening' mode. After this, specific features can be edited manually.  
Templates, substitution and contexts can be stored and retrieved using any kind of datastore. Dynamic substitutions that run code are hard coded by the app.

Simple templates have no variables, only fixed values and wildcards: 

```js
{
    myresource: ["a", "b", "c"]       // this means any of these values are accepted
    canBeAnything: "<%= * %>" // this is a wildcard, any value is allowed
}
```

This would allow the user associated with this template to access resources named "a", "b" and "c". For example the following payloads would be accepted:

```js
{
    myresource: ["b"]
    // canBeAnything is undefined, and that's ok because it can be anything
}
```

or:

```js
{
    myresource: ["c", "a"]
    canBeAnything: {"a" : "b"}
}
```

However, resources like this will probably be used again within multiple templates. Hence we support variables within templates:

```js
{
    myresource: "<%= allowed_resources %>",
    myOtherResource: "foo"
}
```

and:

```js
{
    myresource: "<%= allowed_resources %>",
    myOtherResource: "bar"
}
```

Templates defined like this require substitutions to be defined:

```js
{
    allowed_resources: ["a", "b", "c"]
}
```

However, often the situation might require that the resources in the substitution are automatically kept up to date. To solve this, they can be derived by using a query at the point where the JSON payload templates are compiled, IE in the login step.
 
For example, the template could be:

```js
{
    myresource: "<%= allowed_resources %>",
    myOtherResource: "bar"  //this must match exactly
}
```

The substitution would be defined in code by the application, eg:

```js
{
    allowed_resources: function () {
        return myDataStore.getDataAndReturnPromise(this.myDataQueryQualifier) 
    }
}
```

And the context would need to also be provided:

```js
{
    myDataQueryQualifier: "qualifierForCurrentUserOrRole"
}
```

At the point of login, skeptic takes a set of templates, substitutions and contexts, and publishes payload templates, which are free from any variables or functions.

