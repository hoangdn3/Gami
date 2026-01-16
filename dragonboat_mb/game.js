class DragonBoatRace {
  constructor() {
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.userPosition = 0;
    this.bot1Position = 0;
    this.bot2Position = 0;
    this.maxPosition = 5;
    this.isProcessing = false;
    this.waitingForNext = false;
    this.questions = [];
    this.answersHistory = [];

    this.questionText = document.getElementById('questionText');
    this.submitBtn = document.getElementById('submitBtn');
    this.scoreContainer = document.getElementById('scoreContainer');
    this.gameOverlay = document.getElementById('gameOverlay');
    this.overlayTitle = document.getElementById('overlayTitle');
    this.overlayMessage = document.getElementById('overlayMessage');
    this.restartBtn = document.getElementById('restartBtn');

    this.userPlayer = document.getElementById('userPlayer');
    this.bot1Player = document.getElementById('bot1Player');
    this.bot2Player = document.getElementById('bot2Player');

    this.answerContainers = document.querySelectorAll('.answer-container');

    this.imageModal = document.getElementById('imageModal');
    this.modalImage = document.getElementById('modalImage');
    this.modalClose = document.getElementById('modalClose');

    this.init();
  }

  async init() {
    this.showLoading();
    this.setPlayerName();
    try {
      this.questions = await loadQuestionsFromApi();
      this.updateScoreCount();
      this.bindEvents();
      this.loadQuestion();
      this.updateScore();
      this.updatePlayerPositions();
      this.hideLoading();
    } catch (error) {
      this.showError(error.message);
    }
  }

  setPlayerName() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerName = urlParams.get('name') || 'User';
    const playerNameEl = document.getElementById('playerName');
    if (playerNameEl) {
      playerNameEl.textContent = playerName;
    }
  }

  showLoading() {
    this.questionText.innerHTML = '<span style="color: #666;">Đang tải câu hỏi...</span>';
    this.submitBtn.disabled = true;
    this.answerContainers.forEach(container => {
      container.style.pointerEvents = 'none';
      container.style.opacity = '0.5';
    });
  }

  hideLoading() {
    this.answerContainers.forEach(container => {
      container.style.pointerEvents = '';
      container.style.opacity = '';
    });
  }

  showError(message) {
    this.questionText.innerHTML = `<span style="color: #ff4444;">Lỗi: ${message}</span>`;
    this.submitBtn.disabled = true;
  }


  updateScoreCount() {
    const totalQuestions = this.questions.length;
    const maxDisplay = 5;
    const currentGroup = Math.floor(this.currentQuestion / maxDisplay);
    const startIndex = currentGroup * maxDisplay;
    const endIndex = Math.min(startIndex + maxDisplay, totalQuestions);
    const displayCount = endIndex - startIndex;

    this.scoreContainer.innerHTML = '';

    for (let i = startIndex; i < endIndex; i++) {
      const scoreItem = document.createElement('div');
      scoreItem.className = 'score-item';
      scoreItem.dataset.index = i;
      scoreItem.innerHTML = '<img src="assets/Score.png" alt="Score">';
      this.scoreContainer.appendChild(scoreItem);
    }
  }

  bindEvents() {
    this.answerContainers.forEach(container => {
      container.addEventListener('click', () => this.selectAnswer(container));
    });

    this.submitBtn.addEventListener('click', () => this.submitAnswer());
    this.restartBtn.addEventListener('click', () => this.restartGame());

    document.querySelector('.question-section').addEventListener('click', (e) => {
      const audioIcon = 'listen-6109ad18.svg';
      const excludedImages = [audioIcon];
      const isExcluded = excludedImages.some(img => e.target.src && e.target.src.includes(img));

      if (e.target.tagName === 'IMG' && e.target.src && e.target.src.includes(audioIcon)) {
        const parentDiv = e.target.closest('div');
        if (parentDiv) {
          const audio = parentDiv.querySelector('audio');
          if (audio) {
            if (audio.paused) {
              audio.play();
            } else {
              audio.pause();
            }
          }
        }
        return;
      }

      if (e.target.tagName === 'IMG' && !e.target.classList.contains('question-bg') && !e.target.classList.contains('answer-bg') && !e.target.classList.contains('submit-btn-img') && !isExcluded) {
        this.openImageModal(e.target.src);
      }
    });

    this.modalClose.addEventListener('click', () => this.closeImageModal());
    this.imageModal.addEventListener('click', (e) => {
      if (e.target === this.imageModal) {
        this.closeImageModal();
      }
    });
  }

  openImageModal(src) {
    this.modalImage.src = src;
    this.imageModal.classList.add('show');
  }

  closeImageModal() {
    this.imageModal.classList.remove('show');
    this.modalImage.src = '';
  }

  selectAnswer(container) {
    if (this.isProcessing || this.waitingForNext) return;

    GameAudio.playButtonClick();
    this.answerContainers.forEach(c => c.classList.remove('selected'));
    container.classList.add('selected');
    this.selectedAnswer = container.dataset.answer;
    this.submitBtn.disabled = false;
  }

  loadQuestion() {
    if (this.questions.length === 0) return;

    const question = this.questions[this.currentQuestion];
    this.questionText.innerHTML = question.question;

    const answerKeys = Object.keys(question.answers).sort();

    this.answerContainers.forEach((container, index) => {
      const answerKey = answerKeys[index];
      const textSpan = container.querySelector('.answer-text');

      if (answerKey && question.answers[answerKey]) {
        container.style.display = '';
        container.dataset.answer = answerKey;
        textSpan.innerHTML = question.answers[answerKey];
        container.classList.remove('selected', 'correct', 'wrong');
      } else {
        container.style.display = 'none';
      }
    });

    this.renderMath();

    this.selectedAnswer = null;
    this.submitBtn.disabled = true;
  }

  renderMath() {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.querySelector('.question-section'), {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }

  updateScore() {
    this.updateScoreCount();
    const scoreItems = this.scoreContainer.querySelectorAll('.score-item');
    scoreItems.forEach((item) => {
      const actualIndex = parseInt(item.dataset.index);
      item.classList.remove('active', 'completed-correct', 'completed-wrong');
      if (actualIndex < this.currentQuestion) {
        if (this.answersHistory[actualIndex]) {
          item.classList.add('completed-correct');
        } else {
          item.classList.add('completed-wrong');
        }
      } else if (actualIndex === this.currentQuestion) {
        item.classList.add('active');
      }
    });
  }

  submitAnswer() {
    if (this.waitingForNext) {
      this.goToNextQuestion();
      return;
    }

    if (this.isProcessing || !this.selectedAnswer) return;

    this.isProcessing = true;
    const question = this.questions[this.currentQuestion];
    const isCorrect = this.selectedAnswer === question.correct;

    this.answerContainers.forEach(container => {
      if (container.dataset.answer === question.correct) {
        container.classList.remove('selected');
        container.classList.add('correct');
      } else {
        container.classList.add('wrong');
      }
    });

    this.answersHistory.push(isCorrect);

    if (isCorrect) {
      GameAudio.playCorrectAnswer();
      this.userPosition++;
      this.movePlayer(this.userPlayer, this.userPosition);
    } else {
      GameAudio.playWrongAnswer();
    }

    if (this.bot1Position < this.maxPosition && Math.random() >= 0.5) {
      this.bot1Position++;
      this.movePlayer(this.bot1Player, this.bot1Position);
    }
    if (this.bot2Position < this.maxPosition && Math.random() >= 0.5) {
      this.bot2Position++;
      this.movePlayer(this.bot2Player, this.bot2Position);
    }

    this.waitingForNext = true;
    this.isProcessing = false;
    this.submitBtn.querySelector('.submit-btn-img').src = 'assets/continue-button.png';
  }

  goToNextQuestion() {
    this.currentQuestion++;
    this.waitingForNext = false;
    this.submitBtn.querySelector('.submit-btn-img').src = 'assets/submit-button.png';

    if (this.userPosition >= this.maxPosition || this.currentQuestion >= this.questions.length) {
      this.endGame();
    } else {
      this.loadQuestion();
      this.updateScore();
    }
  }

  movePlayer(player, position) {
    const maxLeft = 85;
    const step = maxLeft / this.maxPosition;
    const newPosition = position * step;

    player.classList.add('moving');
    player.style.left = `${newPosition}%`;

    setTimeout(() => {
      player.classList.remove('moving');
    }, 900);
  }

  updatePlayerPositions() {
    this.movePlayer(this.userPlayer, this.userPosition);
    this.movePlayer(this.bot1Player, this.bot1Position);
    this.movePlayer(this.bot2Player, this.bot2Position);
  }

  endGame() {
    const userReachedFinish = this.userPosition >= this.maxPosition;

    if (userReachedFinish) {
      this.overlayTitle.textContent = '🎉 VỀ ĐÍCH!';
      this.overlayMessage.textContent = 'Chúc mừng! Bạn đã về đích!';
    } else {
      this.overlayTitle.textContent = '🌊 CHƯA VỀ ĐÍCH';
      this.overlayMessage.textContent = 'Hành trình vạn dặm bắt đầu từ một bước chân. Hãy thử lại nhé!';
    }

    GameAudio.playFinishGame();
    this.gameOverlay.classList.add('show');
  }

  restartGame() {
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.userPosition = 0;
    this.bot1Position = 0;
    this.bot2Position = 0;
    this.isProcessing = false;
    this.waitingForNext = false;
    this.answersHistory = [];

    this.gameOverlay.classList.remove('show');
    this.loadQuestion();
    this.updateScore();
    this.updatePlayerPositions();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DragonBoatRace();
});
