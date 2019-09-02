/*jshint esversion: 6 */

//TODO Documentation JSDoc
//TODO InitialStatus has a default if there is only one state.

(function() {
	//fnVal = (v, self)=>angular.isFunction(v) ? v.apply(self, self) : v;
	
	function fnVal(v /*, arguments[1:] */) {
		if (angular.isFunction(v)) {
			var extraArgs = Array.prototype.slice.call(arguments, 1);
			return v.apply(this, extraArgs);
		}
		return v;
	}

	camelCase = s=>s.substring(0,1).toLowerCase() + s.substring(1);
	hyphenCase = s=>s.split('').map((c,i)=>(l = c.toLowerCase()) !== c && i > 0 ? '-' + l : l).join('');
	ctrlFeature = s=>camelCase(trimSuffix(s, 'Controller'));
	trimPrefix = (s, prefix)=>s.startsWith(prefix) ? s.substring(prefix.length) : s; 
	trimSuffix = (s, suffix)=>s.endsWith(suffix) ? s.substring(0, s.length - suffix.length) : s;
	trimPrefixes = (s, prefixes)=>{
		for(var x = 0; x < prefixes.length; x++) {
			if( (ts = trimPrefix(s, prefixes[x])) !== s) return ts;
		}
		return s;
	};

	angular.easy.registerFunction('easyController', function (module, config) {
		ctrlRoute = (status)=>angular.isDefined(config.status[status].route) ? (((r = fnVal(config.route, self)) ? r : hyphenCase(ctrlFeature(config.name))) + fnVal(config.status[status].route, self) ) : undefined;
		
		angular.module(module).config(['$controllerProvider', '$routeProvider', function($controllerProvider, $routeProvider) {
			$controllerProvider.register(config.name, ['$location', '$route', '$routeParams', '$q', '$http', function($location, $route, $routeParams, $q, $http) {
				var self = this;
				self.getModel = ()=>self[self.status].model;
				self.getData = ()=>self[self.status].data;
				self.getVars = ()=>self[self.status].vars;
				self.getParams = ()=>self[self.status].params;
				self.getTemplateUrl = ()=>((t = fnVal(config.templateUrl, self)) ? t : hyphenCase(module) + '/' + hyphenCase(ctrlFeature(config.name))) + ((st = fnVal(config.status[self.status].templateUrl, self)) ? st : '/' + hyphenCase(trimPrefixes(self.status, ['put', 'get', 'post', 'delete'])) + '.html');
				
				//init()
				delete self.status;
				angular.forEach(config.status, (stConfig, status)=>{
					self[status] = angular.isFunction(stConfig) ? stConfig : angular.bind(self, goToStatus, status);
					self[status].model = {};
					self[status].data = {};
					self[status].vars = {};
					self[status].params = {};
				});
				for (var status in config.status) { 
					if (!config.status.hasOwnProperty(status)) continue;
					if (angular.isUndefined((cr = ctrlRoute(status))) || $route.current.originalPath !== cr) continue; 
					self[status]();
					return;
				}					
				function goToStatus(status, form) {
					//Messages.clearMessages();
					//if (angular.isDefined(form) && Messages.formErrors(self.getTemplateUrl(), form)) return $q.defer().resolve();
					
					if(angular.isUndefined(self.status)) {
						self.status = status;
					}
					var cr = ctrlRoute(status);
					if (status != self.status && angular.isDefined(cr)) { 
						var params = angular.copy(fnVal(config.status[status].routeParams, self), {});
						$location.path(interpolatePath(cr, params));
						$location.search(params);
						return;
//						return $q.resolve({data : {}});
					} 
		
					var method = (a = ['PUT','GET','DELETE','POST'].filter(m=>status.toUpperCase().startsWith(m))).length === 1 ? a[0] : false; 
					if(!method) {
						return;
//						return $q.resolve({data : {}}, (fn = config.status[status].success) ? angular.bind(self, fn, self) : angular.bind(self, success, self) );
					}
					
					return $http({
						method: method,
						data: self.getModel(),
						url: (u = fnVal(config.status[status].serviceUrl, self)) ? u : "/api" + $location.url()
					}).then(
						(fn = config.status[status].success) ? angular.bind(self, fn, self) : angular.bind(self, success, self), 
						(fn = config.status[status].fail) ? angular.bind(self, fn, self) : angular.bind(self, fail, self)
					);
		
					//TODO model and data must accept functions with response as argument.
					function success(self, response) {
						var newStatus = fnVal(config.status[status].statusOnSuccess, self) || fnVal(config.status[status].status, self) || status;
		
						self[newStatus].data = response.data;
						angular.copy(fnVal(config.status[status].modelOnSuccess, self) || fnVal(config.status[status].model, self), self[newStatus].model);
						angular.copy(fnVal(config.status[status].varsOnSuccess, self) || fnVal(config.status[status].vars, self), self[newStatus].vars);
		
						if(newStatus === self.status) return;
						
						self.status = newStatus;
						self[newStatus]();
					}
					
					function fail(self, response) {
						var newStatus = fnVal(config.status[status].statusOnFail, self) || fnVal(config.status[status].status, self) || status;
		
						self[newStatus].data = response.data;
						angular.copy(fnVal(config.status[status].modelOnFail, self) || fnVal(config.status[status].model, self), self[newStatus].model);
						angular.copy(fnVal(config.status[status].varsOnFail, self) || fnVal(config.status[status].vars, self), self[newStatus].vars);
		
						var statusChanged = newStatus !== status || newStatus != self.status;
						self.status = newStatus;
						if(statusChanged) {
							self[newStatus]();
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
				if (angular.isUndefined(stConfig.route)) return;
				var ctrlScope = ctrlFeature(config.name) + 'Ctrl';
				$routeProvider.when(config.route + stConfig.route, {
					controller : config.name,
					controllerAs : ctrlScope,
					template : '<ng:include src="' + ctrlScope + '.getTemplateUrl()"></ng:include>'
				});
			});
		}]); //angular.module(module).config(
	});

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
