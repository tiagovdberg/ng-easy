(function() {
	angular.module('ngEasy')
		.directive('ngEasyMenus', MenusDirective);

	MenusDirective.$inject = ['Template']; 
	function MenuDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : MenusDirectiveLink
		};

		function MenusDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.isMenuVisible();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var menus = Template.getMenus();
				menus.forEach(function(menu) {
					var originalElementClone = transclude(function(clone, transcludeScope) {transcludeScope.menu = menu;});
					dynamicalyAddedElements.push(originalElementClone);
					element.after(originalElementClone);
				});
			}
		}
	}
		
})();