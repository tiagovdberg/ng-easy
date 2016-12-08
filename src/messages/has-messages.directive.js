(function() {
	angular.module('ngEasy')
		.directive('ngEasyHasMessages', HasMessagesDirective);

	HasMessagesDirective.$inject=['Messages'];
	function HasMessagesDirective(Messages) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : HasMessagesDirectiveLink
		};

		function HasMessagesDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var originalElementClone = transclude();
			scope.$watch(function(){ return Messages.getChangeCount();}, processElement);
			function processElement() {
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