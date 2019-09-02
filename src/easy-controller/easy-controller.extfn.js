/*jshint esversion: 6 */

//TODO Documentation JSDoc
//TODO InitialStatus has a default if there is only one state.

(function() {
	fnVal = function (v, self /*, arguments[1:] */) { return angular.isFunction(v) ? v.apply(self, Array.prototype.slice.call(arguments, 1)) : v; };
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
		ctrlRoute = (st)=>angular.isDefined(config.status[st].route) ? (((r = fnVal(config.route, self)) ? r : hyphenCase(ctrlFeature(config.name))) + fnVal(config.status[st].route, self) ) : undefined;
		
		angular.module(module).config(['$controllerProvider', '$routeProvider', function($controllerProvider, $routeProvider) {
			$controllerProvider.register(config.name, ['$location', '$route', '$routeParams', '$q', '$http', function($location, $route, $routeParams, $q, $http) {
				var self = this;
				self.model = ()=>self[self.$status].model;
				self.data = ()=>self[self.$status].data;
				self.vars = ()=>self[self.$status].vars;
				self.params = ()=>self[self.$status].params;
				self.templateUrl = ()=>((t = fnVal(config.templateUrl, self)) ? t : hyphenCase(module) + '/' + hyphenCase(ctrlFeature(config.name))) + ((st = fnVal(config.status[self.$status].templateUrl, self)) ? st : '/' + hyphenCase(trimPrefixes(self.$status, ['put', 'get', 'post', 'delete'])) + '.html');
				self.status = status;
				
				//init()
				delete self.$status;
				angular.forEach(config.status, (stConfig, st)=>{
					self[st] = angular.isFunction(stConfig) ? stConfig : angular.bind(self, status, st);
					self[st].model = {};
					self[st].data = {};
					self[st].vars = {};
					self[st].params = {};
				});
				for (var st in config.status) { 
					if (!config.status.hasOwnProperty(st)) continue;
					if (angular.isUndefined((cr = ctrlRoute(st))) || $route.current.originalPath !== cr) continue; 
					self[st]();
					return;
				}					
				
				function status(st, form) {
					if(angular.isUndefined(st)) {
						return self.$status;
					}
					
					//Messages.clearMessages();
					//if (angular.isDefined(form) && Messages.formErrors(self.getTemplateUrl(), form)) return $q.resolve({data : {}});
					
					if(angular.isUndefined(self.$status)) {
						self.$status = st;
					}
					var cr = ctrlRoute(st);
					if (st != self.$status && angular.isDefined(cr)) { 
						var params = angular.copy(fnVal(config.status[st].routeParams, self), {});
						$location.path(interpolatePath(cr, params));
						$location.search(params);
						return $q.resolve({data : {}});
					} 
		
					var method = (a = ['PUT','GET','DELETE','POST'].filter(m=>st.toUpperCase().startsWith(m))).length === 1 ? a[0] : false; 
					if(!method) {
						return $q.resolve({data : {}}, (fn = config.status[st].success) ? angular.bind(self, fn, self) : angular.bind(self, success, self) );
					}
					
					return $http({
						method: method,
						data: self.model(),
						url: (u = fnVal(config.status[st].serviceUrl, self)) ? u : "/api" + $location.url()
					}).then(
						(fn = config.status[st].success) ? angular.bind(self, fn, self) : angular.bind(self, success, self), 
						(fn = config.status[st].fail) ? angular.bind(self, fn, self) : angular.bind(self, fail, self)
					);
		
					//TODO model and data must accept functions with response as argument.
					function success(self, response) {
						var newStatus = fnVal(config.status[st].statusOnSuccess, self) || fnVal(config.status[st].status, self) || st;
		
						self[newStatus].data = response.data;
						angular.copy(fnVal(config.status[st].modelOnSuccess, self) || fnVal(config.status[st].model, self), self[newStatus].model);
						angular.copy(fnVal(config.status[st].varsOnSuccess, self) || fnVal(config.status[st].vars, self), self[newStatus].vars);
		
						if(newStatus === self.$status) return;
						
						self.$status = newStatus;
						self[newStatus]();
					}
					
					function fail(self, response) {
						var newStatus = fnVal(config.status[st].statusOnFail, self) || fnVal(config.status[st].status, self) || st;
		
						self[newStatus].data = response.data;
						angular.copy(fnVal(config.status[st].modelOnFail, self) || fnVal(config.status[st].model, self), self[newStatus].model);
						angular.copy(fnVal(config.status[st].varsOnFail, self) || fnVal(config.status[st].vars, self), self[newStatus].vars);
		
						var changed = newStatus !== st || newStatus != self.$status;
						self.$status = newStatus;
						if(changed) {
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
					
			angular.forEach(config.status, (stConfig)=>{
				if (angular.isUndefined(stConfig.route)) return;
				var ctrlScope = ctrlFeature(config.name) + 'Ctrl';
				$routeProvider.when(config.route + stConfig.route, {
					controller : config.name,
					controllerAs : ctrlScope,
					template : '<ng:include src="' + ctrlScope + '.templateUrl()"></ng:include>'
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
