//TODO Documentation JSDoc
//TODO Automaticaly start on specific state based on Status route.
//TODO InitialStatus has a default if there is only one state.

(function() {
	var //const
		UNDEFINED = 'undefined',
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

	var angularEasy = angular.easy;

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
			injectInitMethod();
			injectAndInitializeStatusAndModelAndData();
			injectInexistentModelAndDataAndTemplateAcessors();
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
				effectiveConfigControllerPrototype.init = initInjectionMethod;
			}
			
			function injectAndInitializeStatusAndModelAndData() {
				if (typeof effectiveConfigControllerPrototype.model === UNDEFINED) {
					effectiveConfigControllerPrototype.model = {};
				}

				if (typeof effectiveConfigControllerPrototype.data === UNDEFINED) {
					effectiveConfigControllerPrototype.data = {};
				}
				
				for (var statusName in effectiveConfigStatus) {
					if (!effectiveConfigStatus.hasOwnProperty(statusName)) {
						continue;
					}
					var status = effectiveConfigStatus[statusName];
					if (typeof effectiveConfigControllerPrototype.model[statusName] === UNDEFINED) {
						effectiveConfigControllerPrototype.model[statusName] = {};
					}
					if (typeof effectiveConfigControllerPrototype.data[statusName] === UNDEFINED) {
						effectiveConfigControllerPrototype.data[statusName] = {};
					}
				}
			}

			function injectInexistentModelAndDataAndTemplateAcessors() {
				if (typeof effectiveConfigControllerPrototype.getModel === UNDEFINED) {
					effectiveConfigControllerPrototype.getModel = getModelInjectionMethod;
				}

				if (typeof effectiveConfigControllerPrototype.getData === UNDEFINED) {
					effectiveConfigControllerPrototype.getData = getDataInjectionMethod;
				}

				if (typeof effectiveConfigControllerPrototype.getTemplateUrl === UNDEFINED) {
					effectiveConfigControllerPrototype.getTemplateUrl = angularEasy.bind(getTemplateUrlInjectionMethod, effectiveConfig);
				}
			}
			
			function injectInexistentStatusMethods() {
				for (var statusName in effectiveConfigStatus) {
					if (!effectiveConfigStatus.hasOwnProperty(statusName)) {
						continue;
					}
					if(typeof effectiveConfigControllerPrototype[statusName] !== UNDEFINED) {
						continue;
					}

					effectiveConfigControllerPrototype[statusName] = angularEasy.bind(statusInjectionMethod, effectiveConfig, statusName);
				}
			}

			function initInjectionMethod() {
				var self = this;
				self['$$' + angularEasy.$moduleName] = {};
				self['$$' + angularEasy.$moduleName].config = configValue;
				self['$$' + angularEasy.$moduleName].effectiveConfig = effectiveConfig;
				$injector = initInjectionMethod.caller.arguments[injectorArgumentIndex];

				if (typeof self.status === UNDEFINED) {
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
				return effectiveConfig.templateBaseUrl + evalFunctionOrValue(effectiveConfigStatus[self.status].templateUrl);
			}

			function statusInjectionMethod(effectiveConfig, newStatusName, form) {
				var self = this;

				$injector.get('Messages').clearMessages();
				
				if ((typeof form !== UNDEFINED) && $injector.get('Messages').formErrors(self.getTemplateUrl(), form)) {
					return;
				}

				var oldStatusName = self.status;
				self.status = newStatusName;

				var serviceMethod = evalFunctionOrValue(effectiveConfigStatus[newStatusName].serviceMethod);
				if(typeof serviceMethod === UNDEFINED) {
					return;
				}
				
				var serviceUrl = (typeof effectiveConfigStatus[newStatusName].serviceUrl !== UNDEFINED) ? 
						$injector.get('Urls').getBaseUrl() + evalFunctionOrValue(effectiveConfigStatus[newStatusName].serviceUrl) : 
						$injector.get('Urls').serviceUrl();
				//FIXME Move to getEffectiveStatusSuccessFn and getEffectiveStatusFailFn 
				var successFn = (typeof effectiveConfigStatus[newStatusName].success !== UNDEFINED) ? effectiveConfigStatus[newStatusName].success : ServiceSuccessPrototype;  
				var failFn = (typeof effectiveConfigStatus[newStatusName].fail !== UNDEFINED) ? effectiveConfigStatus[newStatusName].fail : ServiceFailPrototype;
				
				var loading = evalFunctionOrValue(effectiveConfigStatus[newStatusName].loading);
				$injector.get('Loading').startLoading(loading);
				$injector.get('$http')({
					method: serviceMethod,
					data: self.model[oldStatusName],
					url: serviceUrl
				}).then(
					successFn, 
					failFn
				).finally(function() { $injector.get('Loading').stopLoading(loading) ; });

				//TODO model and data must accept functions with response as argument.
				function ServiceSuccessPrototype(response) {
					var statusOnSuccess = evalFunctionOrValue(effectiveConfigStatus[newStatusName].statusOnSuccess);
					self.data[statusOnSuccess] = response.data;

					
					var modelOnSuccess = evalFunctionOrValue(effectiveConfigStatus[newStatusName].modelOnSuccess);
					if(typeof modelOnSuccess !== UNDEFINED) {
						self.model[statusOnSuccess] = modelOnSuccess;
					}

					var statusChanged = (statusOnSuccess !== newStatusName);
					if(statusChanged) {
						self[statusOnSuccess]();
					}

					var locationOnSuccess = evalFunctionOrValue(effectiveConfigStatus[newStatusName].locationOnSuccess);
					if(typeof locationOnSuccess !== UNDEFINED) {
						$injector.get('$location').url(locationOnSuccess);
					}
					
					var messageOnSuccess = evalFunctionOrValue(effectiveConfigStatus[newStatusName].messageOnSuccess);
					if(messageOnSuccess) {
						if(typeof locationOnSuccess !== UNDEFINED) {
							messageOnSuccess.persistent = true;
						}
						$injector.get('Messages').addMessage(messageOnSuccess);
					}
				}
				
				function ServiceFailPrototype(response) {
					var statusOnFail = evalFunctionOrValue(effectiveConfigStatus[newStatusName].statusOnFail);

					var modelOnFail = evalFunctionOrValue(effectiveConfigStatus[newStatusName].modelOnFail);
					if(typeof modelOnFail !== UNDEFINED) {
						self.model[statusOnFail] = modelOnFail;
					}

					if((statusOnFail !== oldStatusName) && (statusOnFail !== newStatusName)) {
						self[statusOnFail]();
					} else {
						self.status = statusOnFail;
					}
					var locationOnFail = evalFunctionOrValue(effectiveConfigStatus[newStatusName].locationOnFail);
					var hasLocationOnFail = (typeof locationOnFail !== UNDEFINED);
					if(response.status != 401 && hasLocationOnFail) {
						$injector.get('$location').url(locationOnFail);
					}
					$injector.get('Messages').handleErrors(response);
					var messageOnFail = evalFunctionOrValue(effectiveConfigStatus[newStatusName].messageOnFail);
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
			if (typeof config.status === UNDEFINED) {
				return transformControllerNameToFeatureName(localEffectiveConfig.controllerName);
			}
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
			
			return 'GET';
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
		 return transformToCamelCase;
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
		return transformToCamelCase;
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