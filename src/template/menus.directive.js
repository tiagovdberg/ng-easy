(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Menus', MenusDirective);

	MenusDirective.$inject = ['Template', '$location', '$route']; 
	function MenusDirective(Template, $location, $route) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : MenusDirectiveLink
		};

		function MenusDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Template.menuVisible();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var menus = Template.menus();
				menus.forEach(function(menu) {
					var menuWithGoFunction = angular.merge({ go: function() { menuGo(menu) ; } }, menu);
					var originalElementClone = transclude(function(clone, transcludeScope) {transcludeScope.menu = menuWithGoFunction;});
					dynamicalyAddedElements.push(originalElementClone);
					element.after(originalElementClone);
				});
			}
		}

		function menuGo(menu) {
			var oldLocation = $location.url();
			if(oldLocation !== menu.path) {
				$location.url(menu.path);
				return;
			}
			$route.reload();
		}
	}
})();