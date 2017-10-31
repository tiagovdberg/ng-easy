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

(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Alias', AliasDirective);

	function AliasDirective() {
		return {
			restrict : "EA",
			link : AliasDirectiveLink
		};

		function AliasDirectiveLink(scope, element, attrs) {
			var aliasAndExpressions = attrs.ngEasyAlias.split(';');
			aliasAndExpressions.forEach(function(aliasAndExpression) {
				var aliasAndExpressionArray = aliasAndExpression.split('=');
				if(aliasAndExpressionArray.length != 2) {
					throw "Alias and/or Expression not valid. Format: {alias} = {expression}";
				}
				var alias = aliasAndExpressionArray[0].trim();
				var expression = aliasAndExpressionArray[1].trim();
				scope.$watch(function(){ return scope.$eval(expression);}, function(newValue, oldValue) {scope[alias]=newValue;});
			});
		}
	}
})();
//TODO Documentation JSDoc
//TODO Automaticaly start on specific state based on Status route.
//TODO InitialStatus has a default if there is only one state.

(function() {
	var //const
		UNDEFINED = 'undefined',
		FUNCTION = 'function',
		CONTROLLERDEFAULTSUFFIXES = ['Controller', 'Ctrl', 'Ctl'],
		CONTROLLERSCOPEVARIABLENAMESUFFIX = 'Ctrl',
		METHODSPREFIX_DEFAULT_SERVICE_PUT = [ 'create', 'update', 'save', 'replace', 'put' ],
		METHODSPREFIX_DEFAULT_SERVICE_GET = [ 'retrieve', 'load', 'edit', 'get', 'new' ],
		METHODSPREFIX_DEFAULT_SERVICE_DELETE = [ 'delete', 'remove', 'erase' ],
		METHODSPREFIX_DEFAULT_SERVICE_POST = [ 'add', 'submit', 'send', 'do', 'post' ],
		METHODSPREFIX_SERVICES = [].concat(
			METHODSPREFIX_DEFAULT_SERVICE_GET, 
			METHODSPREFIX_DEFAULT_SERVICE_PUT,
			METHODSPREFIX_DEFAULT_SERVICE_POST,
			METHODSPREFIX_DEFAULT_SERVICE_DELETE
		),
		METHODSPREFIX_SHOW = [ 'show', 'view', 'list', 'display' ],
		KNOWNMETHODSPREFIXES = [].concat(
			METHODSPREFIX_DEFAULT_SERVICE_GET, 
			METHODSPREFIX_DEFAULT_SERVICE_PUT,
			METHODSPREFIX_DEFAULT_SERVICE_POST,
			METHODSPREFIX_DEFAULT_SERVICE_DELETE,
			METHODSPREFIX_SHOW
		);

	var angularEasy = angular.easy;
	var acessor = '$' + angularEasy.$moduleName;

	angularEasy.easyController = easyController;
	angularEasy.registerFunction('easyController', easyController);
	
	function easyController(moduleName, config) {
		var moduleNameValue = evalFunctionOrValue(moduleName);
		angular.module(moduleNameValue).config(ConventionalControllerConfig);

		ConventionalControllerConfig.$inject = [ '$controllerProvider', '$routeProvider', 'MessagesProvider' ];
		function ConventionalControllerConfig($controllerProvider, $routeProvider, MessagesProvider) {
			validateModuleNameIsStringAndNotEmpty(moduleNameValue);

			var configValue = evalFunctionOrValue(config);
			validateConfigIsObjectAndMustBeNotEmpty(configValue);
			var effectiveConfig = getEffectiveConfig(moduleNameValue, configValue);
			var effectiveConfigControllerPrototype = effectiveConfig.controller.prototype;
			var effectiveConfigStatus = effectiveConfig.status;

			var $injector;
			var injectorArgumentIndex;

			registerController();
			if(effectiveConfig.configureRoutes === true) {
				configureRoutes();			
			}
			effectiveConfigControllerPrototype[acessor] = {};
			injectInitMethod();
			injectAndInitializeStatusAndModelAndDataAndVars();
			injectInexistentModelAndDataAndVarsAndTemplateAcessors();
			injectInexistentStatusMethods(effectiveConfig);
			if(typeof effectiveConfig.messages !== UNDEFINED) {
				MessagesProvider.addMessagesMap(effectiveConfig.messages);
			}
			return;

			function registerController() {
				if(typeof effectiveConfig.controller.$inject === UNDEFINED) {
					effectiveConfig.controller.$inject =[];
				}
				injectorArgumentIndex = effectiveConfig.controller.$inject.length;
				effectiveConfig.controller.$inject.push('$injector');
				$controllerProvider.register(effectiveConfig.controllerName, effectiveConfig.controller);
			}

			function configureRoutes() {
				// Register Controller Routes
				var controllerRouteConfig = {
					controller : effectiveConfig.controllerName,
					controllerAs : effectiveConfig.controllerAs,
					template : '<ng:include src="' + effectiveConfig.controllerAs + '.getTemplateUrl()"></ng:include>'
				};
				
				if(typeof effectiveConfig.route !== UNDEFINED) {
					$routeProvider.when(effectiveConfig.route, controllerRouteConfig);
				} else {
					for (var statusName in effectiveConfigStatus) {
						if (!effectiveConfigStatus.hasOwnProperty(statusName)) {
							continue;
						}
						var status = effectiveConfigStatus[statusName];
						if (typeof status.route === UNDEFINED) {
							continue;
						}
						var route = effectiveConfig.routeBase + status.route;
						$routeProvider.when(route, controllerRouteConfig);
					}
				}
			}

			function injectInitMethod() {
				effectiveConfigControllerPrototype[acessor].init = initInjectionMethod;
				if (typeof effectiveConfigControllerPrototype.init === UNDEFINED) {
					effectiveConfigControllerPrototype.init = initInjectionMethod;
				}
			}
			
			function injectAndInitializeStatusAndModelAndDataAndVars() {
				if (typeof effectiveConfigControllerPrototype.model === UNDEFINED) {
					effectiveConfigControllerPrototype.model = {};
				}

				if (typeof effectiveConfigControllerPrototype.data === UNDEFINED) {
					effectiveConfigControllerPrototype.data = {};
				}

				if (typeof effectiveConfigControllerPrototype.vars === UNDEFINED) {
					effectiveConfigControllerPrototype.vars = {};
				}

				for (var statusName in effectiveConfigStatus) {
					if (!effectiveConfigStatus.hasOwnProperty(statusName)) {
						continue;
					}
					if (typeof effectiveConfigControllerPrototype.model[statusName] === UNDEFINED) {
						effectiveConfigControllerPrototype.model[statusName] = {};
					}
					if (typeof effectiveConfigControllerPrototype.data[statusName] === UNDEFINED) {
						effectiveConfigControllerPrototype.data[statusName] = {};
					}
					if (typeof effectiveConfigControllerPrototype.vars[statusName] === UNDEFINED) {
						effectiveConfigControllerPrototype.vars[statusName] = {};
					}
				}
			}

			function injectInexistentModelAndDataAndVarsAndTemplateAcessors() {
				if (typeof effectiveConfigControllerPrototype.getModel === UNDEFINED) {
					effectiveConfigControllerPrototype.getModel = getModelInjectionMethod;
				}

				if (typeof effectiveConfigControllerPrototype.getData === UNDEFINED) {
					effectiveConfigControllerPrototype.getData = getDataInjectionMethod;
				}

				if (typeof effectiveConfigControllerPrototype.getVars === UNDEFINED) {
					effectiveConfigControllerPrototype.getVars = getVarsInjectionMethod;
				}

				if (typeof effectiveConfigControllerPrototype.getTemplateUrl === UNDEFINED) {
					effectiveConfigControllerPrototype.getTemplateUrl = getTemplateUrlInjectionMethod;
				}
			}
			
			function injectInexistentStatusMethods() {
				effectiveConfigControllerPrototype[acessor].methods = {};
				for (var statusName in effectiveConfigStatus) {
					if (!effectiveConfigStatus.hasOwnProperty(statusName)) {
						continue;
					}
					effectiveConfigControllerPrototype[acessor].methods[statusName] = angularEasy.bind(statusInjectionMethod, statusName);
					if(typeof effectiveConfigControllerPrototype[statusName] !== UNDEFINED) {
						continue;
					}
					effectiveConfigControllerPrototype[statusName] = effectiveConfigControllerPrototype[acessor].methods[statusName];
				}
			}

			function initInjectionMethod() {
				var self = this;
				self[acessor].config = configValue;
				self[acessor].effectiveConfig = effectiveConfig;
				$injector = initInjectionMethod.caller.arguments[injectorArgumentIndex];
				var $route = $injector.get('$route');
				self[acessor].routes = $route.routes;

				var $location = $injector.get('$location');
				var currentUrl = $location.url();

				if (typeof self.status !== UNDEFINED) {
					return;
				}

				if(typeof effectiveConfig.initialStatus !== UNDEFINED) {
					self[effectiveConfig.initialStatus]();
					return;
				}

				for (var path in self[acessor].routes) {
					if (!self[acessor].routes.hasOwnProperty(path)) {
						continue;
					}
					var route = self[acessor].routes[path];
					if((typeof route.regexp === UNDEFINED) || !route.regexp.exec(currentUrl)) {
						continue;
					}
					for (var statusName in self[acessor].effectiveConfig.status) {
						if (!self[acessor].effectiveConfig.status.hasOwnProperty(statusName)) {
							continue;
						}
						var status = self[acessor].effectiveConfig.status[statusName];			
						var routeUrl = effectiveConfig.routeBase + status.route;
						if(path === routeUrl) {
							self[statusName]();
							return;
						}
					}
				}					
			}
			
			function getModelInjectionMethod() {
				var self = this;
				return self.model[self.status];
			}

			function getDataInjectionMethod() {
				var self = this;
				return self.data[self.status];
			}

			function getVarsInjectionMethod() {
				var self = this;
				return self.vars[self.status];
			}

			function getTemplateUrlInjectionMethod() {
				var self = this;
				return effectiveConfig.templateBaseUrl + evalFunctionOrValue(effectiveConfigStatus[self.status].templateUrl, self);
			}

			function statusInjectionMethod(newStatusName, form) {
				var self = this;

				var Messages = $injector.get('Messages');

				var $q = $injector.get('$q');
				
				Messages.clearMessages();
				
				if ((typeof form !== UNDEFINED) && Messages.formErrors(self.getTemplateUrl(), form)) {
					var df1 = $q.defer();
					df1.resolve();
					return df1.promise;
				}

				var oldStatusName = self.status;
				if(typeof oldStatusName === UNDEFINED) {
					oldStatusName = newStatusName;
				} else if(typeof effectiveConfigStatus[oldStatusName].onExit === FUNCTION) {
					evalFunctionOrValue(effectiveConfigStatus[oldStatusName].onExit, self);
				}

				self.status = newStatusName;

				var serviceMethod = evalFunctionOrValue(effectiveConfigStatus[newStatusName].serviceMethod);
				if(typeof serviceMethod === UNDEFINED) {
					var df2 = $q.defer();
					df2.resolve();
					return df2.promise;
				}
				
				var serviceUrl = (typeof effectiveConfigStatus[newStatusName].serviceUrl !== UNDEFINED) ? 
						$injector.get('Urls').getBaseUrl() + evalFunctionOrValue(effectiveConfigStatus[newStatusName].serviceUrl, self) : 
						$injector.get('Urls').serviceUrl();
				//FIXME Move to getEffectiveStatusSuccessFn and getEffectiveStatusFailFn 
				var successFn = (typeof effectiveConfigStatus[newStatusName].success !== UNDEFINED) ? effectiveConfigStatus[newStatusName].success : ServiceSuccessPrototype;  
				var failFn = (typeof effectiveConfigStatus[newStatusName].fail !== UNDEFINED) ? effectiveConfigStatus[newStatusName].fail : ServiceFailPrototype;
				
				var loading = evalFunctionOrValue(effectiveConfigStatus[newStatusName].loading, self);
				$injector.get('Loading').startLoading(loading);
				return $injector.get('$http')({
					method: serviceMethod,
					data: self.model[oldStatusName],
					url: serviceUrl
				}).then(
					successFn, 
					failFn
				).finally(function() { $injector.get('Loading').stopLoading(loading) ; });

				//TODO model and data must accept functions with response as argument.
				function ServiceSuccessPrototype(response) {
					var statusOnSuccess = evalFunctionOrValue(effectiveConfigStatus[newStatusName].statusOnSuccess, self);
					self.data[statusOnSuccess] = response.data;
					
					var modelOnSuccess = evalFunctionOrValue(effectiveConfigStatus[newStatusName].modelOnSuccess, self);
					if(typeof modelOnSuccess !== UNDEFINED) {
						self.model[statusOnSuccess] = modelOnSuccess;
					}

					var varsOnSuccess = evalFunctionOrValue(effectiveConfigStatus[newStatusName].varsOnSuccess, self);
					if(typeof varsOnSuccess !== UNDEFINED) {
						self.vars[statusOnSuccess] = varsOnSuccess;
					}

					var statusChanged = (statusOnSuccess !== newStatusName);
					if(statusChanged) {
						self[statusOnSuccess]();
					}

					var locationOnSuccess = evalFunctionOrValue(effectiveConfigStatus[newStatusName].locationOnSuccess, self);
					if(typeof locationOnSuccess !== UNDEFINED) {
						$injector.get('$location').url(locationOnSuccess);
					}
					
					var messageOnSuccess = evalFunctionOrValue(effectiveConfigStatus[newStatusName].messageOnSuccess, self);
					if(messageOnSuccess) {
						if(typeof locationOnSuccess !== UNDEFINED) {
							messageOnSuccess.persistent = true;
						}
						Messages.addMessage(messageOnSuccess);
					}
				}
				
				function ServiceFailPrototype(response) {
					var statusOnFail = evalFunctionOrValue(effectiveConfigStatus[newStatusName].statusOnFail, self);

					var modelOnFail = evalFunctionOrValue(effectiveConfigStatus[newStatusName].modelOnFail, self);
					if(typeof modelOnFail !== UNDEFINED) {
						self.model[statusOnFail] = modelOnFail;
					}

					var varsOnFail = evalFunctionOrValue(effectiveConfigStatus[newStatusName].varsOnFail, self);
					if(typeof varsOnFail !== UNDEFINED) {
						self.vars[statusOnFail] = varsOnFail;
					}

					if((statusOnFail !== oldStatusName) && (statusOnFail !== newStatusName)) {
						self[statusOnFail]();
					} else {
						self.status = statusOnFail;
					}
					var locationOnFail = evalFunctionOrValue(effectiveConfigStatus[newStatusName].locationOnFail, self);
					var hasLocationOnFail = (typeof locationOnFail !== UNDEFINED);
					if(response.status != 401 && hasLocationOnFail) {
						$injector.get('$location').url(locationOnFail);
					}
					Messages.handleErrors(response);
					var messageOnFail = evalFunctionOrValue(effectiveConfigStatus[newStatusName].messageOnFail, self);
					if(messageOnFail) {
						Messages.addMessage(messageOnFail);
					}
				}
			}
		}
	}

	function evalFunctionOrValue(functionOrValue /*, arguments[1:] */) {
		var extraArgs = Array.prototype.slice.call(arguments, 1);
		if ((typeof functionOrValue === FUNCTION) || (functionOrValue instanceof Function)) {
			return functionOrValue.apply(this, extraArgs);
		}
		return functionOrValue;
	}
	
	function validateModuleNameIsStringAndNotEmpty(moduleName) {
		var isString = (typeof moduleName === 'string') || (moduleName instanceof String);
		var isTrimmedString = isString && (moduleName.trim() === moduleName);
		var isEmpty = isString && moduleName.length === 0;
		if (!isString || !isTrimmedString || isEmpty) {
			throw '[moduleName] must be a string and must be not empty.';
		}
	}
	
	function getEffectiveConfig(moduleName, config) {
		var localEffectiveConfig = {};
		validateControllerNameEvaluationPossible(config);
		localEffectiveConfig.controller = getEffectiveController(); 
		localEffectiveConfig.controllerName = getEffectiveControllerName();
		localEffectiveConfig.configureRoutes = getEffectiveConfigureRoutes();
		validateRouteConfig(config, localEffectiveConfig.configureRoutes);
		if(localEffectiveConfig.configureRoutes === true) {
			localEffectiveConfig.controllerAs = getEffectiveControllerScopeVariableName();
			localEffectiveConfig.route = getEffectiveRoute();
			localEffectiveConfig.routeBase = getEffectiveRouteBase();
		}
		localEffectiveConfig.templateBaseUrl = getEffectiveTemplateBaseUrl();
		localEffectiveConfig.status = getEffectiveStatuses();
		localEffectiveConfig.initialStatus = getEffectiveInitialStatus();
		localEffectiveConfig.messages = getEffectiveMessages();
		return localEffectiveConfig;
	
		function getEffectiveController() {
			if (typeof config.controller === UNDEFINED) {
				var controller = function() {
					var self = this; 
					self.init();					
				};
				return controller;
			}
			return config.controller;
		}
		
		function getEffectiveControllerName() {
			return (typeof config.controllerName !== UNDEFINED) ? 
				evalFunctionOrValue(config.controllerName) : 
				config.controller.name;
		}

		function getEffectiveConfigureRoutes() {
			if (typeof config.configureRoutes !== UNDEFINED) {
				return evalFunctionOrValue(config.configureRoutes);
			}
			return true;
		}

		function getEffectiveControllerScopeVariableName() {
			return (typeof config.controllerAs !== UNDEFINED) ? 
				evalFunctionOrValue(config.controllerAs) : 
				transformControllerNameToControllerScopeVariableName(localEffectiveConfig.controllerName);
		}

		function getEffectiveRoute() {
			if (typeof config.route !== UNDEFINED) {
				return evalFunctionOrValue(config.route);
			}
			if (typeof config.routeBase !== UNDEFINED) {
				return; //undefined
			}
			return '/' + transformControllerNameToHtmlName(localEffectiveConfig.controllerName);
		}
		
		function getEffectiveRouteBase() {
			if (typeof config.routeBase !== UNDEFINED) {
				return evalFunctionOrValue(config.routeBase);
			}
			return; //undefined
		}
		
		function getEffectiveTemplateBaseUrl() {
			return (typeof config.templateBaseUrl !== UNDEFINED) ? 
				evalFunctionOrValue(config.templateBaseUrl) : 
				transformFeatureNameToHtmlName(moduleName) + '/' + transformControllerNameToHtmlName(localEffectiveConfig.controllerName);
		}
		
		//TODO Route user featurename without prefix. Default Status name with prefix
		function getEffectiveStatuses() {
			var effectiveStatuses = {};
			var statusesValue = evalFunctionOrValue(config.status);
			if (typeof statusesValue === UNDEFINED) {
				var singleStatusName = transformControllerNameToFeatureName(localEffectiveConfig.controllerName);
				effectiveStatuses[singleStatusName] = getEffectiveStatus(singleStatusName, {});
				return effectiveStatuses;
			}
			for (var statusName in statusesValue) {
				if (!statusesValue.hasOwnProperty(statusName)) {
					continue;
				}
				effectiveStatuses[statusName] = getEffectiveStatus(statusName, statusesValue[statusName]);
			}
			return effectiveStatuses;

		}

		function getEffectiveInitialStatus() {
			if(typeof config.initialStatus !== UNDEFINED) {
				return evalFunctionOrValue(config.initialStatus);
			}
			if (typeof config.routeBase !== UNDEFINED) {
				return;
			}
			if (typeof config.status === UNDEFINED) {
				return transformControllerNameToFeatureName(localEffectiveConfig.controllerName);
			}
			if (Object.keys(config.status).length === 1) {
				return transformControllerNameToFeatureName(Object.keys(config.status)[0]);
			}
			//TODO Handle single status name
			return;
		}
		
		function getEffectiveMessages() {
			return evalFunctionOrValue(config.messages);
		}
		
		function getEffectiveStatus(statusName, status) {
			var effectiveStatus = {};
			if(localEffectiveConfig.configureRoutes === true) {
				effectiveStatus.route = getEffectiveStatusRoute(statusName, status);
			}
			effectiveStatus.templateUrl = getEffectiveStatusTemplateUrl(statusName, status);
			effectiveStatus.loading = getEffectiveStatusLoading(statusName, status);
			effectiveStatus.serviceMethod = getEffectiveStatusServiceMethod(statusName, status);
			effectiveStatus.serviceUrl = getEffectiveStatusServiceUrl(statusName, status); 
			effectiveStatus.success = status.success;
			effectiveStatus.fail = status.fail;
			effectiveStatus.statusOnSuccess = getEffectiveStatusStatusOnSuccess(statusName, status);
			effectiveStatus.statusOnFail = getEffectiveStatusStatusOnFail(statusName, status);
			effectiveStatus.modelOnSuccess = status.modelOnSuccess;
			effectiveStatus.modelOnFail = status.modelOnFail;
			effectiveStatus.varsOnSuccess = status.varsOnSuccess;
			effectiveStatus.varsOnFail = status.varsOnFail;
			effectiveStatus.locationOnSuccess = status.locationOnSuccess;
			effectiveStatus.locationOnFail = status.locationOnFail;
			effectiveStatus.messageOnSuccess = status.messageOnSuccess;
			effectiveStatus.messageOnFail = status.messageOnFail;
			effectiveStatus.onExit = status.onExit;
			return effectiveStatus;
		}		
		
		function getEffectiveStatusRoute(statusName, status) {
			if(typeof status.route !== UNDEFINED) {
				return evalFunctionOrValue(status.route);
			}
			if(typeof localEffectiveConfig.route != UNDEFINED) {
				return;
			}
			return '/' + transformStatusNameToHtmlName(statusName);
		}

		function getEffectiveStatusTemplateUrl(statusName, status) {
			return (typeof status.templateUrl !== UNDEFINED)  ?
				status.templateUrl : 
				'/' + transformStatusNameToHtmlName(statusName) + '.html';
		}

		function getEffectiveStatusLoading(statusName, status) {
			return (typeof status.loading !== UNDEFINED)  ?
				status.loading : 
				'global';
		}
		
		function getEffectiveStatusServiceMethod(statusName, status) {
			if(typeof status.serviceMethod !== UNDEFINED) {
				return status.serviceMethod;
			}
			
			if(containsStartString(METHODSPREFIX_DEFAULT_SERVICE_PUT, statusName)) {
				return 'PUT';
			}
			if(containsStartString(METHODSPREFIX_DEFAULT_SERVICE_GET, statusName)) {
				return 'GET';
			}
			if(containsStartString(METHODSPREFIX_DEFAULT_SERVICE_DELETE, statusName)) {
				return 'DELETE';
			}
			if(containsStartString(METHODSPREFIX_DEFAULT_SERVICE_POST, statusName)) {
				return 'POST';
			}
			
			if(containsStartString(METHODSPREFIX_SHOW, statusName)) {
				return;
			}
			
			return;
		}
		
		function getEffectiveStatusServiceUrl(statusName, status) {
			return status.serviceUrl;
		}
		
		function getEffectiveStatusStatusOnSuccess(statusName, status) {
			return (typeof status.statusOnSuccess !== UNDEFINED) ?
				status.statusOnSuccess :
				statusName;
		}

		function getEffectiveStatusStatusOnFail(statusName, status) {
			return (typeof status.statusOnFail !== UNDEFINED) ?
				status.statusOnFail :
				statusName;
		}
	}

	function validateConfigIsObjectAndMustBeNotEmpty(config) {
		var isObject = (typeof config === 'object')	|| (config instanceof Object);
		if (!isObject) {
			throw '[config] must be a object and must be not empty.';
		}
	}

	function validateControllerNameEvaluationPossible(config) {
		var undefinedControllerName = (typeof config.controllerName === UNDEFINED);
		var undefinedControllerFunction = (typeof config.controller === UNDEFINED);
		var undefinedControllerFunctionName = undefinedControllerFunction || (typeof config.controller.name === UNDEFINED);
		if (undefinedControllerName && undefinedControllerFunctionName) {
			throw 'Controller name evaluation not possible. Use [controllerName] or a name [controller]';
		}
	}
	
	function validateRouteConfig(config, configureRoutes) {
		if(configureRoutes === false) {
			validateForbiddenRouteConfig(config);
			return;
		}
		if(typeof config.route === UNDEFINED) {
			return;
		}
		if(typeof config.routeBase !== UNDEFINED) {
			throw '[config.route] and [config.routeBase] are mutually exclusive.';
		}
		var statusesValue = evalFunctionOrValue(config.status);
		if (typeof statusesValue === UNDEFINED) {
			return;
		}
		for (var statusName in statusesValue) {
			if (!statusesValue.hasOwnProperty(statusName)) {
				continue;
			}
			if(typeof statusesValue[statusName].route !== UNDEFINED) {
				throw '[config.route] and [config.status[\'' + statusName + '\'].route] are mutually exclusive.';
			}
		}
	}

	function validateForbiddenRouteConfig(config) {
		if(typeof config.route !== UNDEFINED) {
			throw '[config.configureRoutes = false] and [config.route] are mutually exclusive.';
		}
		if(typeof config.routeBase !== UNDEFINED) {
			throw '[config.configureRoutes = false] and [config.routeBase] are mutually exclusive.';
		}
		if(typeof config.controllerAs !== UNDEFINED) {
			throw '[config.configureRoutes = false] and [config.controllerAs] are mutually exclusive.';
		}
		var statusesValue = evalFunctionOrValue(config.status);
		if (typeof statusesValue === UNDEFINED) {
			return;
		}
		for (var statusName in statusesValue) {
			if (!statusesValue.hasOwnProperty(statusName)) {
				continue;
			}
			if(typeof statusesValue[statusName].route !== UNDEFINED) {
				throw '[config.configureRoutes = false] and [config.status[\'' + statusName + '\'].route] are mutually exclusive.';
			}
		}
	}

	function transformControllerNameToControllerScopeVariableName(controllerName) {
		var featureName = transformControllerNameToFeatureName(controllerName);
		var scopeVariableName = featureName + CONTROLLERSCOPEVARIABLENAMESUFFIX;
		return scopeVariableName;
	}

	function transformControllerNameToFeatureName(controllerName) {
		 var name = removeKnowSuffixes(controllerName, CONTROLLERDEFAULTSUFFIXES);
		 return transformToCamelCase(name);
	}

	function transformToCamelCase(name) {
		return name.substring(0,1).toLowerCase() + name.substring(1);
	}

	function transformControllerNameToHtmlName(controllerName) {
		var featureName = transformControllerNameToFeatureName(controllerName);
		return transformFeatureNameToHtmlName(featureName);
	}

	function transformFeatureNameToHtmlName(featureName) {
		var htmlName = '';
		var featureNameLength = featureName.length;
		for (var i = 0; i < featureNameLength; i++) {
			var char = featureName.charAt(i);
			var lowerCaseChar = char.toLowerCase();
			var isUpperCase = (char != lowerCaseChar);
			if (isUpperCase && (htmlName !== '')) {
				htmlName += '-';
			}
			htmlName += lowerCaseChar;
		}
		return htmlName;
	}


	function validateStatus(config, statusName, varName) {
		varName = (typeof statusName === UNDEFINED) ? 'statusName' : varName;
		var isString = (typeof statusName === 'string')	|| (statusName instanceof String);
		var isTrimmedString = isString && (statusName.trim() === statusName);
		var isEmpty = isString && (statusName.length === 0);
		if (!isString || !isTrimmedString || isEmpty) {
			throw '[' + varName + '] must be a trimmed string and must be not empty.';
		}
		
		if((typeof config.status !== UNDEFINED) && (typeof config.status[statusName] === UNDEFINED)) {
			throw '[' + varName + '] = \"' + status + '\" must exists in [config.status]';
		}
	}

	function transformStatusNameToHtmlName(statusName) {
		var featureName = transformStatusNameToFeatureName(statusName);
		return transformFeatureNameToHtmlName(featureName);
	}

	function transformStatusNameToFeatureName(statusName) {
		var name = removeKnowPrefixes(statusName, KNOWNMETHODSPREFIXES);
		return transformToCamelCase(name);
	}

	function removeKnowPrefixes(name, knownPrefixes) {
		for (var knownPrefixIndex = 0; knownPrefixIndex < knownPrefixes.length; knownPrefixIndex++) {
			var knownPrefix = knownPrefixes[knownPrefixIndex];
			if (name.toLowerCase().startsWith(knownPrefix.toLowerCase())) {
				return name.substring(knownPrefix.length);
			}
		}
		return name;
	}

	function removeKnowSuffixes(name, knownSuffixes) {
		for (var knownSuffixIndex = 0; knownSuffixIndex < knownSuffixes.length; knownSuffixIndex++) {
			var knownSuffix = knownSuffixes[knownSuffixIndex];
			if (name.toLowerCase().endsWith(knownSuffix.toLowerCase())) {
				return name.substring(0, name.length - knownSuffix.length);	
			}
		}
		return name;
	}

	function containsStartString(array, value) {
		for(var index = 0; index < array.length ; index++) {
			if(value.indexOf(array[index]) === 0) {
				return true;
			}			
		}
		return false;
	}
})();
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'IsLoading', IsLoadingDirective);

	IsLoadingDirective.$inject=['Loading'];
	function IsLoadingDirective(Loading) {
		return {
			restrict: 'EA',
			link : IsLoadingDirectiveLink
		};

		function IsLoadingDirectiveLink(scope, element, attrs, ctrl, transclude) {
			scope.$watch(function(){ return Loading.getChangeCount();}, processElement);
			
			function processElement() {
				var loadingExpressions = attrs.ngEasyIsLoading.split(';');
				var isLoading = false;
				loadingExpressions.forEach(function(loadingExpression) {
					var loadings = Loading.getLoadings(loadingExpression);
					isLoading = isLoading || (loadings.length > 0); 
				});
				if(isLoading) {
					element.prop('style').removeProperty('display');
					return;
				}
				element.prop('style').display = 'none';
			}
		}
	}
		
})();
(function() {	
	angular.module(angular.easy.$moduleName).service(angular.easy.$providersPrefix + 'Loading', LoadingService);

	function LoadingService() {
		var self = this;

		self.getChangeCount = getChangeCount;
		self.getLoadings = getLoadings;
		self.startLoading = startLoading;
		self.stopLoading = stopLoading;
		
		init();
		
		function init() {
			self.loadings = [];
			self.changeCount = 0;
		}

		function getChangeCount() {
			return self.changeCount;
		}

		function getLoadings(expression) {
			if((typeof expression === 'undefined') || expression === "*") {
				return self.loadings;
			}
			
			return angular.easy.$$filterElements(self.loadings, expression);
		}

		function startLoading(loadingId) {
			self.loadings.push(loadingId);
			self.changeCount++;
		}

		function stopLoading(loadingId) {
			var index = self.loadings.indexOf(loadingId);
			if(index === -1) {
				return;
			}
			self.loadings.splice(index, 1);
			self.changeCount++;
		}
		
	}
})();	
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'NotLoading', NotLoadingDirective);

	NotLoadingDirective.$inject=['Loading'];
	function NotLoadingDirective(Loading) {
		return {
			restrict: 'EA',
			link : NotLoadingDirectiveLink
		};

		function NotLoadingDirectiveLink(scope, element, attrs, ctrl, transclude) {
			scope.$watch(function(){ return Loading.getChangeCount();}, processElement);
			
			function processElement() {
				var loadingExpressions = attrs.ngEasyNotLoading.split(';');
				var isLoading = false;
				loadingExpressions.forEach(function(loadingExpression) {
					var loadings = Loading.getLoadings(loadingExpression);
					isLoading = isLoading || (loadings.length > 0); 
				});
				if(isLoading) {
					element.prop('style').display = 'none';
					return;
				}
				element.prop('style').removeProperty('display');
			}
		}
	}
		
})();
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'HasMessages', HasMessagesDirective);

	HasMessagesDirective.$inject=['Messages'];
	function HasMessagesDirective(Messages) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : HasMessagesDirectiveLink
		};

		function HasMessagesDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			scope.$watch(function(){ return Messages.getChangeCount();}, processElement);
			
			function processElement() {
				var hasMessagesExpressions = attrs.ngEasyHasMessages.split(';');
				var hasMessages = false;
				hasMessagesExpressions.forEach(function(hasMessageExpression) {
					var messages = Messages.getMessages(hasMessageExpression);
					hasMessages = hasMessages || (messages.length > 0); 
				});
				if(hasMessages) {
					element.after(originalElementClone);
					return;
				}
				originalElementClone.remove();
				return;
			}
		}
	}
		
})();
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Highlight', HighlightDirective);

	HighlightDirective.$inject=['Messages'];
	function HighlightDirective(Messages) {
		return {
			restrict : "A",
			link : HighlightDirectiveLink
		};

		function HighlightDirectiveLink(scope, element, attrs) {
			var originalClasses = element.attr("class");
			scope.$watch(function(){ return Messages.getChangeCount();}, highlightElement);
			
			function highlightElement() {
				element.attr("class", originalClasses);
				var highlightExpressions = attrs.ngEasyHighlight.split(';');
				var priorityMap = {};
				priorityMap[Messages.FATAL] = 0;
				priorityMap[Messages.ERROR] = 1;
				priorityMap[Messages.WARNING] = 2;
				priorityMap[Messages.INFORMATION] = 3;
				priorityMap[Messages.MESSAGE] = 4;
				
				var elementClass;
				var classMap ={};
				var priority = Infinity;
				highlightExpressions.forEach(function(highlightExpression) {
					var classMapExpressions = highlightExpression.split('=');
					if(classMapExpressions.length > 2) {
						return;
					}
					if(classMapExpressions.length === 2) {
						if(classMapExpressions[0] === '' || classMapExpressions[1] === '') {
							return;
						}
						classMap[classMapExpressions[0]] = classMapExpressions[1];
						return;
					}
					var messages = Messages.getMessages(highlightExpression);
					messages.forEach(function(message) {
						var messagePriority = priorityMap[message.type];
						if(messagePriority < priority){
							priority = messagePriority;
							elementClass = message.type;
						}
					});
				});
				if(elementClass) { 
					element.addClass(typeof classMap[elementClass] !== 'undefined' ? classMap[elementClass] : elementClass);
				}
			}
		}
	}
		
})();
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Messages', MessagesDirective);

	MessagesDirective.$inject = ['Messages']; 
	function MessagesDirective(Messages) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : MessagesDirectiveLink
		};

		function MessagesDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Messages.getChangeCount();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var showMessageExpressions = attrs.ngEasyMessages.split(';');
				var classMap = {};
				showMessageExpressions.forEach(function(showMessageExpression) {
					var classMapExpressions = showMessageExpression.split('=');
					if(classMapExpressions.length !== 2) {
						return;
					}
					if(classMapExpressions[0] === '' || classMapExpressions[1] === '') {
						return;
					}
					classMap[classMapExpressions[0]] = classMapExpressions[1];
					return;
				});
				showMessageExpressions.forEach(function(showMessageExpression) {
					var messages = Messages.getMessages(showMessageExpression);
					messages.forEach(function(message) {
						message.class = (typeof classMap[message.type] !== 'undefined') ? classMap[message.type] : message.type;
						var originalElementClone = transclude(function(clone, transcludeScope) {transcludeScope.message = message;});
						dynamicalyAddedElements.push(originalElementClone);
						element.after(originalElementClone);
					});
				});
			}
		}
	}
		
})();
(function() {
	var //const
		UNDEFINED = 'undefined';

	angular.module(angular.easy.$moduleName).provider(angular.easy.$providersPrefix + 'Messages', MessagesProvider);

	function MessagesProvider() {
		var self = this;
		self.messagesMap = {};
		self.$get = MessagesFactory; 
		self.addMessagesMap = addMessagesMap;

		function MessagesFactory() {
			return new Messages(self.messagesMap);
		}
		
		function addMessagesMap(newMessagesMap) {
			var initialPrefix = '';
			_addMessagesMapWithPrefix(initialPrefix, newMessagesMap);
		}

		function _addMessagesMapWithPrefix(prefix, newMessagesMap) {
			for ( var key in newMessagesMap) {
				if (!newMessagesMap.hasOwnProperty(key)) {
					continue;
				}

				var prefixedKey = prefix + key;
				
				if(self.messagesMap[prefixedKey]) {
					//TODO Throw a error?
					continue;
				}
				var value = newMessagesMap[key];
				
				if(typeof value === 'string' || value instanceof String) {
					self.messagesMap[prefixedKey] = value;
					continue;
				}
				
				_addMessagesMapWithPrefix(prefixedKey, value);
			}
		}
	}

	
	Messages.$inject = [];
	function Messages(messagesMap) {
		var //const
			FATAL = 'fatal',
			ERROR = 'error',
			WARNING = 'warning', 
			INFORMATION = 'information', 
			MESSAGE = 'message'; 
		
		var self = this;

		self.FATAL = FATAL;
		self.ERROR = ERROR;
		self.WARNING = WARNING;
		self.INFORMATION = INFORMATION;
		self.MESSAGE = MESSAGE;

		self.getChangeCount = getChangeCount;
		self.getMessages = getMessages;
		self.addMessage = addMessage;
		self.clearMessages = clearMessages;
		self.handleErrors = handleErrors;
		self.formErrors = formErrors;
		self.validate = validate;
		
		init();
		
		function init() {
			self.messagesMap = messagesMap;
			self.messages = [];
			self.changeCount = 0;
		}

		function getChangeCount() {
			return self.changeCount;
		}

		function getMessages(expression) {
			if((typeof expression === UNDEFINED) || expression === "*") {
				return self.messages;
			}
			
			return angular.easy.$$filterElements(self.messages, expression, function(message) { return message.id; });
		}

		function addMessage(newMessage) {
			if((typeof newMessage.id === UNDEFINED) || (typeof self.messagesMap[newMessage.id] === UNDEFINED)) {
				self.messages.push(newMessage);
				self.changeCount++;
				return;
			}
			self.messages.push({id: newMessage.id, text: self.messagesMap[newMessage.id], type: newMessage.type});
			self.changeCount++;
			return;
		}

		function clearMessages() {
			self.messages.length = 0;
			self.changeCount++;
		}
		
		function handleErrors(response) {
			var type = MESSAGE; 

			if(response.status < 200 || response.status >= 600) {
				self.messages.push({"id": response.status ,"text": "Erro não definido", "type": FATAL});
				return;
			}

			if(response.status >= 500 && response.status <= 599) {
				type = FATAL;
			}
			
			if(response.status >= 400 && response.status <= 499) {
				type = ERROR;
			}
			
			if(typeof response.data.text !== UNDEFINED) {
				addMessage({"id": response.data.text ,"text": response.data.text, "type": type});
				return;
			}
			addMessage({"id": response.status.toString() ,"text": response.statusText, "type": type});
		}

		function formErrors(templateUrl, form) {
			var hasError = false;
			for(var fieldName in form) {
				if(!form.hasOwnProperty(fieldName)) {
					continue;
				}
				if(fieldName === '$error') {
					errorTypeLoop:
					for(var errorTypeName in form.$error) {
						var errorType = form.$error[errorTypeName];
						for(var fieldIndex = 0; fieldIndex < errorType.length; fieldIndex++) {
							var field = errorType[fieldIndex];
							if((typeof field.$name !== UNDEFINED) && field.$name !== "") {
								continue;
							}
							hasError = true;
							var qualifiedGenericError = templateUrl + "." + form.$name + ".$error." + errorTypeName;
							addMessage({"id": qualifiedGenericError ,"text": qualifiedGenericError, "type": ERROR});
							continue errorTypeLoop;
						}
					}
					continue;
				}

				if(fieldName.startsWith("$")) {
					continue;
				}
				for(var formFieldError in form[fieldName].$error) {
					hasError = true;
					var qualifiedError = templateUrl + "." + form.$name + "." + fieldName + "." + formFieldError;
					addMessage({"id": qualifiedError ,"text": x(qualifiedError, self.messagesMap), "type": ERROR});
				}
			}
			return hasError;
		}

		function validate(condition, message) {
			var hasError = evalFunctionOrValue(condition);
			if (!hasError) {
				return hasError;
			}
			addMessage({"id": message.id ,"text": x(message.id, self.messagesMap), "type": message.type});
			return hasError;
		}

		function x(qualifiedError, messagesMap) {
			var noParametersQualifiedError = qualifiedError.replace(/\{.*?=.*?\}/, '{}');
			var rawMessage = messagesMap[noParametersQualifiedError];
			if(typeof rawMessage === UNDEFINED) {
				return qualifiedError;
			}
			
			if(qualifiedError === noParametersQualifiedError) {
				return rawMessage;
			}
			var changedMessage = rawMessage;
			var regEx = /\{(.*?)=(.*?)\}/g;
			var regexResult;
			while ((regexResult = regEx.exec(qualifiedError)) !== null) {
				var paramName = regexResult[1];
				var paramValue = regexResult[2];
				changedMessage = changedMessage.replace("\{" + paramName + "\}", paramValue);
			}
			return changedMessage;
		}

	}

	function evalFunctionOrValue(functionOrValue) {
		if ((typeof functionOrValue === 'function') || (functionOrValue instanceof Function)) {
			return functionOrValue();
		}
		return functionOrValue;
	}
})();	
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'BreadCrumbs', BreadCrumbsDirective);

	BreadCrumbsDirective.$inject = ['Template']; 
	function BreadCrumbsDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : BreadCrumbsDirectiveLink
		};

		function BreadCrumbsDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.breadCrumbs();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var breadCrumbs = Template.breadCrumbs();
				breadCrumbs.forEach(function(breadCrumb) {
					var originalElementClone = transclude(function(clone, transcludeScope) {transcludeScope.breadCrumb = breadCrumb;});
					dynamicalyAddedElements.push(originalElementClone);
					element.after(originalElementClone);
				});
			}
		}
	}
		
})();
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'DefaultStyleSheet', DefaultStyleSheetDirective);

	DefaultStyleSheetDirective.$inject=['Template'];
	function DefaultStyleSheetDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : DefaultStyleSheetDirectiveLink
		};

		function DefaultStyleSheetDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			scope.$watch(function(){ return Template.styleSheets();}, processElement);
			
			function processElement() {
				if(Template.styleSheets().length === 0) {
					element.after(originalElementClone);
					return;
				}
				originalElementClone.remove();
				return;
			}
		}
	}
		
})();
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'HasMenu', HasMenuDirective);

	HasMenuDirective.$inject=['Template'];
	function HasMenuDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : HasMenuDirectiveLink
		};

		function HasMenuDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			scope.$watch(function(){ return Template.menuVisible();}, processElement);
			
			function processElement() {
				if(Template.menuVisible()) {
					element.after(originalElementClone);
					return;
				}
				originalElementClone.remove();
				return;
			}
		}
	}
		
})();
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Menus', MenusDirective);

	MenusDirective.$inject = ['Template', '$location', '$route']; 
	function MenusDirective(Template, $location, $route) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : MenusDirectiveLink
		};

		function MenusDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.menuVisible();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var menus = Template.menus();
				menus.forEach(function(menu) {
					var menuWithGoFunction = angular.merge({ go: function() { menuGo(menu) ; } }, menu);
					var originalElementClone = transclude(function(clone, transcludeScope) {transcludeScope.menu = menuWithGoFunction;});
					dynamicalyAddedElements.push(originalElementClone);
					element.after(originalElementClone);
				});
			}
		}

		function menuGo(menu) {
			var oldLocation = $location.url();
			if(oldLocation !== menu.path) {
				$location.url(menu.path);
				return;
			}
			$route.reload();
		}
	}
})();
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Scripts', ScriptsDirective);

	ScriptsDirective.$inject = ['Template']; 
	function ScriptsDirective(Template) {
		var scriptDomElement = document.createElement('script');
		scriptDomElement.setAttribute('type', 'application/javascript');
		var scriptElement = angular.element(scriptDomElement);

		return {
			restrict: 'E',
		    transclude: 'element',
			link : ScriptsDirectiveLink
		};

		function ScriptsDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.scripts();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var scripts = Template.scripts();
				scripts.forEach(function(script) {
					var scriptElementClone = scriptElement.clone();
					scriptElementClone.attr('src', script);
					dynamicalyAddedElements.push(scriptElementClone);
					element.after(scriptElementClone);
				});
			}
		}
	}
		
})();
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'StyleSheets', StyleSheetsDirective);

	StyleSheetsDirective.$inject = ['Template']; 
	function StyleSheetsDirective(Template) {
		var styleSheetDomElement = document.createElement('link');
		styleSheetDomElement.setAttribute('rel', 'stylesheet');
		styleSheetDomElement.setAttribute('type', 'text/css');
		var styleSheetElement = angular.element(styleSheetDomElement);

		return {
			restrict: 'E',
		    transclude: 'element',
			link : StyleSheetsDirectiveLink
		};

		function StyleSheetsDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.styleSheets();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var styleSheets = Template.styleSheets();
				styleSheets.forEach(function(styleSheet) {
					var styleSheetElementClone = styleSheetElement.clone();
					styleSheetElementClone.attr('href', styleSheet);
					dynamicalyAddedElements.push(styleSheetElementClone);
					element.after(styleSheetElementClone);
				});
			}
		}
	}
		
})();
(function() {	
	angular.module(angular.easy.$moduleName)
	  .directive(angular.easy.$directivesPrefix + 'Template', TemplateDirective);

	TemplateDirective.$inject = [ 'Template' ];
	function TemplateDirective(Template) {
		return {
			restrict : 'E',
			scope : {
				title : '@',
				breadCrumbs : '=',
				styleSheets : '=',
				scripts : '=',
				menuVisible : '=',
			},
			link : TemplateDirectiveLink
		};
		
		function TemplateDirectiveLink(scope, element, attrs) {
			Template.title(scope.title || '');
			Template.breadCrumbs(scope.breadCrumbs || []);
			Template.styleSheets(scope.styleSheets || []);
			Template.scripts(scope.scripts || []);
			Template.menuVisible((typeof scope.menuVisible !== 'undefined') ? scope.menuVisible : true);
		}
	}
})();	
(function() {	
	angular.module(angular.easy.$moduleName)
	  .service(angular.easy.$providersPrefix + 'Template', TemplateService);
		
	function TemplateService() {
		var self = this;
		var property = angular.easy.property; 
		property(self, 'title', '');
		property(self, 'breadCrumbs', []);
		property(self, 'styleSheets', []);
		property(self, 'scripts', []);
		property(self, 'menuVisible', true);
		property(self, 'menus', []);
		self.addMenu = addMenu;

		function addMenu(menuToAdd) {
			self.menus().push(menuToAdd);
		}
	}
})();	
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Title', TitleDirective);

	TitleDirective.$inject=['Template'];
	function TitleDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : TitleDirectiveLink
		};

		function TitleDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			var isElement = (originalElementClone.prop('tagName') === 'NG-EASY:TITLE');
			var titleElement = isElement ? angular.element(document.createElement('title')) : originalElementClone;

			scope.$watch(function(){ return Template.title();}, processElement);
			
			function processElement() {
				var titleValue = Template.title();
				if(titleValue !== '') {
					titleElement.text(titleValue);
					element.after(titleElement);
					return;
				}
				titleElement.remove();
				return;
			}
		}
	}
		
})();
(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Uncloak', UncloakDirective);

	function UncloakDirective() {
		return {
			restrict: 'A',
		    compile: UncloakCompile
		};

		function UncloakCompile(element, attrs) {
			element.remove();
		}
	}
})();
(function() {
    angular.module(angular.easy.$moduleName)
        .service(angular.easy.$providersPrefix + 'Urls', UrlsService);

    UrlsService.$inject = ['$location'];
    function UrlsService($location) {
        var self = this;
        var protocolUrl = '';
        var hostUrl = '';
        var portUrl = '';
        var pathUrl = '';
        var baseUrl = '';
        var implicitParameters;
        this.getBaseUrl = getBaseUrl;
        this.setBaseUrl = setBaseUrl;
        this.angularUrl = angularUrl;
        this.injectAngularUrls = injectAngularUrls;
        this.serviceUrl = serviceUrl;
        init();

        function init() {
            self.protocolUrl = $location.protocol();
            self.hostUrl = $location.host();
            self.portUrl = ':' + $location.port();
            self.pathUrl = '/api';
            self.baseUrl = self.protocolUrl + '://' + self.hostUrl + self.portUrl + self.pathUrl;
            self.implicitParameters = [{ "name": "media-type", "value": "application/json" }];
        }

        function getBaseUrl() {
            return self.baseUrl;
        }
        
        function setBaseUrl(newBaseUrl) {
        	self.baseUrl = newBaseUrl;
        }

        function addImplicitParameter(parameterName, parameterValue) {
            self.implicitParameters.push({ "name": parameterName, "value": parameterValue });
        }

        function angularUrl(url) {
            url = removeImplicitParameters(url);
            if (url.length === 0) {
                return "#" + $location.path();
            }

            if (url.startsWith("?")) {
                return "#" + $location.path() + url;
            }

            if (url.startsWith("/") && url.startsWith(self.pathUrl)) {
                return "#" + url.substring(self.pathUrl.length);
            }

            if (typeof self.baseUrl === 'undefined' || self.baseUrl.length === 0) {
                return "#" + aUrl;
            }

            if (url.startsWith(self.baseUrl)) {
                return "#" + url.substring(self.baseUrl.length);
            }

            return url;
        }

        function injectAngularUrls(data) {
            if (Array.isArray(data)) {
                var arrayLength = data.length;
                for (var i = 0; i < arrayLength; i++) {
                    injectAngularUrls(data[i]);
                }
                return;
            }
            for (var propertyName in data) {
                if (!data.hasOwnProperty(propertyName)) {
                    continue;
                }
                if (typeof data[propertyName] == "object") {
                    injectAngularUrls(data[propertyName]);
                    continue;
                }

                if (propertyName == 'url') {
                    data.angularUrl = angularUrl(data[propertyName]);
                    continue;
                }
                var indexOf = propertyName.indexOf("Url");
                if (indexOf == -1) {
                    continue;
                }
                var angularUrlPropertyName =
                    propertyName.substring(0, indexOf) +
                    "AngularUrl" +
                    propertyName.substring(indexOf + 3);
                data[angularUrlPropertyName] = angularUrl(data[propertyName]);
            }
        }

        function serviceUrl() {
            var url = self.baseUrl + $location.url();
            var parameters = $location.search();
            var firstParameter = (Object.keys(parameters).length === 0);
            var implicitParametersLength = self.implicitParameters.length;
            for (var implicitParameterIndex = 0; implicitParameterIndex < implicitParametersLength; implicitParameterIndex++) {
                var implicitParameter = self.implicitParameters[implicitParameterIndex];
                var implicitParameterName = implicitParameter.name;
                var implicitParameterValue = implicitParameter.value;
                if (parameters[implicitParameterName]) {
                    continue;
                }
                if (firstParameter) {
                    url += "?";
                    firstParameter = false;
                } else {
                    url += "&";
                }
                url += implicitParameterName + "=" + implicitParameterValue;
            }
            return url;
        }

        function removeImplicitParameters(url) {
            var implicitParametersLength = self.implicitParameters.length;
            for (var implicitParameterIndex = 0; implicitParameterIndex < implicitParametersLength; implicitParameterIndex++) {
                var implicitParameter = self.implicitParameters[implicitParameterIndex];
                url = removeParameter(url, implicitParameter.name, implicitParameter.value);
            }
            return url;
        }

        function removeParameter(url, parameterNameToRemove, parameterValueToRemove) {
            if (url.indexOf("?") == -1) {
                return url;
            }
            var splitedUrl = url.split("?");
            var requestUri = splitedUrl[0];
            var queryString = splitedUrl[1];
            var parameters = queryString.split("&");
            for (var i = parameters.length - 1; i >= 0; i -= 1) {
                var parameterNameAndValue = parameters[i].split("=");
                var parameterName = parameterNameAndValue[0];
                var parameterValue = parameterNameAndValue[1];
                if (
                    (parameterName == parameterNameToRemove) &&
                    (!(parameterValueToRemove) ||
                        (parameterValueToRemove == parameterValue)
                    )
                ) {
                    parameters.splice(i, 1);
                }
            }
            if (parameters.length === 0) {
                return requestUri;
            }

            return requestUri + "?" + parameters.join("&");
        }
    }

})();
(function() {
    angular.easy.property = property;
    angular.easy.$$filterElements = filterElements;

    function property(obj, propertyName, initialValue) {
        var privateAttr = '_' + propertyName;
        obj[privateAttr] = initialValue;

		obj[propertyName] = function(value) {
			if(typeof value === 'undefined') {
				return obj[privateAttr];
			}
			obj[privateAttr] = value;
		};
    }

    function filterElements(elements, expression, strExtractorFn) {
        if(!expression || expression == "*") {
            return elements;
        }
        
        var returnElements = [];
        var startWildcard = expression.startsWith("*");
        var endWildcard = expression.endsWith("*");
        for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
            var element = elements[elementIndex];
            var str;
            if(typeof strExtractorFn !== 'undefined') {
                str = strExtractorFn(element);
            } else {
                str = element;
            }

            if(typeof str !== 'string') {
                continue;
            }

            if(startWildcard && endWildcard) {
                var middleSubstring = expression.substring(1, expression.length - 1);
                if(str.indexOf(middleSubstring) !== -1) {
                    returnElements.push(element);
                }
                continue;
            }
            if(startWildcard) {
                var starterSubstring = expression.substring(1);
                if(str.endsWith(starterSubstring)) {
                    returnElements.push(element);
                }
                continue;
            }
            if(endWildcard) {
                var terminatorSubstring = expression.substring(0, expression.length - 1);
                if(str.startsWith(terminatorSubstring)) {
                    returnElements.push(element);
                }
                continue;
            }

            if(str == expression) {
                returnElements.push(element);
                continue;
            }
        }
        return returnElements;
    }
})();