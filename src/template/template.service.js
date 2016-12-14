(function() {	
	angular.module(angular.easy.$moduleName)
	  .service(angular.easy.$providersPrefix + 'Template', TemplateService);
		
	function TemplateService() {
		var self = this;
		var property = angular.easy.property; 
		property(self, 'title', '');
		property(self, 'breadCrumbs', []);
		property(self, 'styleSheets', []);
		property(self, 'scripts', []);
		property(self, 'menuVisible', true);
		property(self, 'menus', []);
		self.addMenu = addMenu;

		function addMenu(menuToAdd) {
			self.menus().push(menuToAdd);
		}
	}
})();	