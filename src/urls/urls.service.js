(function() {
    angular.module('ngEasy')
        .service('Urls', UrlsService);

    UrlsService.$inject = ['$location'];
    function UrlsService($location) {
        var self = this;
        var protocolUrl = '';
        var hostUrl = '';
        var portUrl = '';
        var pathUrl = '';
        var baseUrl = '';
        var implicitParameters;
        this.getBaseUrl = getBaseUrl;
        this.setBaseUrl = setBaseUrl;
        this.angularUrl = angularUrl;
        this.injectAngularUrls = injectAngularUrls;
        this.serviceUrl = serviceUrl;
        init();

        function init() {
            self.protocolUrl = $location.protocol();
            self.hostUrl = $location.host();
            self.portUrl = ':' + $location.port();
            self.pathUrl = '/api';
            self.baseUrl = self.protocolUrl + '://' + self.hostUrl + self.portUrl + self.pathUrl;
            self.implicitParameters = [{ "name": "media-type", "value": "application/json" }];
        }

        function getBaseUrl() {
            return self.baseUrl;
        }
        
        function setBaseUrl(newBaseUrl) {
        	self.baseUrl = newBaseUrl;
        }

        function addImplicitParameter(parameterName, parameterValue) {
            self.implicitParameters.push({ "name": parameterName, "value": parameterValue });
        }

        function angularUrl(url) {
            url = removeImplicitParameters(url);
            if (url.length === 0) {
                return "#" + $location.path();
            }

            if (url.startsWith("?")) {
                return "#" + $location.path() + url;
            }

            if (url.startsWith("/") && url.startsWith(self.pathUrl)) {
                return "#" + url.substring(self.pathUrl.length);
            }

            if (typeof self.baseUrl === 'undefined' || self.baseUrl.length === 0) {
                return "#" + aUrl;
            }

            if (url.startsWith(self.baseUrl)) {
                return "#" + url.substring(self.baseUrl.length);
            }

            return url;
        }

        function injectAngularUrls(data) {
            if (Array.isArray(data)) {
                var arrayLength = data.length;
                for (var i = 0; i < arrayLength; i++) {
                    injectAngularUrls(data[i]);
                }
                return;
            }
            for (var propertyName in data) {
                if (!data.hasOwnProperty(propertyName)) {
                    continue;
                }
                if (typeof data[propertyName] == "object") {
                    injectAngularUrls(data[propertyName]);
                    continue;
                }

                if (propertyName == 'url') {
                    data.angularUrl = angularUrl(data[propertyName]);
                    continue;
                }
                var indexOf = propertyName.indexOf("Url");
                if (indexOf == -1) {
                    continue;
                }
                var angularUrlPropertyName =
                    propertyName.substring(0, indexOf) +
                    "AngularUrl" +
                    propertyName.substring(indexOf + 3);
                data[angularUrlPropertyName] = angularUrl(data[propertyName]);
            }
        }

        function serviceUrl() {
            var url = self.baseUrl + $location.url();
            var parameters = $location.search();
            var firstParameter = (Object.keys(parameters).length === 0);
            var implicitParametersLength = self.implicitParameters.length;
            for (var implicitParameterIndex = 0; implicitParameterIndex < implicitParametersLength; implicitParameterIndex++) {
                var implicitParameter = self.implicitParameters[implicitParameterIndex];
                var implicitParameterName = implicitParameter.name;
                var implicitParameterValue = implicitParameter.value;
                if (parameters[implicitParameterName]) {
                    continue;
                }
                if (firstParameter) {
                    url += "?";
                    firstParameter = false;
                } else {
                    url += "&";
                }
                url += implicitParameterName + "=" + implicitParameterValue;
            }
            return url;
        }

        function removeImplicitParameters(url) {
            var implicitParametersLength = self.implicitParameters.length;
            for (var implicitParameterIndex = 0; implicitParameterIndex < implicitParametersLength; implicitParameterIndex++) {
                var implicitParameter = self.implicitParameters[implicitParameterIndex];
                url = removeParameter(url, implicitParameter.name, implicitParameter.value);
            }
            return url;
        }

        function removeParameter(url, parameterNameToRemove, parameterValueToRemove) {
            if (url.indexOf("?") == -1) {
                return url;
            }
            var splitedUrl = url.split("?");
            var requestUri = splitedUrl[0];
            var queryString = splitedUrl[1];
            var parameters = queryString.split("&");
            for (var i = parameters.length - 1; i >= 0; i -= 1) {
                var parameterNameAndValue = parameters[i].split("=");
                var parameterName = parameterNameAndValue[0];
                var parameterValue = parameterNameAndValue[1];
                if (
                    (parameterName == parameterNameToRemove) &&
                    (!(parameterValueToRemove) ||
                        (parameterValueToRemove == parameterValue)
                    )
                ) {
                    parameters.splice(i, 1);
                }
            }
            if (parameters.length === 0) {
                return requestUri;
            }

            return requestUri + "?" + parameters.join("&");
        }
    }

})();