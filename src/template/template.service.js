(function() {	
	angular.module('ngEasy')
	  .service('Template', TemplateService);
		
	function TemplateService() {
		var self = this;
		self.getTitle = getTitle;
		self.setTitle = setTitle;
		self.getBreadCrumbs = getBreadCrumbs;
		self.setBreadCrumbs = setBreadCrumbs;
		self.getStyleSheets = getStyleSheets;
		self.setStyleSheets = setStyleSheets;
		self.getScripts = getScripts;
		self.setScripts = setScripts;
		self.isMenuVisible = isMenuVisible;
		self.setMenuVisible = setMenuVisible;
		self.getMenus = getMenus;
		self.addMenu = addMenu;

		init();
		
		function init() {
			self.title = '';
			self.breadCrumbs = [];
			self.styleSheets = [];
			self.scripts = [];
			self.menuVisible=true;
			self.menus = [];
		}

		function getTitle() {
			return self.title;
		}

		function setTitle(newTitle) {
			self.title = newTitle;
		}

		function getBreadCrumbs() {
			return self.breadCrumbs;
		}

		function setBreadCrumbs(newBreadCrumbs) {
			self.breadCrumbs = newBreadCrumbs;
		}
		
		function getStyleSheets() {
			return self.styleSheets;
		}

		function setStyleSheets(newStyleSheets) {
			self.styleSheets = newStyleSheets;
		}

		function getScripts() {
			return self.scripts;
		}

		function setScripts(newScripts) {
			self.scripts = newScripts;
		}
		
		function isMenuVisible(aMenu) {
			return self.menuVisible;
		}

		function setMenuVisible(newMenuVisible) {
			self.menuVisible = newMenuVisible;
		}
		
		function getMenus() {
			return self.menus;
		}

		function addMenu(menuToAdd) {
			self.menus.push(menuToAdd);
		}
	}
})();	