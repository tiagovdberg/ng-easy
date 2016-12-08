(function() {	
	angular.module('ngEasy').provider('Messages', MessagesProvider);

	function MessagesProvider() {
		var self = this;
		self.messagesMap = {};
		self.$get = MessagesFactory; 
		self.addMessagesMap = addMessagesMap;

		MessagesFactory.$inject= ['$rootScope'];
		function MessagesFactory($rootScope) {
			return new Messages($rootScope, self.messagesMap);
		}
		
		function addMessagesMap(newMessagesMap) {
			var initialPrefix = '';
			_addMessagesMapWithPrefix(initialPrefix, newMessagesMap);
		}

		function _addMessagesMapWithPrefix(prefix, newMessagesMap) {
			for ( var key in newMessagesMap) {
				if (!newMessagesMap.hasOwnProperty(key)) {
					continue;
				}

				var prefixedKey = prefix + key;
				
				if(self.messagesMap[prefixedKey]) {
					//TODO Throw a error?
					continue;
				}
				var value = newMessagesMap[key];
				
				if(typeof value === 'string' || value instanceof String) {
					self.messagesMap[prefixedKey] = value;
					continue;
				}
				
				_addMessagesMapWithPrefix(prefixedKey, value);
			}
		}
	}
	
	function Messages($rootScope, messagesMap) {
		var //const
			FATAL = 'fatal',
			ERROR = 'error',
			WARNING = 'warning', 
			INFORMATION = 'information', 
			MESSAGE = 'message'; 
		
		var self = this;

		self.FATAL = FATAL;
		self.ERROR = ERROR;
		self.WARNING = WARNING;
		self.INFORMATION = INFORMATION;
		self.MESSAGE = MESSAGE;

		self.getChangeCount = getChangeCount;
		self.getMessages = getMessages;
		self.setMessages = setMessages;
		self.addMessage = addMessage;
		self.clearMessages = clearMessages;
		self.handleErrors = handleErrors;
		self.formErrors = formErrors;
		
		init();
		
		function init() {
			self.messagesMap = messagesMap;
			self.messages = [];
			self.changeCount = 0;
//			$rootScope.$on('$routeChangeStart', function(next, current) {expiryMessages();});
		}

		function getChangeCount() {
			return self.changeCount;
		}

		function getMessages(expression) {
			if(!expression || expression == "*") {
				return self.messages;
			}
			
			return angular.easy.$$filterElements(self.messages, expression, function(message) { return message.id; });
		}

		function setMessages(newMessages) {
			self.messages = newMessages;
			self.changeCount++;
		}

		function addMessage(newMessage) {
			if((typeof newMessage.id === 'undefined') || (typeof self.messagesMap[newMessage.id] === 'undefined')) {
				self.messages.push(newMessage);
				self.changeCount++;
				return;
			}
			self.messages.push({id: newMessage.id, text: self.messagesMap[newMessage.id], type: newMessage.type});
			self.changeCount++;
			return;
		}

		function clearMessages() {
			self.messages.length = 0;
			self.changeCount++;
		}
		
		function handleErrors(response) {
			var type = MESSAGE; 

			if(response.status < 200 || response.status >= 600) {
				self.messages.push({"id": response.status ,"text": "Erro não definido", "type": FATAL});
				return;
			}

			if(response.status >= 500 && response.status <= 599) {
				type = FATAL;
			}
			
			if(response.status >= 400 && response.status <= 499) {
				type = ERROR;
			}
			
			if(typeof response.data.text !== 'undefined') {
				addMessage({"id": response.data.text ,"text": response.data.text, "type": type});
				return;
			}
			addMessage({"id": response.status.toString() ,"text": response.statusText, "type": type});
		}

		function formErrors(templateUrl, form) {
			var hasError = false;
			for(var fieldName in form) {
				if(!form.hasOwnProperty(fieldName)) {
					continue;
				}
				if(fieldName === '$error') {
					errorTypeLoop:
					for(var errorTypeName in form.$error) {
						var errorType = form.$error[errorTypeName];
						for(var fieldIndex = 0; fieldIndex < errorType.length; fieldIndex++) {
							var field = errorType[fieldIndex];
							if((typeof field.$name !== 'undefined') && field.$name !== "") {
								continue;
							}
							hasError = true;
							var qualifiedGenericError = templateUrl + "." + form.$name + ".$error." + errorTypeName;
							addMessage({"id": qualifiedGenericError ,"text": qualifiedGenericError, "type": "error"});
							continue errorTypeLoop;
						}
					}
					continue;
				}

				if(fieldName.startsWith("$")) {
					continue;
				}
				for(var formFieldError in form[fieldName].$error) {
					hasError = true;
					var qualifiedError = templateUrl + "." + form.$name + "." + fieldName + "." + formFieldError;
					var noParametersQualifiedError = qualifiedError.replace(/\{.*?=.*?\}/, '{}');
					if(typeof self.messagesMap[noParametersQualifiedError] === 'undefined') {
						addMessage({"id": qualifiedError ,"text": qualifiedError, "type": "error"});
						continue;
					}
					
					var rawMessage = self.messagesMap[noParametersQualifiedError];
					if(qualifiedError === noParametersQualifiedError) {
						addMessage({"id": qualifiedError ,"text": rawMessage, "type": "error"});
						continue;
					}
					var changedMessage = rawMessage;
					var regEx = /\{(.*?)=(.*?)\}/g;
					var regexResult;
					while ((regexResult = regEx.exec(qualifiedError)) !== null) {
						var paramName = regexResult[1];
						var paramValue = regexResult[2];
						changedMessage = changedMessage.replace("\{" + paramName + "\}", paramValue);
					}
					addMessage({"id": qualifiedError ,"text": changedMessage, "type": "error"});
				}
			}
			return hasError;
		}
	}
})();	