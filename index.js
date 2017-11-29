var tripwire = require('tripwire')
var chalk = require('chalk')

// var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ //evil
// const regex = /^([a-zA-Z0-9])(([\-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}[a-z0-9]+[.]{1}(([a-z]{2,3})|([a-z]{2,3}[.]{1}[a-z]{2,3}))$/ //evil
// var regex = /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/ // not evil
const regex = /A(B|C+)+D/ //evil
// const regex = /(\d+)milli(?:second)?[s]?/i
// const regex = /Dell.*Streak|Dell.*Aero|Dell.*Venue|DELL.*Venue Pro|Dell Flash|Dell Smoke|Dell Mini 3iX|XCD28|XCD35|\b001DL\b|\b101DL\b|\bGS01\b/i

const iterations = 10
const timeoutEvilRegex = 1500

process.on('uncaughtException', function (e) {
  if (e.message === 'Blocked event loop') {
    console.log(`Took more than ${timeoutEvilRegex}ms. ${chalk.red('This is most likely an evil regular expression')}`)
  } else {
    console.log(e)
  }
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
