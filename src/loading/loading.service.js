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