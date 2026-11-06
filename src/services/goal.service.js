const pool = require('../config/database');
const AppError = require('../errors/AppError');
const { mapGoal } = require('./goal.rules');

const GOAL_SELECT = `SELECT id, user_id, name, description,
    CAST(target_amount AS CHAR) AS target_amount,
    CAST(current_amount AS CHAR) AS current_amount,
    DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline,
    status, created_at, updated_at
  FROM financial_goals`;

async function listByUser(userId) {
  const [rows] = await pool.execute(
    `${GOAL_SELECT}
     WHERE user_id = ?
     ORDER BY FIELD(status, 'ACTIVE', 'COMPLETED', 'CANCELLED'), deadline IS NULL, deadline ASC, created_at DESC`,
    [userId],
  );
  return rows.map(mapGoal);
}

async function getByUser(userId, goalId, connection = pool) {
  const [rows] = await connection.execute(
    `${GOAL_SELECT} WHERE id = ? AND user_id = ? LIMIT 1`,
    [goalId, userId],
  );
  if (!rows[0]) throw new AppError('Meta nao encontrada.', 404, 'goal_not_found');
  return mapGoal(rows[0]);
}

function goalStatus(currentAmount, targetAmount) {
  return Number(currentAmount) >= Number(targetAmount) ? 'COMPLETED' : 'ACTIVE';
}

async function create(userId, data) {
  const status = goalStatus(data.currentAmount, data.targetAmount);
  const [result] = await pool.execute(
    `INSERT INTO financial_goals
      (user_id, name, description, target_amount, current_amount, deadline, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, data.name, data.description || null, data.targetAmount, data.currentAmount, data.deadline, status],
  );
  return getByUser(userId, result.insertId);
}

async function update(userId, goalId, data) {
  const current = await getByUser(userId, goalId);
  if (current.status === 'CANCELLED') {
    throw new AppError('Reative a meta antes de edita-la.', 409, 'goal_cancelled');
  }
  const status = goalStatus(data.currentAmount, data.targetAmount);
  await pool.execute(
    `UPDATE financial_goals
     SET name = ?, description = ?, target_amount = ?, current_amount = ?, deadline = ?, status = ?
     WHERE id = ? AND user_id = ?`,
    [data.name, data.description || null, data.targetAmount, data.currentAmount, data.deadline, status, goalId, userId],
  );
  return getByUser(userId, goalId);
}

async function contribute(userId, goalId, amount) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT CAST(target_amount AS CHAR) AS target_amount,
          CAST(current_amount AS CHAR) AS current_amount, status
       FROM financial_goals WHERE id = ? AND user_id = ? LIMIT 1 FOR UPDATE`,
      [goalId, userId],
    );
    const goal = rows[0];
    if (!goal) throw new AppError('Meta nao encontrada.', 404, 'goal_not_found');
    if (goal.status !== 'ACTIVE') {
      throw new AppError('Apenas metas ativas podem receber aportes.', 409, 'goal_not_active');
    }
    const nextAmount = Number(goal.current_amount) + Number(amount);
    if (nextAmount > Number(goal.target_amount)) {
      throw new AppError('O aporte nao pode superar o valor restante da meta.', 422, 'goal_contribution_exceeds_remaining');
    }
    const status = goalStatus(nextAmount, goal.target_amount);
    await connection.execute(
      `UPDATE financial_goals SET current_amount = ?, status = ? WHERE id = ? AND user_id = ?`,
      [nextAmount.toFixed(2), status, goalId, userId],
    );
    const updated = await getByUser(userId, goalId, connection);
    await connection.commit();
    return updated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function setStatus(userId, goalId, status) {
  const goal = await getByUser(userId, goalId);
  if (status === 'COMPLETED' && goal.currentAmount < goal.targetAmount) {
    throw new AppError('A meta so pode ser concluida ao atingir o valor-alvo.', 422, 'goal_target_not_reached');
  }
  if (status === 'ACTIVE' && goal.currentAmount >= goal.targetAmount) {
    throw new AppError('Uma meta que atingiu o valor-alvo deve permanecer concluida.', 422, 'goal_already_reached');
  }
  await pool.execute(
    'UPDATE financial_goals SET status = ? WHERE id = ? AND user_id = ?',
    [status, goalId, userId],
  );
  return getByUser(userId, goalId);
}

async function remove(userId, goalId) {
  const [result] = await pool.execute(
    'DELETE FROM financial_goals WHERE id = ? AND user_id = ?',
    [goalId, userId],
  );
  if (result.affectedRows !== 1) throw new AppError('Meta nao encontrada.', 404, 'goal_not_found');
  return { id: goalId };
}

module.exports = { contribute, create, getByUser, listByUser, remove, setStatus, update };
