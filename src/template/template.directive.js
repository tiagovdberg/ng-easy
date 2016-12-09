(function() {	
	angular.module('ngEasy')
	  .directive('ngEasyTemplate', TemplateDirective);

	TemplateDirective.$inject = [ 'Template' ];
	function TemplateDirective(Template) {
		return {
			restrict : 'E',
			scope : {
				title : '@',
				breadCrumbs : '=',
				styleSheets : '=',
				scripts : '=',
				menuVisible : '=',
			},
			link : TemplateDirectiveLink
		};
		
		function TemplateDirectiveLink(scope, element, attrs) {
			Template.setTitle(scope.title || '');
			Template.setBreadCrumbs(scope.breadCrumbs || []);
			Template.setStyleSheets(scope.styleSheets || []);
			Template.setScripts(scope.scripts || []);
			Template.setMenuVisible((typeof scope.menuVisible !== 'undefined') ? scope.menuVisible : true);
		}
	}
})();	