var tripwire = require('tripwire')
var chalk = require('chalk')

const regex = /A(B|C+)+D/ 

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
