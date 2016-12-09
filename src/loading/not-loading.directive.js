(function() {
	angular.module('ngEasy')
		.directive('ngEasyNotLoading', NotLoadingDirective);

	NotLoadingDirective.$inject=['Loading'];
	function NotLoadingDirective(Loading) {
		return {
			restrict: 'EA',
			link : NotLoadingDirectiveLink
		};

		function NotLoadingDirectiveLink(scope, element, attrs, ctrl, transclude) {
			scope.$watch(function(){ return Loading.getChangeCount();}, processElement);
			
			function processElement() {
				var loadingExpressions = attrs.ngEasyNotLoading.split(';');
				var isLoading = false;
				loadingExpressions.forEach(function(loadingExpression) {
					var loadings = Loading.getLoadings(loadingExpression);
					isLoading = isLoading || (loadings.length > 0); 
				});
				if(isLoading) {
					element.prop('style').display = 'none';
					return;
				}
				element.prop('style').removeProperty('display');
			}
		}
	}
		
})();