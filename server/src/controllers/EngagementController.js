// server/src/controllers/EngagementController.js
import { QueryTypes } from "sequelize";
import { logsDb as sequelize, EngagementEvent } from "../models/authModels.js";

export const postEvents = async (req, res) => {
  try {
    const { events } = req.body || {};
    if (!Array.isArray(events) || !events.length) return res.json({ ok: true, n: 0 });

      const rows = events.map((e) => ({
        t: e.t || Date.now(),
        br: String(e.br || "anon"),
        type: String(e.type),
        articleId: e.articleId || null,
        fromId: e.fromId || null,
        toId: e.toId || null,
        // target: e.target || null,  // removed
        ms: Number.isFinite(e.ms) ? Math.max(0, Math.floor(e.ms)) : null,
      }));


    await EngagementEvent.bulkCreate(rows, { validate: false });
    res.json({ ok: true, n: rows.length });
  } catch (err) {
    console.error("postEvents error", err);
    res.status(500).json({ ok: false });
  }
};

export const getArticleStats = async (req, res) => {
  try {
    const { id } = req.params;

    const timeRows = await sequelize.query(
      "SELECT COALESCE(SUM(ms),0) AS s FROM engagement_events WHERE type='time' AND article_id=?",
      { replacements: [id], type: QueryTypes.SELECT }
    );
    const clickRows = await sequelize.query(
      "SELECT COUNT(*) AS c FROM engagement_events WHERE type='click' AND article_id=?",
      { replacements: [id], type: QueryTypes.SELECT }
    );

    const timeRow = timeRows[0] || { s: 0 };
    const clickRow = clickRows[0] || { c: 0 };

    res.json({ id, ms: Number(timeRow.s || 0), clicks: Number(clickRow.c || 0) });
  } catch (err) {
    console.error("getArticleStats error", err);
    res.status(500).json({ ok: false });
  }
};

export const getNextSuggestions = async (req, res) => {
  try {
    const fromId = req.query.fromId || null;
    const limit = Math.min(10, Number(req.query.limit || 5));

    const transitions = await sequelize.query(
      `SELECT from_id AS "from", to_id AS "to", COUNT(*) AS c
       FROM engagement_events
       WHERE type='transition' AND from_id IS NOT NULL AND to_id IS NOT NULL
       GROUP BY from_id, to_id`,
      { type: QueryTypes.SELECT }
    );

    const weightsRows = await sequelize.query(
      `SELECT article_id AS id,
              COALESCE(SUM(CASE WHEN type='time' THEN ms ELSE 0 END),0) AS time_ms,
              COALESCE(SUM(CASE WHEN type='click' THEN 1 ELSE 0 END),0) AS clicks
       FROM engagement_events
       GROUP BY article_id`,
      { type: QueryTypes.SELECT }
    );

    const weights = {};
    for (const r of weightsRows) {
      if (!r.id) continue;
      weights[r.id] = 1 + (Number(r.time_ms) / 60000) * 0.2 + Number(r.clicks) * 0.5;
    }

    const C = new Map();
    for (const r of transitions) {
      if (!C.has(r.from)) C.set(r.from, new Map());
      const m = C.get(r.from);
      m.set(r.to, (m.get(r.to) || 0) + Number(r.c));
    }

    const normalize = (mapFrom) => {
      const arr = [];
      let total = 0;
      mapFrom.forEach((count, to) => {
        const w = count * (weights[to] || 1);
        arr.push({ to, w });
        total += w;
      });
      arr.sort((a, b) => b.w - a.w);
      return arr.map(x => ({ to: x.to, p: total ? x.w / total : 0 }));
    };

    if (fromId && C.has(fromId)) {
      const dist = normalize(C.get(fromId)).slice(0, limit);
      return res.json({ fromId, next: dist });
    }

    const totals = new Map();
    C.forEach((toMap) => {
      toMap.forEach((c, to) => totals.set(to, (totals.get(to) || 0) + c * (weights[to] || 1)));
    });
    const list = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([to, score]) => ({ to, score }));

    res.json({ fromId: null, next: list });
  } catch (err) {
    console.error("getNextSuggestions error", err);
    res.status(500).json({ ok: false });
  }
};
