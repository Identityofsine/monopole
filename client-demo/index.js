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

/**
	* @param {[]} responses
	*/
async function handleVariousResponses(response, game_uuid, user_uuid) {
	let i = 0;
	console.log("-".repeat(10));
	for (i = 0; i < response.length; i++) {
		console.log("[%i] %s", i, response[i]);
	}
	console.log("Please select a response: ");
	console.log("-".repeat(10));
	const responseIndex = parseInt(await askForInput("Response: "));
	return {
		intent: 'response',
		game_uuid: game_uuid,
		uuid: user_uuid,
		decision: response[responseIndex]
	}

}


function connectToServer(_uuid) {
	let uuid = _uuid;
	let user_uuid = '';
	let creating_server = uuid?.length <= 0;
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
			if (creating_server) {
				connection.send(JSON.stringify({
					intent: 'create',
					name: 'TEST'
				}));

			} else {
				connection.send(JSON.stringify({
					intent: 'join',
					name: 'CONNECTOR',
					game_uuid: uuid
				}));
			}
		}
		if (messageObject?.response === 'id') {

			//message: { player_uuid: player.UUID, game_uuid: game.engine.ID },
			user_uuid = messageObject.message.object.player_uuid;
			uuid = messageObject.message.object.game_uuid;
			console.log(`User UUID: ${user_uuid}`);
			if (!creating_server) return;
			await askForInput('Press any key to start...');
			connection.send(JSON.stringify({
				intent: 'command',
				command: 'start',
				game_uuid: uuid,
				uuid: user_uuid
			}));
		}
		if (messageObject?.response === 'respond') {
			//messageObject?.decision : DecisionType | DecisionType[]
			if (messageObject?.decision) {
				const decision = messageObject?.decision;
				if (typeof decision === 'string') {
					if (decision === 'roll') {
						await askForInput('Roll (Press any key): ');
						connection.send(JSON.stringify({
							intent: 'response',
							state: 'turn',
							game_uuid: uuid,
							uuid: user_uuid,
							decision: 'roll'
						}));

					} else {
						const response = await handleVariousResponses([decision], uuid, user_uuid);
						connection.send(JSON.stringify(response));
					}
				} else if (Array.isArray(decision)) {
					const response = await handleVariousResponses(decision, uuid, user_uuid);
					connection.send(JSON.stringify(response));
				}
			}
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
