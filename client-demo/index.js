var ws = require('ws');

let connection_object = {
	address: 'localhost:8337',
	protocol: 'ws',
}

const possible_responses = {
	ROLL: 0,
	BUY: 1,
	SELL: 2,
	PASS: 3,
	TRADEREQUEST: 4,
	TRADEACCEPT: 5,
	TRADEDENY: 6,
	TRADECANCEL: 7,
	MORTGAGE: 8,
	USEGETOUTOFJAILCARD: 9
}

function convertToStringFromBuffer(buffer) {
	let string = '';
	for (let i = 0; i < buffer.length; i++) {
		string += String.fromCharCode(buffer[i]);
	}
	return string;
}

function safeParse(obj) {
	try {
		return JSON.parse(obj);
	} catch (e) {
		return false;
	}
}


function connectToServer(_uuid) {
	let uuid = _uuid;
	let reconnect = uuid?.length > 0;
	let connection = new ws(`${connection_object.protocol}://${connection_object.address}`);
	connection.on('open', () => {
		console.log('Connection opened');
	});

	connection.on('message', async (_message) => {
		var message = convertToStringFromBuffer(_message);
		const messageObject = safeParse(message);
		console.log(messageObject || message);
		if (messageObject?.response === 'connect') {
			//send connection message
			//intents : create | join
			const expected_type = {
				intent: 'create',
				name: 'TEST'
			}
			connection.send(JSON.stringify(expected_type));
		}

	});
	connection.on('close', () => {
		console.log('Connection closed');
	});
}

async function askForInput(prompt) {
	return new Promise((resolve) => {
		const stdin = process.stdin;
		const stdout = process.stdout;
		stdin.resume();
		stdout.write(prompt);
		stdin.once('data', (data) => {
			resolve(data.toString().trim());
		});
	});
}

function main() {
	//grab args
	const args = process.argv.slice(2);
	let uuid = '';
	if (args.length > 0) {
		uuid = args[0];
		console.log(`Connecting with UUID: ${uuid}`);
	}
	//connect to server
	connectToServer(uuid);
}

main();
