(function() {
	angular.module('ngEasy')
		.directive('ngEasyHasMenu', HasMenuDirective);

	HasMenuDirective.$inject=['Template'];
	function HasMenuDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : HasMenuDirectiveLink
		};

		function HasMenuDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			scope.$watch(function(){ return Template.isMenuVisible();}, processElement);
			
			function processElement() {
				if(Template.isMenuVisible()) {
					element.after(originalElementClone);
					return;
				}
				originalElementClone.remove();
				return;
			}
		}
	}
		
})();