import os, sys
import soundfile as sf


def convert_all_flacs(root):
    files = [ os.path.join(root, x) for x in os.listdir(root) ]
    for f in files:
        if os.path.splitext(f)[1] == ".flac":
            dest_wav = os.path.splitext(f)[0] + ".wav"
            if not os.path.exists(dest_wav):
                data, sample_rate = sf.read(f)
                sf.write(dest_wav, data, sample_rate)
            
            
if __name__ == "__main__":
    convert_all_flacs(sys.argv[1])