import { TradeRequest, UUID } from 'shared-types'
import { TradeCommunicationLayer } from './monopoly';

export interface ITrader {
	createTrade(trade: TradeRequest): UUID.UUID;
	completeTrade(): boolean;
	getTrade(trade_id: UUID.UUID): TradeStorageObject | undefined;
	counterTrade(trade_id: UUID.UUID): TradeStorageObject;
	cancelTrade(trade_id: UUID.UUID): TradeStorageObject | undefined;
}

type TradeStorageObject = {
	trade_id: UUID.UUID;
} & TradeRequest;

export class Trader implements ITrader {

	private trades: TradeStorageObject[] = [];
	private tcl: TradeCommunicationLayer;

	public Trader(tcl: TradeCommunicationLayer) {
		this.tcl = tcl;
	}

	public static validTrade(trade: TradeRequest): boolean {
		if (trade.dest.trim() === "" && trade.source.trim() === "") return false;
		if (trade.dest === trade.source) return false;
		//check if dest and source are real players
		return true;
	}

	public createTrade(trade: TradeRequest): UUID.UUID {
		const trade_id = UUID.generateUUID(8337);
		this.trades.push({ trade_id, ...trade });
		return trade_id;
	}

	public completeTrade(): boolean {
		return false;
	}

	public getTrade(trade_id: UUID.UUID): TradeStorageObject | undefined {
		return this.trades.find((trade) => trade.source === trade_id);
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
