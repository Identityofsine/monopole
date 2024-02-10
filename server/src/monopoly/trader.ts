import { NotificationType, TradeRequest, UUID } from 'shared-types'
import { TradeCommunicationLayer } from './monopoly';
import { Property } from './space';

export interface ITrader {
	createTrade(trade: TradeRequest): UUID.UUID;
	completeTrade(trade_id: UUID.UUID, callback?: ServerNotificationCallback): boolean;
	getTrade(trade_id: UUID.UUID): TradeStorageObject | undefined;
	counterTrade(trade_id: UUID.UUID): TradeStorageObject;
	cancelTrade(trade_id: UUID.UUID): TradeStorageObject | undefined;
}

type Function<A = any, R = any> = (...A: any[]) => R;

type ServerNotificationCallback = Function<Property, void>;

type TradeStorageObject = {
	trade_id: UUID.UUID;
} & TradeRequest;

export class Trader implements ITrader {

	private trades: TradeStorageObject[] = [];

	public constructor(private readonly tcl: TradeCommunicationLayer) {
	}

	public static validTrade(trade: TradeRequest, tcl?: TradeCommunicationLayer): boolean {
		if (trade.dest.trim() === "" && trade.source.trim() === "") return false;
		if (trade.dest === trade.source) return false;
		if (tcl) {
			const dest_player = tcl.getPlayer(trade.dest);
			const source_player = tcl.getPlayer(trade.source);
			if (!dest_player || !source_player) return false;
		}
		return true;
	}

	public createTrade(trade: TradeRequest): UUID.UUID {
		const trade_id = UUID.generateUUID(8337);
		this.trades.push({ trade_id, ...trade });
		return trade_id;
	}

	public completeTrade(trade_id: UUID.UUID, callback?: ServerNotificationCallback): boolean {
		const trade = this.getTrade(trade_id);
		if (!trade) return false;
		const dest_player = this.tcl.getPlayer(trade.dest);
		const source_player = this.tcl.getPlayer(trade.source);
		if (!dest_player || !source_player) return false;

		//swap request and offer
		source_player.giveMoney(dest_player.takeMoney(trade.request.money));
		dest_player.giveMoney(source_player.takeMoney(trade.offer.money));

		trade.request.properties?.forEach((property) => {
			this.tcl.changeOwner(property, source_player);
		});
		trade.offer.properties?.forEach((property) => {
			this.tcl.changeOwner(property, dest_player);
		});

		if (callback) {
			trade.request.properties?.forEach((property) => {
				const prop = this.tcl.getProperty(property);
				if (prop) callback(prop);
			});
			trade.offer.properties?.forEach((property) => {
				const prop = this.tcl.getProperty(property);
				if (prop) callback(prop);
			});
		}

		source_player.notify({ 'type': NotificationType.INFO, message: 'TRADE_ACCEPT', data: `Trade with ${dest_player.name} was successful!` });
		dest_player.notify({ 'type': NotificationType.INFO, message: 'TRADE_ACCEPT', data: `Trade with ${source_player.name} was successful!` });

		dest_player.notify({ 'type': NotificationType.FORMAL, message: 'STATUS_UPDATE', data: { recieved: trade.offer, lost: trade.request } });
		source_player.notify({ 'type': NotificationType.FORMAL, message: 'STATUS_UPDATE', data: { recieved: trade.request, lost: trade.offer } });

		return true;
	}

	public getTrade(trade_id: UUID.UUID): TradeStorageObject | undefined {
		return this.trades.find((trade) => trade.trade_id === trade_id);
	}

	public counterTrade(trade_id: UUID.UUID): TradeStorageObject {
		return this.trades[0];
	}

	public cancelTrade(trade_id: UUID.UUID): TradeStorageObject | undefined {
		const index = this.trades.findIndex((trade) => trade.trade_id === trade_id);
		if (index === -1) {
			return undefined;
		}
		const trade = this.trades[index];
		this.trades.splice(index, 1);
		return trade;
	}


}
