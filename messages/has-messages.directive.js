(function() {
	angular.module('ngEasy')
		.directive('ngEasyHasMessages', HasMessagesDirective);

	function HasMessagesDirective(Messages, $compile) {
		return {
			restrict: 'A',
		    transclude: 'element',
			link : HasMessagesDirectiveLink
		};

		function HasMessagesDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Messages.getChangeCount()}, function(newValue, oldValue) {doIt();});
			function doIt() {
				dynamicalyAddedElements.length = 0;
				var hasMessagesExpressions = attrs.ngEasyHasMessages.split(';');
				var hasMessages = false;
				hasMessagesExpressions.forEach(function(showMessageExpression) {
					var messages = Messages.getMessages(showMessageExpression);
					hasMessages = hasMessages || (messages.length > 0); 
				});
				if(hasMessages) {
					element.after(originalElementClone);
					return;
				}
				originalElementClone.remove();
				return;
			}
		}
	}
		
})();