const audioUrls = {
  buttonClick: 'https://r73troypb4obj.vcdn.cloud/audio/20260110174628.mp3',
  wrongAnswer: 'https://r73troypb4obj.vcdn.cloud/audio/20260110174416.mp3',
  correctAnswer: 'https://r73troypb4obj.vcdn.cloud/audio/20260110174359.mp3',
  finishGame: 'https://r73troypb4obj.vcdn.cloud/audio/20260110174229.mp3',
};

const GameAudio = {
  buttonClick: null,
  wrongAnswer: null,
  correctAnswer: null,
  finishGame: null,

  init() {
    this.buttonClick = new Audio(audioUrls.buttonClick);
    this.wrongAnswer = new Audio(audioUrls.wrongAnswer);
    this.correctAnswer = new Audio(audioUrls.correctAnswer);
    this.finishGame = new Audio(audioUrls.finishGame);

    [this.buttonClick, this.wrongAnswer, this.correctAnswer, this.finishGame].forEach(audio => {
      if (audio) {
        audio.preload = 'auto';
      }
    });
  },

  play(audio) {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => { });
    }
  },

  playButtonClick() {
    this.play(this.buttonClick);
  },

  playWrongAnswer() {
    this.play(this.wrongAnswer);
  },

  playCorrectAnswer() {
    this.play(this.correctAnswer);
  },

  playFinishGame() {
    this.play(this.finishGame);
  }
};

GameAudio.init();
