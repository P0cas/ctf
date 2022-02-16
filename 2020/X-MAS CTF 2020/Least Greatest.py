from pwn import *
from subprocess import check_output
from time import sleep

r = remote("challs.xmas.htsp.ro", 6050)
r.recvuntil("1/100\n").strip().split()
def go(_count):
    for a in range(_count):
        num = r.recvline().decode('utf-8').split("= ")[1]
        num1 = r.recvline().decode('utf-8').split("= ")[1]
        print("gcd(x, y) : " + num)
        print("lcm(x, y) : " + num1)
        s_num = int(int(num1)//int(num))
        cmd = "yafu-x64 factor({})".format(s_num)
        out = subprocess.check_output(cmd, shell=True)
        check = out.decode('utf-8')
        length = check.count('P')
        data = []
        for i in range(1, length + 1):
            data.append('')
        j = 0
        for i in range(1, length+1):
            data[j] = check.split('P')[i].split(" =")[1].replace('\n', '').replace('\r', '').replace('ans', '')
            j += 1
        b = []
        k = 0
        for i in range(len(data)):
            if i == 0:
                b.append(data[i])
            if i != 0:
                for j in range(0+k,len(b)):
                    if b[j] != data[i]:
                        b.append(data[i])
                        k += 1           
        Count = len(b)
        count = 2**Count
        print("Round : {}".format(a+1))
        r.sendline(str(count))
        print(r.recvline())
        r.recvline()


if __name__ == '__main__':
    go(100)
    print(r.recv())

# Output : X-MAS{gr347es7_c0mm0n_d1v1s0r_4nd_l345t_c0mmon_mult1pl3_4r3_1n73rc0nn3ct3d}