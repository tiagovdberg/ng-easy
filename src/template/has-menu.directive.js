(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'HasMenu', HasMenuDirective);

	HasMenuDirective.$inject=['Template'];
	function HasMenuDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : HasMenuDirectiveLink
		};

		function HasMenuDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			scope.$watch(function(){ return Template.menuVisible();}, processElement);
			
			function processElement() {
				if(Template.menuVisible()) {
					element.after(originalElementClone);
					return;
				}
				originalElementClone.remove();
				return;
			}
		}
	}
		
})();