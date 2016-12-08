(function() {
  angular.module('ngEasy', [ 'ngRoute' ]);
  angular.easy = {};
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

  function bind(originalFunction) {
    var bindArgs = Array.prototype.slice.call(arguments, 1);
    return function() {
      var callArgs = Array.prototype.slice.call(arguments);
      var args = Array.prototype.concat(bindArgs, callArgs);
      return originalFunction.apply(this, args);
    };
  }
})();

(function() {
	angular.module('ngEasy')
		.directive('ngEasyAlias', AliasDirective);

	function AliasDirective() {
		return {
			restrict : "EA",
			link : AliasDirectiveLink
		};

		function AliasDirectiveLink(scope, element, attrs) {
			var aliasAndExpressions = attrs.ngEasyAlias.split(';');
			aliasAndExpressions.forEach(function(aliasAndExpression) {
				var aliasAndExpressionArray = aliasAndExpression.split(' as ');
				if(aliasAndExpressionArray.length != 2) {
					throw "Alias and/or Expression not valid. Format: {alias} as {expression}";
				}
				var alias = aliasAndExpressionArray[0].trim();
				var expression = aliasAndExpressionArray[1].trim();
				scope.$watch(function(){ return scope.$eval(expression);}, function(newValue, oldValue) {scope[alias]=newValue;});
			});
		}
	}
})();
(function() {
	var //const
		CONTROLLERDEFAULTSUFFIXES = ['Controller', 'Ctrl', 'Ctl'],
		CONTROLLERSCOPEVARIABLENAMESUFFIX = 'Ctrl',
		METHODSPREFIX_DEFAULT_SERVICE_PUT = [ 'create', 'update', 'save', 'replace', 'put' ],
		METHODSPREFIX_DEFAULT_SERVICE_GET = [ 'retrieve', 'load', 'edit', 'get' ],
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

	angular.easy.easyController = easyController;
	angular.easy.registerFunction('easyController', easyController);
	
	function easyController(moduleName, config) {
		var moduleNameValue = evalFunctionOrValue(moduleName);
		angular.module(moduleNameValue).config(ConventionalControllerConfig);

		ConventionalControllerConfig.$inject = [ '$controllerProvider', '$routeProvider', 'MessagesProvider' ];
		function ConventionalControllerConfig($controllerProvider, $routeProvider, MessagesProvider) {
			validateModuleNameIsStringAndNotEmpty(moduleNameValue);

			var configValue = evalFunctionOrValue(config);
			validateConfigIsObjectAndMustBeNotEmpty(configValue);
			var effectiveConfig = getEffectiveConfig(moduleNameValue, configValue);

			// Register Controller
			if(typeof effectiveConfig.controller.$inject === 'undefined') {
				effectiveConfig.controller.$inject =[];
			}
			var injectorArgumentIndex = effectiveConfig.controller.$inject.length;
			effectiveConfig.controller.$inject.push('$injector');

			$controllerProvider.register(effectiveConfig.controllerName, effectiveConfig.controller);

			// Register Controller Routes
			var controllerRouteConfig = {
				controller : effectiveConfig.controllerName,
				controllerAs : effectiveConfig.controllerAs,
				template : '<ng:include src="' + effectiveConfig.controllerAs + '.getTemplateUrl()"></ng:include>'
			};

			var foundControllerRoute = false; 
			var foundStatusRoute = false; 
			
			
			if(typeof effectiveConfig.route !== 'undefined') {
				$routeProvider.when(effectiveConfig.route, controllerRouteConfig);
			} else {
				for (var statusName in effectiveConfig.status) {
					if (!effectiveConfig.status.hasOwnProperty(statusName)) {
						continue;
					}
					var status = effectiveConfig.status[statusName];
					if (typeof status.route === 'undefined') {
						continue;
					}
					var route = effectiveConfig.routeBase + status.route;
					$routeProvider.when(route, controllerRouteConfig);
				}
			}

			var $injector;
			
			injectInitMethod();
			injectAndInitializeStatusAndModelAndData();
			injectInexistentModelAndDataAndTemplateAcessors();
			injectInexistentStatusMethods(effectiveConfig);

			if(typeof effectiveConfig.messages !== 'undefined') {
				MessagesProvider.addMessagesMap(effectiveConfig.messages);
			}
			
			return;

			function injectInitMethod() {
				effectiveConfig.controller.prototype.init = initInjectionMethod;
			}
			
			function injectAndInitializeStatusAndModelAndData() {
				if (typeof effectiveConfig.controller.prototype.model === 'undefined') {
					effectiveConfig.controller.prototype.model = {};
				}

				if (typeof effectiveConfig.controller.prototype.data === 'undefined') {
					effectiveConfig.controller.prototype.data = {};
				}
				
				for (var statusName in effectiveConfig.status) {
					if (!effectiveConfig.status.hasOwnProperty(statusName)) {
						continue;
					}
					var status = effectiveConfig.status[statusName];
					if (typeof effectiveConfig.controller.prototype.model[statusName] === 'undefined') {
						effectiveConfig.controller.prototype.model[statusName] = {};
					}
					if (typeof effectiveConfig.controller.prototype.data[statusName] === 'undefined') {
						effectiveConfig.controller.prototype.data[statusName] = {};
					}
				}
			}

			function injectInexistentModelAndDataAndTemplateAcessors() {
				if (typeof effectiveConfig.controller.prototype.getModel === 'undefined') {
					effectiveConfig.controller.prototype.getModel = getModelInjectionMethod;
				}

				if (typeof effectiveConfig.controller.prototype.getData === 'undefined') {
					effectiveConfig.controller.prototype.getData = getDataInjectionMethod;
				}

				if (typeof effectiveConfig.controller.prototype.getTemplateUrl === 'undefined') {
					effectiveConfig.controller.prototype.getTemplateUrl = angular.easy.bind(getTemplateUrlInjectionMethod, effectiveConfig);
				}
			}
			
			function injectInexistentStatusMethods() {
				for (var statusName in effectiveConfig.status) {
					if (!effectiveConfig.status.hasOwnProperty(statusName)) {
						continue;
					}
					if(typeof effectiveConfig.controller.prototype[statusName] !== 'undefined') {
						continue;
					}

					effectiveConfig.controller.prototype[statusName] = angular.easy.bind(statusInjectionMethod, effectiveConfig, statusName);
				}
			}

			function initInjectionMethod() {
				var self = this;
				$injector = initInjectionMethod.caller.arguments[injectorArgumentIndex];

				if (typeof self.status === 'undefined') {
					self[effectiveConfig.initialStatus]();
				}
				return;
			}
			
			function getModelInjectionMethod() {
				var self = this;
				return self.model[self.status];
			}

			function getDataInjectionMethod() {
				var self = this;
				return self.data[self.status];
			}

			function getTemplateUrlInjectionMethod(effectiveConfig) {
				var self = this;
				return effectiveConfig.templateBaseUrl + evalFunctionOrValue(effectiveConfig.status[self.status].templateUrl);
			}

			function statusInjectionMethod(effectiveConfig, newStatusName, form) {
				var self = this;

				$injector.get('Messages').clearMessages();
				
				if ((typeof form !== 'undefined') && $injector.get('Messages').formErrors(self.getTemplateUrl(), form)) {
					return;
				}

				var oldStatusName = self.status;
				self.status = newStatusName;

				var serviceMethod = evalFunctionOrValue(effectiveConfig.status[newStatusName].serviceMethod);
				if(typeof serviceMethod === 'undefined') {
					return;
				}

//				//FIXME ????
//				self.model[newStatusName] = (typeof oldStatusName !== 'undefined') ? self.model[oldStatusName] : {};
				
				var serviceUrl = (typeof effectiveConfig.status[newStatusName].serviceUrl !== 'undefined') ? 
						$injector.get('Urls').getBaseUrl() + evalFunctionOrValue(effectiveConfig.status[newStatusName].serviceUrl) : 
						$injector.get('Urls').serviceUrl();
				//FIXME Move to getEffectiveStatusSuccessFn and getEffectiveStatusFailFn 
				var successFn = (typeof effectiveConfig.status[newStatusName].success !== 'undefined') ? effectiveConfig.status[newStatusName].success : ServiceSuccessPrototype;  
				var failFn = (typeof effectiveConfig.status[newStatusName].fail !== 'undefined') ? effectiveConfig.status[newStatusName].fail : ServiceFailPrototype;
				
				$injector.get('Template').showLoading();
				$injector.get('$http')({
					method: serviceMethod,
					data: self.model[oldStatusName],
					url: serviceUrl
				}).then(
					successFn, 
					failFn
				).finally($injector.get('Template').hideLoading);

				//TODO model and data must accept functions with response as argument.
				function ServiceSuccessPrototype(response) {
					var statusOnSuccess = evalFunctionOrValue(effectiveConfig.status[newStatusName].statusOnSuccess);
					self.data[statusOnSuccess] = response.data;

					
					var modelOnSuccess = evalFunctionOrValue(effectiveConfig.status[newStatusName].modelOnSuccess);
					if(typeof modelOnSuccess !== 'undefined') {
						self.model[statusOnSuccess] = modelOnSuccess;
					}

					var statusChanged = (statusOnSuccess !== newStatusName);
					if(statusChanged) {
						self[statusOnSuccess]();
					}
					var locationOnSuccess = evalFunctionOrValue(effectiveConfig.status[newStatusName].locationOnSuccess);
					if(typeof locationOnSuccess !== 'undefined') {
						$injector.get('$location').url(locationOnSuccess);
					}
					var messageOnSuccess = evalFunctionOrValue(effectiveConfig.status[newStatusName].messageOnSuccess);
					if(messageOnSuccess) {
						if(typeof locationOnSuccess !== 'undefined') {
							messageOnSuccess.persistent = true;
						}
						$injector.get('Messages').addMessage(messageOnSuccess);
					}
				}
				
				function ServiceFailPrototype(response) {
					var statusOnFail = evalFunctionOrValue(effectiveConfig.status[newStatusName].statusOnFail);

					var modelOnFail = evalFunctionOrValue(effectiveConfig.status[newStatusName].modelOnFail);
					if(typeof modelOnFail !== 'undefined') {
						self.model[statusOnFail] = modelOnFail;
					}

					if((statusOnFail !== oldStatusName) && (statusOnFail !== newStatusName)) {
						self[statusOnFail]();
					} else {
						self.status = statusOnFail;
					}
					var locationOnFail = evalFunctionOrValue(effectiveConfig.status[newStatusName].locationOnFail);
					var hasLocationOnFail = (typeof locationOnFail !== 'undefined');
					if(response.status != 401 && hasLocationOnFail) {
						$injector.get('$location').url(locationOnFail);
					}
					$injector.get('Messages').handleErrors(response);
					var messageOnFail = evalFunctionOrValue(effectiveConfig.status[newStatusName].messageOnFail);
					if(messageOnFail) {
						$injector.get('Messages').addMessage(messageOnFail);
					}
				}
			}
		}
	}

	function evalFunctionOrValue(functionOrValue) {
		if ((typeof functionOrValue === 'function') || (functionOrValue instanceof Function)) {
			return functionOrValue();
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
		var effectiveConfig = {};
		validateControllerNameEvaluationPossible(config);
		effectiveConfig.controller = getEffectiveController(); 
		effectiveConfig.controllerName = getEffectiveControllerName();
		effectiveConfig.controllerAs = getEffectiveControllerScopeVariableName();
		validateRouteConfig(config);
		effectiveConfig.route = getEffectiveRoute();
		effectiveConfig.routeBase = getEffectiveRouteBase();
		effectiveConfig.templateBaseUrl = getEffectiveTemplateBaseUrl();
		effectiveConfig.status = getEffectiveStatuses();
		effectiveConfig.initialStatus = getEffectiveInitialStatus();
		effectiveConfig.messages = getEffectiveMessages();
		return effectiveConfig;
	
		function getEffectiveController() {
			if (typeof config.controller === 'undefined') {
				var controller = function() {
					var self = this; 
					self.init();					
				};
				return controller;
			}
			return config.controller;
		}
		
		function getEffectiveControllerName() {
			return (typeof config.controllerName !== 'undefined') ? 
				evalFunctionOrValue(config.controllerName) : 
				config.controller.name;
		}

		function getEffectiveControllerScopeVariableName() {
			return (typeof config.controllerAs !== 'undefined') ? 
				evalFunctionOrValue(config.controllerAs) : 
				transformControllerNameToControllerScopeVariableName(effectiveConfig.controllerName);
		}

		function getEffectiveRoute() {
			if (typeof config.route !== 'undefined') {
				return evalFunctionOrValue(config.route);
			}
			if (typeof config.routeBase !== 'undefined') {
				return; //undefined
			}
			return '/' + transformControllerNameToHtmlName(effectiveConfig.controllerName);
		}
		
		function getEffectiveRouteBase() {
			if (typeof config.routeBase !== 'undefined') {
				return evalFunctionOrValue(config.routeBase);
			}
			return; //undefined
		}
		
		function getEffectiveTemplateBaseUrl() {
			return (typeof config.templateBaseUrl !== 'undefined') ? 
				evalFunctionOrValue(config.templateBaseUrl) : 
				transformFeatureNameToHtmlName(moduleName) + '/' + transformControllerNameToHtmlName(effectiveConfig.controllerName);
		}
		
		//TODO Route user featurename without prefix. Default Status name with prefix
		function getEffectiveStatuses() {
			var effectiveStatuses = {};
			var statusesValue = evalFunctionOrValue(config.status);
			if (typeof statusesValue === 'undefined') {
				var singleStatusName = transformControllerNameToFeatureName(effectiveConfig.controllerName);
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
			if(typeof config.initialStatus !== 'undefined') {
				return evalFunctionOrValue(config.initialStatus);
			}
			if (typeof config.status === 'undefined') {
				return transformControllerNameToFeatureName(effectiveConfig.controllerName);
			}
			return;
		}
		
		function getEffectiveMessages() {
			return evalFunctionOrValue(config.messages);
		}
		
		function getEffectiveStatus(statusName, status) {
			var effectiveStatus = {};
			effectiveStatus.route = getEffectiveStatusRoute(statusName, status);
			effectiveStatus.templateUrl = getEffectiveStatusTemplateUrl(statusName, status);
			effectiveStatus.serviceMethod = getEffectiveStatusServiceMethod(statusName, status);
			effectiveStatus.serviceUrl = getEffectiveStatusServiceUrl(statusName, status); 
			effectiveStatus.statusOnSuccess = getEffectiveStatusStatusOnSuccess(statusName, status);
			effectiveStatus.statusOnFail = getEffectiveStatusStatusOnFail(statusName, status);
			effectiveStatus.modelOnSuccess = getEffectiveStatusModelOnSuccess(statusName, status);
			effectiveStatus.modelOnFail = getEffectiveStatusModelOnFail(statusName, status);
			effectiveStatus.locationOnSuccess = getEffectiveStatusLocationOnSuccess(statusName, status);
			effectiveStatus.locationOnFail = getEffectiveStatusLocationOnFail(statusName, status);
			effectiveStatus.messageOnSuccess = getEffectiveStatusMessageOnSuccess(statusName, status);
			effectiveStatus.messageOnFail = getEffectiveStatusMessageOnFail(statusName, status);
			return effectiveStatus;
		}		
		
		function getEffectiveStatusRoute(statusName, status) {
			if(typeof status.route !== 'undefined') {
				return evalFunctionOrValue(status.route);
			}
			if(typeof effectiveConfig.route != 'undefined') {
				return;
			}
			return '/' + transformStatusNameToHtmlName(statusName);
		}

		function getEffectiveStatusTemplateUrl(statusName, status) {
			return (typeof status.templateUrl !== 'undefined')  ?
				status.templateUrl : 
				'/' + transformStatusNameToHtmlName(statusName) + '.html';
		}
		
		function getEffectiveStatusServiceMethod(statusName, status) {
			if(typeof status.serviceMethod !== 'undefined') {
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
			
			return 'GET';
		}
		
		function getEffectiveStatusServiceUrl(statusName, status) {
			return status.serviceUrl;
		}
		
		function getEffectiveStatusStatusOnSuccess(statusName, status) {
			return (typeof status.statusOnSuccess !== 'undefined') ?
				status.statusOnSuccess :
				statusName;
		}

		function getEffectiveStatusStatusOnFail(statusName, status) {
			return (typeof status.statusOnFail !== 'undefined') ?
				status.statusOnFail :
				statusName;
		}

		function getEffectiveStatusModelOnSuccess(statusName, status) {
			return status.modelOnSuccess;
		}

		function getEffectiveStatusModelOnFail(statusName, status) {
			return status.modelOnFail;
		}

		function getEffectiveStatusLocationOnSuccess(statusName, status) {
			return status.locationOnSuccess;
		}

		function getEffectiveStatusLocationOnFail(statusName, status) {
			return status.locationOnFail;
		}

		function getEffectiveStatusMessageOnSuccess(statusName, status) {
			return status.messageOnSuccess;
		}

		function getEffectiveStatusMessageOnFail(statusName, status) {
			return status.messageOnFail;
		}
	}

	function validateConfigIsObjectAndMustBeNotEmpty(config) {
		var isObject = (typeof config === 'object')	|| (config instanceof Object);
		if (!isObject) {
			throw '[config] must be a object and must be not empty.';
		}
	}

	function validateControllerNameEvaluationPossible(config) {
		var undefinedControllerName = (typeof config.controllerName === 'undefined');
		var undefinedControllerFunction = (typeof config.controller === 'undefined');
		var undefinedControllerFunctionName = undefinedControllerFunction || (typeof config.controller.name === 'undefined');
		if (undefinedControllerName && undefinedControllerFunctionName) {
			throw 'Controller name evaluation not possible. Use [controllerName] or a name [controller]';
		}
	}
	
	function validateRouteConfig(config) {
		if(typeof config.route === 'undefined') {
			return;
		}
		if(typeof config.routeBase !== 'undefined') {
			throw '[config.route] and [config.routeBase] are mutually exclusive.';
		}
		var statusesValue = evalFunctionOrValue(config.status);
		if (typeof statusesValue === 'undefined') {
			return;
		}
		for (var statusName in statusesValue) {
			if (!statusesValue.hasOwnProperty(statusName)) {
				continue;
			}
			if(typeof statusesValue[statusName].route !== 'undefined') {
				throw '[config.route] and [config.status[\'' + statusName + '\'].route] are mutually exclusive.';
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
		varName = (typeof statusName === 'undefined') ? 'statusName' : varName;
		var isString = (typeof statusName === 'string')	|| (statusName instanceof String);
		var isTrimmedString = isString && (statusName.trim() === statusName);
		var isEmpty = isString && (statusName.length === 0);
		if (!isString || !isTrimmedString || isEmpty) {
			throw '[' + varName + '] must be a trimmed string and must be not empty.';
		}
		
		if((typeof config.status !== 'undefined') && (typeof config.status[statusName] === 'undefined')) {
			throw '[' + varName + '] = \"' + status + '\" must exists in [config.status]';
		}
	}

	function transformStatusNameToHtmlName(statusName) {
		var featureName = transformStatusNameToFeatureName(statusName);
		return transformFeatureNameToHtmlName(featureName);
	}

	function transformStatusNameToFeatureName(statusName) {
		var name = removeKnowPrefixes(statusName, KNOWNMETHODSPREFIXES);
		return name.substring(0,1).toLowerCase() + name.substring(1);
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
	angular.module('ngEasy')
		.directive('ngEasyHasMessages', HasMessagesDirective);

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
				hasMessagesExpressions.forEach(function(showMessageExpression) {
					var messages = Messages.getMessages(showMessageExpression);
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
	angular.module('ngEasy')
		.directive('ngEasyHighlight', HighlightDirective);

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
				var priority = Infinity;
				highlightExpressions.forEach(function(highlightExpression) {
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
					element.addClass(elementClass);
				}
			}
		}
	}
		
})();
(function() {
	angular.module('ngEasy')
		.directive('ngEasyMessages', MessagesDirective);

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
				showMessageExpressions.forEach(function(showMessageExpression) {
					var messages = Messages.getMessages(showMessageExpression);
					messages.forEach(function(message) {
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
	angular.module('ngEasy').provider('Messages', MessagesProvider);

	function MessagesProvider() {
		var self = this;
		self.messagesMap = {};
		self.$get = MessagesFactory; 
		self.addMessagesMap = addMessagesMap;

		MessagesFactory.$inject= ['$rootScope'];
		function MessagesFactory($rootScope) {
			return new Messages($rootScope, self.messagesMap);
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
	
	function Messages($rootScope, messagesMap) {
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
		self.setMessages = setMessages;
		self.addMessage = addMessage;
		self.clearMessages = clearMessages;
		self.handleErrors = handleErrors;
		self.formErrors = formErrors;
		
		init();
		
		function init() {
			self.messagesMap = messagesMap;
			self.messages = [];
			self.changeCount = 0;
//			$rootScope.$on('$routeChangeStart', function(next, current) {expiryMessages();});
		}

		function getChangeCount() {
			return self.changeCount;
		}

		function getMessages(expression) {
			if(!expression || expression == "*") {
				return self.messages;
			}
			
			return angular.easy.$$filterElements(self.messages, expression, function(message) { return message.id; });
		}

		function setMessages(newMessages) {
			self.messages = newMessages;
			self.changeCount++;
		}

		function addMessage(newMessage) {
			if((typeof newMessage.id === 'undefined') || (typeof self.messagesMap[newMessage.id] === 'undefined')) {
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
			
			if(typeof response.data.text !== 'undefined') {
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
							if((typeof field.$name !== 'undefined') && field.$name !== "") {
								continue;
							}
							hasError = true;
							var qualifiedGenericError = templateUrl + "." + form.$name + ".$error." + errorTypeName;
							addMessage({"id": qualifiedGenericError ,"text": qualifiedGenericError, "type": "error"});
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
					var noParametersQualifiedError = qualifiedError.replace(/\{.*?=.*?\}/, '{}');
					if(typeof self.messagesMap[noParametersQualifiedError] === 'undefined') {
						addMessage({"id": qualifiedError ,"text": qualifiedError, "type": "error"});
						continue;
					}
					
					var rawMessage = self.messagesMap[noParametersQualifiedError];
					if(qualifiedError === noParametersQualifiedError) {
						addMessage({"id": qualifiedError ,"text": rawMessage, "type": "error"});
						continue;
					}
					var changedMessage = rawMessage;
					var regEx = /\{(.*?)=(.*?)\}/g;
					var regexResult;
					while ((regexResult = regEx.exec(qualifiedError)) !== null) {
						var paramName = regexResult[1];
						var paramValue = regexResult[2];
						changedMessage = changedMessage.replace("\{" + paramName + "\}", paramValue);
					}
					addMessage({"id": qualifiedError ,"text": changedMessage, "type": "error"});
				}
			}
			return hasError;
		}
	}
})();	
(function() {
	angular.module('ngEasy')
		.directive('ngEasyBreadCrumbs', BreadCrumbsDirective);

	BreadCrumbsDirective.$inject = ['Template']; 
	function BreadCrumbsDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : BreadCrumbsDirectiveLink
		};

		function BreadCrumbsDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.isMenuVisible();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var breadCrumbs = Template.getBreadCrumbs();
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
	angular.module('ngEasy')
		.directive('ngEasyHasMenu', HasMenuDirective);

	HasMenuDirective.$inject=['Template'];
	function HasMenuDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : HasMenuDirectiveLink
		};

		function HasMenuDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			scope.$watch(function(){ return Template.isMenuVisible();}, processElement);
			
			function processElement() {
				if(Template.isMenuVisible()) {
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
	angular.module('ngEasy')
		.directive('ngEasyMenus', MenusDirective);

	MenusDirective.$inject = ['Template']; 
	function MenuDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : MenusDirectiveLink
		};

		function MenusDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.isMenuVisible();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var menus = Template.getMenus();
				menus.forEach(function(menu) {
					var originalElementClone = transclude(function(clone, transcludeScope) {transcludeScope.menu = menu;});
					dynamicalyAddedElements.push(originalElementClone);
					element.after(originalElementClone);
				});
			}
		}
	}
		
})();
(function() {
	angular.module('ngEasy')
		.controller('TemplateController', TemplateController);

	TemplateController.$inject = [ 'Template', '$location', '$route' ];
	function TemplateController(Template, $location, $route) {
		var self = this;
		self.getTitle = getTitle;
		self.getBreadCrumbs = getBreadCrumbs;
		self.getStyleSheets = getStyleSheets;
		self.getScripts = getScripts;
		self.isMenuVisible = isMenuVisible;
		self.getMenus = getMenus;
		self.clickMenu = clickMenu;
		self.isLoading = isLoading;

		function getTitle() {
			return Template.getTitle();
		}

		function getBreadCrumbs() {
			return Template.getBreadCrumbs();
		}

		function getStyleSheets() {
			return Template.getStyleSheets();
		}

		function getScripts() {
			return Template.getScripts();
		}

		function isMenuVisible(aMenu) {
			return Template.isMenuVisible(aMenu);
		}

		function getMenus() {
			return Template.getMenus();
		}
		
		function clickMenu(locationPath) {
			$location.url(locationPath);
			$route.reload();
		}
		
		function isLoading() {
			return Template.isLoading();
		}
	}
})();
(function() {	
	angular.module('ngEasy')
	  .directive('ngEasyTemplate', TemplateDirective);

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
				loading : '='
			},
			link : TemplateDirectiveLink
		};
		
		function TemplateDirectiveLink(scope, element, attrs) {
			if(scope.loading) {
				Template.showLoading();
				return;
			}

			Template.setTitle(scope.title || '');
			Template.setBreadCrumbs(scope.breadCrumbs || []);
			Template.setStyleSheets(scope.styleSheets || []);
			Template.setScripts(scope.scripts || []);
			Template.setMenuVisible((typeof scope.menuVisible !== 'undefined') ? scope.menuVisible : true);
			Template.hideLoading();	
		}
	}
})();	
(function() {	
	angular.module('ngEasy')
	  .service('Template', TemplateService);
		
	function TemplateService() {
		var self = this;
		self.getTitle = getTitle;
		self.setTitle = setTitle;
		self.getBreadCrumbs = getBreadCrumbs;
		self.setBreadCrumbs = setBreadCrumbs;
		self.getStyleSheets = getStyleSheets;
		self.setStyleSheets = setStyleSheets;
		self.getScripts = getScripts;
		self.setScripts = setScripts;
		self.isMenuVisible = isMenuVisible;
		self.setMenuVisible = setMenuVisible;
		self.getMenus = getMenus;
		self.addMenu = addMenu;
		self.isLoading = isLoading;
		self.showLoading = showLoading;
		self.hideLoading = hideLoading;
		init();
		
		function init() {
			self.title = '';
			self.breadCrumbs = [];
			self.styleSheets = [];
			self.scripts = [];
			self.menuVisible=true;
			self.menus = [];
			self.loading = false;
		}

		function getTitle() {
			return self.title;
		}

		function setTitle(newTitle) {
			self.title = newTitle;
		}

		function getBreadCrumbs() {
			return self.breadCrumbs;
		}

		function setBreadCrumbs(newBreadCrumbs) {
			self.breadCrumbs = newBreadCrumbs;
		}
		
		function getStyleSheets() {
			return self.styleSheets;
		}

		function setStyleSheets(newStyleSheets) {
			self.styleSheets = newStyleSheets;
		}

		function getScripts() {
			return self.scripts;
		}

		function setScripts(newScripts) {
			self.scripts = newScripts;
		}
		
		function isMenuVisible(aMenu) {
			return self.menuVisible;
		}

		function setMenuVisible(newMenuVisible) {
			self.menuVisible = newMenuVisible;
		}
		
		function getMenus() {
			return self.menus;
		}

		function addMenu(menuToAdd) {
			self.menus.push(menuToAdd);
		}

		function isLoading() {
			return self.loading;
		}

		function showLoading() {
			self.loading = true;
		}

		function hideLoading() {
			self.loading = false;
		}
	}
})();	
(function() {
	angular.module('ngEasy')
		.directive('ngEasyUncloak', UncloakDirective);

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
    angular.module('ngEasy')
        .service('Urls', UrlsService);

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
    angular.easy.$$filterElements = filterElements;

    function filterElements(elements, expression, strExtractorFn) {
        if(!expression || expression == "*") {
            return elements;
        }
        
        var returnElements = [];
        var startWildcard = expression.startsWith("*");
        var endWildcard = expression.endsWith("*");
        for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
            var element = elements[elementIndex];
            var str = strExtractorFn(element);
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