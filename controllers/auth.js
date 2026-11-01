'use strict';
const { User } = require('../models');
const { sign } = require('../middleware/auth');
const { wrap, bad, str, email, phone } = require('../middleware/http');

exports.register = wrap(async (req, res) => {
  const data = { name: str(req.body.name, 'Name', { max: 120 }), email: email(req.body.email) };
  const password = str(req.body.password, 'Password', { max: 100 });
  if (password.length < 8) throw bad('Password must be at least 8 characters.', 'password');
  if (await User.findOne({ where: { email: data.email } })) throw bad('An account with that email already exists.', 'email');
  const user = await User.create({
    ...data,
    phone: req.body.phone ? phone(req.body.phone) : null,
    passwordHash: await User.hash(password),
  });
  res.status(201).json({ token: sign(user), user: user.toPublic() });
});

exports.login = wrap(async (req, res) => {
  const user = await User.findOne({ where: { email: email(req.body.email) } });
  if (!user || !user.isActive || !(await user.check(String(req.body.password || '')))) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }
  res.json({ token: sign(user), user: user.toPublic() });
});

exports.me = (req, res) => res.json({ user: req.user.toPublic() });
