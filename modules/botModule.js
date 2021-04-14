import { getProxy } from  "./proxyManager.js"
import { getConfig } from  "../server.js"
import WebSocket from 'ws';
//import * as fs from 'fs';
const defaultHeaders = {};

console.log('Bots made by DaRealSh0T');
console.log('Updated by keksbyte : ) ) ');

defaultHeaders["Accept-Encoding"] = "gzip, deflate";
defaultHeaders["Accept-Language"] = "en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7";
defaultHeaders["Cache-Control"] = "no-cache";
defaultHeaders["Connection"] = "Upgrade";
defaultHeaders["Cookie"] = "__cfduid=d557d93bdc916c9975b9a56a883e425021533342031; _ga=GA1.2.115770575.1533950899";
defaultHeaders["Pragma"] = "no-cache";
defaultHeaders["Sec-WebSocket-Extensions"] = "permessage-deflate; client_max_window_bits";
defaultHeaders["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.81 Safari/537.36";

let config = {};

/*if (fs.existsSync('./getConfig().json')) {
	fs.readFile('./getConfig().json', (err, data) => {
		let text = Buffer.from(data).toString();
		config = JSON.parse(text);
		proxyManager.scrapeProxys(getConfig().useProxyApi);
	});
} else {
	let _default = {};
	_default.botNames = ["Sh0T's Bots", "Free Bots"];
	_default.accounts = [""];
	_default.useProxyApi = true;
	_default.useAccount = false;
	_default.maxBots = 100;
	fs.writeFile('getConfig().json', Buffer.from(JSON.stringify(_default, null, 2)), () => {});
	config = _default;
}*/

 class Bot {

	constructor(origin) {
		this.headers = JSON.parse(JSON.stringify(defaultHeaders));
		this.originSplit = origin.split('/')[2];
		this.nameInterval = null;
		this.proxy = getProxy();
		this.origin = origin;
		this.stopped = true;
		this.ws = null;
		this.ip = null;
		this.sId = 0;
	}

	connect(ip, balz) {
		if (!balz && this.originSplit == 'balz.io') return this.balz(ip);
		this.stopped = false;
		this.ip = ip;
		this.headers.Origin = this.origin;
		this.ws = new WebSocket(ip, {
			headers: this.headers,
			agent: this.proxy
		});
		this.ws.binaryType = 'nodebuffer';
		this.ws.onopen = this.onopen.bind(this);
		this.ws.onmessage = this.onmessage.bind(this);
		this.ws.onerror = this.onerror.bind(this);
		this.ws.onclose = this.onclose.bind(this);
	}

	balz(ip) {
		let finIp = ip.split('?')[0];
		let ws = new WebSocket('wss://balz.io/gateway', {
			agent: this.proxy
		});
		ws.onclose = ws.onerror = ws.onopen = () => {};
		ws.onmessage = msg => {
			msg = JSON.parse(msg.data);
			switch (msg[0]) {
				case 0:
					this.sId = msg[1][0];
					finIp += '?session=' + msg[1][1];
					this.connect(finIp, true);
					break;
				case 1:
					ws.send('[1]');
					break;
			}
		};
	}

	onopen() {
		let inits = Buffer.alloc(5);
		inits.writeUInt8(254, 0);
		switch (this.originSplit) {
			case 'agariohub.io':
			case 'agar.bio':
			case '*.agar.bio':
			case 'bomb.agar.bio':
			case 'm.agar.bio':
			case 'play.agario0.com':
				inits.writeUInt32LE(1, 1);
				break;
			case 'cellcraft.io':
			case 'www.cellcraft.io':
			case 'army.ovh':
				inits.writeUInt32LE(5, 1);
				break;
			case 'targ.io':
			case 'balz.io':
				inits.writeUInt32LE(6, 1);
				break;
			case 'senpa.io':
				let strings = ['onxcnk_101', Math.random().toString(36).substr(2, 5)];
				let stringsLen = 0;
				strings.map(a => stringsLen += a.length * 2);
				inits = Buffer.alloc(1 + strings.length * 2 + stringsLen);
				var i = 0;
				inits.writeUInt8(252, i++);
				strings.forEach(string => {
					inits.writeUInt16LE(string.length, i);
					i += 2;
					inits.write(string, i, 'ucs2');
					i += string.length * 2;
				});
				break;
		}
		this.send(inits);

		inits = Buffer.alloc(5);
		inits.writeUInt8(255, 0);
		switch (this.originSplit) {
			case 'agariohub.io':
			case 'agar.bio':
			case '*.agar.bio':
			case 'bomb.agar.bio':
			case 'm.agar.bio':
			case 'army.ovh':
			case 'play.agario0.com':
				inits.writeUInt32LE(1332175218, 1);
				if (getConfig().useAccount && this.originSplit == 'agariohub.io') this.agarHubLogin();
				break;
			case 'cellcraft.io':
			case 'www.cellcraft.io':
				inits.writeUInt32LE(1332775218, 1);
				break;
			case 'targ.io':
			case 'balz.io':
				inits.writeUInt32LE(1, 1);
				break;
			case 'senpa.io':
				let strings = [getConfig().botNames[Math.floor(Math.random() * getConfig().botNames.length)], '', '', '', ''];
				let stringsLen = 0;
				strings.map(a => stringsLen += a.length * 2);
				inits = Buffer.alloc(1 + strings.length * 2 + stringsLen);
				var i = 0;
				inits.writeUInt8(30, i++);
				strings.forEach(string => {
					inits.writeUInt16LE(string.length, i);
					i += 2;
					inits.write(string, i, 'ucs2');
					i += string.length * 2;
				});
				this.send(new Buffer.from([130]));
				break;
		}
		this.send(inits);

		switch (this.originSplit) {
			case 'cellcraft.io':
			case 'www.cellcraft.io':
				this.send(Buffer.from([42]));
				break;
			case 'balz.io':
				setInterval(() => {
					this.send(Buffer.from([254]));
				}, 1000);
		}

		this.spawn();
		this.nameInterval = setInterval(() => {
			this.spawn();
		}, 3000);
	}

	agarHubLogin() {
		let account = getConfig().accounts[Math.floor(Math.random() * getConfig().accounts.length)];
		let loginBuffer = Buffer.alloc(1 + Buffer.byteLength(account, 'ucs2'));

		loginBuffer.writeUInt8(30, 0);
		loginBuffer.write(account, 1, 'ucs2');
		this.send(loginBuffer);
	}

	nameBypass() {
		function _0x67e0x24(_0x67e0x3) {
			for (var _0x67e0x4 = _0x67e0x3; _0x67e0x4 >= 36;) {
				_0x67e0x4 = ~~(_0x67e0x4 / 36) + _0x67e0x4 % 36
			};
			return _0x67e0x4.toString(36)
		}
		var _0x67e0x3 = Math.round(Date.now() / 1e3) % 1e3,
			_0x67e0x4 = 1e3 * (1e3 * (100 + Math.floor(900 * Math.random())) + _0x67e0x3) + (100 + Math.floor(900 * Math.random()));
		return _0x67e0x24(_0x67e0x4) + _0x67e0x4.toString(36) + function (_0x67e0x3) {
			var _0x67e0x4 = 1 / _0x67e0x3;
			for (; _0x67e0x4 < 100;) {
				_0x67e0x4 *= 19
			};
			return _0x67e0x24(~~_0x67e0x4)
		}(_0x67e0x4)
	}

	spawn() {
		let name = getConfig().botNames[Math.floor(Math.random() * getConfig().botNames.length)];
		let spawnBuffer = null;
		switch (this.originSplit) {
			case 'agariohub.io':
				name = this.nameBypass() + '&' + name;
			case 'agar.bio':
			case '*.agar.bio':
			case 'bomb.agar.bio':
			case 'm.agar.bio':
			case 'agarios.org':
			case 'army.ovh':
			case 'play.agario0.com':
				spawnBuffer = Buffer.alloc(1 + Buffer.byteLength(name, 'ucs2'));
				spawnBuffer.write(name, 1, 'ucs2');
				break;
			case 'cellcraft.io':
			case 'www.cellcraft.io':
				spawnBuffer = Buffer.alloc(3 + Buffer.byteLength(name, 'ucs2'));
				spawnBuffer.writeUInt16LE(59, 1);
				spawnBuffer.write(name, 3, 'ucs2');
				break;
			case 'targ.io':
				spawnBuffer = Buffer.alloc(1 + Buffer.byteLength(name, 'utf8'));
				spawnBuffer.write(name, 1, 'utf8');
				break;
			case 'senpa.io':
				this.send(new Buffer.from([130]));
				spawnBuffer = Buffer.from([31]);
				break;
			case 'balz.io':
				name = '(' + this.sId + ')' + name;
				spawnBuffer = Buffer.alloc(1 + Buffer.byteLength(name, 'utf8'));
				spawnBuffer.write(name, 1, 'utf8');
				break;
		}
		this.send(spawnBuffer);
	}

	sendChat(message) {
		let chatBuffer;
		switch (this.originSplit) {
			case 'agar.bio':
			case '*.agar.bio':
			case 'cellcraft.io':
			case 'www.cellcraft.io':
			case 'bomb.agar.bio':
			case 'm.agar.bio':
			case 'agarios.org':
			case 'army.ovh':
			case 'play.agario0.com':
				chatBuffer = Buffer.alloc(2 + message.length * 2);
				chatBuffer.writeUInt8(99, 0);
				chatBuffer.write(message, 2, 'ucs2');
				break;
			case 'balz.io':
			case 'targ.io':
				chatBuffer = Buffer.alloc(3 + message.length);
				chatBuffer.writeUInt8(99, 0);
				chatBuffer.write(message, 2, 'utf8');
				break;
		}
		this.send(chatBuffer);
	}

	onmessage(message) {} //not needed at the moment

	close() {
		this.stopped = true;

		if (this.ws) this.ws.close();
	}

	onclose(error) {
		clearInterval(this.nameInterval);
		if (this.stopped) return;
		this.proxy = getProxy();

		if (this.ip)
			this.connect(this.ip);
	}

	onerror(error) {}

	send(buffer) {
		if (this.ws && this.ws.readyState == 1)
			this.ws.send(buffer);
	}

}

export { Bot };