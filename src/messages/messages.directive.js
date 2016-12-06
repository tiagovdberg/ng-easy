(function() {
	angular.module('ngEasy')
		.directive('ngEasyMessages', MessagesDirective);

	MessagesDirective.$inject = ['Messages']; 
	function MessagesDirective(Messages) {
		return {
			restrict: 'A',
		    transclude: 'element',
			link : MessagesDirectiveLink
		};

		function MessagesDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Messages.getChangeCount();}, function(newValue, oldValue) {doIt();});
			
			function doIt() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var showMessageExpressions = attrs.ngEasyMessages.split(';');
				showMessageExpressions.forEach(function(showMessageExpression) {
					var messages = Messages.getMessages(showMessageExpression);
					messages.forEach(function(message) {
						var originalElementClone = transclude(function(clone, transcludeScope) {transcludeScope.message = message;});
//						originalElementClone.removeAttr('ngEasy-messages');
//						originalElementClone.removeAttr('data-ngEasy-messages');
						dynamicalyAddedElements.push(originalElementClone);
						element.after(originalElementClone);
					});
				});
			}
		}
	}
		
})();