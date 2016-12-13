(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'HasMessages', HasMessagesDirective);

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
				hasMessagesExpressions.forEach(function(hasMessageExpression) {
					var messages = Messages.getMessages(hasMessageExpression);
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