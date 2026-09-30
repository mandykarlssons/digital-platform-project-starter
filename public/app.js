// Hämtar element från HTML
const quizButtons = document.querySelectorAll(".quiz-button");
const quizPopup = document.querySelector("#quiz-popup");
const closeQuizButton = document.querySelector("#close-quiz");
const quizTitle = document.querySelector("#quiz-title");
const quizQuestion = document.querySelector("#quiz-question");
const quizAudio = document.querySelector("#quiz-audio");
const quizAnswers = document.querySelector("#quiz-answers");
const quizFeedback = document.querySelector("#quiz-feedback");
const serverStatus = document.querySelector("#server-status");

// Quizens innehåll (både musik- och faktafrågor)
const quizzes = {
  "80tal": {
    title: "Poppigt 80-tal",
    questions: [
      {
        question: "Lyssna på låten. Vilken artist hör du?",
        audio: "/music/80tal-1.mp3",
        answers: ["Rick Astley", "Michael Jackson", "Madonna", "A-ha"],
        correctAnswer: "Rick Astley"
      },
      {
        question: "Vilket år släpptes Michael Jacksons ikoniska album 'Thriller'?",
        audio: null,
        answers: ["1980", "1982", "1984", "1987"],
        correctAnswer: "1982"
      },
      {
        question: "Vilket känt brittiskt synthband hade en enorm hit med 'Take On Me'?",
        audio: null,
        answers: ["Duran Duran", "Depeche Mode", "A-ha", "Pet Shop Boys"],
        correctAnswer: "A-ha"
      }
    ]
  },

  "90tal": {
    title: "Håll käften-musik från 90-talet",
    questions: [
      {
        question: "Lyssna på låten. Vilken artist eller grupp hör du?",
        audio: "/music/90tal-1.mp3",
        answers: ["Spice Girls", "Backstreet Boys", "Nirvana", "Ace of Base"],
        correctAnswer: "Backstreet Boys"
      },
      {
        question: "Vilken artist utmanade popvärlden med sin debutsingel '...Baby One More Time' år 1998?",
        audio: null,
        answers: ["Christina Aguilera", "Britney Spears", "Jessica Simpson", "Mandy Moore"],
        correctAnswer: "Britney Spears"
      },
      {
        question: "Vilket grungeband från Seattle leddes av sångaren Kurt Cobain?",
        audio: null,
        answers: ["Pearl Jam", "Soundgarden", "Nirvana", "Alice in Chains"],
        correctAnswer: "Nirvana"
      }
    ]
  },

  "10tal": {
    title: "Det bästa av det mesta från 10-talet",
    questions: [
      {
        question: "Lyssna på låten. Vilken artist hör du?",
        audio: "/music/10tal-1.mp3",
        answers: ["Avicii", "Zara Larsson", "Tove Lo", "Måns Zelmerlöw"],
        correctAnswer: "Avicii"
      },
      {
        question: "Vilken låt vann Eurovision Song Contest för Sverige år 2012?",
        audio: null,
        answers: ["Euphoria - Loreen", "Heroes - Måns Zelmerlöw", "Popular - Eric Saade", "Dance You Off - Benjamin Ingrosso"],
        correctAnswer: "Euphoria - Loreen"
      },
      {
        question: "Vilken kanadensisk artist slog rekord med spår som 'Hotline Bling' och 'One Dance'?",
        audio: null,
        answers: ["Justin Bieber", "The Weeknd", "Drake", "Shawn Mendes"],
        correctAnswer: "Drake"
      }
    ]
  }
};

// Tillståndshantering
let currentQuizCategory = null;
let currentQuestionIndex = 0;
let userScore = 0;

// Lyssnar på alla Starta-knappar
quizButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const quizName = button.dataset.quiz;
    startQuizCategory(quizName);
  });
});

// Startar valts quizkategori
function startQuizCategory(categoryKey) {
  currentQuizCategory = quizzes[categoryKey];
  currentQuestionIndex = 0;
  userScore = 0;
  
  quizPopup.classList.add("open");
  loadQuestion();
}

// Laddar aktuell fråga
function loadQuestion() {
  const currentQuiz = currentQuizCategory;
  const currentQ = currentQuiz.questions[currentQuestionIndex];
  const totalQuestions = currentQuiz.questions.length;

  quizTitle.textContent = `${currentQuiz.title} (Fråga ${currentQuestionIndex + 1}/${totalQuestions})`;
  quizQuestion.textContent = currentQ.question;
  quizFeedback.textContent = "";
  quizAnswers.innerHTML = "";

  // Om frågan har ljud spelas det upp, annars döljs ljudspelaren
  if (currentQ.audio) {
    quizAudio.style.display = "block";
    quizAudio.src = currentQ.audio;
    quizAudio.load();
    quizAudio.play().catch(() => {
      console.log("Tryck på Play för att starta musiken.");
    });
  } else {
    quizAudio.pause();
    quizAudio.style.display = "none";
  }

  // Skapar svarsknappar
  currentQ.answers.forEach((answer) => {
    const answerButton = document.createElement("button");
    answerButton.type = "button";
    answerButton.textContent = answer;

    answerButton.addEventListener("click", () => handleAnswer(answer, currentQ));
    quizAnswers.appendChild(answerButton);
  });
}

// Hanterar svar och nästa steg
function handleAnswer(selectedAnswer, questionData) {
  if (questionData.audio) {
    quizAudio.pause();
  }

  // Lås alla svarsknappar
  const buttons = quizAnswers.querySelectorAll("button");
  buttons.forEach((btn) => (btn.disabled = true));

  const isCorrect = selectedAnswer === questionData.correctAnswer;
  if (isCorrect) {
    userScore++;
    quizFeedback.textContent = "Rätt svar!";
  } else {
    quizFeedback.textContent = `Fel svar! Rätt svar var ${questionData.correctAnswer}.`;
  }

  // Nästa knapp eller avsluta
  const isLastQuestion = currentQuestionIndex === currentQuizCategory.questions.length - 1;
  const nextButton = document.createElement("button");
  nextButton.style.marginTop = "15px";

  if (isLastQuestion) {
    nextButton.textContent = "Visa resultat";
    nextButton.addEventListener("click", () => {
      quizTitle.textContent = `${currentQuizCategory.title} - Klart!`;
      quizQuestion.textContent = `Du fick ${userScore} av ${currentQuizCategory.questions.length} rätt.`;
      quizAnswers.innerHTML = "";
      quizFeedback.textContent = "";
      quizAudio.style.display = "none";
    });
  } else {
    nextButton.textContent = "Nästa fråga ->";
    nextButton.addEventListener("click", () => {
      currentQuestionIndex++;
      loadQuestion();
    });
  }

  quizFeedback.appendChild(document.createElement("br"));
  quizFeedback.appendChild(nextButton);
}

// Stänger quizet
function closeQuiz() {
  quizPopup.classList.remove("open");
  quizAudio.pause();
  quizAudio.currentTime = 0;
}

// Event handlers för stängning
closeQuizButton.addEventListener("click", closeQuiz);

quizPopup.addEventListener("click", (event) => {
  if (event.target === quizPopup) {
    closeQuiz();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && quizPopup.classList.contains("open")) {
    closeQuiz();
  }
});

// Kontrollerar Node-servern
async function checkServer() {
  try {
    const response = await fetch("/api/health");

    if (!response.ok) {
      throw new Error("Serverfel: " + response.status);
    }

    const data = await response.json();

    serverStatus.textContent =
      data.status === "ok"
        ? "Servern svarar. Öppna Network i DevTools och hitta requesten."
        : "Servern svarade, men med ett oväntat resultat.";
  } catch (error) {
    console.error("Could not reach local server", error);
    serverStatus.textContent = "Kunde inte kontakta den lokala servern.";
  }
}

checkServer();