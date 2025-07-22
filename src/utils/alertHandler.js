// alertHandler.js - Controle centralizado de alarme/alerta

/**
 * Classe responsável por gerenciar os alertas urgentes do aplicativo
 * Mantém a funcionalidade intrusiva essencial para diferenciação no mercado
 */
class AlertHandler {
  constructor() {
    this.alertTone = null;
    this.alertIsActive = false;
    this.lastUrgentChatInfo = null;
    this.alertOverlay = null;
    this.alertMessage = null;

    this.initializeElements();
    this.loadAudio();
  }

  /**
   * Inicializa os elementos DOM necessários para o alerta
   */
  initializeElements() {
    this.alertOverlay = document.getElementById('alertOverlay');
    this.alertMessage = document.getElementById('alertMessage');
  }

  /**
   * Carrega o áudio de alerta de forma assíncrona
   */
  async loadAudio() {
    try {
      // Carrega a biblioteca Tone.js
      const toneScript = document.createElement('script');
      toneScript.src =
        'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js';

      toneScript.onload = async () => {
        try {
          const audioBuffer =
            await window.electronAPI.getAudioData('./notify.wav');
          if (!audioBuffer) {
            console.warn('[ALERTA] Arquivo de áudio não encontrado');
            return;
          }

          const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);

          this.alertTone = new Tone.Player(audioUrl).toDestination();
          this.alertTone.volume.value = -10;
          this.alertTone.loop = true;
          await this.alertTone.load();

          console.log('[ALERTA] Áudio carregado com sucesso');
        } catch (error) {
          console.error('[ALERTA] Falha ao carregar áudio:', error);
        }
      };

      document.head.appendChild(toneScript);
    } catch (error) {
      console.error('[ALERTA] Erro ao inicializar áudio:', error);
    }
  }

  /**
   * Dispara o alerta urgente com todas as funcionalidades intrusivas
   * @param {string} alertReasonText - Texto explicativo do alerta
   * @param {Object} chatInfo - Informações do chat que gerou o alerta
   */
  triggerUrgentAlert(alertReasonText = 'uma nova mensagem', chatInfo = null) {
    if (this.alertIsActive) {
      console.log('[ALERTA] Alerta já está ativo, ignorando novo trigger');
      return;
    }

    console.log('[ALERTA] Disparando alerta urgente:', alertReasonText);
    this.alertIsActive = true;
    this.lastUrgentChatInfo = chatInfo;

    // Atualiza a interface visual
    this.updateAlertUI(alertReasonText);

    // Inicia o áudio repetitivo
    this.startAlertAudio();

    // Comunica com o processo principal do Electron para manipular a janela
    this.triggerElectronAlert(alertReasonText);
  }

  /**
   * Atualiza a interface visual do alerta
   * @param {string} alertReasonText - Texto do alerta
   */
  updateAlertUI(alertReasonText) {
    if (this.alertMessage) {
      this.alertMessage.textContent = `ATENÇÃO: ${alertReasonText.toUpperCase()}`;
    }

    if (this.alertOverlay) {
      this.alertOverlay.classList.remove('hidden');
      this.alertOverlay.classList.add('animate-pulse-red');
    }

    // Bloqueia o scroll da página
    document.body.classList.add('overflow-hidden');
  }

  /**
   * Inicia a reprodução do áudio de alerta
   */
  async startAlertAudio() {
    if (this.alertTone && this.alertTone.loaded) {
      try {
        await Tone.start();
        this.alertTone.loop = true;
        this.alertTone.start();
        console.log('[ALERTA] Áudio iniciado');
      } catch (error) {
        console.error('[ALERTA] Erro ao iniciar áudio:', error);
      }
    } else {
      console.warn('[ALERTA] Áudio não está carregado');
    }
  }

  /**
   * Comunica com o processo principal do Electron para manipular a janela
   * @param {string} alertReasonText - Texto do alerta
   */
  triggerElectronAlert(alertReasonText) {
    if (window.electronAPI?.triggerUrgentAlert) {
      window.electronAPI.triggerUrgentAlert(alertReasonText);
      console.log('[ALERTA] Comando enviado para o Electron');
    } else {
      console.warn('[ALERTA] API do Electron não disponível');
    }
  }

  /**
   * Para o alerta e restaura o estado normal
   * @param {Function} onStopCallback - Callback executado após parar o alerta
   */
  stopAlert(onStopCallback = null) {
    console.log('[ALERTA] Parando alerta');

    this.alertIsActive = false;

    // Para o áudio
    if (this.alertTone) {
      this.alertTone.stop();
      console.log('[ALERTA] Áudio parado');
    }

    // Restaura a interface
    this.restoreUI();

    // Para os efeitos no Electron
    this.stopElectronAlert();

    // Executa callback se fornecido
    if (onStopCallback) {
      onStopCallback(this.lastUrgentChatInfo);
    }

    // Limpa as informações do chat
    this.lastUrgentChatInfo = null;
  }

  /**
   * Restaura a interface visual ao estado normal
   */
  restoreUI() {
    if (this.alertOverlay) {
      this.alertOverlay.classList.add('hidden');
      this.alertOverlay.classList.remove('animate-pulse-red');
    }

    // Restaura o scroll da página
    document.body.classList.remove('overflow-hidden');
  }

  /**
   * Para os efeitos visuais no Electron
   */
  stopElectronAlert() {
    if (window.electronAPI?.stopShaking) {
      window.electronAPI.stopShaking();
      console.log('[ALERTA] Comando de parar enviado para o Electron');
    }
  }

  /**
   * Verifica se há um alerta ativo
   * @returns {boolean} True se há alerta ativo
   */
  isAlertActive() {
    return this.alertIsActive;
  }

  /**
   * Obtém as informações do último chat que gerou alerta
   * @returns {Object|null} Informações do chat ou null
   */
  getLastUrgentChatInfo() {
    return this.lastUrgentChatInfo;
  }
}

// Exporta uma instância única (singleton) do AlertHandler
export const alertHandler = new AlertHandler();

// Exporta a classe para casos onde múltiplas instâncias são necessárias
export { AlertHandler };
