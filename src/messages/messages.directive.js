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

				var showMessageCommand = attrs.ngEasyMessages.split('|');
				if (showMessageCommand.length > 2) {
					return;
				}

				var showMessageExpressions = showMessageCommand[0].split(';');
			 	var classMap = showMessageCommand.length == 2 ? parseClassMapExpressions(showMessageCommand[1]) : {};
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

	function parseClassMapExpressions(classMapExpressions) {
		var classMap ={};
		var classMapExpressionsArray = classMapExpressions.split(';');
		for(var index = 0; index < classMapExpressionsArray.length; index++) {
			var classMapExpression = classMapExpressionsArray[index];
			var classMapExpressionAssignment = classMapExpression.split('=');
			if(classMapExpressionAssignment.length > 2) {
				return {};
			}
			if(classMapExpressionAssignment.length === 2) {
				var classMapExpressionFrom = classMapExpressionAssignment[0].trim();
				var classMapExpressionTo = classMapExpressionAssignment[1].trim();
				if(classMapExpressionFrom === '' || classMapExpressionTo === '') {
					return {};
				}
				classMap[classMapExpressionFrom] = classMapExpressionTo;
			}
		}
		return classMap;
	}
})();
