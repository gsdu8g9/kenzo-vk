mod.init__background = function() {
    mod.tabs = [];

    // From Content Script —
    browser.runtime.onConnect.addListener(function(port) {
        if (port.name !== mod.full_name) return;

        var current_tab = {};

        port.onMessage.addListener(awaiting_registration_request);

        function awaiting_registration_request(message) {
            if (message.action != 'register content') return;

            var match = false;
            var tab = {
                id: port.sender.tab.id,
                key: kk.generate_key(15),
                port_of_content: port
            }

            each (mod.tabs, function(item, index) {
                if (item.id === tab.id) {
                    match = index;
                    return true;
                }
            });

            if (typeof match === 'number')
                current_tab = mod.tabs[match] = tab;
            else {
                mod.tabs.push(tab);
                current_tab = mod.tabs[mod.tabs.length - 1];
            }

            mod.log('confirm the registration');

            // Остановка слушателя
            port.onMessage.removeListener(awaiting_registration_request);

            // Новый слушатель
            port.onMessage.addListener(after_registration);

            // Отправка подтверждения, идентификатора вкладки и ключа
            port.postMessage({
                action: 'confirm the registration',
                tab_id: current_tab.id,
                key: current_tab.key
            });
        }

        function after_registration(message) {
            if (message.action == 'get') {
                if (typeof message.key !== 'string') return;
                if (typeof message.value !== 'string') return;

                var response = {
                    action: 'get:response',
                    key: message.key
                }

                mod.get(message.value, current_tab).then(function(proxy_response) {
                    response.value = proxy_response.value;
                    response.meta = proxy_response.meta;
                    port.postMessage(response);
                }, function(proxy_response) {
                    response.error = proxy_response;
                    port.postMessage(response);
                });

            } else
                mod.log('incoming message from CS', message);
        }

        port.onDisconnect.addListener(function() {
            mod.log('onDisconnect', arguments);
        });
    });

    // From Page — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — —
    browser.runtime.onConnectExternal.addListener(function(port) {
        if (port.name !== mod.full_name) return;

        var current_tab = {};

        port.onMessage.addListener(awaiting_registration_request);

        function awaiting_registration_request(message) {
            if (message.action != 'register page') return;

            each (mod.tabs, function(tab, index) {
                if (tab.id !== message.tab_id) return;
                if (tab.key !== message.key) return;

                // Удаление ключа (больше не нужен)
                delete tab.key;

                // Остановка слушателя
                port.onMessage.removeListener(awaiting_registration_request);

                // Новый слушатель
                port.onMessage.addListener(after_registration);

                tab.port_of_page = port;
                current_tab = mod.tabs[index];

                // Отправка подтверждения
                port.postMessage({
                    action: 'confirm the registration'
                });

                // Оповестить CS об успешном подключении
                current_tab.port_of_content.postMessage({
                    action: 'page is connected'
                });

                mod.on_loaded.dispatch();

                return true;
            }, function() {
                // Совпадений нет
                mod.warn('unknow request');
            });
        }

        var ignore_actions = [
            'get:response',
            'get:response-from-page'
        ]

        function after_registration(message) {
            each (ignore_actions, function(item) {
                if (message.action === item)
                    return true;
            }, function() {
                mod.log('incoming message from page', message);
            });
        }

        port.onDisconnect.addListener(function() {
            mod.log('onDisconnect (External)', arguments);
        });

    });
}
