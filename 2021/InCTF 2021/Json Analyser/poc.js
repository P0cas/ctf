const config = require('config-handler')();
console.log("=========After prototype pollution, A value for config variable=========");
console.log('(A) config : ', config);

console.log("=========After prototype pollution, A value for pollution variable=========");
console.log(`(A) pollution : ${pollution}`);