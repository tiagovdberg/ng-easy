(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'StyleSheets', StyleSheetsDirective);

	StyleSheetsDirective.$inject = ['Template']; 
	function StyleSheetsDirective(Template) {
		var styleSheetDomElement = document.createElement('link');
		styleSheetDomElement.setAttribute('rel', 'stylesheet');
		styleSheetDomElement.setAttribute('type', 'text/css');
		var styleSheetElement = angular.element(styleSheetDomElement);

		return {
			restrict: 'E',
		    transclude: 'element',
			link : StyleSheetsDirectiveLink
		};

		function StyleSheetsDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.styleSheets();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var styleSheets = Template.styleSheets();
				styleSheets.forEach(function(styleSheet) {
					var styleSheetElementClone = styleSheetElement.clone();
					styleSheetElementClone.attr('href', styleSheet);
					dynamicalyAddedElements.push(styleSheetElementClone);
					element.after(styleSheetElementClone);
				});
			}
		}
	}
		
})();