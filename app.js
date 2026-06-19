const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const finalCaption = document.querySelector("#finalCaption");
const interimCaption = document.querySelector("#interimCaption");
const transcriptList = document.querySelector("#transcriptList");
const statusText = document.querySelector("#statusText");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const languageSelect = document.querySelector("#languageSelect");
const fontSizeRange = document.querySelector("#fontSizeRange");
const contrastToggle = document.querySelector("#contrastToggle");
const keepAwakeToggle = document.querySelector("#keepAwakeToggle");
const copyButton = document.querySelector("#copyButton");
const downloadButton = document.querySelector("#downloadButton");
const clearButton = document.querySelector("#clearButton");

let recognition = null;
let isListening = false;
let shouldRestart = false;
let transcript = [];
let wakeLock = null;

function setStatus(message) {
  statusText.textContent = message;
}

function setListeningState(nextIsListening) {
  isListening = nextIsListening;
  document.body.classList.toggle("listening", nextIsListening);
  startButton.disabled = nextIsListening || !SpeechRecognition;
  stopButton.disabled = !nextIsListening;
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator) || !keepAwakeToggle.checked) {
    return;
  }

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

async function releaseWakeLock() {
  if (!wakeLock) {
    return;
  }

  await wakeLock.release();
  wakeLock = null;
}

function addTranscriptLine(text) {
  const cleanText = text.trim();
  if (!cleanText) {
    return;
  }

  transcript.push(cleanText);
  finalCaption.textContent = cleanText;

  const item = document.createElement("li");
  item.textContent = cleanText;
  transcriptList.append(item);
  transcriptList.parentElement.scrollTop = transcriptList.parentElement.scrollHeight;
}

function buildRecognition() {
  if (!SpeechRecognition) {
    setStatus("Speech recognition is not available in this browser.");
    finalCaption.textContent = "Open this app in Android Chrome or desktop Chrome.";
    startButton.disabled = true;
    return null;
  }

  const instance = new SpeechRecognition();
  instance.lang = languageSelect.value;
  instance.continuous = true;
  instance.interimResults = true;
  instance.maxAlternatives = 1;

  instance.onstart = () => {
    setListeningState(true);
    setStatus(`Listening in ${languageSelect.options[languageSelect.selectedIndex].text}`);
  };

  instance.onresult = (event) => {
    let interimText = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const text = result[0].transcript;

      if (result.isFinal) {
        addTranscriptLine(text);
      } else {
        interimText += text;
      }
    }

    interimCaption.textContent = interimText.trim();
  };

  instance.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      shouldRestart = false;
      setStatus("Microphone permission is blocked.");
      finalCaption.textContent = "Allow microphone access in Chrome settings, then start again.";
      return;
    }

    if (event.error === "network") {
      setStatus("Speech service needs a network connection.");
      return;
    }

    setStatus(`Speech recognition paused: ${event.error}`);
  };

  instance.onend = () => {
    setListeningState(false);
    interimCaption.textContent = "";

    if (shouldRestart) {
      window.setTimeout(() => {
        if (shouldRestart && recognition) {
          recognition.start();
        }
      }, 180);
      return;
    }

    releaseWakeLock();
    setStatus("Stopped");
  };

  return instance;
}

async function startListening() {
  recognition = buildRecognition();
  if (!recognition) {
    return;
  }

  shouldRestart = true;
  await requestWakeLock();

  try {
    recognition.start();
  } catch {
    setStatus("Already listening");
  }
}

function stopListening() {
  shouldRestart = false;
  if (recognition && isListening) {
    recognition.stop();
  }
  setListeningState(false);
  releaseWakeLock();
}

async function copyTranscript() {
  const text = transcript.join("\n");
  if (!text) {
    setStatus("Nothing to copy yet");
    return;
  }

  await navigator.clipboard.writeText(text);
  setStatus("Transcript copied");
}

function downloadTranscript() {
  const text = transcript.join("\n");
  if (!text) {
    setStatus("Nothing to save yet");
    return;
  }

  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `live-caption-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus("Transcript saved");
}

function clearTranscript() {
  transcript = [];
  transcriptList.replaceChildren();
  finalCaption.textContent = "Tap Start and begin speaking.";
  interimCaption.textContent = "";
  setStatus("Transcript cleared");
}

startButton.addEventListener("click", startListening);
stopButton.addEventListener("click", stopListening);
copyButton.addEventListener("click", copyTranscript);
downloadButton.addEventListener("click", downloadTranscript);
clearButton.addEventListener("click", clearTranscript);

languageSelect.addEventListener("change", () => {
  if (isListening) {
    stopListening();
    window.setTimeout(startListening, 250);
  }
});

fontSizeRange.addEventListener("input", () => {
  document.documentElement.style.setProperty("--caption-size", `${fontSizeRange.value}px`);
});

contrastToggle.addEventListener("change", () => {
  document.body.classList.toggle("high-contrast", contrastToggle.checked);
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && isListening) {
    requestWakeLock();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

setListeningState(false);
if (!SpeechRecognition) {
  buildRecognition();
}

