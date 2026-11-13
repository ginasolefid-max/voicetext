import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const $ = (id) => document.getElementById(id);
const isNative = Capacitor.isNativePlatform();
let voices = [];
let paused = false;
let currentText = '';
let resumeAt = 0;
let activeVoice = 0;
let browserUtterance = null;
const synth = window.speechSynthesis;

function status(message) { $('status').textContent = message; }
function selectedVoice() { return voices[Number($('voice').value)] || voices[0]; }

async function loadVoices() {
  const select = $('voice');
  try {
    if (isNative) {
      const result = await TextToSpeech.getSupportedVoices();
      voices = result.voices || [];
    } else {
      voices = synth ? synth.getVoices() : [];
    }
    select.innerHTML = '';
    if (!voices.length) {
      select.innerHTML = '<option value="">Device default voice</option>';
      status('No voice list returned. The device default voice may still work.');
      return;
    }
    voices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' — default' : ''}`;
      select.appendChild(option);
    });
    const preferred = voices.findIndex(v => /^en/i.test(v.lang || ''));
    select.value = String(preferred >= 0 ? preferred : 0);
  } catch (error) {
    select.innerHTML = '<option value="">Device default voice</option>';
    status(`Could not load voices: ${error?.message || error}`);
  }
}

async function stopSpeech(updateStatus = true) {
  try {
    if (isNative) await TextToSpeech.stop();
    else if (synth) synth.cancel();
  } catch (_) {}
  if (updateStatus) status('Stopped.');
}

async function speakFrom(offset = 0) {
  const text = currentText.slice(offset).trimStart();
  if (!text) { status('Finished speaking.'); paused = false; resumeAt = 0; return; }
  const voice = selectedVoice();
  const rate = Number($('rate').value);
  const pitch = Number($('pitch').value);
  try {
    if (isNative) {
      const voiceIndex = Number($('voice').value);
      await TextToSpeech.speak({
        text,
        lang: voice?.lang || 'en-US',
        rate,
        pitch,
        volume: 1,
        ...(Number.isFinite(voiceIndex) ? { voice: voiceIndex } : {}),
        queueStrategy: 0
      });
      status('Speech request completed.');
      paused = false;
      resumeAt = 0;
    } else {
      if (!synth) throw new Error('Speech synthesis is not supported in this browser.');
      browserUtterance = new SpeechSynthesisUtterance(text);
      if (voice) browserUtterance.voice = voice;
      browserUtterance.rate = rate;
      browserUtterance.pitch = pitch;
      browserUtterance.onstart = () => status('Speaking…');
      browserUtterance.onend = () => { status('Finished speaking.'); paused = false; resumeAt = 0; };
      browserUtterance.onerror = e => status(`Speech error: ${e.error}`);
      synth.cancel(); synth.speak(browserUtterance);
    }
  } catch (error) {
    status(`Speech error: ${error?.message || error}`);
  }
}

$('text').addEventListener('input', () => $('count').textContent = `${$('text').value.length} / 12000`);
$('rate').addEventListener('input', () => $('rateVal').textContent = `${Number($('rate').value).toFixed(1)}×`);
$('pitch').addEventListener('input', () => $('pitchVal').textContent = Number($('pitch').value).toFixed(1));
$('speak').onclick = async () => {
  currentText = $('text').value.trim();
  if (!currentText) { status('Please enter some text first.'); $('text').focus(); return; }
  await stopSpeech(false); paused = false; resumeAt = 0; status('Starting speech…'); await speakFrom(0);
};
$('pause').onclick = async () => {
  if (!currentText) { status('Nothing is speaking.'); return; }
  if (!isNative && synth?.speaking) { synth.pause(); paused = true; status('Paused.'); return; }
  if (isNative) {
    status('Pause is not supported by the Android TTS plugin. Use Stop to end speech.');
    return;
  }
  status('Nothing is speaking.');
};
$('resume').onclick = async () => {
  if (isNative) { status('Pause/resume is not supported by the Android TTS plugin. Tap Speak to start again.'); return; }
  if (!isNative && synth?.paused) { synth.resume(); paused = false; status('Resumed.'); return; }
  status('Speech is not paused.');
};
$('stop').onclick = async () => { paused = false; currentText = ''; await stopSpeech(true); };
$('sample').onclick = () => {
  $('text').value = 'Hello! Welcome to VoiceText. Type anything here and your device will read it aloud.';
  $('text').dispatchEvent(new Event('input'));
  status('Sample text added.');
};

if (isNative) {
  TextToSpeech.openInstall().catch(() => {});
  loadVoices();
} else if (synth) {
  loadVoices();
  synth.onvoiceschanged = loadVoices;
} else {
  loadVoices();
}
