// JS logic for MIDI to Utterances conversion
// Requires @tonejs/midi (loaded in index.html)

function noteToFreq(noteNumber) {
  // MIDI note → frequency in Hz (A4 = MIDI 69 = 440 Hz)
  return 440.0 * Math.pow(2, (noteNumber - 69) / 12);
}

function getNoteName(noteNumber) {
  // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(noteNumber / 12) - 1;
  return names[noteNumber % 12] + octave;
}

async function convertMidi() {
  const fileInput = document.getElementById('midiFile');
  const nameInput = document.getElementById('utteranceName');
  const outputDiv = document.getElementById('output');
  outputDiv.textContent = '';

  if (!fileInput.files.length) {
    outputDiv.textContent = 'Please select a MIDI file.';
    return;
  }

  const file = fileInput.files[0];
  const utteranceName = nameInput.value.trim() || file.name.replace(/\.[^.]+$/, '');

  const arrayBuffer = await file.arrayBuffer();
  const midi = new Midi(arrayBuffer);

  // Collect notes from all tracks
  let notes = [];
  midi.tracks.forEach(track => {
    let now = 0;
    track.notes.forEach(note => {
      notes.push({
        time: parseFloat(note.time.toFixed(9)),
        name: getNoteName(note.midi),
        frequency: noteToFreq(note.midi)
      });
    });
  });

  // Sort notes by time
  notes.sort((a, b) => a.time - b.time);

  // Build utterance object
  const keyframes = notes.map(n => ({
    time: n.time,
    name: n.name,
    frequency: n.frequency,
    'tongue.index': 0,
    'tongue.diameter': 0,
    'frontConstriction.index': 0,
    'frontConstriction.diameter': 0,
    tenseness: 0,
    loudness: 0,
    intensity: 0
  }));

  const utterance = { name: utteranceName, keyframes };

  // Format as JS file
  const jsContent = 'const utterances = [\n  ' + JSON.stringify(utterance, null, 2) + '\n];\n';

  // Create download link
  const blob = new Blob([jsContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  outputDiv.innerHTML = `<a href="${url}" download="${utteranceName}.txt">Download utterances file</a>`;
}
