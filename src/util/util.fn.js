(function() {
    angular.easy.property = property;
    angular.easy.$$filterElements = filterElements;

    function property(obj, propertyName, initialValue) {
        var privateAttr = '_' + propertyName;
        obj[privateAttr] = initialValue;

		obj[propertyName] = function(value) {
			if(typeof value === 'undefined') {
				return obj[privateAttr];
			}
			obj[privateAttr] = value;
		};
    }

    function filterElements(elements, expression, strExtractorFn) {
        if(!expression || expression == "*") {
            return elements;
        }
        
        var returnElements = [];
        var startWildcard = expression.startsWith("*");
        var endWildcard = expression.endsWith("*");
        for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
            var element = elements[elementIndex];
            var str;
            if(typeof strExtractorFn !== 'undefined') {
                str = strExtractorFn(element);
            } else {
                str = element;
            }

            if(typeof str !== 'string') {
                continue;
            }

            if(startWildcard && endWildcard) {
                var middleSubstring = expression.substring(1, expression.length - 1);
                if(str.indexOf(middleSubstring) !== -1) {
                    returnElements.push(element);
                }
                continue;
            }
            if(startWildcard) {
                var starterSubstring = expression.substring(1);
                if(str.endsWith(starterSubstring)) {
                    returnElements.push(element);
                }
                continue;
            }
            if(endWildcard) {
                var terminatorSubstring = expression.substring(0, expression.length - 1);
                if(str.startsWith(terminatorSubstring)) {
                    returnElements.push(element);
                }
                continue;
            }

            if(str == expression) {
                returnElements.push(element);
                continue;
            }
        }
        return returnElements;
    }
})();