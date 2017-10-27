(function() {	
  var //const
    UNDEFINED = 'undefined';
  
  if(typeof angular.easy === UNDEFINED) {
      angular.easy = {};
  }

  if(typeof angular.easy.$moduleName === UNDEFINED) {
      angular.easy.$moduleName = 'ngEasy';
  }

  if(typeof angular.easy.$directivesPrefix === UNDEFINED) {
      angular.easy.$directivesPrefix = 'ngEasy';
  }

  if(typeof angular.easy.$providersPrefix === UNDEFINED) {
      angular.easy.$providersPrefix = '';
  }

  angular.module(angular.easy.$moduleName, [ 'ngRoute' ]);
  angular.easy.registerFunction = registerFunction;
  angular.easy.registerOnModule = registerOnModule;
  angular.easy.bind = bind;

  var functions = {};
  
  function registerFunction(name, fn) {
    functions[name] = fn;
  }

  function registerOnModule(moduleName) {
    for (var functionName in functions) {
      if (!functions.hasOwnProperty(functionName)) {
        continue;
      }
      angular.module(moduleName)[functionName] = bind(functions[functionName], moduleName);
    }
  }

  function bind(originalFunction/*, arguments[1:] */) {
    var bindArgs = Array.prototype.slice.call(arguments, 1);
    return function() {
      var callArgs = Array.prototype.slice.call(arguments);
      var args = Array.prototype.concat(bindArgs, callArgs);
      return originalFunction.apply(this, args);
    };
  }
})();
