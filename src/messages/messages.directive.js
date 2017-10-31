(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Messages', MessagesDirective);

	MessagesDirective.$inject = ['Messages']; 
	function MessagesDirective(Messages) {
		return {
			restrict: 'EA',
		    transclude: 'element',
			link : MessagesDirectiveLink
		};

		function MessagesDirectiveLink(scope, element, attrs, ctrl, transclude) {
			var dynamicalyAddedElements = [];
			scope.$watch(function(){ return Messages.getChangeCount();}, processElements);
			
			function processElements() {
				dynamicalyAddedElements.forEach(function(dynamicalyAddedElement) {
					dynamicalyAddedElement.remove();
				});
				dynamicalyAddedElements.length = 0;
				var showMessageExpressions = attrs.ngEasyMessages.split(';');
				var classMap = {};
				showMessageExpressions.forEach(function(showMessageExpression) {
					var classMapExpressions = showMessageExpression.split('=');
					if(classMapExpressions.length !== 2) {
						return;
					}
					if(classMapExpressions[0] === '' || classMapExpressions[1] === '') {
						return;
					}
					classMap[classMapExpressions[0]] = classMapExpressions[1];
					return;
				});
				showMessageExpressions.forEach(function(showMessageExpression) {
					var messages = Messages.getMessages(showMessageExpression);
					messages.forEach(function(message) {
						message.class = (typeof classMap[message.type] !== 'undefined') ? classMap[message.type] : message.type;
						var originalElementClone = transclude(function(clone, transcludeScope) {transcludeScope.message = message;});
						dynamicalyAddedElements.push(originalElementClone);
						element.after(originalElementClone);
					});
				});
			}
		}
	}
		
})();