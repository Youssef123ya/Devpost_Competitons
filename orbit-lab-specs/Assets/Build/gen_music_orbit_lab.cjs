// Offline ambient teaching bed; no samples or copied melody.
const fs=require('fs'),path=require('path');
if(!process.env.CLAD_SKILLS_DIR)throw new Error('Set CLAD_SKILLS_DIR to the installed ls-clad skills directory.');
const m=require(path.resolve(process.env.CLAD_SKILLS_DIR,'build-music/tools'));
const PROJECT_ASSETS_SFX=path.resolve(__dirname,'../GeneratedSFX');
fs.mkdirSync(PROJECT_ASSETS_SFX,{recursive:true});
const {chords,meta}=m.composeChords({genre:'ambient',voice:'pad'});
const bpm=m.suggestTempo('ambient');
console.log(JSON.stringify({meta,bpm}));
const bars=8, sections=m.arrangement.arrangement8();
const pad=m.chordEvents(chords,{voice:'pad',bars,velocity:48,stagger:0.1});
const mallets=m.chordEvents(chords,{voice:'vibraphone',bars,velocity:38,stagger:0.35});
const tracks=[
  m.track('orbit-pad','pad',m.mask(pad,sections.full,bars,4),{fx:{hpf:220,lpf:2600,reverb:'largeHall',chorus:{voices:3,mix:0.2},gain:0.24}}),
  m.track('distant-mallets','vibraphone',m.mask(mallets,sections.b,bars,4),{fx:{hpf:550,lpf:4000,reverb:'largeHall',gain:0.12}}),
];
const out=m.render(tracks,{bpm,master:{normalize:'peak',glue:true,width:1.12}});
m.WavBuilder.write(out,path.join(PROJECT_ASSETS_SFX,'OrbitLabBackgroundMusic.wav'));
