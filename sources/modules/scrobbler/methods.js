mod.methods = {
    auth: {},
    track: {}
};

mod.methods.auth.getSession = function(token, callback){
    mod.session = null;

    var params = {
        method: 'auth.getSession',
        token: token
    }

    ext.modules.scrobbler.request(params, function(response){
        if (typeof response.session == 'object'){
            //mod.log('response.session.key', response.session.key);

            mod.session = response.session;
            mod.log('mod.methods.auth.getSession ** mod.session', mod.session);

            chrome.storage.local.get('scrobbler', function(storage){
                storage.scrobbler.session = response.session;
                chrome.storage.local.set(storage, function(){
                    if (typeof callback == 'function')
                        callback();
                });
            });
        }
    });
}

mod.methods.track.updateNowPlaying = function(params, callback){
    if (typeof params !== 'object'){
        mod.warn('Параметры не заданы')
        return false;
    }

    params.method = 'track.updateNowPlaying';

    ext.modules.scrobbler.request(params, function(response){
        // mod.log('updateNowPlaying:', response);

        if (typeof callback == 'function')
            callback(response);

    }, true);
}

mod.methods.track.scrobble = function(params, callback){
    if (typeof params !== 'object'){
        mod.warn('Параметры не заданы')
        return false;
    }

    params.method = 'track.scrobble';

    ext.modules.scrobbler.request(params, function(response){
        mod.log('track.scrobble:', response);

        if (typeof callback == 'function')
            callback(response);

    }, true);
}