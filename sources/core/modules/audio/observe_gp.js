(function(kzvk){
'use strict';
//  – — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — —|

var mod = kzvk.modules.audio;

var gp = {
    dom: {},
    complete: false
};

// Регистрация и Отлов изменений глобального плеера
mod.observe_gp = function(element){
    //console.log('--observe_gp!');

    if (!(element instanceof Element))
        return false;

    if (gp.dom.self instanceof Element)
        return false;

    gp.dom.self = element;

    mod.make_provider(mod.provider_key);

    // FIX: не очень красиво сие
    var observer = new MutationObserver(function(mutations){
        each (mutations, function(mr){
            // Если плеер ещё не создан полностью
            if (mr.target.getAttribute('id') === 'gp_play_btn'){
                gp.dom.button = mr.target;
            } else if (mr.target.getAttribute('id') === 'gp_performer'){
                gp.dom.performer = mr.target;
            } else if (mr.target.getAttribute('id') === 'gp_title'){
                gp.dom.title = mr.target;
            }
        });

        if (
            (gp.dom.button instanceof Element) &&
            (gp.dom.performer instanceof Element) &&
            (gp.dom.title instanceof Element)
        ){
            observer.disconnect();
        }

    });

    observer.observe(gp.dom.self, {childList: true, subtree: true, attributes: true});
}

mod.observe_gb_button = function(){
    var observer = new MutationObserver(function(mutations){
        each (mutations, function(mr){
            if (mr.type === 'childList'){
                console.log('-- ADD', mr);

            } else if (mr.type === 'attributes'){
                console.log('-- ATTR', mr);

            }
        });
    });

    observer.observe(gp.dom.button, {childList: true, subtree: true, attributes: true});
}

mod.make_provider = function(key) {
    var provider = document.createElement('script');

    // Объект, передаваемый в формате JSON изолированной функции
    var _ = {
        id: chrome.runtime.id,
        message: {
            action: 'register provider',
            key: key
        }
    }

    // Функция-провайдер, передаваемая во внешний скрипт в форме текста
    // Работает только в контексте страницы.
    var isolated_function = function(_){
        var secret_key = null;

        var ap_observer = function(changes){
            //console.log('** changes:', changes);
            var track = audioPlayer.lastSong;

            var info = {
                current_time: audioPlayer.curTime,
                id: track.aid,
                duration: track[3],
                performer: track[5],
                title: track[6]
            }

            chrome.runtime.sendMessage(_.id, {
                action: 'audio status update',
                key: secret_key,
                info: info
            });
        }

        chrome.runtime.sendMessage(_.id, _.message, function(){
            if (typeof arguments[0] === 'string'){
                secret_key = arguments[0];
                if (typeof audioPlayer === 'object'){
//                    console.log('audioPlayer', audioPlayer);

                    Object.observe(audioPlayer, function(changes){
                        try { // FIXME: временно для отлова ошибок внутри Object.observe();
                            ap_observer(changes);
                        } catch (error) {
                            console.error(error);
                        }
                    });
                }
            }
        });
    };

    provider.innerHTML = '(' + isolated_function + ')(' + JSON.stringify(_) + ')'

    mod.dom.body.appendChild(provider);
    // Сразу после создания DOM-объекта, функция выполняется.
    // Проверка показала, что скрипт-провайдер выполняется в первую очередь
    // и маловероятно, что чужеродный скрипт (eve.js) может сымитировать поведение
    // провайдера, прежде, чем последний будет выполнен (обменяется ключами с расширением).
}

})(kzvk);