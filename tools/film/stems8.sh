#!/bin/sh
# render the full mix + the stems used by measure8/measurek for film7
cd /home/claude/film
F='const __m=musicEvents,__r=recordings;'
python3 audio8.py > stems/full8.log 2>&1 &
python3 stem.py film7.html stems/v7_rec.wav "window.musicEvents=()=>[]" > stems/v7_rec.log 2>&1 &
python3 stem.py film7.html stems/v7_mus.wav "window.recordings=()=>[]" > stems/v7_mus.log 2>&1 &
python3 stem.py film7.html stems/v7_stream.wav "${F}window.musicEvents=()=>[];window.recordings=()=>__r().filter(r=>r.k==='stream')" > stems/v7_stream.log 2>&1 &
python3 stem.py film7.html stems/v7_drum.wav "${F}window.musicEvents=()=>__m().filter(e=>/kick|snare|hat|tom|crash|shk/.test(e.inst));window.recordings=()=>[]" > stems/v7_drum.log 2>&1 &
python3 stem.py film7.html stems/v7_bass.wav "${F}window.musicEvents=()=>__m().filter(e=>e.inst==='bass');window.recordings=()=>[]" > stems/v7_bass.log 2>&1 &
python3 stem.py film7.html stems/v7_filmdrum.wav "${F}window.musicEvents=()=>__m().filter(e=>e.src==='film'&&e.at>=at(6)-.01&&/kick|snare|hat|tom|crash|shk/.test(e.inst));window.recordings=()=>[]" > stems/v7_filmdrum.log 2>&1 &
python3 stem.py film7.html stems/v7_stickers.wav "${F}window.musicEvents=()=>__m().filter(e=>e.src!=='film');window.recordings=()=>[]" > stems/v7_stickers.log 2>&1 &
wait
rm -f stems/v7_nodrum.*
grep -o 'peak [0-9.]*' stems/full8.log | cut -d' ' -f2 > fullpeak.txt
cat stems/full8.log
