(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Uncloak', UncloakDirective);

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