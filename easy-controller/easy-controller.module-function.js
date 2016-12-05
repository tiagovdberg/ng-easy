(function() {
	const
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
				for (statusName in effectiveConfig.status) {
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
				
				for (statusName in effectiveConfig.status) {
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
					effectiveConfig.controller.prototype.getModel = getDataInjectionMethod;
				}

				if (typeof effectiveConfig.controller.prototype.getTemplateUrl === 'undefined') {
					effectiveConfig.controller.prototype.getTemplateUrl = angular.easy.bind(getTemplateUrlInjectionMethod, effectiveConfig);
				}
			}
			
			function injectInexistentStatusMethods() {
				for (statusName in effectiveConfig.status) {
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
				return self.model[self.status]
			}

			function getDataInjectionMethod() {
				var self = this;
				return self.data[self.status]
			}

			function getTemplateUrlInjectionMethod(effectiveConfig) {
				var self = this;
				return effectiveConfig.templateBaseUrl + effectiveConfig.status[self.status].templateUrl;
			}

			function statusInjectionMethod(effectiveConfig, newStatusName, form) {
				var self = this;

				$injector.get('Messages').clearMessages();
				
				if ((typeof form !== 'undefined') && Messages.formErrors(self.getTemplateUrl(), form)) {
					return;
				}

				var oldStatusName = self.status;
				self.model[newStatusName] = (typeof oldStatusName !== 'undefined') ? self.model[oldStatusName] : {};
				self.status = newStatusName;

				if(typeof effectiveConfig.status[newStatusName].serviceMethod === 'undefined') {
					return;
				}
				
				var serviceUrl = (typeof effectiveConfig.status[newStatusName].serviceUrl !== 'undefined') ? 
						$injector.get('Urls').getBaseUrl() + effectiveConfig.status[newStatusName].serviceUrl : 
						$injector.get('Urls').serviceUrl();
				var locationOnSuccess = evalFunctionOrValue(effectiveConfig.status[newStatusName].locationOnSuccess);
				var locationOnFail = evalFunctionOrValue(effectiveConfig.status[newStatusName].locationOnFail);
				var successFn = (typeof effectiveConfig.status[newStatusName].success !== 'undefined') ? effectiveConfig.status[newStatusName].success : ServiceSuccessPrototype;  
				var errorFn = (typeof effectiveConfig.status[newStatusName].error !== 'undefined') ? effectiveConfig.status[newStatusName].error : ServiceFailPrototype;
				var messageOnSuccess = evalFunctionOrValue(effectiveConfig.status[newStatusName].messageOnSuccess);
				var messageOnFail = evalFunctionOrValue(effectiveConfig.status[newStatusName].messageOnFail);
				
				$injector.get('Template').showLoading();
				$injector.get('$http')({
					method: effectiveConfig.status[newStatusName].serviceMethod,
					data: self.getModel(),
					url: serviceUrl
				}).then(
					successFn, 
					errorFn
				).finally($injector.get('Template').hideLoading);

				//TODO model and data must accept functions with response as argument.
				function ServiceSuccessPrototype(response) {
					self.data[statusOnSuccess] = response.data;
					if(statusOnSuccess != newStatusName) {
						self[statusOnSuccess]();
					}
					self.model[statusOnSuccess] = {};
					if(typeof locationOnSuccess !== 'undefined') {
						$injector.get('$location').url(locationOnSuccess);
					}
					if(messageOnSuccess) {
						if(typeof locationOnSuccess !== 'undefined') {
							messageOnSuccess.persistent = true;
						}
						$injector.get('Messages').addMessage(messageOnSuccess);
					}
				}
				
				function ServiceFailPrototype(response) {
					if(typeof statusOnFail !== 'undefined') {
						if((statusOnFail !== oldStatusName) && (statusOnFail !== newStatusName)) {
							self[statusOnFail]();
						} else {
							self.status = statusOnFail;
						}
					}
					var hasLocationOnFail = (typeof locationOnFail !== 'undefined');
					if(response.status != 401 && hasLocationOnFail) {
						$injector.get('$location').url(locationOnFail);
					}
					$injector.get('Messages').handleErrors(response, hasLocationOnFail);
					if(messageOnFail) {
						$injector.get('Messages').addMessage(messageOnFail);
					}
				}
			}
		}
	}

	function evalFunctionOrValue(functionOrValue) {
		if ((typeof functionOrValue === 'function')
				|| (functionOrValue instanceof Function)) {
			return functionOrValue();
		}
		return functionOrValue;
	}
	
	function validateModuleNameIsStringAndNotEmpty(moduleName) {
		var isString = (typeof moduleName === 'string') || (moduleName instanceof String);
		var isTrimmedString = isString && (moduleName.trim() === moduleName);
		var isEmpty = isString && moduleName.length == 0;
		if (!isString || !isTrimmedString || isEmpty) {
			throw '[moduleName] must be a string and must be not empty.';
		}
	}
	
	function getEffectiveConfig(moduleName, config) {
		var effectiveConfig = {}; //angular.copy(config);
		validateControllerNameEvaluationPossible(config)
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
				var controller = new Function(
					"var self = this; \n" + 
					"self.init(); \n"					
				);
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
				moduleName + '/' + transformControllerNameToHtmlName(effectiveConfig.controllerName);
		}
		
		//TODO Route user featurename without prefix. Default Status name with prefix
		function getEffectiveStatuses() {
			var effectiveStatuses = {};
			var statusesValue = evalFunctionOrValue(config.status);
			if (typeof statusesValue === 'undefined') {
				var statusName = transformControllerNameToFeatureName(effectiveConfig.controllerName);
				effectiveStatuses[statusName] = getEffectiveStatus(statusName, {});
				return effectiveStatuses;
			}
			for (statusName in statusesValue) {
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
				evalFunctionOrValue(status.templateUrl) :
				'/' + transformStatusNameToHtmlName(statusName) + '.html';
		}
		
		function getEffectiveStatusServiceMethod(statusName, status) {
			if(typeof status.serviceMethod !== 'undefined') {
				return evalFunctionOrValue(status.serviceMethod);
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
			return evalFunctionOrValue(status.serviceUrl);
		}
		
		function getEffectiveStatusStatusOnSuccess(statusName, status) {
			return evalFunctionOrValue(status.statusOnSuccess);
		}

		function getEffectiveStatusStatusOnFail(statusName, status) {
			return evalFunctionOrValue(status.statusOnFail);
		}

		function getEffectiveStatusLocationOnSuccess(statusName, status) {
			return evalFunctionOrValue(status.locationOnSuccess);
		}

		function getEffectiveStatusLocationOnFail(statusName, status) {
			return evalFunctionOrValue(status.locationOnFail);
		}

		function getEffectiveStatusMessageOnSuccess(statusName, status) {
			return evalFunctionOrValue(status.messageOnSuccess);
		}

		function getEffectiveStatusMessageOnFail(statusName, status) {
			return evalFunctionOrValue(status.messageOnFail);
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
		for (statusName in statusesValue) {
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
			var lowerCaseChar = char.toLowerCase()
			var isUpperCase = (char != lowerCaseChar);
			if (isUpperCase && htmlName != '') {
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
		var isEmpty = isString && statusName.length == 0;
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