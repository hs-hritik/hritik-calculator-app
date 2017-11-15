/**
 * Audio helper to download and play audio files.
 * @author Brijesh Bittu <brijesh@helpshift.com>
 * @created Nov 09, 2017
 */

define ("helpers/audio",
  ["store"],
  function (store) {
    "use strict";

    const AUDIO_SEND = "SEND";
    const AUDIO_RECEIVE = "RECEIVE";

    const sounds = {
      [AUDIO_SEND]: null,
      [AUDIO_RECEIVE]: null
    };

    /**
     * Load the audio files to be played later.
     */
    const init = () => {
      sounds [AUDIO_SEND] = new Audio ("/assets/audio/send.mp3");
      sounds [AUDIO_RECEIVE] = new Audio ("/assets/audio/receive.mp3");
    };

    const _play = (type) => {
      const {appState} = store.getState ();

      if (appState.featuresEnabled.audioNotifications && sounds [type]) {
        sounds [type].play ();
      }
    };

    const playSend = () => {
      _play (AUDIO_SEND);
    };

    const playReceive = () => {
      _play (AUDIO_RECEIVE);
    };

    /**
     * Play the loaded audio file
     * @param {String} messageType - The type of message that was created.
     * @param {Boolean} isCustomerMsg - Message is created by customer or not.
     */
    const playAudio = (isCustomerMsg) => {
      if (isCustomerMsg) {
        playSend ();
      } else {
        playReceive ();
      }
    };

    return {
      init,
      playSend,
      playReceive,
      playAudio
    };
  }
);
