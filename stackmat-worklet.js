// stackmat-worklet.js
class StackmatProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Dynamic sample rate fixes the bit-drifting ("Cmd: Á" bug)
        this.samplesPerBit = sampleRate / 1200; 
        this.threshold = 0.05;
        this.lastVal = 0;
        this.sampleCount = 0;
        this.bitBuffer = { normal: "", inverted: "" };

        // Sonar variables
        this.maxVolThisSecond = 0;
        this.framesProcessed = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) return true; 

        const channelData = input[0];

        for (let i = 0; i < channelData.length; i++) {
            // Track volume for sonar debugging
            let absVol = Math.abs(channelData[i]);
            if (absVol > this.maxVolThisSecond) this.maxVolThisSecond = absVol;

            // Schmitt trigger to read bits
            const val = channelData[i] > this.threshold ? 0 : (channelData[i] < -this.threshold ? 1 : this.lastVal);

            if (val !== this.lastVal) {
                const bits = Math.round(this.sampleCount / this.samplesPerBit);
                if (bits > 0 && bits < 20) {
                    for (let j = 0; j < bits; j++) {
                        // Build both polarities to bypass hardware inversion
                        this.bitBuffer.normal += this.lastVal;
                        this.bitBuffer.inverted += (this.lastVal === 1 ? 0 : 1); 
                    }
                }
                this.sampleCount = 0;
                this.lastVal = val;

                // Wait for the sync header
                if (this.bitBuffer.normal.endsWith("0111111111")) {
                    this.parsePacket(this.bitBuffer.normal, "Normal");
                    this.bitBuffer.normal = "";
                }
                if (this.bitBuffer.inverted.endsWith("0111111111")) {
                    this.parsePacket(this.bitBuffer.inverted, "Inverted");
                    this.bitBuffer.inverted = "";
                }
            }
            this.sampleCount++;
            this.framesProcessed++;

            // Sonar Ping every 1 second
            if (this.framesProcessed >= sampleRate) {
                this.port.postMessage({ type: "sonar", vol: this.maxVolThisSecond });
                this.framesProcessed = 0;
                this.maxVolThisSecond = 0;
            }
        }
        return true;
    }

    parsePacket(buffer, polarity) {
        if (buffer.length < 90) return;

        const packet = buffer.slice(-90);
        const bytes = [];

        for (let i = 0; i < 9; i++) {
            const byteStr = packet.substr(i * 10 + 1, 8);
            // "& 127" strips the stop-bit bleed to ensure clean data
            bytes.push(parseInt(byteStr.split("").reverse().join(""), 2) & 127);
        }

        let sum = 0;
        for (let i = 1; i < 6; i++) sum += (bytes[i] & 0x0F);
        const checksum = bytes[7];
        const cmd = String.fromCharCode(bytes[0]);

        // Post debug data back to main thread
        this.port.postMessage({ 
            type: "debug", 
            message: `[${polarity}] Cmd: ${cmd} | Sum: ${sum} | Check: ${checksum}` 
        });

        // The Official Math Checksum
        if (sum === checksum || sum + 64 === checksum) {
            let state = "unknown";
            // Map the byte to the timer state
            if (cmd === 'R') state = "running";
            else if ("SAILC ".includes(cmd)) state = "stopped";

            this.port.postMessage({ type: "state", state: state });
        }
    }
}

registerProcessor('stackmat-processor', StackmatProcessor);