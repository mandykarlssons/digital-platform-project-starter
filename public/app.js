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
const forgetNameButton = document.querySelector("#forget-name");

const cookieDialog = document.querySelector("#cookie-dialog");
const cookieSettingsForm = document.querySelector("#cookie-settings-form");
const allowNameCookie = document.querySelector("#allow-name-cookie");
const allowScoreStorage = document.querySelector("#allow-score-storage");
const cookieMessage = document.querySelector("#cookie-message");

// Avkodar text från API:et
function decodeBase64(value) {
  try {
    const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (error) {
    return value;
  }
}

// Quizfrågor
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

// Sparnycklar
const NAME_KEY = "jarnganget-player-name";
const SCORES_KEY = "jarnganget-leaderboards";
const SETTINGS_KEY = "jarnganget-storage-settings";

// Spelets tillstånd
let playerName = "";
let currentPlayerName = "";
let currentQuizKey = null;
let currentQuizCategory = null;
let currentQuestionIndex = 0;
let userScore = 0;
let answered = false;
let resultSaved = false;
let previousFocus = null;
let quizRequestId = 0;
let leaderboards = { "80tal": [], "90tal": [], "10tal": [], "external": [] };

let storageSettings = { name: false, scores: false };
let hasSavedSettings = false;

// Läser en cookie
function readCookie(key) {
  try {
    const cookie = document.cookie.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${key}=`));

    return cookie ? decodeURIComponent(cookie.slice(key.length + 1)) : "";
  } catch (error) {
    return "";
  }
}

// Sparar en cookie i 30 dagar
function writeCookie(key, value) {
  const secure = location.protocol === "https:" ? "; Secure" : "";

  document.cookie =
    `${key}=${encodeURIComponent(value)}; Max-Age=${30 * 24 * 60 * 60}; Path=/; SameSite=Lax${secure}`;

  if (readCookie(key) !== value) {
    throw new Error("Cookien kunde inte sparas.");
  }
}

// Tar bort en cookie
function deleteCookie(key) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${key}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;

  if (readCookie(key)) {
    throw new Error("Cookien kunde inte tas bort.");
  }
}

// Läser lagringsval
function loadStorageSettings() {
  try {
    const value = readCookie(SETTINGS_KEY);
    if (!value) return;

    const saved = JSON.parse(value);

    if (
      typeof saved?.name === "boolean" &&
      typeof saved?.scores === "boolean"
    ) {
      storageSettings = { name: saved.name, scores: saved.scores };
      hasSavedSettings = true;
    }
  } catch (error) {
    console.error("Kunde inte läsa lagringsval", error);
  }
}

// Läser sparat namn och topplistor
function loadSavedData() {
  playerName = storageSettings.name
    ? readCookie(NAME_KEY).trim().slice(0, 30)
    : "";

  if (storageSettings.scores) {
    try {
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
            ).sort(compareScores).slice(0, 10)
          : [];
      }
    } catch (error) {
      console.error("Kunde inte läsa topplistan", error);
      storageStatus.textContent =
        "Sparade resultat kunde inte läsas. Du kan fortfarande spela.";
    }
  } else {
    storageStatus.textContent =
      "Topplistan visas under detta besök och sparas inte till nästa gång.";
  }

  playerNameInput.value = playerName;
  updatePlayerStatus();
  renderLeaderboards();
}

// Öppnar cookiepopupen
function openCookieSettings() {
  allowNameCookie.checked = storageSettings.name;
  allowScoreStorage.checked = storageSettings.scores;
  cookieMessage.textContent = "";

  if (!cookieDialog.open) cookieDialog.showModal();
}

// Sparar lagringsval
function saveStorageSettings(nameAllowed, scoresAllowed) {
  storageSettings = { name: nameAllowed, scores: scoresAllowed };
  const errors = [];

  try {
    writeCookie(SETTINGS_KEY, JSON.stringify(storageSettings));
    hasSavedSettings = true;
  } catch (error) {
    console.error(error);
    errors.push("Dina val gäller nu, men kunde inte sparas till nästa besök.");
  }

  try {
    if (storageSettings.name && playerName) {
      writeCookie(NAME_KEY, playerName);
    } else if (!storageSettings.name) {
      deleteCookie(NAME_KEY);
    }
  } catch (error) {
    console.error(error);
    errors.push("Webbläsaren kunde inte uppdatera namn-cookien.");
  }

  try {
    // Rensar namnet från den äldre lösningen
    localStorage.removeItem(NAME_KEY);

    if (storageSettings.scores) {
      localStorage.setItem(SCORES_KEY, JSON.stringify(leaderboards));
    } else {
      localStorage.removeItem(SCORES_KEY);
    }
  } catch (error) {
    console.error(error);
    errors.push("Webbläsaren kunde inte uppdatera topplistans lagring.");
  }

  storageStatus.textContent = storageSettings.scores
    ? "Topplistan sparas i den här webbläsaren."
    : "Topplistan visas under detta besök och sparas inte till nästa gång.";

  cookieMessage.textContent = errors.join(" ");

  if (!errors.length) cookieDialog.close();
}

// Popupens knappar
document.querySelector("#open-cookie-settings")
  .addEventListener("click", openCookieSettings);

document.querySelector("#accept-all-cookies")
  .addEventListener("click", () => saveStorageSettings(true, true));

document.querySelector("#necessary-cookies-only")
  .addEventListener("click", () => saveStorageSettings(false, false));

cookieSettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveStorageSettings(allowNameCookie.checked, allowScoreStorage.checked);
});

// Visar spelarnamn
function updatePlayerStatus() {
  playerStatus.textContent = playerName
    ? `Du spelar som ${playerName}. Du kan registrera ett annat namn ovan.`
    : "Registrera ditt namn innan du startar ett quiz.";
}

// Registrerar namn
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
    if (storageSettings.name) {
      writeCookie(NAME_KEY, playerName);
    } else {
      deleteCookie(NAME_KEY);
    }
  } catch (error) {
    console.error(error);
    playerStatus.textContent =
      `Du spelar som ${playerName}. Namn-cookien kunde inte uppdateras.`;
  }

  try {
    localStorage.removeItem(NAME_KEY);
  } catch (error) {
    console.error(error);
  }
});

playerNameInput.addEventListener("input", () => {
  playerNameInput.setCustomValidity("");
});

// Glömmer namnet men behåller resultaten
forgetNameButton.addEventListener("click", () => {
  let couldForget = true;

  try {
    deleteCookie(NAME_KEY);
    localStorage.removeItem(NAME_KEY);
  } catch (error) {
    console.error(error);
    couldForget = false;
  }

  playerName = "";
  playerNameInput.value = "";
  playerNameInput.setCustomValidity("");
  updatePlayerStatus();

  if (!couldForget) {
    playerStatus.textContent =
      "Namnet har tömts för detta besök, men sparat namn kunde inte rensas helt.";
  }

  playerNameInput.focus();
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

// Slumpar svarsalternativ
function shuffleAnswers(answers) {
  const shuffled = [...answers];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// Startar quiz
async function startQuizCategory(categoryKey) {
  if (!quizzes[categoryKey]) return;

  const requestId = ++quizRequestId;
  previousFocus = document.activeElement;
  currentQuizKey = categoryKey;

  // Varje spel får sitt eget frågeinnehåll
  currentQuizCategory = {
    ...quizzes[categoryKey],
    questions: [...quizzes[categoryKey].questions]
  };

  currentPlayerName = playerName;
  currentQuestionIndex = 0;
  userScore = 0;
  answered = false;
  resultSaved = false;

  quizPopup.classList.add("open");
  document.body.classList.add("quiz-open");
  quizFeedback.textContent = "";
  quizAnswers.replaceChildren();
  quizActions.replaceChildren();
  resetAudio();
  popupContent.focus();

  if (!currentQuizCategory.isApi) {
    loadQuestion();
    return;
  }

  quizTitle.textContent = currentQuizCategory.title;
  quizProgress.textContent = "Hämtar frågor från Open Trivia DB...";
  quizQuestion.textContent = "Var god vänta...";

  try {
    const response = await fetch(
      "https://opentdb.com/api.php?amount=10&category=12&difficulty=medium&type=multiple&encode=base64"
    );

    if (!response.ok) throw new Error("API-fel: " + response.status);

    const data = await response.json();

    // Ignorerar svar från ett stängt eller ersatt quiz
    if (requestId !== quizRequestId) return;

    if (
      data.response_code !== 0 ||
      !Array.isArray(data.results) ||
      !data.results.length
    ) {
      throw new Error("Inga frågor kunde hämtas.");
    }

    currentQuizCategory.questions = data.results.map((item) => {
      const correctAnswer = decodeBase64(item.correct_answer);

      return {
        question: decodeBase64(item.question),
        audio: null,
        answers: shuffleAnswers([
          ...item.incorrect_answers.map(decodeBase64),
          correctAnswer
        ]),
        correctAnswer
      };
    });

    loadQuestion();
  } catch (error) {
    if (requestId !== quizRequestId) return;
    console.error("API Error:", error);
    quizProgress.textContent = "";
    quizQuestion.textContent =
      "Kunde inte hämta frågor. Stäng quizet och försök igen senare.";
  }
}

// Tömmer ljudspelaren
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
  updateQuizProgress();
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

// Visar fråga och poäng
function updateQuizProgress() {
  quizProgress.textContent =
    `${currentPlayerName} • Fråga ${currentQuestionIndex + 1}/${currentQuizCategory.questions.length} • ${userScore} poäng`;
}

// Hanterar svar
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
    quizFeedback.textContent =
      `Fel svar! Rätt svar var ${question.correctAnswer}.`;
  }

  updateQuizProgress();

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

// Visar resultat
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
    : storageSettings.scores
      ? "Resultatet visas under detta besök, men kunde inte sparas till nästa gång."
      : "Resultatet visas under detta besök. Aktivera lagring för att spara till nästa gång.";

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

// Sorterar högsta resultat först
function compareScores(a, b) {
  return (b.score / b.total) - (a.score / a.total) || a.date - b.date;
}

// Sparar resultat om lagring tillåts
function saveResult() {
  leaderboards[currentQuizKey].push({
    name: currentPlayerName,
    score: userScore,
    total: currentQuizCategory.questions.length,
    date: Date.now()
  });

  leaderboards[currentQuizKey] = leaderboards[currentQuizKey]
    .sort(compareScores)
    .slice(0, 10);

  if (!storageSettings.scores) {
    storageStatus.textContent =
      "Topplistan visas under detta besök och sparas inte till nästa gång.";
    return false;
  }

  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(leaderboards));
    storageStatus.textContent = "Topplistan sparas i den här webbläsaren.";
    return true;
  } catch (error) {
    console.error("Kunde inte spara resultatet", error);
    storageStatus.textContent = "Resultaten kunde inte sparas till nästa besök.";
    return false;
  }
}

// Visar topplistor
function renderLeaderboards() {
  for (const key of Object.keys(quizzes)) {
    const list = document.querySelector(`#leaderboard-${key}`);
    if (!list) continue;
    list.replaceChildren();

    const entries = [...leaderboards[key]].sort(compareScores).slice(0, 10);

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
  quizRequestId++;
  quizPopup.classList.remove("open");
  document.body.classList.remove("quiz-open");
  resetAudio();
  previousFocus?.focus();
}

closeQuizButton.addEventListener("click", closeQuiz);

quizPopup.addEventListener("click", (event) => {
  if (event.target === quizPopup) closeQuiz();
});

// Tangentbordsnavigation i quizpopupen
document.addEventListener("keydown", (event) => {
  if (!quizPopup.classList.contains("open") || cookieDialog.open) return;

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

    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === popupContent)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || document.activeElement === popupContent)
    ) {
      event.preventDefault();
      first?.focus();
    }
  }
});

// Kontrollerar Node-servern
async function checkServer() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("Serverfel: " + response.status);

    const data = await response.json();
    serverStatus.textContent = data.status === "ok"
      ? "Servern svarar. Öppna Network i DevTools och hitta requesten."
      : "Servern svarade, men med ett oväntat resultat.";
  } catch (error) {
    console.error("Kunde inte kontakta servern", error);
    serverStatus.textContent = "Kunde inte kontakta den lokala servern.";
  }
}

// Startar sidan
loadStorageSettings();
loadSavedData();
checkServer();

if (!hasSavedSettings) {
  openCookieSettings();
}