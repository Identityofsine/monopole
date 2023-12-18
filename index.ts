import { Monopoly, MonopolyEngine, Pair } from "./src/monopoly/monopoly";
import { MonopolyError } from "./src/monopoly/monopoly.error";
import { MonopolyInterface, NotificationType } from "./src/monopoly/monopoly.types";

const game = new MonopolyEngine();

const IMonopoly: MonopolyInterface = {
	onNotification(player, communicationlayer, notification) {
		/*
		const type = notification.type;
		const message = notification.message;
		if (notification.type === NotificationType.DECISION) {
			const decision = notification.decision;
			if (!decision) throw new MonopolyError('No decision provided');
			if (typeof decision === 'string') {
				if (decision == 'roll') {
					const roll: Pair = communicationlayer.rollDice();
					console.log('[MI][player:%s] rolled %d', player.Name, roll.dice1 + roll.dice2);
					communicationlayer.move(roll.dice1 + roll.dice2);
				}
			} else {
				if (decision.includes('ignore')) {
					console.log('[MI][player:%s] ignoring', player.Name);
				}
			}
		}
		if (notification.type === NotificationType.INFO) {
			console.log('[MI][INFO][player:%s] %s', player.Name, notification.message);
		}
		*/
		//do nothing
	}
}


game.addPlayer('Player 1', IMonopoly);
game.addPlayer('Player 2', IMonopoly);

game.start();
