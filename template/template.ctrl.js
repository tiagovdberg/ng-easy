(function() {
	angular.module('ngEasy')
		.controller('TemplateController', TemplateController);

	TemplateController.$inject = [ 'Template', '$location', '$route' ];
	function TemplateController(Template, $location, $route) {
		var self = this;
		self.getTitle = getTitle;
		self.getBreadCrumbs = getBreadCrumbs;
		self.getStyleSheets = getStyleSheets;
		self.getScripts = getScripts;
		self.isMenuVisible = isMenuVisible;
		self.getMenus = getMenus;
		self.clickMenu = clickMenu;
		self.isLoading = isLoading;

		function getTitle() {
			return Template.getTitle();
		}

		function getBreadCrumbs() {
			return Template.getBreadCrumbs();
		}

		function getStyleSheets() {
			return Template.getStyleSheets();
		}

		function getScripts() {
			return Template.getScripts();
		}

		function isMenuVisible(aMenu) {
			return Template.isMenuVisible(aMenu);
		}

		function getMenus() {
			return Template.getMenus();
		}
		
		function clickMenu(locationPath) {
			$location.url(locationPath);
			$route.reload();
		}
		
		function isLoading() {
			return Template.isLoading();
		}
	}
})();