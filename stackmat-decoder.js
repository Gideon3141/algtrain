// stackmat-decoder.js
import { Stackmat } from 'https://esm.sh/stackmat';

export class StackmatDecoder {
    constructor() {
        this.stackmat = new Stackmat();
        this.lastState = "stopped";
    }

    start(callback) {
        this.stackmat.on('packetReceived', (packet) => {
            if (!packet.isValid) return;

            let currentState = packet.status === ' ' ? 'running' : 'stopped';

            if (currentState !== this.lastState) {
                this.lastState = currentState;

                // Send the state AND the exact string from the timer hardware
                callback({ 
                    state: currentState, 
                    timeStr: packet.timeAsString,
                    timeMs: packet.timeInMilliseconds
                });
            }
        });
        this.stackmat.start();
    }

    stop() {
        this.stackmat.stop();
        this.lastState = "stopped";
    }
}