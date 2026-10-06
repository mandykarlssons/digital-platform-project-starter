// Hämtar HTML-element
const quizButtons = document.querySelectorAll(".quiz-button");
const quizPopup = document.querySelector("#quiz-popup");
const popupContent = document.querySelector(".quiz-popup-content");
const closeQuizButton = document.querySelector("#close-quiz");
const quizTitle = document.querySelector("#quiz-title");
const quizProgress = document.querySelector("#quiz-progress");
const quizQuestion = document.querySelector("#quiz-question");
const quizAudio = document.querySelector("#quiz-audio");
const quizAnswers = document.querySelector("#quiz-answers");
const quizFeedback = document.querySelector("#quiz-feedback");
const quizActions = document.querySelector("#quiz-actions");
const serverStatus = document.querySelector("#server-status");
const registrationForm = document.querySelector("#registration-form");
const playerNameInput = document.querySelector("#player-name");
const playerStatus = document.querySelector("#player-status");
const storageStatus = document.querySelector("#storage-status");

// Hjälpfunktion för att avkoda Base64 med stöd för svenska tecken (UTF-8)
function decodeBase64(base64Str) {
  try {
    const binString = atob(base64Str);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return base64Str; // fallback om avkodning misslyckas
  }
}

// Dina quizfrågor
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
        question: "Vilket känt norskt synthband hade en enorm hit med 'Take On Me'?",
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
        answers: [
          "Euphoria - Loreen",
          "Heroes - Måns Zelmerlöw",
          "Popular - Eric Saade",
          "Dance You Off - Benjamin Ingrosso"
        ],
        correctAnswer: "Euphoria - Loreen"
      },
      {
        question: "Vilken kanadensisk artist slog rekord med spår som 'Hotline Bling' och 'One Dance'?",
        audio: null,
        answers: ["Justin Bieber", "The Weeknd", "Drake", "Shawn Mendes"],
        correctAnswer: "Drake"
      }
    ]
  },
  "external": {
    title: "Extern Musiktrivia (API)",
    isApi: true,
    questions: []
  }
};

// Sparnycklar och spelets tillstånd
const NAME_KEY = "jarnganget-player-name";
const SCORES_KEY = "jarnganget-leaderboards";
let playerName = "";
let currentPlayerName = "";
let currentQuizKey = null;
let currentQuizCategory = null;
let currentQuestionIndex = 0;
let userScore = 0;
let answered = false;
let resultSaved = false;
let previousFocus = null;
let leaderboards = { "80tal": [], "90tal": [], "10tal": [], "external": [] };

// Läser sparade uppgifter
function loadSavedData() {
  try {
    const savedName = localStorage.getItem(NAME_KEY);
    playerName = savedName ? savedName.trim().slice(0, 30) : "";
    const savedScores = JSON.parse(localStorage.getItem(SCORES_KEY) || "{}");

    for (const key of Object.keys(quizzes)) {
      const entries = savedScores?.[key];
      leaderboards[key] = Array.isArray(entries)
        ? entries.filter((entry) =>
            entry &&
            typeof entry.name === "string" &&
            entry.name.trim().length > 0 &&
            Number.isInteger(entry.score) &&
            Number.isInteger(entry.total) &&
            entry.total > 0 &&
            entry.score >= 0 &&
            entry.score <= entry.total &&
            Number.isFinite(entry.date)
          )
        : [];
    }
  } catch (error) {
    console.error("Kunde inte läsa sparade uppgifter", error);
    storageStatus.textContent =
      "Sparade uppgifter kunde inte läsas. Du kan fortfarande spela.";
  }

  playerNameInput.value = playerName;
  updatePlayerStatus();
  renderLeaderboards();
}

// Visar registrerat namn
function updatePlayerStatus() {
  playerStatus.textContent = playerName
    ? `Du spelar som ${playerName}. Du kan registrera ett annat namn ovan.`
    : "Registrera ditt namn innan du startar ett quiz.";
}

// Registrerar spelarnamn
registrationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = playerNameInput.value.trim();

  if (!name) {
    playerNameInput.setCustomValidity("Skriv ett spelarnamn.");
    playerNameInput.reportValidity();
    return;
  }

  playerName = name.slice(0, 30);
  playerNameInput.value = playerName;
  updatePlayerStatus();

  try {
    localStorage.setItem(NAME_KEY, playerName);
  } catch (error) {
    console.error("Kunde inte spara namnet", error);
    playerStatus.textContent =
      `Du spelar som ${playerName}. Namnet kunde inte sparas till nästa besök.`;
  }
});

playerNameInput.addEventListener("input", () => {
  playerNameInput.setCustomValidity("");
});

// Startknappar
quizButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!playerName) {
      playerStatus.textContent = "Registrera ditt namn först för att kunna spela!";
      playerNameInput.focus();
      registrationForm.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    startQuizCategory(button.dataset.quiz);
  });
});

// Startar valt quiz
async function startQuizCategory(categoryKey) {
  if (!quizzes[categoryKey]) return;

  previousFocus = document.activeElement;
  currentQuizKey = categoryKey;
  currentQuizCategory = quizzes[categoryKey];
  currentPlayerName = playerName;
  currentQuestionIndex = 0;
  userScore = 0;
  resultSaved = false;

  quizPopup.classList.add("open");
  document.body.classList.add("quiz-open");

  // Om det är det externa API-quizzet, hämta frågorna först
  if (currentQuizCategory.isApi) {
    quizTitle.textContent = currentQuizCategory.title;
    quizProgress.textContent = "Hämtar frågor från Open Trivia DB...";
    quizQuestion.textContent = "Var god vänta...";
    quizAnswers.replaceChildren();
    quizActions.replaceChildren();
    resetAudio();

    try {
      const response = await fetch("https://opentdb.com/api.php?amount=10&category=12&difficulty=medium&type=multiple&encode=base64");
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        currentQuizCategory.questions = data.results.map((item) => {
          const decodedQuestion = decodeBase64(item.question);
          const decodedCorrect = decodeBase64(item.correct_answer);
          const decodedIncorrects = item.incorrect_answers.map(decodeBase64);
          
          // Slumpa ihop svarsalternativen
          const allAnswers = [...decodedIncorrects, decodedCorrect].sort(() => Math.random() - 0.5);

          return {
            question: decodedQuestion,
            audio: null,
            answers: allAnswers,
            correctAnswer: decodedCorrect
          };
        });
        loadQuestion();
      } else {
        quizQuestion.textContent = "Kunde inte ladda frågor från API:et. Försök igen senare.";
      }
    } catch (error) {
      console.error("API Error:", error);
      quizQuestion.textContent = "Ett nätverksfel uppstod vid hämtning av frågor.";
    }
  } else {
    loadQuestion();
  }

  popupContent.focus();
}

// Stoppar och tömmer ljudspelaren
function resetAudio() {
  quizAudio.pause();
  quizAudio.removeAttribute("src");
  quizAudio.load();
  quizAudio.style.display = "none";
}

// Laddar en fråga
function loadQuestion() {
  const question = currentQuizCategory.questions[currentQuestionIndex];
  answered = false;

  quizTitle.textContent = currentQuizCategory.title;
  quizProgress.textContent =
    `${currentPlayerName} • Fråga ${currentQuestionIndex + 1}/${currentQuizCategory.questions.length} • ${userScore} poäng`;
  quizQuestion.textContent = question.question;
  quizFeedback.textContent = "";
  quizAnswers.replaceChildren();
  quizActions.replaceChildren();
  resetAudio();

  if (question.audio) {
    quizAudio.style.display = "block";
    quizAudio.src = question.audio;
    quizAudio.load();
    quizAudio.play().catch(() => {
      console.log("Tryck på Play för att starta musiken.");
    });
  }

  question.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer;
    button.addEventListener("click", () => handleAnswer(answer, question));
    quizAnswers.appendChild(button);
  });
}

// Hanterar svaret
function handleAnswer(selectedAnswer, question) {
  if (answered) return;
  answered = true;
  quizAudio.pause();

  quizAnswers.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
    if (button.textContent === question.correctAnswer) {
      button.classList.add("correct");
    } else if (button.textContent === selectedAnswer) {
      button.classList.add("incorrect");
    }
  });

  if (selectedAnswer === question.correctAnswer) {
    userScore++;
    quizFeedback.textContent = "Rätt svar!";
  } else {
    quizFeedback.textContent = `Fel svar! Rätt svar var ${question.correctAnswer}.`;
  }

  quizProgress.textContent =
    `${currentPlayerName} • Fråga ${currentQuestionIndex + 1}/${currentQuizCategory.questions.length} • ${userScore} poäng`;

  const isLastQuestion =
    currentQuestionIndex === currentQuizCategory.questions.length - 1;
  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.textContent = isLastQuestion ? "Visa resultat" : "Nästa fråga →";

  nextButton.addEventListener("click", () => {
    if (isLastQuestion) {
      showResult();
    } else {
      currentQuestionIndex++;
      loadQuestion();
      popupContent.focus();
    }
  });

  quizActions.replaceChildren(nextButton);
  nextButton.focus();
}

// Visar och sparar resultatet en gång
function showResult() {
  if (resultSaved) return;
  resultSaved = true;
  resetAudio();

  const total = currentQuizCategory.questions.length;
  quizTitle.textContent = `${currentQuizCategory.title} – Klart!`;
  quizProgress.textContent = currentPlayerName;
  quizQuestion.textContent = `Du fick ${userScore} av ${total} rätt!`;
  quizAnswers.replaceChildren();

  const saved = saveResult();
  renderLeaderboards();
  quizFeedback.textContent = saved
    ? "Ditt resultat är sparat. De tio bästa resultaten visas i topplistan!"
    : "Resultatet visas under det här besöket, men kunde inte sparas till nästa gång.";

  const doneButton = document.createElement("button");
  doneButton.type = "button";
  doneButton.textContent = "Stäng och se topplistor";
  doneButton.addEventListener("click", () => {
    closeQuiz();
    document.querySelector(".leaderboards").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
  quizActions.replaceChildren(doneButton);
  doneButton.focus();
}

// Sparar ett avslutat spel
function saveResult() {
  leaderboards[currentQuizKey].push({
    name: currentPlayerName,
    score: userScore,
    total: currentQuizCategory.questions.length,
    date: Date.now()
  });

  leaderboards[currentQuizKey].sort((a, b) =>
    (b.score / b.total) - (a.score / a.total) || a.date - b.date
  );
  leaderboards[currentQuizKey] = leaderboards[currentQuizKey].slice(0, 10);

  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(leaderboards));
    storageStatus.textContent = "";
    return true;
  } catch (error) {
    console.error("Kunde inte spara resultatet", error);
    storageStatus.textContent =
      "Resultaten kunde inte sparas till nästa besök.";
    return false;
  }
}

// Bygger topplistor med namn som vanlig text
function renderLeaderboards() {
  for (const key of Object.keys(quizzes)) {
    const list = document.querySelector(`#leaderboard-${key}`);
    if (!list) continue;
    list.replaceChildren();

    const entries = [...leaderboards[key]].sort((a, b) =>
      (b.score / b.total) - (a.score / a.total) || a.date - b.date
    ).slice(0, 10);

    if (!entries.length) {
      const empty = document.createElement("li");
      empty.textContent = "Inga resultat ännu. Bli först!";
      list.appendChild(empty);
      continue;
    }

    entries.forEach((entry, index) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const score = document.createElement("span");
      name.className = "entry-name";
      score.className = "entry-score";
      name.textContent = `${index + 1}. ${entry.name}`;
      score.textContent = `${entry.score}/${entry.total} rätt`;
      item.append(name, score);
      list.appendChild(item);
    });
  }
}

// Stänger quizet
function closeQuiz() {
  quizPopup.classList.remove("open");
  document.body.classList.remove("quiz-open");
  resetAudio();
  previousFocus?.focus();
}

closeQuizButton.addEventListener("click", closeQuiz);
quizPopup.addEventListener("click", (event) => {
  if (event.target === quizPopup) closeQuiz();
});

// Escape och tangentbordsnavigation i popupen
document.addEventListener("keydown", (event) => {
  if (!quizPopup.classList.contains("open")) return;

  if (event.key === "Escape") {
    closeQuiz();
    return;
  }

  if (event.key === "Tab") {
    const elements = [...popupContent.querySelectorAll(
      "button:not(:disabled), audio[controls]"
    )].filter((element) => element.getClientRects().length > 0);
    const first = elements[0];
    const last = elements[elements.length - 1];

    if (event.shiftKey &&
        (document.activeElement === first || document.activeElement === popupContent)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey &&
               (document.activeElement === last || document.activeElement === popupContent)) {
      event.preventDefault();
      first?.focus();
    }
  }
});

// Kontrollerar din Node-server
async function checkServer() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) {
      throw new Error("Serverfel: " + response.status);
    }

    const data = await response.json();
    serverStatus.textContent = data.status === "ok"
      ? "Servern svarar. Öppna Network i DevTools och hitta requesten."
      : "Servern svarade, men med ett oväntat resultat.";
  } catch (error) {
    console.error("Could not reach local server", error);
    serverStatus.textContent = "Kunde inte kontakta den lokala servern.";
  }
}

// Startar sidan
loadSavedData();
checkServer();