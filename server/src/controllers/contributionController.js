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
    const contributions = await Contributions.findAll({
      include: [
        { model: Contributors, attributes: ["first_name", "last_name", "email"] },
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
    return res.status(500).json({ message: "Server error retrieving contributions." });
  }
};

export const getContributionById = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await Contributions.findOne({
      where: { contribution_id: id },
      include: [
        { model: Contributors, attributes: ["first_name", "last_name", "email", "phone_number"] },
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
