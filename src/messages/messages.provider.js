(function() {
	var //const
		UNDEFINED = 'undefined';

	angular.module(angular.easy.$moduleName).provider(angular.easy.$providersPrefix + 'Messages', MessagesProvider);

	function MessagesProvider() {
		var self = this;
		self.messagesMap = {};
		self.$get = MessagesFactory; 
		self.addMessagesMap = addMessagesMap;

		function MessagesFactory() {
			return new Messages(self.messagesMap);
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

	
	Messages.$inject = [];
	function Messages(messagesMap) {
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
		self.addMessage = addMessage;
		self.clearMessages = clearMessages;
		self.handleErrors = handleErrors;
		self.formErrors = formErrors;
		self.validate = validate;
		
		init();
		
		function init() {
			self.messagesMap = messagesMap;
			self.messages = [];
			self.changeCount = 0;
		}

		function getChangeCount() {
			return self.changeCount;
		}

		function getMessages(expression) {
			if((typeof expression === UNDEFINED) || expression === "*") {
				return self.messages;
			}
			
			return angular.easy.$$filterElements(self.messages, expression, function(message) { return message.id; });
		}

		function addMessage(newMessage) {
			if((typeof newMessage.id === UNDEFINED) || (typeof self.messagesMap[newMessage.id] === UNDEFINED)) {
				self.messages.push(newMessage);
				self.changeCount++;
				return;
			}
			self.messages.push({id: newMessage.id, text: self.messagesMap[newMessage.id], type: newMessage.type});
			self.changeCount++;
			return;
		}

		function clearMessages() {
			self.messages.forEach(function(item, index, object) {
				  if (item.persistent) {
					  delete item.persistent;
				  } else {
					  object.splice(index, 1);
				  }
			});
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
			
			if(typeof response.data.text === UNDEFINED) {
				addMessage({"id": response.status.toString() ,"text": response.statusText, "type": type});
				return;
			}
			addMessage({"id": response.data.text ,"text": parameterizeMessage(response.data.text, self.messagesMap), "type": type});
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
							if((typeof field.$name !== UNDEFINED) && field.$name !== "") {
								continue;
							}
							hasError = true;
							var qualifiedGenericError = templateUrl + "." + form.$name + ".$error." + errorTypeName;
							addMessage({"id": qualifiedGenericError ,"text": qualifiedGenericError, "type": ERROR});
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
					addMessage({"id": qualifiedError ,"text": parameterizeMessage(qualifiedError, self.messagesMap), "type": ERROR});
				}
			}
			return hasError;
		}

		function validate(condition, message) {
			var hasError = evalFunctionOrValue(condition);
			if (!hasError) {
				return hasError;
			}
			addMessage({"id": message.id ,"text": parameterizeMessage(message.id, self.messagesMap), "type": message.type});
			return hasError;
		}

		function parameterizeMessage(qualifiedError, messagesMap) {
			var noParametersQualifiedError = qualifiedError.replace(/\{.*?=.*?\}/, '{}');
			var rawMessage = messagesMap[noParametersQualifiedError];
			if(typeof rawMessage === UNDEFINED) {
				return qualifiedError;
			}
			
			if(qualifiedError === noParametersQualifiedError) {
				return rawMessage;
			}
			var changedMessage = rawMessage;
			var regEx = /\{(.*?)=(.*?)\}/g;
			var regexResult;
			while ((regexResult = regEx.exec(qualifiedError)) !== null) {
				var paramName = regexResult[1];
				var paramValue = regexResult[2];
				changedMessage = changedMessage.replace("\{" + paramName + "\}", paramValue);
			}
			return changedMessage;
		}

	}

	function evalFunctionOrValue(functionOrValue) {
		if ((typeof functionOrValue === 'function') || (functionOrValue instanceof Function)) {
			return functionOrValue();
		}
		return functionOrValue;
	}
})();	
