(function() {
	angular.module('ngEasy')
		.directive('ngEasyTitle', TitleDirective);

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

			scope.$watch(function(){ return Template.getTitle();}, processElement);
			
			function processElement() {
				var titleValue = Template.getTitle();
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