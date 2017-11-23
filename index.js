var regex = /A(B|C+)+D/
var randexp = require('./wrong-string-regex').randexp
var str = randexp(regex)
console.log(str)
console.log(regex.test(str))