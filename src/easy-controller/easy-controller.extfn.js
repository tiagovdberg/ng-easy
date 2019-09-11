/*jshint esversion: 6 */
//TODO Documentation JSDoc
(function() {
	var interruptedPromise = {
		then : ()=>{},
		catch : ()=>{},
		finally : ()=>{},
		defer : ()=>{},
		when : ()=>{},
		resolve : ()=>{},
		reject : ()=>{},
		all : ()=>{},
		race : ()=>{}
	};
	var fnVal = (v, self, args)=>angular.isFunction(v) ? v.apply(self, args) : v; 
	var bindSuffixed = (self, originalFunction, args)=>(...fnArgs)=>originalFunction.apply(self, Array.prototype.slice.call(fnArgs).concat(args));
	var camelCase = s=>s.substring(0,1).toLowerCase() + s.substring(1);
	var hyphenCase = s=>s.split('').map((c,i)=>(l = c.toLowerCase()) !== c && i > 0 ? '-' + l : l).join('');
	var trimPrefix = (s, prefix)=>s.startsWith(prefix) ? s.substring(prefix.length) : s; 
	var trimSuffix = (s, suffix)=>s.endsWith(suffix) ? s.substring(0, s.length - suffix.length) : s;
	var trimPrefixes = (s, prefixes)=>{
		for(var pl = 0; pl < prefixes.length; pl++) {
			if( (ts = trimPrefix(s, prefixes[pl])) !== s) return ts;
		}
		return s;
	};

	angular.easy.registerFunction('easyController', function (module, config) {
		var ctrlFeature = s=>camelCase(trimSuffix(s, 'Controller'));
		
		angular.module(module)
		.service('$' + ctrlFeature(config.name) + 'StateService', function() {
			var self = this;
			self.stack = [];
			self.argsStack = [];
			self.save = v=>self.stack.push(v); 
			self.restore = v=>self.stack.pop(v);
			self.saveArgs = v=>self.argsStack.push(v); 
			self.restoreArgs = v=>self.argsStack.pop(v);
		})
		.config(['$controllerProvider', '$routeProvider', function($controllerProvider, $routeProvider) {
			$controllerProvider.register(config.name, ['$location', '$route', '$routeParams', '$q', '$http', '$' + ctrlFeature(config.name) + 'StateService', function($location, $route, $routeParams, $q, $http, $stateService) {
				var self = this;
				self.config = config;
				self.data = ()=>self[self.$status].data;
				self.model = ()=>self[self.$status].model;
				self.vars = ()=>self[self.$status].vars;
				self.params = ()=>self[self.$status].params;
				self.templateUrl = ()=>((t = fnVal(config.template, self, [self])) ? t : hyphenCase(module) + '/' + hyphenCase(ctrlFeature(config.name))) + ((st = fnVal(config.status[self.$status].template, self, [self])) ? st : '/' + hyphenCase(trimPrefixes(self.$status, ['put', 'get', 'post', 'delete'])) + '.html');
				self.status = angular.bind(self, status, self);
				
				function ctrlRoute(st) {
					return angular.isDefined(config.status[st].route) ? ( ((r = fnVal(config.route, self, [self])) ? r : hyphenCase(ctrlFeature(config.name))) + fnVal(config.status[st].route, self, [self]) ) : undefined;
				}

				delete self.$status;
				angular.forEach(config.status, (stConfig, st)=>{
					self[st] = angular.isFunction(stConfig) ? angular.bind(self, stConfig, self, st) : angular.bind(self, self.status, st);
					self[st].data = {};
					self[st].model = {};
					self[st].vars = {};
					self[st].params = {};
				});
				for (var st in config.status) { 
					if (!config.status.hasOwnProperty(st)) continue;
					if (angular.isUndefined((cr = ctrlRoute(st))) || $route.current.originalPath !== cr) continue; 
					var oldCtrl = $stateService.restore();
					var args = $stateService.restoreArgs();
					if(angular.isDefined(oldCtrl)) {
						self.$status = oldCtrl.$status;
						angular.copy(oldCtrl.model(), self[self.$status].model);
						angular.copy(oldCtrl.vars(), self[self.$status].vars);
						angular.copy(oldCtrl.params(), self[self.$status].params);
					}
					if(angular.isUndefined(self.$status)) {
						self.$status = st;
					}
					angular.copy($routeParams, self[st].params);
					self[st].apply(self, args);
					return;
				}					
				
				function status(self, st /*, arguments[1:] */) {
					if(angular.isUndefined(st)) {
						return self.$status;
					}
					
					var transition = {};
					if (angular.isDefined(config.status[self.$status].to)) {
						transition = config.status[self.$status].to[st] || config.status[self.$status].to["*"] || {};
					}

					var args = Array.prototype.slice.call(arguments, 1);
					var fnValArgs = [self].concat(args);

					if(angular.isFunction(config.status[st].before) && config.status[st].before.apply(self, fnValArgs) === false) {
						return $q.resolve({data : {}});
					}
					
					var cr = ctrlRoute(st);
					if (angular.isDefined(cr) && $route.current.originalPath !== cr) { 
						$stateService.save(self);
						$stateService.saveArgs(args);
						var params = angular.copy(fnVal(transition.routeParams, self, fnValArgs), {}); //TODO
						$location.path(interpolatePath(cr, params));
						$location.search(params);
						return interruptedPromise;
					} 
		
					var method = fnVal(config.status[st].method, self, fnValArgs) || ((a = ['PUT','GET','DELETE','POST'].filter(m=>st.toUpperCase().startsWith(m))).length === 1 ? a[0] : false); 
					if(!method) {
						return $q.resolve({data : {}}, bindSuffixed(self, config.status[st].success ||  success, fnValArgs));
					}
					
					if(method !== 'GET' && angular.isDefined(cr) && $route.current.originalPath === cr) {
						return $q.reject("Will not call a " + method + " method directly from a route.").catch(reason=>console.error(reason));
					}
					
					return $http({
						method: method,
						data: self.model(),
						url: fnVal(config.status[st].url, self, fnValArgs) || '/api' + $location.url()
					}).then(
						bindSuffixed(self, success, fnValArgs), 
						bindSuffixed(self, fail, fnValArgs)
					);
		
					function success(response) {
						var newStatus = fnVal(config.status[st].statusOnSuccess, self, fnValArgs) || fnVal(config.status[st].status, self, fnValArgs) || st;
						
						self[newStatus].data = response.data;
						var newModel = fnVal(transition.modelOnSuccess, self, fnValArgs) || fnVal(transition.model, self, fnValArgs);
						var newVars = fnVal(transition.varsOnSuccess, self, fnValArgs) || fnVal(transition.vars, self, fnValArgs);
						if (angular.isDefined(newModel) && newModel !== self[newStatus].model) {
							angular.copy(newModel, self[newStatus].model);
						}
						if (angular.isDefined(newVars) && newVars !== self[newStatus].vars) {
							angular.copy(newVars, self[newStatus].vars);
						}

						var changed = newStatus !== st;
						self.$status = newStatus;
						if(changed) {
							self[newStatus]();
						}
					}
					
					function fail(response) {
						var newStatus = fnVal(config.status[st].statusOnFail, self, fnValArgs) || fnVal(config.status[st].status, self, fnValArgs) || st;
		
						self[newStatus].data = response.data;
						var newModel = fnVal(transition.modelOnFail, self, fnValArgs) || fnVal(transition.model, self, fnValArgs);
						var newVars = fnVal(transition.varsOnFail, self, fnValArgs) || fnVal(transition.vars, self, fnValArgs);
						if (angular.isDefined(newModel) && newModel !== self[newStatus].model) {
							angular.copy(newModel, self[newStatus].model);
						}
						if (angular.isDefined(newVars) && newVars !== self[newStatus].vars) {
							angular.copy(newVars, self[newStatus].vars);
						}
		
						var changed = newStatus !== st;
						self.$status = newStatus;
						if(changed) {
							self[newStatus]();
						}
						throw response;
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
