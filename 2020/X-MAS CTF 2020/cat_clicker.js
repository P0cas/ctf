const fetch = require("node-fetch");
fetch('http://challs.xmas.htsp.ro:3003/api/buy.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'item_id=2&state=12%20%7C%201%80%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00H%02%00%00%00%00%00%00%20%7C%201000&hash=f48ccd5768b829f8856ae186eb4bf4a4'
}).then((x) => x.text()).then((x) => console.log(x));

// Output :  X-MAS{1_h4v3_s0_m4ny_c4t5_th4t_my_h0m3_c4n_b3_c0ns1d3r3d_4_c4t_sh3lt3r_aaf30fcb4319effa}