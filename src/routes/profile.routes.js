const express = require('express');
const authenticate = require('../middleware/authenticate');
const profileService = require('../services/profile.service');
const authService = require('../services/auth.service');
const { validateProfile } = require('../validation/profile');
const AppError = require('../errors/AppError');
const env = require('../config/env');

const router = express.Router();
router.use(authenticate);

function publicProfile(profile) {
  const { session_version: _sessionVersion, ...safe } = profile;
  return safe;
}

router.get('/', async (request, response, next) => {
  try {
    response.json({ profile: publicProfile(await profileService.get(request.user.id)) });
  } catch (error) { next(error); }
});

router.put('/', async (request, response, next) => {
  try {
    const validation = validateProfile(request.body);
    if (Object.keys(validation.errors).length) {
      throw new AppError('Revise os campos destacados.', 422, 'validation_error', validation.errors);
    }
    const profile = await profileService.update(request.user.id, validation.data);
    const token = authService.createToken(profile);
    response.cookie('fincontrol_session', token, {
      httpOnly: true, sameSite: 'lax', secure: env.isProduction, path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    response.json({ message: 'Perfil atualizado.', profile: publicProfile(profile) });
  } catch (error) { next(error); }
});

module.exports = router;
