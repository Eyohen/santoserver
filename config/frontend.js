'use strict';
// FRONTEND_URL may hold one or more origins (comma separated), with or without a trailing
// slash. Normalise them, and allow the www / non-www twin of each so a DNS choice can't break CORS.
const clean = (u) => u.trim().replace(/\/+$/, '');
const list = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(clean).filter(Boolean);

const origins = [...new Set(list.flatMap((o) => {
  const m = o.match(/^(https?:\/\/)(www\.)?(.+)$/);
  return m && !/localhost|\d+\.\d+\.\d+\.\d+/.test(o) ? [o, `${m[1]}${m[2] ? '' : 'www.'}${m[3]}`] : [o];
}))];

module.exports = { origins, primary: list[0] };
