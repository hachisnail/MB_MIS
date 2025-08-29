import {
  Contributors,
  Contributions,
  LendingDetails,
  ContributionArtifacts,
} from "../models/contributionModels.js";
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

    // build base filter for Contributions
    const where = {};
    if (status) where.status = status; 
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
          where: Object.keys(contributorWhere).length ? contributorWhere : undefined,
        },
        { model: LendingDetails },
        { model: ContributionArtifacts },
      ],
      order: [["created_at", "DESC"]],
    });

    const parsed = contributions.map((c) => ({
      ...c.dataValues,
      ContributionArtifact: parseArtifactFiles(c.ContributionArtifact),
    }));

    return res.json(parsed);
  } catch (error) {
    console.error(error);
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
      ],
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
    const { status } = req.body;

    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const [updatedCount] = await Contributions.update(
      { status, updated_at: new Date() },
      { where: { contribution_id: id } }
    );
    if (updatedCount === 0)
      return res.status(404).json({ message: "Contribution not found or no changes made" });

    const updatedContribution = await Contributions.findOne({ where: { contribution_id: id } });
    return res.json({ message: "Status updated successfully", contribution: updatedContribution });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error updating status" });
  }
};

export const getContributionStats = async (req, res) => {
  try {
    const total = await Contributions.count();
    const pending = await Contributions.count({ where: { status: "pending" } });
    const approved = await Contributions.count({ where: { status: "approved" } });
    const rejected = await Contributions.count({ where: { status: "rejected" } });

    return res.json({ total, pending, approved, rejected });
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