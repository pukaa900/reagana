// Connect to TTS via BroadcastChannel
const channel = new BroadcastChannel("pink-trombone");
function send(message) {
  message.from = "synthesizer";
  channel.postMessage(message);
}

// Convert semitones (from C5 = 140 Hz) to frequency
function getFrequencyFromSemitones(semitones) {
  return 140 * Math.pow(2, semitones / 12);
}

// Map vertical grid index to semitone offset from C5
function getSemitonesFromRow(y) {
  return y - 7; // row 7 = C5
}

// Generate utterance from grid notes
function generateUtterance(notes) {
  const bpm = parseFloat(document.getElementById("bpmInput").value);
  const beatLength = 60 / bpm;

  const utterance = {
    name: "synthesizer-sequence",
    keyframes: []
  };

  const sortedNotes = [...notes].sort((a, b) => a.x - b.x);

  for (const note of sortedNotes) {
    const startTime = (note.x / 4) * beatLength; // grid col = 16th note
    const semitones = getSemitonesFromRow(note.y);
    const frequency = getFrequencyFromSemitones(semitones);

    utterance.keyframes.push({
      time: startTime,
      name: note.phoneme,
      frequency,
      intensity: 1
    });
  }

  // Add trailing silence to finish
  if (utterance.keyframes.length > 0) {
    const last = utterance.keyframes.at(-1);
    utterance.keyframes.push({
      name: ".",
      time: last.time + 0.5,
      frequency: last.frequency,
      intensity: 0
    });
  }

  return utterance;
}

// Play the sequence
function playSequence() {
  const utterance = generateUtterance(notes);
  send({ to: ["tts"], type: "message", utterance });
}

// Save notes as .json
function downloadSequence() {
  const data = JSON.stringify(notes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "synthesizer-sequence.json";
  a.click();
  URL.revokeObjectURL(url);
}
