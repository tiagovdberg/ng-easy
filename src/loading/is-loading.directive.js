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