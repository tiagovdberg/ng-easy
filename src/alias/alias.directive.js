(function() {
	angular.module('ngEasy')
		.directive('ngEasyAlias', AliasDirective);

	function AliasDirective() {
		return {
			restrict : "EA",
			link : AliasDirectiveLink
		};

		function AliasDirectiveLink(scope, element, attrs) {
			var aliasAndExpressions = attrs.ngEasyAlias.split(';');
			aliasAndExpressions.forEach(function(aliasAndExpression) {
				var aliasAndExpressionArray = aliasAndExpression.split(' as ');
				if(aliasAndExpressionArray.length != 2) {
					throw "Alias and/or Expression not valid. Format: {alias} as {expression}";
				}
				var alias = aliasAndExpressionArray[0].trim();
				var expression = aliasAndExpressionArray[1].trim();
				scope.$watch(function(){ return scope.$eval(expression);}, function(newValue, oldValue) {scope[alias]=newValue;});
			});
		}
	}
})();