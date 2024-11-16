import os, sys
import json
import glob


def build_sample_map(input_dir, output_file):
    is_audio = lambda f : f.endswith(".wav") or f.endswith(".mp3") or f.endswith(".flac")
    samples = {
        x : [f for f in sorted(os.listdir(os.path.join(input_dir, x))) if is_audio(f)] for x in os.listdir(input_dir)
    }
    json.dump(
        samples,
        open(output_file, 'w'),
        indent = 4,
        sort_keys=True
    )


if __name__ == "__main__":
    build_sample_map("./public/wav/", "samples.json")