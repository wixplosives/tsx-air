# Derived and Async stores

## Derived stores

A reactive store, that will behave like any a simple reactive value: it will be reset iff the data origin changes, and can't be set outside the main render function (i.e events, timeouts etc)

## Async stores

Syntactic sugar for async activity, it assigns a promise result onto the store, along with async api:

- $pending - true until the promise is settled
- $rejected - reason in case of rejection
- $resolved - resolved value is case of resolution. this value is also assigned to the store
- $promise - the store origin
