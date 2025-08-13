// useAlertHandler.js - Hook para gerenciar alertas urgentes com funcionalidades completas do Electron

import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

/**
 * Hook responsável por gerenciar os alertas urgentes do aplicativo
 * Mantém a funcionalidade intrusiva essencial para diferenciação no mercado
 * Inclui todas as funcionalidades do Electron: som, tremor da janela, foco
 */
export const useAlertHandler = () => {
  const [alertIsActive, setAlertIsActive] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [lastUrgentChatInfo, setLastUrgentChatInfo] = useState(null);
  const alertToneRef = useRef(null);
  const audioInitializedRef = useRef(false);

  useEffect(() => {
    // Inicializa o áudio de alerta
    const initializeAudio = async () => {
      if (audioInitializedRef.current) return;

      try {
        console.log('[ALERTA] Inicializando sistema de áudio...');

        // Verifica se estamos em um ambiente Electron
        if (window.electronAPI?.getAudioData) {
          console.log('[ALERTA] Tentando carregar áudio do Electron...');
          const audioBuffer =
            await window.electronAPI.getAudioData('notify.wav');
          console.log(
            '[ALERTA] Dados de áudio recebidos do Electron:',
            audioBuffer,
          );

          if (audioBuffer) {
            // Decodifica o buffer de áudio recebido do Electron diretamente
            // O dado recebido via IPC é um Uint8Array, então usamos seu .buffer
            const decodedBuffer = await Tone.context.decodeAudioData(
              audioBuffer.buffer,
            );

            alertToneRef.current = new Tone.Player(
              decodedBuffer,
            ).toDestination();
            alertToneRef.current.volume.value = -10;
            alertToneRef.current.loop = true;
            console.log(
              '[ALERTA] Áudio do Electron carregado e decodificado com sucesso',
            );
          } else {
            console.warn(
              '[ALERTA] Arquivo de áudio não encontrado, usando fallback',
            );
            createFallbackAudio();
          }
        } else {
          console.warn(
            '[ALERTA] API do Electron não disponível, usando áudio padrão',
          );
          createFallbackAudio();
        }

        audioInitializedRef.current = true;
      } catch (error) {
        console.error('[ALERTA] Erro ao inicializar áudio:', error);
        createFallbackAudio();
        audioInitializedRef.current = true;
      }
    };

    const createFallbackAudio = () => {
      // Cria um tom de alerta usando Tone.js como fallback
      alertToneRef.current = new Tone.Oscillator({
        frequency: 800,
        type: 'sine',
      }).toDestination();
      alertToneRef.current.volume.value = -15;
      console.log('[ALERTA] Áudio fallback (oscillator) criado');
    };

    initializeAudio();

    return () => {
      if (alertToneRef.current) {
        try {
          alertToneRef.current.dispose();
        } catch (error) {
          console.warn('[ALERTA] Erro ao limpar áudio:', error);
        }
      }
    };
  }, []);

  /**
   * Dispara o alerta urgente com todas as funcionalidades intrusivas
   * @param {string} alertReasonText - Texto explicativo do alerta
   * @param {Object} chatInfo - Informações do chat que gerou o alerta
   */
  const triggerUrgentAlert = async (
    alertReasonText = 'uma nova mensagem',
    chatInfo = null,
  ) => {
    if (alertIsActive) {
      console.log('[ALERTA] Alerta já está ativo, ignorando novo trigger');
      return;
    }

    console.log('[ALERTA] Disparando alerta urgente:', alertReasonText);
    setAlertIsActive(true);
    setAlertMessage(`ATENÇÃO: ${alertReasonText.toUpperCase()}`);
    setLastUrgentChatInfo(chatInfo);

    // Inicia o áudio repetitivo
    await startAlertAudio();

    // Comunica com o processo principal do Electron para manipular a janela
    triggerElectronAlert(alertReasonText);

    // Bloqueia o scroll da página (funcionalidade intrusiva)
    document.body.classList.add('overflow-hidden');
  };

  /**
   * Inicia a reprodução do áudio de alerta
   */
  const startAlertAudio = async () => {
    if (!alertToneRef.current) {
      console.warn('[ALERTA] Áudio não está inicializado');
      return;
    }

    try {
      // Garante que o contexto de áudio está iniciado
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('[ALERTA] Contexto de áudio iniciado');
      }

      if (alertToneRef.current.loaded !== false) {
        // Para Player (arquivo de áudio)
        alertToneRef.current.loop = true;
        alertToneRef.current.start();
        console.log('[ALERTA] Áudio Player iniciado');
      } else if (alertToneRef.current.start) {
        // Para Oscillator (fallback)
        alertToneRef.current.start();
        console.log('[ALERTA] Áudio Oscillator iniciado');
      }
    } catch (error) {
      console.error('[ALERTA] Erro ao iniciar áudio:', error);

      // Tentativa de fallback com beep do sistema
      try {
        if (window.electronAPI?.systemBeep) {
          window.electronAPI.systemBeep();
        }
      } catch (beepError) {
        console.error('[ALERTA] Erro ao executar beep do sistema:', beepError);
      }
    }
  };

  /**
   * Comunica com o processo principal do Electron para manipular a janela
   * @param {string} alertReasonText - Texto do alerta
   */
  const triggerElectronAlert = (alertReasonText) => {
    if (window.electronAPI?.triggerUrgentAlert) {
      window.electronAPI.triggerUrgentAlert(alertReasonText);
      console.log(
        '[ALERTA] Comando enviado para o Electron - janela será movida para frente e tremerá',
      );
    } else {
      console.warn(
        '[ALERTA] API do Electron não disponível - funcionalidades de janela não estarão disponíveis',
      );

      // Fallback para ambiente web: tenta usar APIs do navegador
      try {
        if (window.focus) {
          window.focus();
        }
        if (document.title) {
          const originalTitle = document.title;
          let flashCount = 0;
          const flashInterval = setInterval(() => {
            document.title =
              flashCount % 2 === 0 ? '🚨 ALERTA URGENTE! 🚨' : originalTitle;
            flashCount++;
            if (flashCount >= 10) {
              clearInterval(flashInterval);
              document.title = originalTitle;
            }
          }, 500);
        }
      } catch (error) {
        console.warn('[ALERTA] Erro ao executar fallback web:', error);
      }
    }
  };

  /**
   * Para o alerta e restaura o estado normal
   * @param {Function} onStopCallback - Callback executado após parar o alerta
   */
  const stopAlert = (onStopCallback = null) => {
    console.log('[ALERTA] Parando alerta');

    setAlertIsActive(false);
    setAlertMessage('');

    // Para o áudio
    if (alertToneRef.current) {
      try {
        if (alertToneRef.current.stop) {
          alertToneRef.current.stop();
        }
        console.log('[ALERTA] Áudio parado');
      } catch (error) {
        console.warn('[ALERTA] Erro ao parar áudio:', error);
      }
    }

    // Restaura o scroll da página
    document.body.classList.remove('overflow-hidden');

    // Para os efeitos no Electron
    stopElectronAlert();

    // Executa callback se fornecido
    if (onStopCallback) {
      onStopCallback(lastUrgentChatInfo);
    }

    // Limpa as informações do chat
    setLastUrgentChatInfo(null);
  };

  /**
   * Para os efeitos visuais no Electron
   */
  const stopElectronAlert = () => {
    if (window.electronAPI?.stopShaking) {
      window.electronAPI.stopShaking();
      console.log('[ALERTA] Comando de parar tremor enviado para o Electron');
    }

    // Para o flash do título (fallback web)
    try {
      if (document.title.includes('🚨')) {
        document.title = 'Cesaria Chat';
      }
    } catch (error) {
      console.warn('[ALERTA] Erro ao restaurar título:', error);
    }
  };

  /**
   * Força a inicialização do áudio (útil para interações do usuário)
   */
  const initializeAudioContext = async () => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('[ALERTA] Contexto de áudio forçadamente iniciado');
      }
    } catch (error) {
      console.error('[ALERTA] Erro ao inicializar contexto de áudio:', error);
    }
  };

  return {
    alertIsActive,
    alertMessage,
    lastUrgentChatInfo,
    triggerUrgentAlert,
    stopAlert,
    initializeAudioContext,
    isAlertActive: () => alertIsActive,
    getLastUrgentChatInfo: () => lastUrgentChatInfo,
  };
};
