// Per-letter alphabet lesson illustrations (imported from the bundled
// assets so Vite fingerprints + serves them). Each is a full background
// "scene" (grass + big 3D letter + object) that the teacher avatar is
// composited on top of — matching the PassPoint lesson design.

import a from "../../assets/images/letter-a.jpg";
import b from "../../assets/images/letter-b.jpg";
import c from "../../assets/images/letter-c.jpg";
import d from "../../assets/images/letter-d.jpg";
import e from "../../assets/images/letter-e.jpg";
import f from "../../assets/images/letter-f.jpg";
import g from "../../assets/images/letter-g.jpg";
import h from "../../assets/images/letter-h.jpg";
import i from "../../assets/images/letter-i.jpg";
import j from "../../assets/images/letter-j.jpg";
import k from "../../assets/images/letter-k.jpg";
import l from "../../assets/images/letter-l.jpg";
import m from "../../assets/images/letter-m.jpg";
import n from "../../assets/images/letter-n.jpg";
import o from "../../assets/images/letter-o.jpg";
import p from "../../assets/images/letter-p.jpg";
import q from "../../assets/images/letter-q.jpg";
import r from "../../assets/images/letter-r.jpg";
import s from "../../assets/images/letter-s.jpg";
import t from "../../assets/images/letter-t.jpg";
import u from "../../assets/images/letter-u.jpg";
import v from "../../assets/images/letter-v.jpg";
import w from "../../assets/images/letter-w.jpg";
import x from "../../assets/images/letter-x.jpg";
import y from "../../assets/images/letter-y.jpg";
import z from "../../assets/images/letter-z.jpg";
import teacherPointed from "../../assets/images/teacher-pointed.jpg";
import teacherAvatar from "../../assets/images/teacher-avatar.jpg";

// Keyed by uppercase letter.
export const LETTER_IMAGES = {
  A: a, B: b, C: c, D: d, E: e, F: f, G: g, H: h, I: i, J: j, K: k, L: l,
  M: m, N: n, O: o, P: p, Q: q, R: r, S: s, T: t, U: u, V: v, W: w, X: x,
  Y: y, Z: z,
};

// The pointing teacher portrait (white background — chroma-keyed at runtime).
export const TEACHER_POINTED = teacherPointed;

// The teacher headshot used in the sidebar avatar circle.
export const TEACHER_AVATAR = teacherAvatar;

export function letterImage(letter) {
  return LETTER_IMAGES[String(letter || "").toUpperCase()] || null;
}
