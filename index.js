var tripwire = require('tripwire')
var chalk = require('chalk')

const regex = /A(B|C+)+D/ 
// const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
// const regex = /^([a-zA-Z0-9])(([\-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}[a-z0-9]+[.]{1}(([a-z]{2,3})|([a-z]{2,3}[.]{1}[a-z]{2,3}))$/
// const regex = /(\w+\d+)+C/
// const regex = /^(([a-z])+.)+[A-Z]([a-z])+$/
// const regex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]).)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/
// const regex = /^([^.\/]+\/?)*$/
// const regex = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/
// const regex = /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/
// const regex = /(([\w#:.~>+()\s-]+|[.?])+)\s(,|$)/

const iterations = 10
const timeoutEvilRegex = 1500
let longestStringLen = 0
let longestTime = 0

process.on('uncaughtException', function (e) {
  if (e.message === 'Blocked event loop') {
    console.log(`Took more than ${timeoutEvilRegex}ms. ${chalk.red('This is most likely an evil regular expression')}`)
  } else {
    console.log(e)
  }
  process.exit(1)
})

const randexp = require('./wrong-string-regex')

// if the string generated resolves to true we need to increase the mutatePosition
let str = randexp.randexp(regex, 5, true)
while (regex.test(str)) {
  randexp.mutatePosition++
  console.log(randexp.mutatePosition)
  str = randexp.randexp(regex, 5, true)
}

Array.from({ length: iterations }).forEach(n => {
  const item = randexp.randexp(regex)
  if (item.length > longestStringLen) longestStringLen = item.length

  console.log(`evaluating: ${chalk.yellow(item)}`)
  tripwire.resetTripwire(timeoutEvilRegex)
  console.time(chalk.green(item))
  regex.test(item)
  console.timeEnd(chalk.green(item))
})

console.log('')
console.log(chalk.green('-----  Your regex is fine -----'))
console.log(`Longest length of string evaluated: ${longestStringLen}`)

tripwire.clearTripwire()
