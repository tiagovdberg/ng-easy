/*jshint esversion: 6 */

//TODO Documentation JSDoc
//TODO InitialStatus has a default if there is only one state.

(function() {

	var angularEasy = angular.easy;
	angularEasy.registerFunction('easyController', function (module, config) {
		
		angular.module(module).config(['$controllerProvider', '$routeProvider', function($controllerProvider, $routeProvider) {
			$controllerProvider.register(config.name, ['$location', '$route', '$routeParams', '$q', '$http', function($location, $route, $routeParams, $q, $http) {
				var self = this;
				
				self.getModel = ()=>self[self.status].model;
				self.getData = ()=>self[self.status].data;
				self.getVars = ()=>self[self.status].vars;
				self.getParams = ()=>self[self.status].params;
				self.getTemplateUrl = ()=>((t = fnVal(config.templateUrl, self)) ? t : dashedCase(module) + '/' + dashedCase(ctrlFeature(config.name))) + ((st = fnVal(config.status[self.status].templateUrl, self)) ? st : '/' + dashedCase(self.status) + '.html');
//				self.getTemplateUrl = ()=>dashedCase(module) + '/' + dashedCase(config.name) + '/' + dashedCase(self.status) + '.html';
				
				//init()
				delete self.status;
				angular.forEach(config.status, (stConfig, status)=>{
					self[status] = angular.isFunction(stConfig) ? stConfig : angular.bind(self, goToStatus, status);
					self[status].model = {};
					self[status].data = {};
					self[status].vars = {};
					self[status].params = {};
					self[status].route = {}; //TODO
				});
				angular.forEach($route.routes, (route, path)=>{
					if(!angular.isUndefined(route.regexp) && route.regexp.exec($location.url())) { 
						angular.forEach(config.status, (stConfig, status)=>{
							//TODO Eval Defauts config.route + stConfig.route
							//>((r = fnVal(config.route, self)) ? r : dashedCase(module) + '/' + dashedCase(ctrlName)) + (sr = fnVal(config.status.[self.status].route, self)) ? sr : '/' + dashedCase(self.status) + '.html';
							if(path === (config.route + stConfig.route)) {
								self[status]();
								return;
							}
						});
					}
				});					
				
				function goToStatus(status, form) {
					//Messages.clearMessages();
					//if (angular.isDefined(form) && Messages.formErrors(self.getTemplateUrl(), form)) return $q.defer().resolve();
					
					if(angular.isUndefined(self.status)) {
						self.status = status;
					}
					
//					if (angular.isDefined(config.status[status].route) && //TODO) {
//						var params = angular.copy($routeParams, {});
//						$location.path(interpolatePath(config.routeBase + config.status[status].route, params));
//						$location.search(params);
//						return $q.defer().resolve();
//					} 
		
					var method = (a = ['PUT','GET','DELETE','POST'].filter(m=>status.toUpperCase().startsWith(m))).length === 1 ? a[0] : false; 
					if(!method) {
						success({data : {}});
						return $q.defer().resolve();
					}
					
					return $http({
						method: method,
						data: self.getModel(),
						url: (u = fnVal(config.status[self.status].templateUrl, self)) ? u : "/api/" + $location.url()
					}).then(
						(fn = config.status[status].success) ? fn : success, 
						(fn = config.status[status].fail) ? fn : fail
					);
		
					//TODO model and data must accept functions with response as argument.
					function success(response) {
						var newStatus = fnVal(config.status[status].statusOnSuccess, self) || fnVal(config.status[status].status, self) || status;
		
						self[newStatus].data = response.data;
						angular.copy(fnVal(config.status[status].modelOnSuccess, self) || fnVal(config.status[status].model, self), self[newStatus].model);
						angular.copy(fnVal(config.status[status].varsOnSuccess, self) || fnVal(config.status[status].vars, self), self[newStatus].vars);
		
						if(newStatus === self.status) return;
						
						self.status = statusOnSuccess;
						self[statusOnSuccess]();
					}
					
					function fail(response) {
						var newStatus = fnVal(config.status[status].statusOnFail, self) || fnVal(config.status[status].status, self) || status;
		
						self[newStatus].data = response.data;
						angular.copy(fnVal(config.status[status].modelOnFail, self) || fnVal(config.status[status].model, self), self[newStatus].model);
						angular.copy(fnVal(config.status[status].varsOnFail, self) || fnVal(config.status[status].vars, self), self[newStatus].vars);
		
						var statusChanged = newStatus !== status;
						self.status = newStatus;
						if(statusChanged) {
							self[statusOnFail]();
						}
		//				Messages.handleErrors(response);
		//				var messageOnFail = fnVal(effectiveConfigStatus[newStatusName].messageOnFail, self);
		//				if(messageOnFail) {
		//					Messages.addMessage(messageOnFail);
		//				}
					}
				}
			}]); //$controllerProvider.register(
					
			angular.forEach(config.status, (stConfig, status)=>{
				if (angular.isDefined(stConfig.route)) {
					var ctrlScope = ctrlFeature(config.name) + 'Ctrl';
					$routeProvider.when(config.route + stConfig.route, {
						controller : config.name,
						controllerAs : ctrlScope,
						template : '<ng:include src="' + ctrlScope + '.getTemplateUrl()"></ng:include>'
					});
				}
			});
		}]); //angular.module(module).config(
	});
	function fnVal(v, self) {
		return angular.isFunction(v) ? v.apply(self, arguments.slice(arguments, 2)) : v;
	}
	
	function camelCase(s) {
		return s.substring(0,1).toLowerCase() + s.substring(1);
	}

	function dashedCase(s) {
		return s.split('').map((c,i)=>(l = c.toLowerCase()) !== c && i > 0 ? '-' + l : l).join('');
	}
	
	function ctrlFeature(s) {
		return camelCase(trimSuffix(s, ['Controller', 'Ctrl', 'Ctl']));
	}
	
	function trimPrefix(name, knownPrefixes) {
		for (var knownPrefixIndex = 0; knownPrefixIndex < knownPrefixes.length; knownPrefixIndex++) {
			var knownPrefix = knownPrefixes[knownPrefixIndex];
			if (name.toLowerCase().startsWith(knownPrefix.toLowerCase())) {
				return name.substring(knownPrefix.length);
			}
		}
		return name;
	}

	function trimSuffix(name, knownSuffixes) {
		for (var knownSuffixIndex = 0; knownSuffixIndex < knownSuffixes.length; knownSuffixIndex++) {
			var knownSuffix = knownSuffixes[knownSuffixIndex];
			if (name.toLowerCase().endsWith(knownSuffix.toLowerCase())) {
				return name.substring(0, name.length - knownSuffix.length);	
			}
		}
		return name;
	}

	function interpolatePath(string, params) {
		var result = [];
		angular.forEach((string || '').split(':'), function(segment, i) {
			if (i === 0) {
				result.push(segment);
			} else {
				var segmentMatch = segment.match(/(\w+)(?:[?*])?(.*)/);
				var key = segmentMatch[1];
				result.push(params[key]);
				result.push(segmentMatch[2] || '');
				delete params[key];
			}
		});
		return result.join('');
	}
})();
