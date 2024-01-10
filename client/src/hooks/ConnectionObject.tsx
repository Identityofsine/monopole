'use client';

import { Connection } from "@/obj/connection";
import { ConnectionHandler } from "@/obj/connectionmanager";
import { WebSocketConnection } from "@/obj/listener";
import { useEffect, useState } from "react";

function useConnectionObject(uri: string) {

	const [connection, setConnectionObject] = useState<ConnectionHandler | null>(null);

	useEffect(() => {
		if (connection) return;
		const ws_connect: Connection = new WebSocketConnection(uri);
		const _connection = ConnectionHandler.getInstance(ws_connect);
		setConnectionObject(_connection);

	}, [])

	return connection;

}

export default useConnectionObject;
