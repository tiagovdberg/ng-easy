(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'DefaultStyleSheet', DefaultStyleSheetDirective);

	DefaultStyleSheetDirective.$inject=['Template'];
	function DefaultStyleSheetDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : DefaultStyleSheetDirectiveLink
		};

		function DefaultStyleSheetDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			scope.$watch(function(){ return Template.getStyleSheets();}, processElement);
			
			function processElement() {
				if(Template.getStyleSheets().length === 0) {
					element.after(originalElementClone);
					return;
				}
				originalElementClone.remove();
				return;
			}
		}
	}
		
})();