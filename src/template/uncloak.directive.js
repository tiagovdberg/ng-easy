(function() {
	angular.module('ngEasy')
		.directive('ngEasyUncloak', UncloakDirective);

	function UncloakDirective() {
		return {
			restrict: 'A',
		    compile: UncloakCompile
		};

		function UncloakCompile(element, attrs) {
			element.remove();
		}
	}
})();