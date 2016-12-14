(function() {	
	angular.module(angular.easy.$moduleName)
	  .directive(angular.easy.$directivesPrefix + 'Template', TemplateDirective);

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
			Template.title(scope.title || '');
			Template.breadCrumbs(scope.breadCrumbs || []);
			Template.styleSheets(scope.styleSheets || []);
			Template.scripts(scope.scripts || []);
			Template.menuVisible((typeof scope.menuVisible !== 'undefined') ? scope.menuVisible : true);
		}
	}
})();	