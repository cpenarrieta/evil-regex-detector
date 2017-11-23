var tripwire = require('tripwire')
var chalk = require('chalk')

// var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ //evil
// const regex = /^([a-zA-Z0-9])(([\-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}[a-z0-9]+[.]{1}(([a-z]{2,3})|([a-z]{2,3}[.]{1}[a-z]{2,3}))$/ //evil
// var regex = /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/ // not evil
const regex = /A(B|C+)+D/ //evil

const iterations = 10
const timeoutEvilRegex = 1500

process.on('uncaughtException', function (e) {
  console.log(`Took more than ${timeoutEvilRegex}ms. ${chalk.red('This is most likely an evil regular expression')}`)
  process.exit(1)
})

const randexp = require('./wrong-string-regex').randexp

const incorrectStrings = Array.from({ length: iterations }).map((e, k) => randexp(regex))

incorrectStrings.forEach(item => {
  console.log(`evaluating: ${chalk.yellow(item)}`)
  tripwire.resetTripwire(timeoutEvilRegex)
  console.time(chalk.green(item))
  regex.test(item)
  console.timeEnd(chalk.green(item))
})

console.log('')
console.log(chalk.green('-----  Your regex is fine -----'))

tripwire.clearTripwire()
