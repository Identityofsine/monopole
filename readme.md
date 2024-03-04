# Monopole (Monopoly Clone)

**Monopole** is an ambitious web application project that combines a WebSocket Server with a NextJS Frontend to recreate the immersive experience of the classic board game Monopoly on the web.

## Project Goals

The primary goals of Monopole are to provide an enjoyable gaming experience for all players, accommodating various browsers, including mobile. The project is committed to adhering to the official [*Hasbro* rules](https://www.hasbro.com/common/instruct/00009.pdf) governing Monopoly gameplay.

### Current Progress

As of now, Monopole has achieved the following development milestones:

- **Backend Completion:** 80% Finished
- **Frontend Completion:** 20% Finished

These figures provide an overview of the project's overall progress. The aim is to make the game playable when the completion figures reach 95% for the backend and 60% for the frontend.

## Building & Running

For both the client and server, you must clone this repo.

### Client

1. `cd` into the `client` folder
2. Run `npm i`
3. To start the client run `npm run dev`

### Server

1. `cd` into the `server` folder
2. Run `npm i`
3. To start the server run `npm run dev`

### Known Issues So Far

- [ ] Jailed Players can move, very buggy.
- [ ] Declined Requests can stop the gameflow due to the player not having their decisions popped-up.
- [ ] Trade information not available to reciever
- [ ] Turns end right after a decision
