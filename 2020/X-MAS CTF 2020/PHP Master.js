const url = "http://challs.xmas.htsp.ro:3000/?param1=1.0&param2=001"
fetch(url).then((x) => x.text()).then((x) => console.log(x));

// Output : X-MAS{s0_php_m4ny_skillz-69acb43810ed4c42}
