(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Title', TitleDirective);

	TitleDirective.$inject=['Template'];
	function TitleDirective(Template) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : TitleDirectiveLink
		};

		function TitleDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			var isElement = (originalElementClone.prop('tagName') === 'NG-EASY:TITLE');
			var titleElement = isElement ? angular.element(document.createElement('title')) : originalElementClone;

			scope.$watch(function(){ return Template.title();}, processElement);
			
			function processElement() {
				var titleValue = Template.title();
				if(titleValue !== '') {
					titleElement.text(titleValue);
					element.after(titleElement);
					return;
				}
				titleElement.remove();
				return;
			}
		}
	}
		
})();