document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // DOM ELEMENTS
  // ==========================================

  const recordTab = document.getElementById("recordTab");
  const uploadTab = document.getElementById("uploadTab");

  const recordPanel = document.getElementById("recordPanel");
  const uploadPanel = document.getElementById("uploadPanel");

  const mainMicButton = document.getElementById("mainMicButton");
  const recordBox = document.getElementById("recordBox");
  const recordStatus = document.getElementById("recordStatus");
  const recordTimer = document.getElementById("recordTimer");
  const recordControls = document.getElementById("recordControls");

  const pauseButton = document.getElementById("pauseButton");
  const stopButton = document.getElementById("stopButton");

  const recordedAudioResult =
    document.getElementById("recordedAudioResult");

  const recordedAudio =
    document.getElementById("recordedAudio");

  const recordedDuration =
    document.getElementById("recordedDuration");

  const deleteRecording =
    document.getElementById("deleteRecording");

  const recordAgain =
    document.getElementById("recordAgain");

  const useRecording =
    document.getElementById("useRecording");

  const audioInput =
    document.getElementById("audioInput");

  const dropZone =
    document.getElementById("dropZone");

  const uploadedAudioResult =
    document.getElementById("uploadedAudioResult");

  const uploadedAudio =
    document.getElementById("uploadedAudio");

  const uploadedFileName =
    document.getElementById("uploadedFileName");

  const uploadedFileInfo =
    document.getElementById("uploadedFileInfo");

  const removeUpload =
    document.getElementById("removeUpload");

  const sourceLanguage =
    document.getElementById("sourceLanguage");

  const targetLanguage =
    document.getElementById("targetLanguage");

  const swapLanguages =
    document.getElementById("swapLanguages");

  const languageMenu =
    document.getElementById("languageMenu");

  const translateButton =
    document.getElementById("translateButton");

  const processingSection =
    document.getElementById("processingSection");

  const translationResult =
    document.getElementById("translationResult");

  const errorToast =
    document.getElementById("errorToast");

  const errorTitle =
    document.getElementById("errorTitle");

  const errorMessage =
    document.getElementById("errorMessage");

  const closeError =
    document.getElementById("closeError");


  // ==========================================
  // STATE
  // ==========================================

  let mediaRecorder = null;
  let recordingStream = null;
  let audioChunks = [];

  let recordingTimer = null;
  let recordingSeconds = 0;

  let isPaused = false;
  let audioReady = false;

  let audioSource = null;
  let audioBlob = null;
  let uploadedFile = null;

  let currentAudioUrl = null;

  let selectedLanguageType = "source";

  const MAX_RECORDING_SECONDS = 60;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const allowedExtensions = [
    "mp3",
    "wav",
    "m4a",
    "webm"
  ];

  const allowedMimeTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/x-m4a",
    "audio/mp4",
    "audio/webm"
  ];


  // ==========================================
  // LANGUAGE STATE
  // ==========================================

  let selectedSourceLanguage = {
    name: "Malayalam",
    code: "ML"
  };

  let selectedTargetLanguage = {
    name: "English",
    code: "EN"
  };


  // ==========================================
  // INITIALIZATION
  // ==========================================

  if (window.lucide) {
    lucide.createIcons();
  }

  updateLanguageUI();
  updateTranslateButton();


  // ==========================================
  // TAB SWITCHING
  // ==========================================

  recordTab?.addEventListener(
    "click",
    () => {

      recordTab.classList.add("active");

      uploadTab?.classList.remove("active");

      recordPanel?.classList.add("active");

      uploadPanel?.classList.remove("active");
    }
  );


  uploadTab?.addEventListener(
    "click",
    () => {

      uploadTab.classList.add("active");

      recordTab?.classList.remove("active");

      uploadPanel?.classList.add("active");

      recordPanel?.classList.remove("active");
    }
  );


  // ==========================================
  // RECORDING
  // ==========================================

  mainMicButton?.addEventListener(
    "click",
    async () => {

      if (
        mediaRecorder?.state === "recording"
      ) {
        return;
      }

      await startRecording();
    }
  );


  async function startRecording() {

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      showError(
        "Microphone unavailable",
        "Your browser does not support microphone recording."
      );

      return;
    }


    clearUploadedAudio();


    try {

      recordingStream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });


      const mimeType =
        getSupportedMimeType();


      if (mimeType) {

        mediaRecorder =
          new MediaRecorder(
            recordingStream,
            {
              mimeType
            }
          );

      } else {

        mediaRecorder =
          new MediaRecorder(
            recordingStream
          );
      }


      audioChunks = [];

      recordingSeconds = 0;

      isPaused = false;


      mediaRecorder.addEventListener(
        "dataavailable",
        (event) => {

          if (
            event.data &&
            event.data.size > 0
          ) {

            audioChunks.push(
              event.data
            );
          }
        }
      );


      mediaRecorder.addEventListener(
        "start",
        () => {

          recordBox?.classList.add(
            "recording"
          );


          if (recordStatus) {

            recordStatus.textContent =
              "Recording...";
          }


          if (recordTimer) {

            recordTimer.textContent =
              "00:00";
          }


          recordControls?.classList.add(
            "show"
          );


          startRecordingTimer();

          updatePauseButton();
        }
      );


      mediaRecorder.addEventListener(
        "pause",
        () => {

          isPaused = true;


          if (recordStatus) {

            recordStatus.textContent =
              "Paused";
          }


          updatePauseButton();
        }
      );


      mediaRecorder.addEventListener(
        "resume",
        () => {

          isPaused = false;


          if (recordStatus) {

            recordStatus.textContent =
              "Recording...";
          }


          updatePauseButton();
        }
      );


      mediaRecorder.addEventListener(
        "stop",
        () => {

          stopRecordingTimer();

          finishRecording();
        }
      );


      mediaRecorder.addEventListener(
        "error",
        () => {

          stopRecordingTimer();

          stopRecordingStream();


          showError(
            "Recording failed",
            "Something went wrong while recording. Please try again."
          );
        }
      );


      mediaRecorder.start();

    } catch (error) {

      console.error(
        "Microphone error:",
        error
      );


      stopRecordingStream();


      if (
        error.name === "NotAllowedError"
      ) {

        showError(
          "Microphone permission required",
          "Please allow microphone access and try again."
        );

      } else {

        showError(
          "Recording failed",
          "We couldn't access your microphone. Please try again."
        );
      }
    }
  }


  // ==========================================
  // MIME TYPE
  // ==========================================

  function getSupportedMimeType() {

    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4"
    ];


    for (
      const type of types
    ) {

      if (
        typeof MediaRecorder !==
          "undefined" &&
        MediaRecorder.isTypeSupported(
          type
        )
      ) {

        return type;
      }
    }


    return "";
  }


  // ==========================================
  // RECORDING TIMER
  // ==========================================

  function startRecordingTimer() {

    stopRecordingTimer();


    recordingTimer =
      setInterval(
        () => {

          if (
            !mediaRecorder ||
            mediaRecorder.state !==
              "recording"
          ) {

            return;
          }


          recordingSeconds++;


          if (recordTimer) {

            recordTimer.textContent =
              formatTime(
                recordingSeconds
              );
          }


          if (
            recordingSeconds >=
            MAX_RECORDING_SECONDS
          ) {

            stopRecording();


            showError(
              "Recording limit reached",
              "Voice messages can be up to 60 seconds long."
            );
          }

        },
        1000
      );
  }


  function stopRecordingTimer() {

    if (recordingTimer) {

      clearInterval(
        recordingTimer
      );

      recordingTimer = null;
    }
  }


  // ==========================================
  // PAUSE / RESUME
  // ==========================================

  pauseButton?.addEventListener(
    "click",
    () => {

      if (!mediaRecorder) {
        return;
      }


      if (
        mediaRecorder.state ===
        "recording"
      ) {

        mediaRecorder.pause();

      } else if (
        mediaRecorder.state ===
        "paused"
      ) {

        mediaRecorder.resume();
      }
    }
  );


  function updatePauseButton() {

    if (!pauseButton) {
      return;
    }


    const icon =
      pauseButton.querySelector(
        "i"
      );


    const text =
      pauseButton.querySelector(
        "span"
      );


    if (isPaused) {

      if (text) {

        text.textContent =
          "Resume";
      }


      pauseButton.setAttribute(
        "aria-label",
        "Resume recording"
      );


      if (icon) {

        icon.setAttribute(
          "data-lucide",
          "play"
        );
      }

    } else {

      if (text) {

        text.textContent =
          "Pause";
      }


      pauseButton.setAttribute(
        "aria-label",
        "Pause recording"
      );


      if (icon) {

        icon.setAttribute(
          "data-lucide",
          "pause"
        );
      }
    }


    if (window.lucide) {

      lucide.createIcons();
    }
  }


  // ==========================================
  // STOP RECORDING
  // ==========================================

  stopButton?.addEventListener(
    "click",
    () => {

      stopRecording();
    }
  );


  function stopRecording() {

    if (!mediaRecorder) {
      return;
    }


    if (
      mediaRecorder.state ===
        "recording" ||
      mediaRecorder.state ===
        "paused"
    ) {

      mediaRecorder.stop();
    }
  }


  // ==========================================
  // FINISH RECORDING
  // ==========================================

  function finishRecording() {

    stopRecordingTimer();

    stopRecordingStream();


    recordBox?.classList.remove(
      "recording"
    );


    recordControls?.classList.remove(
      "show"
    );


    if (recordStatus) {

      recordStatus.textContent =
        "Recording complete";
    }


    const mimeType =
      mediaRecorder?.mimeType ||
      "audio/webm";


    audioBlob =
      new Blob(
        audioChunks,
        {
          type: mimeType
        }
      );


    if (!audioBlob.size) {

      showError(
        "Recording failed",
        "No audio was captured. Please try again."
      );


      resetRecordingState();

      return;
    }


    revokeCurrentAudioUrl();


    currentAudioUrl =
      URL.createObjectURL(
        audioBlob
      );


    if (recordedAudio) {

      recordedAudio.src =
        currentAudioUrl;
    }


    recordedAudioResult?.classList.add(
      "show"
    );


    if (recordedDuration) {

      recordedDuration.textContent =
        formatTime(
          recordingSeconds
        );
    }


    audioSource =
      "recording";

    audioReady =
      true;


    updateTranslateButton();


    mediaRecorder =
      null;
  }


  // ==========================================
  // RECORD AGAIN
  // ==========================================

  recordAgain?.addEventListener(
    "click",
    async () => {

      resetRecordingState();

      await startRecording();
    }
  );


  // ==========================================
  // DELETE RECORDING
  // ==========================================

  deleteRecording?.addEventListener(
    "click",
    () => {

      resetRecordingState();


      showInfo(
        "Recording removed",
        "You can record a new voice message."
      );
    }
  );


  // ==========================================
  // USE RECORDING
  // ==========================================

  useRecording?.addEventListener(
    "click",
    () => {

      if (!audioReady) {
        return;
      }


      const languageSection =
        document.querySelector(
          ".language-section"
        );


      languageSection?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  );


  // ==========================================
  // RESET RECORDING
  // ==========================================

  function resetRecordingState() {

    stopRecordingTimer();

    stopRecordingStream();


    if (
      mediaRecorder &&
      (
        mediaRecorder.state ===
          "recording" ||
        mediaRecorder.state ===
          "paused"
      )
    ) {

      try {

        mediaRecorder.stop();

      } catch (error) {

        console.warn(error);
      }
    }


    mediaRecorder = null;

    audioChunks = [];

    recordingSeconds = 0;

    isPaused = false;

    audioBlob = null;


    if (recordedAudio) {

      recordedAudio.pause();

      recordedAudio.removeAttribute(
        "src"
      );

      recordedAudio.load();
    }


    recordedAudioResult?.classList.remove(
      "show"
    );


    recordBox?.classList.remove(
      "recording"
    );


    recordControls?.classList.remove(
      "show"
    );


    if (recordTimer) {

      recordTimer.textContent =
        "00:00";
    }


    if (recordStatus) {

      recordStatus.textContent =
        "Ready to record";
    }


    if (audioSource === "recording") {

      audioSource = null;

      audioReady = false;
    }


    revokeCurrentAudioUrl();

    updateTranslateButton();
  }


  // ==========================================
  // STOP MEDIA STREAM
  // ==========================================

  function stopRecordingStream() {

    if (!recordingStream) {
      return;
    }


    recordingStream
      .getTracks()
      .forEach(
        (track) => track.stop()
      );


    recordingStream = null;
  }


  // ==========================================
  // UPLOAD
  // ==========================================

  audioInput?.addEventListener(
    "change",
    (event) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      handleAudioFile(file);
    }
  );


  dropZone?.addEventListener(
    "dragover",
    (event) => {

      event.preventDefault();

      dropZone.classList.add(
        "dragging"
      );
    }
  );


  dropZone?.addEventListener(
    "dragleave",
    () => {

      dropZone.classList.remove(
        "dragging"
      );
    }
  );


  dropZone?.addEventListener(
    "drop",
    (event) => {

      event.preventDefault();


      dropZone.classList.remove(
        "dragging"
      );


      const file =
        event.dataTransfer.files?.[0];


      if (!file) {
        return;
      }


      handleAudioFile(file);
    }
  );


  async function handleAudioFile(
    file
  ) {

    const extension =
      getFileExtension(
        file.name
      );


    const isAllowedExtension =
      allowedExtensions.includes(
        extension
      );


    const isAllowedMime =
      !file.type ||
      allowedMimeTypes.includes(
        file.type.toLowerCase()
      );


    if (
      !isAllowedExtension &&
      !isAllowedMime
    ) {

      showError(
        "Unsupported audio",
        "This audio format isn't supported. Please choose another file."
      );


      clearAudioInput();

      return;
    }


    if (
      file.size >
      MAX_FILE_SIZE
    ) {

      showError(
        "File too large",
        "Please upload an audio file smaller than 10 MB."
      );


      clearAudioInput();

      return;
    }


    resetRecordingOnly();


    uploadedFile =
      file;


    revokeCurrentAudioUrl();


    currentAudioUrl =
      URL.createObjectURL(
        file
      );


    if (uploadedAudio) {

      uploadedAudio.src =
        currentAudioUrl;
    }


    if (uploadedFileName) {

      uploadedFileName.textContent =
        file.name;
    }


    if (uploadedFileInfo) {

      uploadedFileInfo.textContent =
        formatFileSize(
          file.size
        );
    }


    uploadedAudioResult?.classList.add(
      "show"
    );


    uploadedAudio?.addEventListener(
      "loadedmetadata",
      () => {

        const duration =
          uploadedAudio.duration;


        if (
          !Number.isFinite(
            duration
          )
        ) {

          return;
        }


        if (
          duration >
          MAX_RECORDING_SECONDS
        ) {

          showError(
            "Audio too long",
            "Please upload a voice message shorter than 60 seconds."
          );


          clearUploadedAudio();

          return;
        }


        audioSource =
          "upload";

        audioReady =
          true;


        updateTranslateButton();

      },
      {
        once: true
      }
    );
  }


  // ==========================================
  // REMOVE UPLOAD
  // ==========================================

  removeUpload?.addEventListener(
    "click",
    () => {

      clearUploadedAudio();


      showInfo(
        "Audio removed",
        "You can upload another voice message."
      );
    }
  );


  function clearUploadedAudio() {

    uploadedFile = null;


    if (uploadedAudio) {

      uploadedAudio.pause();

      uploadedAudio.removeAttribute(
        "src"
      );

      uploadedAudio.load();
    }


    uploadedAudioResult?.classList.remove(
      "show"
    );


    clearAudioInput();


    if (
      audioSource === "upload"
    ) {

      audioSource = null;

      audioReady = false;
    }


    updateTranslateButton();
  }


  function clearAudioInput() {

    if (audioInput) {

      audioInput.value = "";
    }
  }


  // ==========================================
  // RESET ONLY RECORDING
  // ==========================================

  function resetRecordingOnly() {

    stopRecordingTimer();

    stopRecordingStream();

    mediaRecorder = null;

    audioChunks = [];

    recordingSeconds = 0;

    isPaused = false;

    audioBlob = null;


    if (recordedAudio) {

      recordedAudio.pause();

      recordedAudio.removeAttribute(
        "src"
      );

      recordedAudio.load();
    }


    recordedAudioResult?.classList.remove(
      "show"
    );


    if (
      audioSource === "recording"
    ) {

      audioSource = null;

      audioReady = false;
    }
  }


  // ==========================================
  // LANGUAGE MENU
  // ==========================================

  document
    .querySelectorAll(
      ".language-menu button[data-language]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const languageName =
              button.dataset.language;


            const languageCode =
              button
                .querySelector(
                  ".language-code"
                )
                ?.textContent
                ?.trim() || "";


            const language = {
              name:
                languageName,
              code:
                languageCode
            };


            if (
              selectedLanguageType ===
              "source"
            ) {

              selectedSourceLanguage =
                language;

            } else {

              selectedTargetLanguage =
                language;
            }


            languageMenu?.classList.remove(
              "show"
            );


            updateLanguageUI();

            updateTranslateButton();
          }
        );
      }
    );


  // ==========================================
  // LANGUAGE SELECT BUTTONS
  // ==========================================

  sourceLanguage?.addEventListener(
    "click",
    () => {

      selectedLanguageType =
        "source";


      languageMenu?.classList.toggle(
        "show"
      );
    }
  );


  targetLanguage?.addEventListener(
    "click",
    () => {

      selectedLanguageType =
        "target";


      languageMenu?.classList.toggle(
        "show"
      );
    }
  );


  // ==========================================
  // SWAP LANGUAGES
  // ==========================================

  swapLanguages?.addEventListener(
    "click",
    () => {

      const temp =
        selectedSourceLanguage;


      selectedSourceLanguage =
        selectedTargetLanguage;


      selectedTargetLanguage =
        temp;


      updateLanguageUI();

      updateTranslateButton();
    }
  );


  function updateLanguageUI() {

    updateLanguageButton(
      sourceLanguage,
      selectedSourceLanguage
    );


    updateLanguageButton(
      targetLanguage,
      selectedTargetLanguage
    );


    if (window.lucide) {

      lucide.createIcons();
    }
  }


  function updateLanguageButton(
    element,
    language
  ) {

    if (!element) {
      return;
    }


    const name =
      element.querySelector(
        ".language-name"
      );


    const code =
      element.querySelector(
        ".language-code"
      );


    if (name) {

      name.textContent =
        language.name;
    }


    if (code) {

      code.textContent =
        language.code;
    }
  }


  // ==========================================
  // TRANSLATE BUTTON
  // ==========================================

  translateButton?.addEventListener(
    "click",
    async () => {

      if (!audioReady) {

        showError(
          "No audio",
          "Please record or upload a voice message first."
        );

        return;
      }


      if (
        selectedSourceLanguage.code ===
        selectedTargetLanguage.code
      ) {

        showError(
          "Choose different languages",
          "Your voice language and translation language must be different."
        );

        return;
      }


      await startTranslation();
    }
  );


  // ==========================================
  // TRANSLATE BUTTON STATE
  // ==========================================

  function updateTranslateButton() {

    if (!translateButton) {
      return;
    }


    const languagesValid =
      selectedSourceLanguage.code &&
      selectedTargetLanguage.code &&
      selectedSourceLanguage.code !==
        selectedTargetLanguage.code;


    translateButton.disabled =
      !audioReady ||
      !languagesValid;
  }


  // ==========================================
  // SEND AUDIO TO BACKEND
  // ==========================================

  async function startTranslation() {

    const file =
      getCurrentAudioFile();


    if (!file) {

      showError(
        "Audio unavailable",
        "Please record or upload your voice again."
      );

      return;
    }


    // ==========================================
    // SHOW PROCESSING UI
    // ==========================================

    translationResult?.classList.remove(
      "show"
    );


    processingSection?.classList.add(
      "show"
    );


    const processingSteps =
      document.querySelectorAll(
        ".processing-step"
      );


    processingSteps.forEach(
      (step) => {

        step.classList.remove(
          "active",
          "completed"
        );
      }
    );


    if (processingSteps[0]) {

      processingSteps[0].classList.add(
        "active"
      );
    }


    // ==========================================
    // PREVENT DOUBLE CLICK
    // ==========================================

    translateButton.disabled =
      true;


    try {

      // ==========================================
      // CREATE FORM DATA
      // ==========================================

      const formData =
        new FormData();


      formData.append(
        "audio",
        file,
        file.name ||
          "voice.webm"
      );


      formData.append(
        "sourceLanguage",
        selectedSourceLanguage.code
      );


      formData.append(
        "targetLanguage",
        selectedTargetLanguage.code
      );


      console.log(
        "Sending audio to backend..."
      );


      console.log(
        "Source:",
        selectedSourceLanguage.code
      );


      console.log(
        "Target:",
        selectedTargetLanguage.code
      );


      console.log(
        "File:",
        file
      );


      // ==========================================
      // SEND REQUEST
      // ==========================================

      const response =
        await fetch(
          "/api/translate",
          {
            method: "POST",
            body: formData
          }
        );


      // ==========================================
      // READ RESPONSE
      // ==========================================

      const data =
        await response.json();


      console.log(
        "Backend response:",
        data
      );


      // ==========================================
      // CHECK RESPONSE
      // ==========================================

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Audio upload failed."
        );
      }


      // ==========================================
      // PROCESSING STEP 1
      // ==========================================

      if (processingSteps[0]) {

        processingSteps[0].classList.remove(
          "active"
        );


        processingSteps[0].classList.add(
          "completed"
        );
      }


      // ==========================================
      // PROCESSING STEP 2
      // ==========================================

      if (processingSteps[1]) {

        processingSteps[1].classList.add(
          "active"
        );
      }


      setTimeout(
        () => {

          if (processingSteps[1]) {

            processingSteps[1].classList.remove(
              "active"
            );


            processingSteps[1].classList.add(
              "completed"
            );
          }


          if (processingSteps[2]) {

            processingSteps[2].classList.add(
              "active"
            );
          }

        },
        700
      );


      // ==========================================
      // PROCESSING STEP 3
      // ==========================================

      setTimeout(
        () => {

          if (processingSteps[2]) {

            processingSteps[2].classList.remove(
              "active"
            );


            processingSteps[2].classList.add(
              "completed"
            );
          }


          if (processingSteps[3]) {

            processingSteps[3].classList.add(
              "active"
            );
          }

        },
        1400
      );


      // ==========================================
      // FINAL STEP + RESULT PAGE
      // ==========================================

      setTimeout(
        () => {

          if (processingSteps[3]) {

            processingSteps[3].classList.remove(
              "active"
            );


            processingSteps[3].classList.add(
              "completed"
            );
          }


          processingSection?.classList.remove(
            "show"
          );


          // ==========================================
          // SAVE RESULT
          // ==========================================

          const resultData = {

            text:
              data.text || "",

            translatedText:
              data.translatedText || "",

            translatedAudioUrl:
              data.translatedAudioUrl || "",

            sourceLanguage:
              selectedSourceLanguage.name,

            sourceCode:
              selectedSourceLanguage.code,

            targetLanguage:
              selectedTargetLanguage.name,

            targetCode:
              selectedTargetLanguage.code,

            translationId:
              data.translationId || null,

            // Keep original audio temporarily
            audioUrl:
              currentAudioUrl || null
          };


          sessionStorage.setItem(
            "translationResult",
            JSON.stringify(
              resultData
            )
          );


          console.log(
            "Translation result saved:",
            resultData
          );


          // ==========================================
          // GO TO RESULT PAGE
          // ==========================================

          window.location.href =
            `/result?id=${data.translationId}`;

        },
        2200
      );


    } catch (error) {

      console.error(
        "Translation request failed:",
        error
      );


      processingSection?.classList.remove(
        "show"
      );


      translateButton.disabled =
        false;


      showError(
        "Translation failed",
        error.message ||
          "We couldn't process your audio. Please try again."
      );
    }
  }


  // ==========================================
  // GET CURRENT AUDIO FILE
  // ==========================================

  function getCurrentAudioFile() {

    if (
      audioSource ===
        "recording" &&
      audioBlob
    ) {

      const extension =
        getAudioExtension(
          audioBlob.type
        );


      return new File(
        [audioBlob],
        `voice.${extension}`,
        {
          type:
            audioBlob.type ||
            "audio/webm"
        }
      );
    }


    if (
      audioSource ===
        "upload" &&
      uploadedFile
    ) {

      return uploadedFile;
    }


    return null;
  }


  // ==========================================
  // AUDIO EXTENSION
  // ==========================================

  function getAudioExtension(
    mimeType
  ) {

    if (
      mimeType.includes(
        "mp4"
      )
    ) {

      return "mp4";
    }


    if (
      mimeType.includes(
        "mpeg"
      )
    ) {

      return "mp3";
    }


    if (
      mimeType.includes(
        "wav"
      )
    ) {

      return "wav";
    }


    if (
      mimeType.includes(
        "webm"
      )
    ) {

      return "webm";
    }


    return "webm";
  }


  // ==========================================
  // ERROR TOAST
  // ==========================================

  closeError?.addEventListener(
    "click",
    () => {

      errorToast?.classList.remove(
        "show"
      );
    }
  );


  function showError(
    title,
    message
  ) {

    if (!errorToast) {
      return;
    }


    if (errorTitle) {

      errorTitle.textContent =
        title;
    }


    if (errorMessage) {

      errorMessage.textContent =
        message;
    }


    errorToast.classList.add(
      "show"
    );


    setTimeout(
      () => {

        errorToast.classList.remove(
          "show"
        );

      },
      5000
    );
  }


  // ==========================================
  // INFO MESSAGE
  // ==========================================

  function showInfo(
    title,
    message
  ) {

    if (!errorToast) {
      return;
    }


    if (errorTitle) {

      errorTitle.textContent =
        title;
    }


    if (errorMessage) {

      errorMessage.textContent =
        message;
    }


    errorToast.classList.add(
      "show"
    );


    setTimeout(
      () => {

        errorToast.classList.remove(
          "show"
        );

      },
      3000
    );
  }


  // ==========================================
  // OBJECT URL CLEANUP
  // ==========================================

  function revokeCurrentAudioUrl() {

    if (currentAudioUrl) {

      URL.revokeObjectURL(
        currentAudioUrl
      );


      currentAudioUrl =
        null;
    }
  }


  // ==========================================
  // HELPERS
  // ==========================================

  function getFileExtension(
    fileName
  ) {

    return fileName
      .split(".")
      .pop()
      .toLowerCase();
  }


  function formatFileSize(
    bytes
  ) {

    if (bytes < 1024) {

      return `${bytes} B`;
    }


    if (
      bytes <
      1024 * 1024
    ) {

      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }


    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }


  function formatTime(
    seconds
  ) {

    const minutes =
      Math.floor(
        seconds / 60
      );


    const remainingSeconds =
      seconds % 60;


    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(
      2,
      "0"
    )}`;
  }


  // ==========================================
  // CLEANUP WHEN LEAVING PAGE
  // ==========================================

  window.addEventListener(
    "beforeunload",
    () => {

      stopRecordingTimer();

      stopRecordingStream();

      revokeCurrentAudioUrl();
    }
  );
});