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

// Quizens innehåll
const quizzes = {
  "80tal": {
    title: "Poppigt 80-tal",
    question: "Lyssna på låten. Vilken artist hör du?",
    audio: "/music/80tal-1.mp3",
    answers: ["Rick Astley", "Michael Jackson", "Madonna", "A-ha"],
    correctAnswer: "Rick Astley"
  },

  "90tal": {
    title: "Håll käften-musik från 90-talet",
    question: "Lyssna på låten. Vilken artist eller grupp hör du?",
    audio: "/music/90tal-1.mp3",
    answers: ["Spice Girls", "Backstreet Boys", "Nirvana", "Ace of Base"],
    correctAnswer: "Backstreet Boys"
  },

  "10tal": {
    title: "Det bästa av det mesta från 10-talet",
    question: "Lyssna på låten. Vilken artist hör du?",
    audio: "/music/10tal-1.mp3",
    answers: ["Avicii", "Zara Larsson", "Tove Lo", "Måns Zelmerlöw"],
    correctAnswer: "Avicii"
  }
};

// Lyssnar på alla Starta-knappar
quizButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const quizName = button.dataset.quiz;
    startQuiz(quizzes[quizName]);
  });
});

// Öppnar valt quiz
function startQuiz(quiz) {
  quizPopup.classList.add("open");
  quizTitle.textContent = quiz.title;
  quizQuestion.textContent = quiz.question;
  quizFeedback.textContent = "";
  quizAnswers.innerHTML = "";

  // Laddar och spelar rätt musik
  quizAudio.src = quiz.audio;
  quizAudio.load();
  quizAudio.play().catch(() => {
    console.log("Tryck på Play för att starta musiken.");
  });

  // Skapar svarsknappar
  quiz.answers.forEach((answer) => {
    const answerButton = document.createElement("button");
    answerButton.type = "button";
    answerButton.textContent = answer;

    answerButton.addEventListener("click", () => {
      if (answer === quiz.correctAnswer) {
        quizFeedback.textContent = "Rätt svar!";
      } else {
        quizFeedback.textContent = "Fel svar! Rätt svar är " + quiz.correctAnswer + ".";
      }

      // Stoppar musiken och låser svaren
      quizAudio.pause();
      quizAnswers.querySelectorAll("button").forEach((button) => {
        button.disabled = true;
      });
    });

    quizAnswers.appendChild(answerButton);
  });
}

// Stänger quizet
function closeQuiz() {
  quizPopup.classList.remove("open");
  quizAudio.pause();
  quizAudio.currentTime = 0;
}

// Stäng med krysset
closeQuizButton.addEventListener("click", closeQuiz);

// Stäng genom att klicka utanför popupen
quizPopup.addEventListener("click", (event) => {
  if (event.target === quizPopup) {
    closeQuiz();
  }
});

// Stäng med Escape
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