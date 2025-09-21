// src/middlewares/forcePrivateCategory.js
export function forcePrivateCategory(req, res, next) {
  // Multer hasn’t parsed multipart yet, but we can still set a default.
  // Most multer storages read from req.body *after* parsing; they won’t replace the object,
  // they just add keys, so this default usually sticks.
  if (!req.body) req.body = {};
  if (!req.body.category) req.body.category = "private";

  // (optional) also stash on a separate key in case your storage checks it
  req.forceCategory = req.forceCategory || "private";
  next();
}
