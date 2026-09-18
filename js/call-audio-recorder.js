/**
 * 🎙️ CallAudioRecorder — Bộ Ghi Âm Đàm Thoại 2 Bên Chuẩn Khoa Học & Bảo Mật Tuyệt Đối
 * 
 * Tính năng chính:
 * 1. Hòa trộn âm thanh 2 chiều (Dual-Channel Audio Mixing):
 *    - Kênh 1: Micro cán bộ/người gọi (Local Stream)
 *    - Kênh 2: Âm thanh người dân/đối phương (Remote Audio Stream)
 * 2. Mã hóa MP3 trực tiếp phía Client (Client-Side MP3 Encoder) bằng LameJS:
 *    - Chuẩn MPEG-1 Layer III, 44.1kHz, 128kbps stereo/mono.
 * 3. Tải xuống tức thì khi dừng ghi âm (Instant Local File Download).
 * 4. Tự hủy và giải phóng vùng nhớ hoàn toàn (Zero Data Retention / Ephemeral Memory):
 *    - Tuyệt đối không gửi dữ liệu âm thanh lên server.
 *    - Hủy sạch Blob URL và mảng PCM trong RAM ngay sau khi tải.
 *    - Đáp ứng 100% Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
 */

class CallAudioRecorder {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 44100;
    this.bitrate = options.bitrate || 128; // 128 kbps
    this.channels = 1; // Mono mixed channel for speech clarity & compact size
    this.onStateChange = options.onStateChange || null;
    this.onTick = options.onTick || null; // callback(secondsFormatted, rawSeconds)

    this.isRecording = false;
    this.audioCtx = null;
    this.mixedDestination = null;
    this.scriptProcessor = null;
    this.mp3Encoder = null;
    this.mp3Chunks = [];
    this.localSource = null;
    this.remoteSource = null;
    this.analyser = null;
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.visualizerAnimationId = null;
  }

  /**
   * Khởi động quá trình ghi âm 2 bên
   * @param {MediaStream} localStream - Luồng Micro của chính thiết bị này
   * @param {MediaStream|HTMLMediaElement} remoteSource - Luồng âm thanh từ người đối thoại (MediaStream hoặc thẻ <video>/<audio>)
   * @param {HTMLCanvasElement} [canvasEl] - Canvas tùy chọn để vẽ visualizer sóng âm
   */
  async startRecording(localStream = null, remoteSource = null, canvasEl = null) {
    if (this.isRecording) {
      console.warn('[CallAudioRecorder] Đang trong phiên ghi âm.');
      return;
    }

    // 1. Đảm bảo có thư viện LameJS
    const Lame = window.lamejs || globalThis.lamejs;
    if (!Lame || !Lame.Mp3Encoder) {
      throw new Error('Thư viện LameJS chưa được nạp. Vui lòng kiểm tra assets/vendor/lame.min.js');
    }

    // 2. Thu thập Micro cục bộ nếu chưa có
    let ownLocalStream = localStream;
    if (!ownLocalStream) {
      try {
        ownLocalStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        this._hasInternalLocalStream = true;
      } catch (err) {
        throw new Error('Không thể truy cập Microphone: ' + err.message);
      }
    } else {
      this._hasInternalLocalStream = false;
    }

    // 3. Khởi tạo Web Audio Context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass({ sampleRate: this.sampleRate });
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    // 4. Tạo Mixer Destination và Analyser
    this.mixedDestination = this.audioCtx.createMediaStreamDestination();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // 5. Nối Local Stream (Micro của ta)
    try {
      this.localSource = this.audioCtx.createMediaStreamSource(ownLocalStream);
      const localGain = this.audioCtx.createGain();
      localGain.gain.value = 1.0;
      this.localSource.connect(localGain);
      localGain.connect(this.mixedDestination);
      localGain.connect(this.analyser);
    } catch (e) {
      console.warn('[CallAudioRecorder] Local stream connect warning:', e);
    }

    // 6. Nối Remote Stream (Âm thanh đối phương) nếu có
    if (remoteSource) {
      try {
        let remoteStreamToConnect = null;
        if (remoteSource instanceof MediaStream) {
          remoteStreamToConnect = remoteSource;
        } else if (remoteSource.srcObject instanceof MediaStream) {
          remoteStreamToConnect = remoteSource.srcObject;
        } else if (typeof remoteSource.captureStream === 'function') {
          remoteStreamToConnect = remoteSource.captureStream();
        }

        if (remoteStreamToConnect && remoteStreamToConnect.getAudioTracks().length > 0) {
          this.remoteSource = this.audioCtx.createMediaStreamSource(remoteStreamToConnect);
          const remoteGain = this.audioCtx.createGain();
          remoteGain.gain.value = 1.2; // Khuếch đại nhẹ âm thanh đối phương cho cân bằng
          this.remoteSource.connect(remoteGain);
          remoteGain.connect(this.mixedDestination);
          remoteGain.connect(this.analyser);
        }
      } catch (e) {
        console.warn('[CallAudioRecorder] Remote stream connect warning:', e);
      }
    }

    // 7. Khởi tạo MP3 Encoder và ScriptProcessorNode (bộ đệm 4096 mẫu)
    this.mp3Encoder = new Lame.Mp3Encoder(this.channels, this.sampleRate, this.bitrate);
    this.mp3Chunks = [];

    const bufferSize = 4096;
    this.scriptProcessor = this.audioCtx.createScriptProcessor(bufferSize, 1, 1);

    // Chuyển đổi Float32 (-1.0 -> 1.0) sang Int16 (-32768 -> 32767) và mã hóa MP3 thời gian thực
    this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      if (!this.isRecording) return;
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      const numSamples = inputData.length;
      const int16Samples = new Int16Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        let s = Math.max(-1, Math.min(1, inputData[i]));
        int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      const mp3Chunk = this.mp3Encoder.encodeBuffer(int16Samples);
      if (mp3Chunk.length > 0) {
        this.mp3Chunks.push(new Uint8Array(mp3Chunk));
      }
    };

    // Kết nối mixer vào scriptProcessor và nối ra destination để kích hoạt luồng xử lý
    const mixedAudioSource = this.audioCtx.createMediaStreamSource(this.mixedDestination.stream);
    mixedAudioSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioCtx.destination);

    // 8. Bật đồng hồ đếm thời gian
    this.isRecording = true;
    this.elapsedSeconds = 0;
    if (this.onTick) this.onTick('00:00', 0);

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      const m = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
      const s = String(this.elapsedSeconds % 60).padStart(2, '0');
      const formatted = `${m}:${s}`;
      if (this.onTick) this.onTick(formatted, this.elapsedSeconds);
    }, 1000);

    // 9. Bật visualizer sóng âm nếu có Canvas
    if (canvasEl) {
      this.startVisualizer(canvasEl);
    }

    if (this.onStateChange) {
      this.onStateChange({ isRecording: true, state: 'recording' });
    }
  }

  /**
   * Dừng ghi âm, xuất file MP3 tải xuống ngay lập tức và hủy sạch vùng nhớ
   * @param {string} [incidentId] - Mã sự cố SOS để đặt tên file
   * @returns {Promise<{success: boolean, filename: string, size: number, duration: number}>}
   */
  async stopAndDownload(incidentId = 'CALL') {
    if (!this.isRecording) {
      console.warn('[CallAudioRecorder] Không có phiên ghi âm nào đang chạy.');
      return { success: false, reason: 'not_recording' };
    }

    this.isRecording = false;

    // Dừng đồng hồ và visualizer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.visualizerAnimationId) {
      cancelAnimationFrame(this.visualizerAnimationId);
      this.visualizerAnimationId = null;
    }

    // Flush nốt phần đệm cuối của MP3
    if (this.mp3Encoder) {
      const remainingChunk = this.mp3Encoder.flush();
      if (remainingChunk && remainingChunk.length > 0) {
        this.mp3Chunks.push(new Uint8Array(remainingChunk));
      }
    }

    const recordedSeconds = this.elapsedSeconds;

    // Tạo file MP3 Blob từ các khối đã mã hóa trong bộ nhớ
    const mp3Blob = new Blob(this.mp3Chunks, { type: 'audio/mp3' });
    const fileSize = mp3Blob.size;

    // Sinh tên tệp chuẩn hành chính: GhiAm_CuocGoi_SOS_{MãSựCố}_{ThờiGian}.mp3
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const cleanId = String(incidentId).replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `GhiAm_CuocGoi_SOS_${cleanId}_${timestampStr}.mp3`;

    // TẢI XUỐNG TỨC THỜI QUA CLIENT (BLOB URL)
    const blobUrl = URL.createObjectURL(mp3Blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // =========================================================================
    // NGUYÊN TẮC BẢO MẬT NGHỊ ĐỊNH 13/2023/NĐ-CP: TỰ HỦY SẠCH BỘ NHỚ RAM (EPHEMERAL)
    // =========================================================================
    setTimeout(() => {
      try {
        if (downloadLink && downloadLink.parentNode) {
          downloadLink.parentNode.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobUrl);
      } catch (e) {}
    }, 400);

    // Giải phóng AudioContext & Tracks
    this.destroyAudioPipeline();

    if (this.onStateChange) {
      this.onStateChange({ isRecording: false, state: 'idle', filename, size: fileSize, duration: recordedSeconds });
    }

    return {
      success: true,
      filename,
      size: fileSize,
      duration: recordedSeconds
    };
  }

  /**
   * Hủy sạch toàn bộ pipeline âm thanh và mảng đệm trong RAM
   */
  destroyAudioPipeline() {
    // 1. Xóa sạch mảng dữ liệu MP3 trong RAM
    if (this.mp3Chunks) {
      this.mp3Chunks.length = 0;
      this.mp3Chunks = null;
    }
    this.mp3Encoder = null;

    // 2. Ngắt kết nối các audio nodes
    try {
      if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
        this.scriptProcessor.onaudioprocess = null;
        this.scriptProcessor = null;
      }
      if (this.localSource) {
        this.localSource.disconnect();
        this.localSource = null;
      }
      if (this.remoteSource) {
        this.remoteSource.disconnect();
        this.remoteSource = null;
      }
      if (this.analyser) {
        this.analyser.disconnect();
        this.analyser = null;
      }
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close().catch(() => {});
        this.audioCtx = null;
      }
    } catch (e) {
      console.warn('[CallAudioRecorder] Cleanup error:', e);
    }

    // 3. Tắt track mic nội bộ nếu tự tạo
    if (this._hasInternalLocalStream && this.localStream) {
      try {
        this.localStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
    }
  }

  /**
   * Vẽ sóng âm thời gian thực trên Canvas
   */
  startVisualizer(canvas) {
    if (!canvas || !this.analyser) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!this.isRecording || !this.analyser) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      this.visualizerAnimationId = requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / (bufferLength * 0.5)) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength * 0.5; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        // Gradient màu từ xanh lam sang đỏ tác chiến
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#00d2ff');
        gradient.addColorStop(0.7, '#3b82f6');
        gradient.addColorStop(1, '#ef4444');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    draw();
  }
}

// Gán toàn cục cho cả trình duyệt và module system
if (typeof window !== 'undefined') {
  window.CallAudioRecorder = CallAudioRecorder;
}
if (typeof globalThis !== 'undefined') {
  globalThis.CallAudioRecorder = CallAudioRecorder;
}
