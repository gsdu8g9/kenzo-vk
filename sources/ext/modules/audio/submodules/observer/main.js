core.events.on_audio_play = new kk.Event();

sub.audio_player_keys = [];
sub.actions = {
    register: sub.full_name + '.register',
    set_key: sub.full_name + '.set_key',
    update: sub.full_name + '.update'
}

sub.init__content = () => {
    sub.key = kk.generate_key(15);

    browser.runtime.sendMessage({
        action: sub.actions.set_key,
        key: sub.key
    });

    sub.make_provider(sub.key);
}

sub.init__background = () => {
    sub.conductor();
}
