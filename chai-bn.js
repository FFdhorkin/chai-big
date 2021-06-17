module.exports = function (Big) {
  const isEqualTo = Big.prototype.eq;
  const isGreaterThan = Big.prototype.gt;
  const isGreaterThanOrEqualTo = Big.prototype.gte;
  const isLessThan = Big.prototype.lt;
  const isLessThanOrEqualTo = Big.prototype.lte;

  return function (chai, utils) {
    const flag = utils.flag;
    // The 'bignumber' property sets the 'bignumber' flag, enabling the custom overrides
    chai.Assertion.addProperty('bignumber', function () {
      utils.flag(this, 'bignumber', true);
    });

    // Big objects created using different (compatible) instances of Big can be identified by constructor name
    const isBig = function (object) {
      return object instanceof Big || (object && object.constructor && object.constructor.name === 'Big');
    };

    const convert = function (value) {
      if (isBig(value)) {
        return value;
      } else if (typeof value === 'string') {
        return new Big(value);
        // Big also supports conversion from e.g. JavaScript numbers, but only for small values. We disable that entirely
      } else {
        new chai.Assertion(value).assert(false,
          'expected #{act} to be an instance of Big or string');
      }
    };

    // Overwrites the assertion performed by multiple methods (which should be aliases) with a new function. Prior to
    // calling said function, we assert that the actual value is a Big, and attempt to convert all other arguments to Big.
    const overwriteMethods = function (messageIndex, methodNames, newAssertion) {
      function overwriteMethod (originalAssertion) {
        return function () {
          if (utils.flag(this, 'bignumber')) {
            const actual = convert(this._obj);
            const args = [actual].concat(
              [].slice
                .call(arguments)
                .slice(0, messageIndex)
                .map(convert))
              .concat(arguments[messageIndex]);
            newAssertion.apply(this, args);
          } else {
            originalAssertion.apply(this, arguments);
          }
        };
      }

      methodNames.forEach(methodName =>
        chai.Assertion.overwriteMethod(methodName, overwriteMethod)
      );
    };

    // Overwrites the assertion performed by multiple properties (which should be aliases) with a new function. Prior to
    // calling said function, we assert that the actual value is a Big.
    const overwriteProperties = function (propertyNames, newAssertion) {
      function overwriteProperty (originalAssertion) {
        return function () {
          if (utils.flag(this, 'bignumber')) {
            const actual = convert(this._obj);

            newAssertion.apply(this, [actual]);
          } else {
            originalAssertion.call(this);
          }
        };
      }

      propertyNames.forEach(propertyName =>
        chai.Assertion.overwriteProperty(propertyName, overwriteProperty)
      );
    };

    // Big.eq
    overwriteMethods(1, ['equal', 'equals', 'eq'], function (actual, expected, msg) {
      if (msg) {
        flag(this, 'message', msg);
      }
      this.assert(
        isEqualTo.bind(expected)(actual),
        'expected #{act} to equal #{exp}',
        'expected #{act} to be different from #{exp}',
        expected.toString(),
        actual.toString()
      );
    });

    // Big.gt
    overwriteMethods(1, ['above', 'gt', 'greaterThan'], function (actual, expected, msg) {
      if (msg) {
        flag(this, 'message', msg);
      }
      this.assert(
        isGreaterThan.bind(actual)(expected),
        'expected #{act} to be greater than #{exp}',
        'expected #{act} to be less than or equal to #{exp}',
        expected.toString(),
        actual.toString()
      );
    });

    // Big.gte
    overwriteMethods(1, ['least', 'gte'], function (actual, expected, msg) {
      if (msg) {
        flag(this, 'message', msg);
      }
      this.assert(
        isGreaterThanOrEqualTo.bind(actual)(expected),
        'expected #{act} to be greater than or equal to #{exp}',
        'expected #{act} to be less than #{exp}',
        expected.toString(),
        actual.toString()
      );
    });

    // Big.lt
    overwriteMethods(1, ['below', 'lt', 'lessThan'], function (actual, expected, msg) {
      if (msg) {
        flag(this, 'message', msg);
      }
      this.assert(
        isLessThan.bind(actual)(expected),
        'expected #{act} to be less than #{exp}',
        'expected #{act} to be greater than or equal to #{exp}',
        expected.toString(),
        actual.toString()
      );
    });

    // Big.lte
    overwriteMethods(1, ['most', 'lte'], function (actual, expected, msg) {
      if (msg) {
        flag(this, 'message', msg);
      }
      this.assert(
        isLessThanOrEqualTo.bind(actual)(expected),
        'expected #{act} to be less than or equal to #{exp}',
        'expected #{act} to be greater than #{exp}',
        expected.toString(),
        actual.toString()
      );
    });

    // Equality with tolerance, using gte and lte
    overwriteMethods(2, ['closeTo'], function (actual, expected, delta, msg) {
      if (msg) {
        flag(this, 'message', msg);
      }
      this.assert(
        isGreaterThanOrEqualTo.bind(actual)(expected.sub(delta)) && isLessThanOrEqualTo.bind(actual)(expected.add(delta)),
        `expected #{act} to be within '${delta}' of #{exp}`,
        `expected #{act} to be further than '${delta}' from #{exp}`,
        expected.toString(),
        actual.toString()
      );
    });

    // Big.isNeg
    overwriteProperties(['negative'], function (value) {
      this.assert(
        isLessThan.bind(value)(Big(0)),
        'expected #{this} to be negative',
        'expected #{this} to not be negative',
        value.toString()
      );
    });

    // Big.isZero
    overwriteProperties(['zero'], function (value) {
      this.assert(
        isEqualTo.bind(value)(Big(0.0)),
        'expected #{this} to be zero',
        'expected #{this} to not be zero',
        value.toString()
      );
    });
  };
};
