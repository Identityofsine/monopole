import { Player } from './player';
import { DecisionType, NotificationEvent, UUID } from 'shared-types';
import { Space } from './space';

export interface MonopolyInterface<T extends object> {
	onNotification(player: object, communicationlayer: T, notification: NotificationEvent): void;
	onPlayerAdded(player: Player, engine_id: UUID.UUID): void;
	onTurnStart(player: Player, engine_id: UUID.UUID): void;
	onBuildingUpdate(space: Space, engine_id: UUID.UUID): void;
}


export type LandInformation = {
	space: Space;
	owner?: UUID.UUID;
	rent?: number; //current rent
	decision?: DecisionType | DecisionType[];
	engine_should_wait: boolean;
}


export { MonopolyEngineCommands } from 'shared-types';

