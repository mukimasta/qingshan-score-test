#!/bin/sh
# render the full mix + the stems used by measure8/measurek for film7
cd /home/claude/film
F='const __m=musicEvents,__r=recordings;'
python3 audio9.py > stems/full9.log 2>&1 &
python3 stem.py film8.html stems/v8_rec.wav "window.musicEvents=()=>[]" > stems/v8_rec.log 2>&1 &
python3 stem.py film8.html stems/v8_mus.wav "window.recordings=()=>[]" > stems/v8_mus.log 2>&1 &
python3 stem.py film8.html stems/v8_stream.wav "${F}window.musicEvents=()=>[];window.recordings=()=>__r().filter(r=>r.k==='stream')" > stems/v8_stream.log 2>&1 &
python3 stem.py film8.html stems/v8_drum.wav "${F}window.musicEvents=()=>__m().filter(e=>/kick|snare|hat|tom|crash|shk/.test(e.inst));window.recordings=()=>[]" > stems/v8_drum.log 2>&1 &
python3 stem.py film8.html stems/v8_bass.wav "${F}window.musicEvents=()=>__m().filter(e=>e.inst==='bass');window.recordings=()=>[]" > stems/v8_bass.log 2>&1 &
python3 stem.py film8.html stems/v8_filmdrum.wav "${F}window.musicEvents=()=>__m().filter(e=>e.src==='film'&&e.at>=at(6)-.01&&/kick|snare|hat|tom|crash|shk/.test(e.inst));window.recordings=()=>[]" > stems/v8_filmdrum.log 2>&1 &
python3 stem.py film8.html stems/v8_stickers.wav "${F}window.musicEvents=()=>__m().filter(e=>e.src!=='film');window.recordings=()=>[]" > stems/v8_stickers.log 2>&1 &
wait
rm -f stems/v8_nodrum.*
grep -o 'peak [0-9.]*' stems/full9.log | cut -d' ' -f2 > fullpeak.txt
cat stems/full9.log
