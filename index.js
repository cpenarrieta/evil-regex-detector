var tripwire = require('tripwire')
var chalk = require('chalk')

// var regex = /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/

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

// const regex = /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/

//----
// # Vulnerable
// const regex = /(a|ab|b)*c|.*/ // detected

// # No suffix
// const regex = /.*|(a|ab|b)*c/ // not detected

// # Empty suffix
// const regex = /.*c|(a|ab|b)*c/ // detected

// # No suffix
// const regex = /.*b|(a|ab|b)*c/ // not detected

// # Phi2 < Phi3
// const regex = /(.*b|(a|ab|b)*c)d/ // detected

// # Unroll Kleene star
// const regex = /a.*|(b|a|ab)*c/ // detected

// # X1 Choice
// const regex = /c.*|(c|d)(a|b|ab)*e/  // detected

// # Pumpable choice
// const regex = /d.*|((c|d)(a|a))*b/ // detected

// # Unroll c*
// const regex = /a.*|(c*a(b|b))*d/ // detected

// # Only b is pumpable
// const regex = /(a|a|b|b)*(a.*|c)/ // not detected

// # Unroll c*
// const regex = /(a|b).*|c*(a|b|ab)*d/ // detected

// # Unroll selective
// const regex = /(ab|a*b|aab.*)*$/ // detected

// # lexing error
// const regex = /b(([\w-]+://?|www[.])[^\s()<>]+(?:\([\w\d]+\)|([^[:punct:]\s]|/)))/ // invalid regex

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

console.log(`regex to test: ${chalk.blue(regex)}`)
console.log('')

const randexp = require('./wrong-string-regex')

let index = 0

// Evaluating strings that matchs to TRUE
Array.from({ length: iterations }, (n, i) => {
  index++
  const item = randexp.randexp(regex, 10, false, true)
  if (item.length > longestStringLen) longestStringLen = item.length

  console.log(`evaluating ${chalk.green(`string #${index}`)} (${chalk.cyan(`length ${item.length}`)}): ${chalk.yellow(item)}`)
  tripwire.resetTripwire(timeoutEvilRegex)
  console.time(`${chalk.green(`string #${index}`)}`)
  regex.test(item)
  console.timeEnd(`${chalk.green(`string #${index}`)}`)
  console.log('')
})

// if the string generated resolves to true we need to increase the mutatePosition
let str = randexp.randexp(regex, 5, true)
let i = 0
while (regex.test(str) && i < 100) {
  randexp.mutatePosition++
  str = randexp.randexp(regex, 5, true)
  i++
}

// Evaluating strings that matchs to FALSE
Array.from({ length: iterations }, (n, i) => {
  index++
  const item = randexp.randexp(regex)
  if (item.length > longestStringLen) longestStringLen = item.length

  console.log(`${chalk.green(`string #${index}`)} (${chalk.cyan(`length ${item.length}`)}): ${chalk.yellow(item)}`)
  tripwire.resetTripwire(timeoutEvilRegex)
  console.time(`${chalk.green(`string #${index}`)}`)
  regex.test(item)
  console.timeEnd(`${chalk.green(`string #${index}`)}`)
  console.log('')
})

randexp.mutatePosition = 1
randexp.randexp(regex, 5, true, false, true)
// Evaluating strings by removing the last token
Array.from({ length: iterations }, (n, i) => {
  index++
  const item = randexp.randexp(regex, 5, false, false, true)
  if (item.length > longestStringLen) longestStringLen = item.length

  console.log(`${chalk.green(`string #${index}`)} (${chalk.cyan(`length ${item.length}`)}): ${chalk.yellow(item)}`)
  tripwire.resetTripwire(timeoutEvilRegex)
  console.time(`${chalk.green(`string #${index}`)}`)
  regex.test(item)
  console.timeEnd(`${chalk.green(`string #${index}`)}`)
  console.log('')
})

console.log(chalk.green('-----  Your regex is fine -----'))
console.log(`Longest length of string evaluated: ${longestStringLen}`)

tripwire.clearTripwire()
