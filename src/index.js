(function() {
'use strict';
    var root = this;
    var previous_module = root.aeDataValidator;

    var has_require = typeof require !== 'undefined';

    var _ = root._;

    if (typeof _ === 'undefined') {
        if (has_require) {
            _ = require('lodash');
        } else {
            throw new Error('aeDataValidator requires lodash');
        }
    }

    var matcher = function(inBaseObject) {
        return function(inObjProp, inValidationSourceProp) {
            if (inValidationSourceProp.constructor === Function) {
                return inValidationSourceProp(inObjProp);
            } else if (inValidationSourceProp.constructor === Array) {
                var args = inValidationSourceProp.concat();
                var fn = args.shift();

                args = args.map(function(inArg) {
                    return inBaseObject[inArg];
                });
                args.unshift(inObjProp);
                return fn.apply(null, args);
            } else {
                throw new Error('Invalid matcher configuration');
            }
        };
    };

    var emailRE = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i; //jshint ignore:line

    var forceString = function forceString(inVal) {
        if (!inVal) {
            return '';
        }
        return inVal.toString();
    };

    var aeModule = new (function() { /*jshint ignore:line */ //suppresses 'weird construction error' supernew option not working
        this.addPlugIn = function(inPlugIn) {
            var that = this;
            _.each(inPlugIn, function(inValidatorFn, inName) {
                if (_.isFunction(that[inName])) {
                    console.warn('Overriding default validator with name: ' + inName);
                }
                that[inName] = _.bind(inValidatorFn, that);
            });
        };

        this.password = function password(inPassword) {
            return forceString(inPassword).length >= 8 &&
                /^(\w|\d|[\.!@#\$%\^&\-+=,?]){8}((\w|\d|[\.!@#\$%\^&\-+=,?]))*?$/.test(inPassword) &&
                /\w/.test(inPassword) &&
                /\d/.test(inPassword) &&
                /[\.!@#\$%\^&\-+=,?]/.test(inPassword);
        };

        this.nonEmptyArray = function nonEmptyArray(inObject) {
            return _.isArray(inObject) && inObject.length;
        };

        this.companyTaxNumber = function(inVal, inCountryCode) {
            switch(inCountryCode.toUpperCase()) {
                case 'IT':
                    return !_.isEmpty(inVal) && !isNaN(inVal) && /^\d{11}$/.test(inVal.toString());
                default:
                    return false;
            }
        };

        this.nonEmptyString = function(inVal) {
            return !_.isEmpty(inVal) && _.isString(inVal);
        };

        this.stateProvince = function(inVal, inCountryCode) {
            switch(inCountryCode.toUpperCase()) {
                case 'IT':
                    return !_.isEmpty(inVal) &&
                        _.isString(inVal) &&
                        inVal.length == 2;
                default:
                    return false;
            }
        };

        this.creditCardNumber = function creditCardNumber(inNumber) {
            if (/[^0-9-\s]+/.test(inNumber)) return false;

            var nCheck = 0, nDigit = 0, bEven = false;
            inNumber = inNumber.replace(/\D/g, "");

            for (var n = inNumber.length - 1; n >= 0; n--) {
                var cDigit = inNumber.charAt(n);
                      nDigit = parseInt(cDigit, 10);

                if (bEven) {
                    if ((nDigit *= 2) > 9) nDigit -= 9;
                }

                nCheck += nDigit;
                bEven = !bEven;
            }
            return (nCheck % 10) === 0;
        };

        this.country = function(inVal) {
            return !_.isEmpty(inVal) &&
                _.isString(inVal) &&
                inVal.toUpperCase() === 'ITALY';
        };

        this.countryCode = function(inVal) {
            return !_.isEmpty(inVal) &&
                _.isString(inVal) &&
                inVal.toUpperCase() === 'IT';
        };

        this.phoneNumber = function(inVal, inCoutryCode) { //jshint unused:false
            //TODO: validate mobile and landline phone numbers
            //		landline numbers prefix can be validated against the postal code phone prefix
            return !_.isEmpty(inVal) &&
                _.isString(inVal) &&
                /\+39\d+$/.test(inVal.replace(/\s/g, ''));
        };

        this.email = function(inVal) {
            return !_.isEmpty(inVal) &&
                _.isString(inVal) &&
                emailRE.test(inVal.toLowerCase());
        };

        this.postalCode = function(inVal, inCoutryCode) {
            return !_.isEmpty(inVal) &&
                _.isString(inVal) &&
                /^\d{5}$/.test(inVal);
        };

        this.address  = function(inAddress) {
            _.isMatchWith( inAddress,
                {
                'first_name': this.nonEmptyString,
                'last_name': this.nonEmptyString,
                'company': this.nonEmptyString,
                'street_1': this.nonEmptyString,
                'street_2': _.isString,
                'city': this.nonEmptyString,
                'state': [inAddress.province, 'country_iso2'],
                'zip': this.postalCode,
                'country': this.country,
                'country_iso2': this.countryCode,
                'phone': [inAddress.phone, 'country_iso2'],
                'email': this.email
            }, matcher(inAddress));
        };
    })();

    aeModule.noConflict = function() {
        root.aeDataValidator = previous_module;
        return aeModule;
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = aeModule;
        }
        exports.aeDataValidator = aeModule;
    } else {
        root.aeDataValidator = aeModule;
    }
}).call(this); //jshint ignore:line

