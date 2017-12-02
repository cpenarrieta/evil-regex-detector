/**
 * Code taken from https://github.com/fent/randexp.js
 * Slighly modified to generate an incorrect output string
 */

var ret = require('ret');
var DRange = require('discontinuous-range');
var types = ret.types;

function getRandom(min, max) {
  const x = Math.random() * (max - min) + min - 0.000000001
  return Math.floor(x);
}

const singleCharToken = () => ({ "type": ret.types.CHAR, "value": getRandom(34, 10000) })

/**
 * If code is alphabetic, converts to other case.
 * If not alphabetic, returns back code.
 *
 * @param {Number} code
 * @return {Number}
 */
function toOtherCase(code) {
  return code + (97 <= code && code <= 122 ? -32 :
    65 <= code && code <= 90  ?  32 : 0);
}

/**
 * Randomly returns a true or false value.
 *
 * @return {Boolean}
 */
function randBool() {
  return !this.randInt(0, 1);
}

/**
 * Randomly selects and returns a value from the array.
 *
 * @param {Array.<Object>} arr
 * @return {Object}
 */
function randSelect(arr) {
  if (arr instanceof DRange) {
    return arr.index(this.randInt(0, arr.length - 1));
  }
  return arr[this.randInt(0, arr.length - 1)];
}

/**
 * expands a token to a DiscontinuousRange of characters which has a
 * length and an index function (for random selecting)
 *
 * @param {Object} token
 * @return {DiscontinuousRange}
 */
function expand(token) {
  if (token.type === ret.types.CHAR) {
    return new DRange(token.value);
  } else if (token.type === ret.types.RANGE) {
    return new DRange(token.from, token.to);
  } else {
    var drange = new DRange();
    for (var i = 0; i < token.set.length; i++) {
      var subrange = expand.call(this, token.set[i]);
      drange.add(subrange);
      if (this.ignoreCase) {
        for (var j = 0; j < subrange.length; j++) {
          var code = subrange.index(j);
          var otherCaseCode = toOtherCase(code);
          if (code !== otherCaseCode) {
            drange.add(otherCaseCode);
          }
        }
      }
    }
    if (token.not) {
      return this.defaultRange.clone().subtract(drange);
    } else {
      return drange;
    }
  }
}

/**
 * Checks if some custom properties have been set for this regexp.
 *
 * @param {RandExp} randexp
 * @param {RegExp} regexp
 */
function checkCustom(randexp, regexp) {
  regexp.max
  if (typeof regexp.max === 'number') {
    randexp.max = regexp.max;
  }
  if (regexp.defaultRange instanceof DRange) {
    randexp.defaultRange = regexp.defaultRange;
  }
  if (typeof regexp.randInt === 'function') {
    randexp.randInt = regexp.randInt;
  }
}

/**
 * @constructor
 * @param {RegExp|String} regexp
 * @param {String} m
 */
var RandExp = module.exports = function(regexp, m) {
  this.defaultRange = this.defaultRange.clone();
  if (regexp instanceof RegExp) {
    this.ignoreCase = regexp.ignoreCase;
    this.multiline = regexp.multiline;
    checkCustom(this, regexp);
    regexp = regexp.source;
  } else if (typeof regexp === 'string') {
    this.ignoreCase = m && m.indexOf('i') !== -1;
    this.multiline = m && m.indexOf('m') !== -1;
  } else {
    throw new Error('Expected a regexp or string');
  }

  RandExp.regexStr = regexp
  this.tokens = ret(regexp);
};

// When a repetitional token has its max set to Infinite,
// randexp won't actually generate a random amount between min and Infinite
// instead it will see Infinite as min + 100.
RandExp.prototype.max = 1;
RandExp.mutatePosition = 1;
RandExp.regexStr = null;

function cleanArray(arr, deleteValue) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === deleteValue) {         
      arr.splice(i, 1);
      i--;
    }
  }
  return arr;
}

function removeLastFromObject(obj) {
  let count = 0
  for (var key in obj) {
    if (Array.isArray(obj[key])) {
      let tmp = obj[key]
      for (var key2 in tmp) {
        count++
      }
    } else {
      count++
    }
  }

  count++
  const pos = getRandom(1, count)

  for (var key in obj) {
    if (Array.isArray(obj[key])) {
      let tmp = obj[key]
      for (var key2 in tmp) {
        count--
        if (pos === count) {
          tmp[key2] = undefined
          cleanArray(tmp, undefined)
        }
      }
    } else {
      count--
      if (pos === count) {
        obj[key] = undefined
        cleanArray(obj, undefined)
      }
    }
  }
}

RandExp.prototype.mutateRegex = function(removeItem) {
  if (this.tokens.stack) {
    if (removeItem) {
      // this.tokens.stack.splice(this.tokens.stack.length - RandExp.mutatePosition, 1)
      removeLastFromObject(this.tokens.stack)
    } else {
      this.tokens.stack.splice(this.tokens.stack.length - RandExp.mutatePosition, 1, singleCharToken())
    }
  } else {
    if (removeItem) {
      // this.tokens.options.splice(this.tokens.options.length - RandExp.mutatePosition, 1)
      removeLastFromObject(this.tokens.options)
    } else {
      this.tokens.options.splice(this.tokens.options.length - RandExp.mutatePosition, 1, singleCharToken())
    }
  }
}

// Generates the random string.
RandExp.prototype.gen = function(resetMax, dontMutate, removeItem) {
  if (resetMax) {
    this.max = 1;
  }

  this.max = this.max * 2
  this.tokens = ret(RandExp.regexStr)

  if (!dontMutate) {
    this.mutateRegex(removeItem)
  }

  return gen.call(this, this.tokens, []);
};


// Enables use of randexp with a shorter call.
RandExp.randexp = function(regexp, m, resetMax, dontMutate, removeItem) {
  var randexp;
  if (regexp._randexp === undefined) {
    randexp = new RandExp(regexp, m);
    regexp._randexp = randexp;
  } else {
    randexp = regexp._randexp;
  }
  
  checkCustom(randexp, regexp);
  return randexp.gen(resetMax, dontMutate, removeItem);
};

// This enables sugary /regexp/.gen syntax.
RandExp.sugar = function() {
  /* jshint freeze:false */
  RegExp.prototype.gen = function() {
    return RandExp.randexp(this);
  };
};

// This allows expanding to include additional characters
// for instance: RandExp.defaultRange.add(0, 65535);
RandExp.prototype.defaultRange = new DRange(32, 126);

/**
 * Randomly generates and returns a number between a and b (inclusive).
 *
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 */
RandExp.prototype.randInt = function(a, b) {
  return a + Math.floor(Math.random() * (1 + b - a));
};

/**
 * Generate random string modeled after given tokens.
 *
 * @param {Object} token
 * @param {Array.<String>} groups
 * @return {String}
 */
function gen(token, groups) {
  var stack, str, n, i, l;

  switch (token.type) {
    case types.ROOT:
    case types.GROUP:
      // Ignore lookaheads for now.
      if (token.followedBy || token.notFollowedBy) { return ''; }

      // Insert placeholder until group string is generated.
      if (token.remember && token.groupNumber === undefined) {
        token.groupNumber = groups.push(null) - 1;
      }

      stack = token.options ?
        randSelect.call(this, token.options) : token.stack;

      str = '';
      for (i = 0, l = stack.length; i < l; i++) {
        str += gen.call(this, stack[i], groups);
      }

      if (token.remember) {
        groups[token.groupNumber] = str;
      }
      return str;

    case types.POSITION:
      // Do nothing for now.
      return '';

    case types.SET:
      var expandedSet = expand.call(this, token);
      if (!expandedSet.length) { return ''; }
      return String.fromCharCode(randSelect.call(this, expandedSet));

    case types.REPETITION:
      // Randomly generate number between min and max.
      n = this.randInt(token.min,
              token.max === Infinity ? token.min + this.max : token.max);

      str = '';
      for (i = 0; i < n; i++) {
        str += gen.call(this, token.value, groups);
      }

      return str;

    case types.REFERENCE:
      return groups[token.value - 1] || '';

    case types.CHAR:
      var code = this.ignoreCase && randBool.call(this) ?
        toOtherCase(token.value) : token.value;
      return String.fromCharCode(code);
  }
}
