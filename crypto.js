function convertArrayBuffertoString(buffer) {
    var decoder = new TextDecoder("utf-8");
    return decoder.decode(buffer);
}

function convertStringToArrayBuffer(str) {
    var encoder = new TextEncoder("utf-8");
    return encoder.encode(str);
}   

function getEncDecAlgorithm() {
	const iv = new Uint8Array(12)
	for(var i=0; i<iv.length; i++) iv[i] = i
	return {iv, name: "AES-GCM"}
}
	
async function getEncDecKey(password) {
	let keyMaterial = await window.crypto.subtle.importKey(
				"raw",
				convertStringToArrayBuffer(password), 
				{name: "PBKDF2"},
				false, ["deriveBits", "deriveKey"])
	let salt = new Uint8Array(16)
	for(var i=0; i<salt.length; i++) salt[i] = i;
	return await window.crypto.subtle.deriveKey({
			"name": "PBKDF2",
			salt: salt,
			"iterations": 1000,
			"hash": "SHA-256"
		},
		keyMaterial, {
			"name": "AES-GCM",
			"length": 256
		},
		true, ["encrypt", "decrypt"])
}

async function decrypt(encryptedData, password) {
	const key = await getEncDecKey(password)
	const data = await window.crypto.subtle.decrypt(getEncDecAlgorithm(), key, encryptedData)
	return convertArrayBuffertoString(data)
}

async function encrypt(text, password) {
	const key = await getEncDecKey(password)
	return await window.crypto.subtle.encrypt(getEncDecAlgorithm(), key, convertStringToArrayBuffer(text))
}

function uint8ArrayToHex(u8arr) {
	var res = ""
	for (var i = 0; i < u8arr.byteLength; i++) {
		res += u8arr[i].toString(16).padStart(2, "0")
	}
	return res
}

function uint8ArrayFromHex(s) {
	var u8arr = new Uint8Array(Math.ceil(s.length / 2));
	for (var i = 0; i < u8arr.length; i++) {
		u8arr[i] = parseInt(s.substr(i*2, 2), 16);
	}
	return u8arr
}

async function unlockWalletWithPassword(password) {
	const encryptedDataAsHex = localStorage.getItem("encryptedDataAsHex")
	const encryptedDataAsUint8Arr = uint8ArrayFromHex(encryptedDataAsHex)
	try {
		const mnemonic = await decrypt(encryptedDataAsUint8Arr.buffer, password)
		window.Wallet = ethers.Wallet.fromMnemonic(mnemonic)
	} catch(e) {
		return false
	}
	return true
}

async function tryInit() {
	const resp = await fetch("/sw/pw_get")
	const passwordEnc = await resp.text()
	console.log("pw_get", decodeURIComponent(passwordEnc))
	if(passwordEnc.length != 0) {
		await unlockWalletWithPassword(decodeURIComponent(passwordEnc))
	}
}
