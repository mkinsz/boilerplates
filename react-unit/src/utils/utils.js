export const getUrlLast = url => {
	const site = url.lastIndexOf('/');
	return url.substring(site + 1, url.length);
};

const scrubHexData = hexData => {
	var scrubbedHexData;

	scrubbedHexData = hexData.replace(/,/g, ' ');
	scrubbedHexData = scrubbedHexData.replace(/0x/g, ' ');
	scrubbedHexData = scrubbedHexData.replace(/\t/g, ' ');
	scrubbedHexData = scrubbedHexData.replace(/(\r\n|\n|\r)/gm, ' ');
	scrubbedHexData = scrubbedHexData.replace(/ +/g, ' ');
	scrubbedHexData = scrubbedHexData.toUpperCase();
	scrubbedHexData = scrubbedHexData.trim();
	scrubbedHexData = scrubbedHexData.split(' ');

	return scrubbedHexData;
}

const convertToIntArray = stringArray => {
	var arrayData = [];
	for (var i = 0; i < stringArray.length; i++)
		arrayData[i] = parseInt(stringArray[i], 16);
	return arrayData;
}

const convertToHexString = (dataArray, addCommas, addHex, addLineBreaks) => {
	var comma;
	var newLine;
	var hexPrefix;
	var hexString = new Array();
	var lastByte = dataArray.length - 1;
	for (var index = 0; index < dataArray.length; index++) {
		if (addCommas && index != lastByte) {
			comma = ',';
		} else {
			comma = '';
		}

		if (addHex) {
			hexPrefix = '0x';
		} else {
			hexPrefix = '';
		}
		if (addLineBreaks && index % 16 == 15 && index != lastByte) {
			newLine = '\n';
			if (index % 128 == 127) {
				newLine += '\n';
			}
		} else {
			newLine = '';
		}
		hexString[index] =
			hexPrefix +
			pad(dataArray[index].toString(16).toUpperCase(), 2) +
			comma +
			newLine;
	}

	return hexString.join(' ');
}

const pad = (num, size) => {
	var s = num + '';
	while (s.length < size) s = '0' + s;
	return s;
}

export const ip2num = ip => {
	ip = ip.split(".");
	const num = parseInt(ip[0]) * Math.pow(256, 3) + parseInt(ip[1]) * Math.pow(256, 2) + parseInt(ip[2]) * 256 + parseInt(ip[3]);
	return num >>> 0;
}

export const num2ip = num => {
	const a = new Array();
	a[0] = (num >>> 24) >>> 0;
	a[1] = (num << 8) >>> 24;
	a[2] = (num << 16) >>> 24;
	a[3] = (num << 24) >>> 24;
	return a.join(".");
}

export const offset_top = obj => {
	if (!obj) return 0;
	let t = obj.offsetTop;
	let v = obj.offsetParent;
	while (v) {
		t += v.offsetTop;
		v = v.offsetParent;
	}
	return t;
}

const offset_left = obj => {
	if (!obj) return 0;
	let t = obj.offsetLeft;
	let v = obj.offsetParent;
	while (v) {
		t += v.offsetLeft;
		v = v.offsetParent;
	}
	return t;
}

// let address = '';
// const uid = address + pid + now().toString(36);
// const process = pid + now().toString(36)
// const time = now().toString(36)

// const pid = process && process.pid ? process.pid.toString(36) : '';

// if (typeof __webpack_require__ !== 'function') {
// 	const mac = '', networkInterfaces = require('os').networkInterfaces();
// 	for (let interface_key in networkInterfaces) {
// 		const networkInterface = networkInterfaces[interface_key];
// 		const length = networkInterface.length;
// 		for (let i = 0; i < length; i++) {
// 			if (networkInterface[i].mac && networkInterface[i].mac != '00:00:00:00:00:00') {
// 				mac = networkInterface[i].mac; break;
// 			}
// 		}
// 	}
// 	address = mac ? parseInt(mac.replace(/\:|\D+/gi, '')).toString(36) : '';
// }

const now = () => {
	var time = Date.now();
	var last = now.last || time;
	return now.last = time > last ? time : last + 1;
}

export const swap = (a, i, j) => {
    a[i] = a.splice(j, 1, a[i])[0]
}

export const toTop = (a, i) => {
    if (i) a.unshift(a.splice(i, 1)[0])
}

export const toBottom = (a, i) => {
    a.push(a.splice(i, 1)[0])
}

export const toUp = (a, i) => {
    if (i) a[i] = a.splice(i - 1, 1, a[i])[0]
    else a.push(a.shift())
}

export const toDown = (a, i) => {
    if (i != a.length - 1) a[i] = a.splice(i + 1, 1, a[i])[0];
    else a.unshift(a.splice(i, 1)[0])
}

const check_length = str => {
	let len = 0;
	Array.from(str).map(m => {
		/[\u4e00-\u9fa5]/.test(m) ? len +=3 : len++;
	})
	return len;
}