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
			injectAndInitializeStatusAndModelAndDataAndVarsAndParams();
			injectInexistentModelAndDataAndVarsAndParamsAndTemplateAcessors();
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
					//reloadOnSearch : false,
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
			
			function injectAndInitializeStatusAndModelAndDataAndVarsAndParams() {
				if (typeof effectiveConfigControllerPrototype.model === UNDEFINED) {
					effectiveConfigControllerPrototype.model = {};
				}

				if (typeof effectiveConfigControllerPrototype.data === UNDEFINED) {
					effectiveConfigControllerPrototype.data = {};
				}

				if (typeof effectiveConfigControllerPrototype.vars === UNDEFINED) {
					effectiveConfigControllerPrototype.vars = {};
				}

				if (typeof effectiveConfigControllerPrototype.params === UNDEFINED) {
					effectiveConfigControllerPrototype.params = {};
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
					if (typeof effectiveConfigControllerPrototype.params[statusName] === UNDEFINED) {
						effectiveConfigControllerPrototype.params[statusName] = {};
					}
				}
			}

			function injectInexistentModelAndDataAndVarsAndParamsAndTemplateAcessors() {
				if (typeof effectiveConfigControllerPrototype.getModel === UNDEFINED) {
					effectiveConfigControllerPrototype.getModel = getModelInjectionMethod;
				}

				if (typeof effectiveConfigControllerPrototype.getData === UNDEFINED) {
					effectiveConfigControllerPrototype.getData = getDataInjectionMethod;
				}

				if (typeof effectiveConfigControllerPrototype.getVars === UNDEFINED) {
					effectiveConfigControllerPrototype.getVars = getVarsInjectionMethod;
				}

				if (typeof effectiveConfigControllerPrototype.getParams === UNDEFINED) {
					effectiveConfigControllerPrototype.getParams = getParamsInjectionMethod;
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
					
					if(typeof effectiveConfigStatus[statusName] === FUNCTION || effectiveConfigStatus[statusName] instanceof Function) {
						effectiveConfigControllerPrototype[statusName] = effectiveConfigStatus[statusName];
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

				var $routeParams = $injector.get('$routeParams');

				if (typeof self.status !== UNDEFINED) {
					self.params[self.status] = $routeParams;
					return;
				}

				if(typeof effectiveConfig.initialStatus !== UNDEFINED) {
					self.params[effectiveConfig.initialStatus] = $routeParams;
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
							self.params[statusName] = $routeParams;
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

			function getParamsInjectionMethod() {
				var self = this;
				return self.params[self.status];
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

				if(typeof self.status === UNDEFINED) {
					self.status = newStatusName;
				} else if(typeof effectiveConfigStatus[self.status].onBeforeExit === FUNCTION) {
					effectiveConfigStatus[self.status].onBeforeExit(self);
				}
				
				if(typeof effectiveConfigStatus[newStatusName].onBeforeEnter === FUNCTION) {
					effectiveConfigStatus[newStatusName].onBeforeEnter(self);
				}

				//self.status = newStatusName;

				var serviceMethod = evalFunctionOrValue(effectiveConfigStatus[newStatusName].serviceMethod);
				
				var successFn = (typeof effectiveConfigStatus[newStatusName].success !== UNDEFINED) ? effectiveConfigStatus[newStatusName].success : ServiceSuccessPrototype;  
				var failFn = (typeof effectiveConfigStatus[newStatusName].fail !== UNDEFINED) ? effectiveConfigStatus[newStatusName].fail : ServiceFailPrototype;

				if(typeof serviceMethod === UNDEFINED) {
					successFn({data : {}});
					
					var df2 = $q.defer();
					df2.resolve();
					return df2.promise;
				}
				
				var serviceUrl = (typeof effectiveConfigStatus[newStatusName].serviceUrl !== UNDEFINED) ? 
						$injector.get('Urls').getBaseUrl() + evalFunctionOrValue(effectiveConfigStatus[newStatusName].serviceUrl, self) : 
						$injector.get('Urls').serviceUrl();
				
				var loading = evalFunctionOrValue(effectiveConfigStatus[newStatusName].loading, self);
				$injector.get('Loading').startLoading(loading);
				return $injector.get('$http')({
					method: serviceMethod,
					data: self.model[self.status],
					url: serviceUrl,
					//transformResponse: undefined
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

					self.status = newStatusName;

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

					self.status = statusOnFail;
					
					if((statusOnFail !== self.status) && (statusOnFail !== newStatusName)) {
						self[statusOnFail]();
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
				
				
				if (typeof statusesValue[statusName] === FUNCTION || statusesValue[statusName] instanceof Function) {
					effectiveStatuses[statusName] = statusesValue[statusName];
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
			effectiveStatus.modelOnSuccess = getEffectiveStatusModelOnSuccess(statusName, status);
			effectiveStatus.modelOnFail = getEffectiveStatusModelOnFail(statusName, status);
			effectiveStatus.varsOnSuccess = getEffectiveStatusVarsOnSuccess(statusName, status);
			effectiveStatus.varsOnFail = getEffectiveStatusVarsOnFail(statusName, status);
			effectiveStatus.locationOnSuccess = status.locationOnSuccess;
			effectiveStatus.locationOnFail = status.locationOnFail;
			effectiveStatus.messageOnSuccess = status.messageOnSuccess;
			effectiveStatus.messageOnFail = status.messageOnFail;
			effectiveStatus.onBeforeEnter = status.onBeforeEnter;
			effectiveStatus.onBeforeExit = status.onBeforeExit;
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
				(typeof status.status !== UNDEFINED) ? 
					status.status : 
					statusName;
		}

		function getEffectiveStatusStatusOnFail(statusName, status) {
			return (typeof status.statusOnFail !== UNDEFINED) ? 
				status.statusOnFail :
				(typeof status.status !== UNDEFINED) ? 
					status.status :
					statusName;
		}
		
		function getEffectiveStatusModelOnSuccess(statusName, status) {
			return (typeof status.modelOnSuccess !== UNDEFINED) ? status.modelOnSuccess : status.model;
		}

		function getEffectiveStatusModelOnFail(statusName, status) {
			return (typeof status.modelOnFail !== UNDEFINED) ? status.modelOnFail : status.model;
		}

		function getEffectiveStatusVarsOnSuccess(statusName, status) {
			return (typeof status.varsOnSuccess !== UNDEFINED) ? status.varsOnSuccess : status.vars;
		}

		function getEffectiveStatusVarsOnFail(statusName, status) {
			return (typeof status.varsOnFail !== UNDEFINED) ? status.varsOnFail : status.vars;
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
