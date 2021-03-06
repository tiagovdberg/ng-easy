(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'BreadCrumbs', BreadCrumbsDirective);

	BreadCrumbsDirective.$inject = ['Template']; 
	function BreadCrumbsDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : BreadCrumbsDirectiveLink
		};

		function BreadCrumbsDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.breadCrumbs();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var breadCrumbs = Template.breadCrumbs();
				breadCrumbs.forEach(function(breadCrumb) {
					var originalElementClone = transclude(function(clone, transcludeScope) {transcludeScope.breadCrumb = breadCrumb;});
					dynamicalyAddedElements.push(originalElementClone);
					element.after(originalElementClone);
				});
			}
		}
	}
		
})();