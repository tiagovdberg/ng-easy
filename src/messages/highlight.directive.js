(function() {
	angular.module('ngEasy')
		.directive('ngEasyHighlight', HighlightDirective);

	HighlightDirective.$inject=['Messages'];
	function HighlightDirective(Messages) {
		return {
			restrict : "A",
			link : HighlightDirectiveLink
		};

		function HighlightDirectiveLink(scope, element, attrs) {
			var originalClasses = element.attr("class");
			scope.$watch(function(){ return Messages.getChangeCount();}, function(newValue, oldValue) {highlightElement();});
			
			function highlightElement() {
				element.attr("class", originalClasses);
				var highlightExpressions = attrs.ngEasyHighlight.split(';');
				var priorityMap = {};
				priorityMap[Messages.FATAL] = 0;
				priorityMap[Messages.ERROR] = 1;
				priorityMap[Messages.WARNING] = 2;
				priorityMap[Messages.INFORMATION] = 3;
				priorityMap[Messages.MESSAGE] = 4;
				
				var elementClass;
				var priority = Infinity;
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
					element.addClass(elementClass);
				}
			}
		}
	}
		
})();