import {
  Contributors,
  Contributions,
  LendingDetails,
  ContributionArtifacts,
  ContributionTimelines,
  ContributionSessions
} from "../models/contributionModels.js";

import { Op } from "sequelize";

import { signUUID, verifyUUIDSignature  } from "../services/hmac.js";

import { sendEmail } from "../services/emailTransporter.js";
import { createLog } from "../services/logService.js";

import {Contracts} from "../models/Contracts.js"

import { requireCaptchaVerification } from "../services/captchaService.js";

// Helper to parse JSON fields
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

    // PRIVATE category check: either logged-in user OR captcha verified
    if (
      category === "private" &&
      !req.session?.user &&
      !req.session?.captchaVerified
    ) {
      try {
        if (!captchaToken) {
          return res
            .status(400)
            .json({ message: "Captcha token required for private submission" });
        }
        await requireCaptchaVerification(req, captchaToken);
      } catch (err) {
        return res.status(400).json({ message: "Captcha verification failed" });
      }
    }

    // Find or create contributor
    let contributor = await Contributors.findOne({ where: { email } });
    if (!contributor) {
      contributor = await Contributors.create({
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
    }

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
      other_info: additionalInfo,
      narrative_story: narrative,
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

    // ✅ Status filter (handles single, comma-separated, or array)
    if (status) {
      if (Array.isArray(status)) {
        where.status = { [Op.in]: status };
      } else if (typeof status === "string" && status.includes(",")) {
        where.status = { [Op.in]: status.split(",") };
      } else {
        where.status = status;
      }
    }

    if (type) where.contribution_type = type;

    if (fromDate && toDate) {
      where.submission_date = {
        [Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    } else if (fromDate) {
      where.submission_date = { [Op.gte]: new Date(fromDate) };
    } else if (toDate) {
      where.submission_date = { [Op.lte]: new Date(toDate) };
    }

    // contributor filters
    const contributorWhere = {};
    if (contributorName) {
      contributorWhere[Op.or] = [
        { first_name: { [Op.like]: `%${contributorName}%` } },
        { last_name: { [Op.like]: `%${contributorName}%` } },
      ];
    }
    if (contributorEmail) {
      contributorWhere.email = { [Op.like]: `%${contributorEmail}%` };
    }
    if (province) contributorWhere.province = province;
    if (city) contributorWhere.city = city;

    const contributions = await Contributions.findAll({
      where,
      include: [
        {
          model: Contributors,
          attributes: ["first_name", "last_name", "email", "province", "city"],
          where: Object.keys(contributorWhere).length
            ? contributorWhere
            : undefined,
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
    return res
      .status(500)
      .json({ message: "Server error retrieving contributions." });
  }
};
export const getContributionById = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await Contributions.findOne({
      where: { contribution_id: id },
      include: [
        { model: Contributors },
        { model: LendingDetails },
        { model: ContributionArtifacts },
        { model: ContributionTimelines }, 
      ],
    });

    if (!contribution)
      return res.status(404).json({ message: "Contribution not found" });

    return res.json({
      ...contribution.dataValues,
      ContributionArtifact: parseArtifactFiles(contribution.ContributionArtifact),
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error retrieving contribution" });
  }
};



export const updateContributionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responseMessage } = req.body;

    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // ✅ Update contribution status
    const [updatedCount] = await Contributions.update(
      { status, updated_at: new Date() },
      { where: { contribution_id: id } }
    );

    if (updatedCount === 0) {
      return res
        .status(404)
        .json({ message: "Contribution not found or no changes made" });
    }

    // ✅ Fetch contributor + artifact
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

    // ✅ Update timeline
    const timelineUpdates = {};
    const now = new Date();
    if (status === "pending") timelineUpdates.under_review_at = now;
    if (status === "approved") timelineUpdates.approved_at = now;
    if (status === "rejected") timelineUpdates.under_review_at = now;

    await ContributionTimelines.update(
      { ...timelineUpdates, updated_at: now },
      { where: { contribution_id: id } }
    );

    // ✅ Generate session link only for approved contributions
    let interactionLink = null;
    if (status === "approved") {
      // Create session if not already existing
      let session = await ContributionSessions.findOne({
        where: { contribution_id: id, is_active: true },
      });

      if (!session) {
        session = await ContributionSessions.create({
          contribution_id: id,
        });
      }

      const signature = signUUID(session.uuid);
      const baseClientUrl = process.env.CLIENT_URL || "https://mis.museobulawan.com";
      interactionLink = `${baseClientUrl}/acquisition/inquiry/${session.uuid}?sig=${signature}`;
    }

    // ✅ Prepare personalized email
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
        <p><a href="${interactionLink}" target="_blank">${interactionLink}</a></p>
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
      interactionLink, // return it for debugging/admin
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error updating status" });
  }
};


export const updateTimelineStep = async (req, res) => {
  try {
    const { contribution_id, step } = req.body;

    const timeline = await ContributionTimelines.findOne({
      where: { contribution_id },
    });

    if (!timeline) {
      return res.status(404).json({ message: "Timeline not found" });
    }

    // Map step → column
    const stepFieldMap = {
      1: "under_review_at",
      2: "approved_at",
      3: "moa_settled_at",
      4: "on_delivery_at",
      5: "completed_at", // 👈 completion
    };

    const field = stepFieldMap[step];
    if (!field) {
      return res.status(400).json({ message: "Invalid step" });
    }

    timeline[field] = new Date();
    await timeline.save();

    // ✅ If transaction is completed, deactivate session
    if (field === "completed_at") {
      await ContributionSessions.update(
        { is_active: false, closed_at: new Date() },
        { where: { contribution_id } }
      );
    }

    res.json({ success: true, timeline });
  } catch (err) {
    console.error("Error updating timeline:", err);
    res.status(500).json({ message: "Server error" });
  }
};



export const getContributionStats = async (req, res) => {
  try {
    const total = await Contributions.count();
    const pending = await Contributions.count({ where: { status: "pending" } });
    const approved = await Contributions.count({ where: { status: "approved" } });
    const rejected = await Contributions.count({ where: { status: "rejected" } });
    const completed = await Contributions.count({ where: { status: "completed" } });

    return res.json({ total, pending, approved, rejected, completed });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error retrieving stats" });
  }
};


export const getDonorRecords = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    // filter contributions by date if provided
    const where = {};
    if (fromDate && toDate) {
      where.submission_date = {
        [Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    }

    const donors = await Contributors.findAll({
      attributes: [
        "contributor_id",
        "first_name",
        "last_name",
        "email",
        "province",
        "city",
      ],
      include: [
        {
          model: Contributions,
          attributes: [
            "contribution_id",
            "status",
            "contribution_type",
            "submission_date",
          ],
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

    // reshape: add total_contributions manually
    const result = donors.map((donor) => {
      const donorJson = donor.toJSON();
      donorJson.total_contributions = donorJson.Contributions?.length || 0;
      return donorJson;
    });

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error retrieving donor records." });
  }
};



export const getContributionsSummary = async (req, res) => {
  try {
    // Optional date filtering from query
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate && toDate) {
      dateFilter.submission_date = { [Op.between]: [new Date(fromDate), new Date(toDate)] };
    } else if (fromDate) {
      dateFilter.submission_date = { [Op.gte]: new Date(fromDate) };
    } else if (toDate) {
      dateFilter.submission_date = { [Op.lte]: new Date(toDate) };
    }

    // Counts by status
    const [totalCount, approvedCount, rejectedCount, pendingCount, donationCount, lendingCount] =
      await Promise.all([
        Contributions.count({ where: dateFilter }),
        Contributions.count({ where: { ...dateFilter, status: "approved" } }),
        Contributions.count({ where: { ...dateFilter, status: "rejected" } }),
        Contributions.count({ where: { ...dateFilter, status: "pending" } }),
        Contributions.count({ where: { ...dateFilter, contribution_type: "donation" } }),
        Contributions.count({ where: { ...dateFilter, contribution_type: "lending" } }),
      ]);

    return res.json({
      totalCount,
      approvedCount,
      rejectedCount,
      pendingCount,
      donationCount,
      lendingCount,
    });
  } catch (err) {
    console.error("Error fetching contributions summary:", err);
    return res.status(500).json({ message: "Server error retrieving summary" });
  }
};




// acquisition process

export const getContract = async (req, res) => {
  try {
    const raw = decodeURIComponent(req.params.contractId);
    const contributionId = parseInt(raw, 10);

    if (isNaN(contributionId)) {
      return res.status(400).json({ message: "Invalid Contribution ID" });
    }

    const contract = await Contracts.findOne({
      where: { contribution_id: contributionId },
      raw: true,
    });

    if (!contract) {
      return res.status(404).json({ message: "Contract not found for this contribution" });
    }

    return res.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create or update a contract
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
      contract = await existingContract.update({
        payload: { type, fileName, mergedData },
      });

      // 🔹 Log update
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

      // 🔹 Log creation
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
      message: existingContract
        ? "Contract updated successfully"
        : "Contract created successfully",
      contract,
    });
  } catch (error) {
    console.error("Error in setContract:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};







// inquiry management
export const getContributionSession = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { sig } = req.query;

    if (!uuid || !sig) {
      return res.status(400).json({ message: "Missing uuid or signature" });
    }

    // ✅ Verify signature
    const valid = verifyUUIDSignature(uuid, sig);
    if (!valid) {
      return res.status(403).json({ message: "Invalid or expired signature" });
    }

    // ✅ Find session
    const session = await ContributionSessions.findOne({
      where: { uuid, is_active: true },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found or inactive" });
    }

    // ✅ Include related contribution details
    const contribution = await Contributions.findOne({
      where: { contribution_id: session.contribution_id },
      include: [
        { model: Contributors, attributes: ["first_name", "last_name", "email"] },
        { model: ContributionArtifacts, attributes: ["title", "description"] },
        { model: ContributionTimelines },
      ],
    });

    if (!contribution) {
      return res.status(404).json({ message: "Contribution not found" });
    }

    return res.json({
      session: {
        uuid: session.uuid,
        created_at: session.created_at,
        updated_at: session.updated_at,
      },
      contribution,
    });
  } catch (err) {
    console.error("Error fetching contribution session:", err);
    return res.status(500).json({ message: "Server error fetching contribution session" });
  }
};