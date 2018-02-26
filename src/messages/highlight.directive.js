(function() {
	angular.module(angular.easy.$moduleName)
		.directive(angular.easy.$directivesPrefix + 'Highlight', HighlightDirective);

	HighlightDirective.$inject=['Messages'];
	function HighlightDirective(Messages) {
		return {
			restrict : "A",
			link : HighlightDirectiveLink
		};

		function HighlightDirectiveLink(scope, element, attrs) {
			var originalClasses = element.attr("class");
			scope.$watch(function(){ return Messages.getChangeCount();}, highlightElement);
			
			function highlightElement() {
				element.attr("class", originalClasses);
				var highlightCommand = attrs.ngEasyHighlight.split('|');
				if (highlightCommand.length > 2) {
					return;
				}

				var priorityMap = {};
				priorityMap[Messages.FATAL] = 0;
				priorityMap[Messages.ERROR] = 1;
				priorityMap[Messages.WARNING] = 2;
				priorityMap[Messages.INFORMATION] = 3;
				priorityMap[Messages.MESSAGE] = 4;

				var elementClass;
				var priority = Infinity;
				var highlightExpressions = highlightCommand[0].split(';');
				highlightExpressions.forEach(function(highlightExpression) {
					var messages = Messages.getMessages(highlightExpression);
					messages.forEach(function(message) {
						var messagePriority = priorityMap[message.type];
						if(messagePriority < priority){
							priority = messagePriority;
							elementClass = message.type;
						}
					});
				});
				if(elementClass) { 
				 	var classMap = highlightCommand.length == 2 ? parseClassMapExpressions(highlightCommand[1]) : {};
					element.addClass(typeof classMap[elementClass] !== 'undefined' ? classMap[elementClass] : elementClass);
				}
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
