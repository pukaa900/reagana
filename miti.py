#!/usr/bin/env python3
"""
midi2utterances.py  –  Convert a MIDI file into Lō'ata’s key-frame TXT format.

Usage
-----
python midi2utterances.py song.mid out.txt [utterance_name]

If you omit utterance_name, the script uses the MIDI filename (without
the extension).
"""

import math
import os
import sys
import json
import mido


def note_to_freq(note_number: int) -> float:
    """MIDI note → frequency in Hz (A4 = MIDI 69 = 440 Hz)."""
    return 440.0 * (2 ** ((note_number - 69) / 12))


def collect_notes(midi_path: str):
    """Walk through the MIDI, returning a list of {'time', 'name', 'frequency'}."""
    mid = mido.MidiFile(midi_path)
    tempo = 500_000          # default 120 BPM (µs per beat)
    tpb   = mid.ticks_per_beat
    now   = 0.0
    notes = []

    for msg in mid:          # mido yields messages in play-order, .time = delta-ticks
        now += mido.tick2second(msg.time, tpb, tempo)

        if msg.type == "set_tempo":
            tempo = msg.tempo

        elif msg.type == "note_on" and msg.velocity > 0:
            freq = note_to_freq(msg.note)
            notes.append({
                "time": round(now, 9),               # nice, clean decimals
                "name": mido.get_note_name(msg.note),
                "frequency": freq,
            })

    return notes


def build_utterance(notes, name: str):
    """Wrap raw notes into your JS-style utterance object."""
    keyframes = []
    for n in notes:
        kf = {
            "time": n["time"],
            "name": n["name"],
            "frequency": n["frequency"],
            # everything else parked at zero, per Lō'ata’s decree
            "tongue.index": 0,
            "tongue.diameter": 0,
            "frontConstriction.index": 0,
            "frontConstriction.diameter": 0,
            "tenseness": 0,
            "loudness": 0,
            "intensity": 0,
        }
        keyframes.append(kf)

    return {"name": name, "keyframes": keyframes}


def main():
    if len(sys.argv) < 3:
        print("Usage: midi2utterances.py input.mid output.txt [utterance_name]")
        sys.exit(1)

    midi_path = sys.argv[1]
    out_path  = sys.argv[2]
    utt_name  = sys.argv[3] if len(sys.argv) > 3 else os.path.splitext(os.path.basename(midi_path))[0]

    notes = collect_notes(midi_path)
    utterance = build_utterance(notes, utt_name)

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("const utterances = [\n  ")
        json.dump(utterance, f, indent=2)
        f.write("\n];\n")

    print(f"Wrote {len(notes)} keyframes to {out_path}")


if __name__ == "__main__":
    main()
