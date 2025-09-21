import crypto from "crypto";
import {
  Contributors,
  Contributions,
  LendingDetails,
  ContributionArtifacts,
  ContributionTimelines,
  ContributionSessions,
} from "../models/contributionModels.js";

import { Op } from "sequelize";
// import { verifyUUIDSignature } from "../services/hmac.js";

import {
  mintGuestCookie,
  verifyGuestCookie,
  cookieOptions,
  GUEST_COOKIE_NAME,
} from "../services/guestCookie.js";

import { sendEmail } from "../services/emailTransporter.js";
import { createLog } from "../services/logService.js";
import { Contracts } from "../models/Contracts.js";
import { requireCaptchaVerification } from "../services/captchaService.js";

import {
  newOpaqueToken,
  sha256hex,
  newOtpCode,
  verifyOtpCode,
} from "../services/magicLink.js";

import { upsertCatalogArtifact } from "../services/catalogSyncService.js";


// ---------------- config ----------------
const READ_WRITE_TTL_MIN = parseInt(process.env.GUEST_READ_WRITE_TTL_MIN || "120", 10); // 2h
const OTP_TTL_MIN = parseInt(process.env.GUEST_OTP_TTL_MIN || "10", 10); // 10m

// ---------------- helpers ----------------
function maskEmail(email) {
  if (!email || typeof email !== "string") return null;
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const dparts = domain.split(".");
  const dname = dparts[0] || "";
  const dtld = dparts.slice(1).join(".") || "";
  const localMasked =
    local.length <= 2 ? local[0] + "*" : local[0] + "*".repeat(local.length - 2) + local.slice(-1);
  const dnameMasked =
    dname.length <= 2 ? dname[0] + "*" : dname[0] + "*".repeat(Math.max(1, dname.length - 2)) + dname.slice(-1);
  return `${localMasked}@${dnameMasked}${dtld ? "." + dtld : ""}`;
}

function securityHeaders(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
}

// Convert DB value → string (handles Buffer / weird {0:"{"} / plain string)
function toStringish(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (Buffer.isBuffer(v)) return v.toString("utf8");
  if (typeof v === "object") {
    const keys = Object.keys(v);
    if (keys.length && keys.every((k) => /^\d+$/.test(k))) {
      return keys
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => v[k])
        .join("");
    }
  }
  return null;
}

// safe JSON parse from DB (handles TEXT/JSON/BLOB-ish)
function asJson(v) {
  if (v && typeof v === "object" && !Buffer.isBuffer(v)) {
    const keys = Object.keys(v);
    if (!keys.length || !keys.every((k) => /^\d+$/.test(k))) {
      return v;
    }
  }
  const s = toStringish(v);
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// ensure an array for scopes
function asArray(v) {
  const j = asJson(v);
  if (Array.isArray(j)) return j;
  if (Array.isArray(v)) return v;
  return [];
}

// stringify consistently for DB storage
function toDbJson(val) {
  try {
    return JSON.stringify(val ?? null);
  } catch {
    return JSON.stringify(null);
  }
}

// Helper to parse JSON fields of artifact
const parseArtifactFiles = (artifact) => {
  if (!artifact) return null;
  return {
    ...artifact.dataValues,
    images: JSON.parse(artifact.images || "[]"),
    documents: JSON.parse(artifact.documents || "[]"),
    related_images: JSON.parse(artifact.related_images || "[]"),
    image_urls: JSON.parse(artifact.image_urls || "[]"),
    document_urls: JSON.parse(artifact.document_urls || "[]"),
    related_image_urls: JSON.parse(artifact.related_image_urls || "[]"),
  };
};

// ---------------- Contribution CRUD ----------------

export const createContribution = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      birthDate,
      contact,
      sex,
      email,
      organization,
      province,
      city,
      barangay,
      street,
      type,
      lendDuration,
      lendConditions,
      lendLiabilities,
      lendingReason,
      artifactTitle,
      artifactDescription,
      acquisitionDetails,
      additionalInfo,
      narrative,
      artifactImages,
      artifactDocuments,
      artifactRelatedImages,
      imageUrls,
      documentUrls,
      relatedImageUrls,
      captchaToken,
      category,
    } = req.body;

    if (category === "private" && !req.session?.user && !req.session?.captchaVerified) {
      try {
        if (!captchaToken) {
          return res.status(400).json({ message: "Captcha token required for private submission" });
        }
        await requireCaptchaVerification(req, captchaToken);
      } catch {
        return res.status(400).json({ message: "Captcha verification failed" });
      }
    }


    const contributor = await Contributors.create({
      first_name: firstName,

      last_name: lastName,
      birth_date: birthDate,
      phone_number: contact,
      sex,
      email,
      organization,
      province,
      city,
      barangay,
      street,
    });


    const contribution = await Contributions.create({
      contributor_id: contributor.contributor_id,
      contribution_type: type,
      status: "pending",
    });

    if (type === "lending") {
      await LendingDetails.create({
        contribution_id: contribution.contribution_id,
        duration_from: lendDuration?.from || null,
        duration_to: lendDuration?.to || null,
        lend_conditions: lendConditions,
        lend_liabilities: lendLiabilities,
        lending_reason: lendingReason,
      });
    }

    await ContributionArtifacts.create({
      contribution_id: contribution.contribution_id,
      title: artifactTitle,
      description: artifactDescription,
      acquisition_details: acquisitionDetails,
      additional_info: additionalInfo,
      narrative: narrative,
      images: JSON.stringify(artifactImages || []),
      documents: JSON.stringify(artifactDocuments || []),
      related_images: JSON.stringify(artifactRelatedImages || []),
      image_urls: JSON.stringify(imageUrls || []),
      document_urls: JSON.stringify(documentUrls || []),
      related_image_urls: JSON.stringify(relatedImageUrls || []),
    });

    return res.status(201).json({
      message: "Contribution submitted successfully",
      contribution_id: contribution.contribution_id,
      status: contribution.status,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error creating contribution." });
  }
};

export const uploadContributionFiles = async (req, res) => {
  try {
    const files = req.files.map((file) => file.filename);
    return res.status(200).json({ message: "Files uploaded successfully", files });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error uploading files", error: err.message });
  }
};

export const getAllContributions = async (req, res) => {
  try {
    const {
      status,
      type,
      contributorName,
      contributorEmail,
      fromDate,
      toDate,
      province,
      city,
    } = req.query;

    const where = {};
    if (status) {
      if (Array.isArray(status)) where.status = { [Op.in]: status };
      else if (typeof status === "string" && status.includes(",")) where.status = { [Op.in]: status.split(",") };
      else where.status = status;
    }
    if (type) where.contribution_type = type;

    if (fromDate && toDate) where.submission_date = { [Op.between]: [new Date(fromDate), new Date(toDate)] };
    else if (fromDate) where.submission_date = { [Op.gte]: new Date(fromDate) };
    else if (toDate) where.submission_date = { [Op.lte]: new Date(toDate) };

    const contributorWhere = {};
    if (contributorName) {
      contributorWhere[Op.or] = [
        { first_name: { [Op.like]: `%${contributorName}%` } },
        { last_name: { [Op.like]: `%${contributorName}%` } },
      ];
    }
    if (contributorEmail) contributorWhere.email = { [Op.like]: `%${contributorEmail}%` };
    if (province) contributorWhere.province = province;
    if (city) contributorWhere.city = city;

    const contributions = await Contributions.findAll({
      where,
      include: [
        {
          model: Contributors,
          attributes: ["first_name", "last_name", "email", "birth_date", "province", "city"],
          where: Object.keys(contributorWhere).length ? contributorWhere : undefined,
        },
        { model: LendingDetails },
        { model: ContributionArtifacts },
        {
          model: ContributionTimelines,
          attributes: [
            "timeline_id",
            "contribution_id",
            "submitted_at",
            "under_review_at",
            "approved_at",
            "moa_settled_at",
            "on_delivery_at",
            "completed_at",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const parsed = contributions.map((c) => ({
      ...c.dataValues,
      ContributionArtifact: parseArtifactFiles(c.ContributionArtifact),
    }));

    return res.json(parsed);
  } catch (error) {
    console.error("Error in getAllContributions:", error);
    return res.status(500).json({ message: "Server error retrieving contributions." });
  }
};

export const getContributionById = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await Contributions.findOne({
      where: { contribution_id: id },
      include: [{ model: Contributors }, { model: LendingDetails }, { model: ContributionArtifacts }, { model: ContributionTimelines }],
    });

    if (!contribution) return res.status(404).json({ message: "Contribution not found" });

    return res.json({
      ...contribution.dataValues,
      ContributionArtifact: parseArtifactFiles(contribution.ContributionArtifact),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error retrieving contribution" });
  }
};

export const updateContributionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    the: {
    }
    const { status, responseMessage } = req.body;

    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [updatedCount] = await Contributions.update(
      { status, updated_at: new Date() },
      { where: { contribution_id: id } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: "Contribution not found or no changes made" });
    }

    const contribution = await Contributions.findOne({
      where: { contribution_id: id },
      include: [
        { model: Contributors, attributes: ["email", "first_name", "last_name"] },
        { model: ContributionArtifacts, attributes: ["title"] },
        { model: ContributionTimelines },
      ],
    });

    if (!contribution?.Contributor?.email) {
      return res.status(400).json({ message: "No contributor email found" });
    }

    const timelineUpdates = {};
    const now = new Date();
    if (status === "pending") timelineUpdates.under_review_at = now;
    if (status === "approved") timelineUpdates.approved_at = now;
    if (status === "rejected") timelineUpdates.under_review_at = now;

    await ContributionTimelines.update(
      { ...timelineUpdates, updated_at: now },
      { where: { contribution_id: id } }
    );

    let interactionLink = null;
    if (status === "approved") {
      let session = await ContributionSessions.findOne({
        where: { contribution_id: id, is_active: true },
      });

      const guestId = crypto.randomUUID();
      const token = newOpaqueToken(32);
      const tokenHash = sha256hex(token);
      const linkTTLdays = 14;
      const linkExpiresAt = new Date(Date.now() + linkTTLdays * 24 * 60 * 60 * 1000);

      const readScope = `inquiry:read:${id}`;

      const guest_identity = {
        guest_id: guestId,
        email: contribution.Contributor.email,
        status: "active",
        scopes: [readScope], // write scope is granted after OTP
        expires_at: linkExpiresAt.toISOString(),
        last_seen_at: null,
      };

      if (!session) {
        session = await ContributionSessions.create({
          contribution_id: id,
          guest_identity: toDbJson(guest_identity),
          scopes: toDbJson([readScope]),
          magic_token_hash: tokenHash,
          link_expires_at: linkExpiresAt,
          is_active: true,
          otp_salt: null,
          otp_code_hash: null,
          otp_expires_at: null,
          otp_verified_at: null,
        });
      } else {
        await session.update({
          guest_identity: toDbJson(guest_identity),
          scopes: toDbJson([readScope]),
          magic_token_hash: tokenHash,
          link_expires_at: linkExpiresAt,
          otp_salt: null,
          otp_code_hash: null,
          otp_expires_at: null,
          otp_verified_at: null,
        });
      }

      const baseClientUrl = process.env.CLIENT_URL || "https://mis.museobulawan.com";
      interactionLink = `${baseClientUrl}/acquisition/inquiry/${encodeURIComponent(token)}`;
    }

    const artifactName = contribution.ContributionArtifact?.title || "your artifact";
    const typeWord = contribution.contribution_type === "donation" ? "donation" : "lending";
    const subject = `Your ${typeWord} request for "${artifactName}" has been ${status}`;

    let emailHtml = `
      <p>Dear ${contribution.Contributor.first_name},</p>
      <p>Your <b>${typeWord}</b> request for the artifact <b>"${artifactName}"</b> has been <b>${status}</b>.</p>
      <p>Message from our team:</p>
      <blockquote>${responseMessage}</blockquote>
    `;

    if (interactionLink) {
      emailHtml += `
        <p>You can continue interacting with our museum staff using the following link:</p>
        <p><a href="${interactionLink}" target="_blank" rel="noreferrer">${interactionLink}</a></p>
        <p>This link will remain active until your transaction is completed.</p>
      `;
    }

    emailHtml += `<p>Best regards,<br/>Museo Bulawan Team</p>`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: contribution.Contributor.email,
      subject,
      html: emailHtml,
    };

    const emailResult = await sendEmail(mailOptions);

    return res.json({
      message: "Status & timeline updated successfully",
      emailSent: emailResult.success,
      contribution,
      interactionLink,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error updating status" });
  }
};

export const updateTimelineStep = async (req, res) => {
  try {
    const { contribution_id, step } = req.body;

    const stepFieldMap = {
      1: "under_review_at",
      2: "approved_at",
      3: "pending_at",
      4: "moa_settled_at",
      5: "on_delivery_at",
      6: "completed_at",
    };

    const field = stepFieldMap[step];
    if (!field) {
      return res.status(400).json({ message: "Invalid step" });
    }

    // Try to find an existing timeline
    let timeline = await ContributionTimelines.findOne({ where: { contribution_id } });

    // If none exists, create one seeded with the contribution's submitted date
    if (!timeline) {
      const contribution = await Contributions.findByPk(contribution_id, {
        attributes: ["submission_date", "created_at"],
      });
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }

      const submittedAt =
        contribution.submission_date ||
        contribution.created_at ||
        new Date();

      timeline = await ContributionTimelines.create({
        contribution_id,
        submitted_at: submittedAt,
      });
    }

    // Set the requested step timestamp
    timeline[field] = new Date();
    await timeline.save();

    // If completed, deactivate any active sessions for this contribution
    if (field === "completed_at") {
      await ContributionSessions.update(
        { is_active: false, closed_at: new Date() },
        { where: { contribution_id } }
      );
    }

    return res.json({ success: true, timeline });
  } catch (err) {
    console.error("Error updating timeline:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getContributionStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, completed] = await Promise.all([
      Contributions.count(),
      Contributions.count({ where: { status: "pending" } }),
      Contributions.count({ where: { status: "approved" } }),
      Contributions.count({ where: { status: "rejected" } }),
      Contributions.count({ where: { status: "completed" } }),
    ]);

    return res.json({ total, pending, approved, rejected, completed });
  } catch (err) {
    console.error("Error fetching stats:", err);
    return res.status(500).json({ message: "Server error retrieving stats" });
  }
};

export const getDonorRecords = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const where = {};
    if (fromDate && toDate) where.submission_date = { [Op.between]: [new Date(fromDate), new Date(toDate)] };

    const donors = await Contributors.findAll({
      attributes: ["contributor_id", "first_name", "last_name", "email", "birth_date", "province", "city"],
      include: [
        {
          model: Contributions,
          attributes: ["contribution_id", "status", "contribution_type", "submission_date"],
          where,
          include: [
            {
              model: ContributionArtifacts,
              attributes: [
                "artifact_id",
                "title",
                "description",
                "acquisition_details",
                "additional_info",
                "narrative",
                "images",
                "documents",
              ],
            },
          ],
        },
      ],
      order: [[{ model: Contributions }, "submission_date", "DESC"]],
    });

    const result = donors.map((donor) => {
      const donorJson = donor.toJSON();
      donorJson.total_contributions = donorJson.Contributions?.length || 0;
      return donorJson;
    });

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error retrieving donor records." });
  }
};

export const getContributionsSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const dateFilter = {};
    if (fromDate && toDate) dateFilter.submission_date = { [Op.between]: [new Date(fromDate), new Date(toDate)] };
    else if (fromDate) dateFilter.submission_date = { [Op.gte]: new Date(fromDate) };
    else if (toDate) dateFilter.submission_date = { [Op.lte]: new Date(toDate) };

    const [totalCount, approvedCount, rejectedCount, pendingCount, donationCount, lendingCount, completedCount] =
      await Promise.all([
        Contributions.count({ where: dateFilter }),
        Contributions.count({ where: { ...dateFilter, status: "approved" } }),
        Contributions.count({ where: { ...dateFilter, status: "rejected" } }),
        Contributions.count({ where: { ...dateFilter, status: "pending" } }),
        Contributions.count({ where: { ...dateFilter, contribution_type: "donation" } }),
        Contributions.count({ where: { ...dateFilter, contribution_type: "lending" } }),
        Contributions.count({ where: { ...dateFilter, status: "completed" } }),
      ]);

    return res.json({
      totalCount,
      approvedCount,
      rejectedCount,
      pendingCount,
      donationCount,
      lendingCount,
      completedCount,
    });
  } catch (err) {
    console.error("Error fetching contributions summary:", err);
    return res.status(500).json({ message: "Server error retrieving summary" });
  }
};

// ---------------- Contracts ----------------

export const getContract = async (req, res) => {
  try {
    const raw = decodeURIComponent(req.params.contractId);
    const contributionId = parseInt(raw, 10);
    if (isNaN(contributionId)) return res.status(400).json({ message: "Invalid Contribution ID" });

    const contract = await Contracts.findOne({ where: { contribution_id: contributionId }, raw: true });
    if (!contract) return res.status(404).json({ message: "Contract not found for this contribution" });

    return res.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const setContract = async (req, res) => {
  try {
    const { contribution_id, type, fileName, mergedData } = req.body;
    if (!contribution_id || !type || !fileName || !mergedData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingContract = await Contracts.findOne({ where: { contribution_id } });
    let contract;

    if (existingContract) {
      const oldData = existingContract.dataValues;
      contract = await existingContract.update({ payload: { type, fileName, mergedData } });

      await createLog(
        "update",
        "Contract",
        `Contract for Contribution (${contribution_id}) updated`,
        req.session?.userId || null,
        oldData,
        contract.dataValues,
        `IP: ${req.ip}, User-Agent: ${req.get("User-Agent")}`
      );
    } else {
      contract = await Contracts.create({
        contribution_id,
        payload: { type, fileName, mergedData },
      });

      await createLog(
        "create",
        "Contract",
        `Contract for Contribution (${contribution_id}) created`,
        req.session?.userId || null,
        null,
        contract.dataValues,
        `IP: ${req.ip}, User-Agent: ${req.get("User-Agent")}`
      );
    }

    return res.status(200).json({
      message: existingContract ? "Contract updated successfully" : "Contract created successfully",
      contract,
    });
  } catch (error) {
    console.error("Error in setContract:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------- inquiry / magic link + cookie + OTP ----------------

// ensure there is a *fresh* OTP; if none (or expired), create & email a new one
async function ensureOtpActiveAndMaybeSend(session, now) {
  const gi = asJson(session.guest_identity) || {};
  const email = gi.email || null;
  if (!email) return { sent: false, email: null };

  if (!session.otp_expires_at || now > session.otp_expires_at) {
    const { code, salt, hash } = newOtpCode();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MIN * 60 * 1000);

    await session.update({
      otp_salt: salt,
      otp_code_hash: hash,
      otp_expires_at: expiresAt,
      otp_verified_at: null, // invalidate any old verification
    });

    await sendEmail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your verification code",
      html: `<p>Your Museo Bulawan verification code is <b>${code}</b>.</p><p>It expires in ${OTP_TTL_MIN} minutes.</p>`,
    });

    return { sent: true, email };
  }
  return { sent: false, email };
}

export const openContributionSessionByToken = async (req, res) => {
  try {
    securityHeaders(res);
    const now = new Date();

    // 1) Try cookie first — if valid, return content immediately (no OTP)
    const gcRaw = req.cookies?.[GUEST_COOKIE_NAME];
    if (gcRaw) {
      const payload = verifyGuestCookie(gcRaw);
      if (payload) {
        const session = await ContributionSessions.findOne({
          where: { session_id: payload.sid, contribution_id: payload.cid, is_active: true },
        });

        if (session && (!session.link_expires_at || session.link_expires_at >= now)) {
          await session.update({
            last_seen_at: now,
            magic_link_used_at: session.magic_link_used_at || now,
          });

          const gi = asJson(session.guest_identity) || {};
          const baseSession = {
            session_id: session.session_id,
            read_enabled: true,
            write_enabled: true,
            guest_identity: gi,
            link_expires_at: session.link_expires_at,
            otp_verified_at: session.otp_verified_at,
            created_at: session.created_at,
            ttl_minutes: READ_WRITE_TTL_MIN,
          };

          const contribution = await Contributions.findOne({
            where: { contribution_id: session.contribution_id },
            include: [
              { model: Contributors, attributes: ["first_name", "last_name", "email"] },
              { model: ContributionArtifacts, attributes: ["title", "description"] },
              { model: ContributionTimelines },
              { model: Contracts },
            ],
          });
          if (!contribution) return res.status(404).json({ message: "Contribution not found" });

          return res.json({ session: baseSession, contribution });
        }
        res.clearCookie(GUEST_COOKIE_NAME, cookieOptions());
      } else {
        res.clearCookie(GUEST_COOKIE_NAME, cookieOptions());
      }
    }

    // 2) Fall back to magic link token
    const token = req.params.token || req.query.token;
    if (!token) return res.status(400).json({ message: "Missing token or cookie" });

    const session = await ContributionSessions.findOne({
      where: { magic_token_hash: sha256hex(token), is_active: true },
    });

    if (!session || (session.link_expires_at && session.link_expires_at < now)) {
      return res.status(401).json({ message: "Link invalid or expired" });
    }

    await session.update({
      last_seen_at: now,
      magic_link_used_at: session.magic_link_used_at || now,
    });

    // ❌ removed ensureOtpActiveAndMaybeSend
    // OTP must now be requested explicitly by the client

    const gi = asJson(session.guest_identity) || {};
    const baseSession = {
      session_id: session.session_id,
      read_enabled: false,
      write_enabled: false,
      guest_identity: {
        email_hint: maskEmail(gi?.email),
      },
      link_expires_at: session.link_expires_at,
      otp_verified_at: session.otp_verified_at,
      created_at: session.created_at,
      ttl_minutes: READ_WRITE_TTL_MIN,
    };

    const contribution = await Contributions.findOne({
      where: { contribution_id: session.contribution_id },
      include: [
        { model: Contributors, attributes: ["first_name", "last_name", "email"] },
        { model: ContributionArtifacts, attributes: ["title", "description"] },
        { model: ContributionTimelines },
        { model: Contracts },
      ],
    });
    if (!contribution) return res.status(404).json({ message: "Contribution not found" });

    return res.json({
      session: baseSession,
      requires_otp: true,
      contribution,
    });
  } catch (err) {
    console.error("openContributionSessionByToken error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const sendContributionSessionOtp = async (req, res) => {
  try {
    securityHeaders(res);

    const { sessionId } = req.params;
    const session = await ContributionSessions.findByPk(sessionId);
    if (!session || !session.is_active) return res.status(404).json({ message: "Session not found" });

    const gi = asJson(session.guest_identity) || {};
    const email = gi.email;
    if (!email) return res.status(400).json({ message: "No guest email on session" });

    const { code, salt, hash } = newOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
    await session.update({
      otp_salt: salt,
      otp_code_hash: hash,
      otp_expires_at: expiresAt,
      otp_verified_at: null,
    });

    await sendEmail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your verification code",
      html: `<p>Your Museo Bulawan verification code is <b>${code}</b>.</p><p>It expires in ${OTP_TTL_MIN} minutes.</p>`,
    });
    console.log("bypass otp: " + code);

    return res.json({ ok: true });
  } catch (err) {
    console.error("sendContributionSessionOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const verifyContributionSessionOtp = async (req, res) => {
  try {
    securityHeaders(res);

    const { sessionId } = req.params;
    const { code } = req.body;

    const session = await ContributionSessions.findByPk(sessionId);
    if (!session || !session.is_active) return res.status(404).json({ message: "Session not found" });

    const now = new Date();
    if (!session.otp_code_hash || !session.otp_salt || !session.otp_expires_at || now > session.otp_expires_at) {
      return res.status(400).json({ message: "Code expired. Request a new one." });
    }

    const ok = verifyOtpCode(code, session.otp_salt, session.otp_code_hash);
    if (!ok) return res.status(400).json({ message: "Invalid code" });

    // scopes (DB may store stringified)
    const curScopes = asArray(session.scopes);
    const writeScope = `chat:write:${session.contribution_id}`;
    const newSessionScopes = Array.from(new Set([...curScopes, writeScope]));

    // guest identity (DB may store stringified)
    const gi = asJson(session.guest_identity) || {};
    gi.scopes = Array.from(new Set([...(gi.scopes || []), writeScope]));
    gi.last_seen_at = now.toISOString();

    await session.update({
      otp_verified_at: now,
      scopes: toDbJson(newSessionScopes),
      guest_identity: toDbJson(gi),
      // hardening: remove OTP after success (prevents replay)
      otp_salt: null,
      otp_code_hash: null,
      otp_expires_at: null,
    });

    // 🍪 Set HttpOnly cookie for subsequent authorization
    const token = mintGuestCookie(session.session_id, session.contribution_id, READ_WRITE_TTL_MIN);
    res.cookie(GUEST_COOKIE_NAME, token, cookieOptions(READ_WRITE_TTL_MIN));

    return res.json({ ok: true, write_enabled: true, ttl_minutes: READ_WRITE_TTL_MIN });
  } catch (err) {
    console.error("verifyContributionSessionOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const completeContributionSession = async (req, res) => {
  try {
    const { id } = req.params; // contribution_id
    const { sessionId } = req.body;

    // 1. Require admin login
    if (!req.session?.user || req.session.user.roleId !== 1) {
      return res.status(403).json({ message: "Admin login required" });
    }

    // 2. Validate contribution
    const contribution = await Contributions.findByPk(id, {
      include: [{ model: ContributionTimelines }],
    });
    if (!contribution) {
      return res.status(404).json({ message: "Contribution not found" });
    }

    // 3. Validate session
    const session = await ContributionSessions.findOne({
      where: { session_id: sessionId, contribution_id: id, is_active: true },
    });
    if (!session) {
      return res.status(404).json({ message: "Active session not found" });
    }

    // 4. Mark session inactive
    await session.update({
      is_active: false,
      closed_at: new Date(),
    });

    // 5. Mark timeline complete
    let timeline = contribution.ContributionTimeline;
    if (!timeline) {
      timeline = await ContributionTimelines.create({
        contribution_id: id,
        submitted_at: contribution.submission_date,
      });
    }
    timeline.completed_at = new Date();
    await timeline.save();

    // 6. Update contribution status -> triggers afterUpdate hook to ensure collection_number
    await contribution.update({
      status: "completed",
      updated_at: new Date(),
    });

    // 7. Sync catalog so the collection_number is now reflected
    await upsertCatalogArtifact(id);

    return res.json({
      success: true,
      message: "Contribution session completed successfully",
      contribution_id: id,
      session_id: sessionId,
    });
  } catch (err) {
    console.error("completeContributionSession error:", err);
    return res
      .status(500)
      .json({ message: "Server error completing contribution session" });
  }
};



export const closeContributionSession = async (req, res) => {
  try {
    securityHeaders(res);

    const gcRaw = req.cookies?.[GUEST_COOKIE_NAME];

    if (!gcRaw) {
      // console.warn("closeContributionSession: no cookie present");
      return res.json({ ok: true });
    }

    const payload = verifyGuestCookie(gcRaw);
    if (!payload) {
      console.warn("closeContributionSession: invalid or tampered cookie detected");
      res.clearCookie(GUEST_COOKIE_NAME, cookieOptions());
      return res.json({ ok: true });
    }

    res.clearCookie(GUEST_COOKIE_NAME, cookieOptions());
    return res.json({ ok: true });
  } catch (err) {
    console.error("closeContributionSession error:", err);
    return res.status(500).json({ message: "Server error closing session" });
  }
};
