const pool = require('../config/database');
const AppError = require('../errors/AppError');
const articles = require('../../public/content/articles.v1.json');
const learning = require('../content/learning.v1.json');

function requireArticle(id) {
  const article = articles.articles.find((item) => item.id === id);
  if (!article) throw new AppError('Conteúdo não encontrado.', 404, 'article_not_found');
  return article;
}

function requireChallenge(id) {
  const challenge = learning.challenges.find((item) => item.id === id);
  if (!challenge) throw new AppError('Desafio não encontrado.', 404, 'challenge_not_found');
  return challenge;
}

async function catalog(userId) {
  const [articleRows, challengeRows] = await Promise.all([
    pool.execute('SELECT article_id, read_at, quiz_passed_at FROM learning_progress WHERE user_id = ?', [userId]),
    pool.execute('SELECT challenge_id, completed_at FROM learning_challenges WHERE user_id = ?', [userId]),
  ]);
  const progress = Object.fromEntries(articleRows[0].map((row) => [row.article_id, {
    read: Boolean(row.read_at), quizPassed: Boolean(row.quiz_passed_at),
  }]));
  const challengesCompleted = challengeRows[0].map((row) => row.challenge_id);
  const quizzes = Object.fromEntries(Object.entries(learning.quizzes).map(([id, quiz]) => [id, {
    question: quiz.question, options: quiz.options,
  }]));
  return {
    version: learning.version,
    tracks: learning.tracks,
    challenges: learning.challenges,
    quizzes,
    progress,
    challengesCompleted,
  };
}

async function markRead(userId, articleId) {
  requireArticle(articleId);
  await pool.execute(
    `INSERT INTO learning_progress (user_id, article_id, content_version, read_at)
     VALUES (?, ?, ?, UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE read_at = COALESCE(read_at, UTC_TIMESTAMP()),
       content_version = VALUES(content_version)`,
    [userId, articleId, articles.version],
  );
  return { articleId, read: true };
}

async function answerQuiz(userId, articleId, answerIndex) {
  requireArticle(articleId);
  const quiz = learning.quizzes[articleId];
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= quiz.options.length) {
    throw new AppError('Escolha uma resposta válida.', 422, 'invalid_quiz_answer');
  }
  const correct = answerIndex === quiz.correctIndex;
  if (correct) {
    await pool.execute(
      `INSERT INTO learning_progress (user_id, article_id, content_version, read_at, quiz_passed_at)
       VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
       ON DUPLICATE KEY UPDATE quiz_passed_at = UTC_TIMESTAMP(),
         read_at = COALESCE(read_at, UTC_TIMESTAMP()), content_version = VALUES(content_version)`,
      [userId, articleId, articles.version],
    );
  }
  return {
    correct,
    correctAnswer: quiz.options[quiz.correctIndex],
    explanation: quiz.explanation,
    message: correct ? 'Boa! Você concluiu este conteúdo.' : 'Tudo bem tentar de novo. Veja a explicação e escolha outra resposta.',
  };
}

async function completeChallenge(userId, challengeId) {
  requireChallenge(challengeId);
  await pool.execute(
    'INSERT IGNORE INTO learning_challenges (user_id, challenge_id) VALUES (?, ?)',
    [userId, challengeId],
  );
  return { challengeId, completed: true };
}

module.exports = { catalog, markRead, answerQuiz, completeChallenge };
