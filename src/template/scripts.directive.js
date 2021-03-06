(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Scripts', ScriptsDirective);

	ScriptsDirective.$inject = ['Template']; 
	function ScriptsDirective(Template) {
		var scriptDomElement = document.createElement('script');
		scriptDomElement.setAttribute('type', 'application/javascript');
		var scriptElement = angular.element(scriptDomElement);

		return {
			restrict: 'E',
		    transclude: 'element',
			link : ScriptsDirectiveLink
		};

		function ScriptsDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.scripts();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var scripts = Template.scripts();
				scripts.forEach(function(script) {
					var scriptElementClone = scriptElement.clone();
					scriptElementClone.attr('src', script);
					dynamicalyAddedElements.push(scriptElementClone);
					element.after(scriptElementClone);
				});
			}
		}
	}
		
})();