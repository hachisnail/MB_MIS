import { Contributors, Contributions, LendingDetails, ContributionArtifacts } from "../models/contributionModels.js";
import { Op } from "sequelize";

export const createContribution = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      age,
      phone,
      sex,
      email,
      organization,
      province,
      city,
      barangay,
      street,
      contributionType,
      duration,
      displayHandlingCondition,
      liabilityConcerns,
      lendingReason,
      title,
      description,
      acquisition,
      otherInfo,
      moreInfo,
      imageFiles,
      documentFiles,
      relatedImageFiles,
      imageUrls,
      documentUrls,
      relatedImageUrls,
    } = req.body;

    // Check if contributor already exists by email
    let contributor = await Contributors.findOne({ where: { email } });

    if (!contributor) {
      contributor = await Contributors.create({
        first_name: firstName,
        last_name: lastName,
        age,
        phone_number: phone,
        sex,
        email,
        organization,
        province,
        city,
        barangay,
        street,
      });
    }

    // Create contribution record
    const contribution = await Contributions.create({
      contributor_id: contributor.contributor_id,
      contribution_type: contributionType,
      status: "pending",
    });

    // If lending, create lending details
    if (contributionType === "lending") {
      await LendingDetails.create({
        contribution_id: contribution.contribution_id,
        duration,
        display_handling_condition: displayHandlingCondition,
        liability_concerns: liabilityConcerns,
        lending_reason: lendingReason,
      });
    }

    // Create artifact record
    await ContributionArtifacts.create({
      contribution_id: contribution.contribution_id,
      title,
      description,
      acquisition_details: acquisition,
      other_info: otherInfo,
      narrative_story: moreInfo,
      images: JSON.stringify(imageFiles || []),
      documents: JSON.stringify(documentFiles || []),
      related_images: JSON.stringify(relatedImageFiles || []),
      image_urls: JSON.stringify(imageUrls ? [imageUrls] : []),
      document_urls: JSON.stringify(documentUrls ? [documentUrls] : []),
      related_image_urls: JSON.stringify(relatedImageUrls ? [relatedImageUrls] : []),
    });

    return res.status(201).json({
      message: "Contribution submitted successfully",
      contribution_id: contribution.contribution_id,
      status: contribution.status,
    });
  } catch (error) {
    console.error("Error creating contribution:", error);
    return res.status(500).json({ message: "Server error creating contribution." });
  }
};

export const getAllContributions = async (req, res) => {
  try {
    const contributions = await Contributions.findAll({
      include: [
        {
          model: Contributors,
          attributes: ["first_name", "last_name", "email"],
        },
        {
          model: LendingDetails,
        },
        {
          model: ContributionArtifacts,
        },
      ],
      order: [["created_at", "DESC"]],
    });
    return res.json(contributions);
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return res.status(500).json({ message: "Server error retrieving contributions." });
  }
};

export const getContributionById = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await Contributions.findOne({
      where: { contribution_id: id },
      include: [
        {
          model: Contributors,
          attributes: ["first_name", "last_name", "email", "phone_number"],
        },
        {
          model: LendingDetails,
        },
        {
          model: ContributionArtifacts,
        },
      ],
    });

    if (!contribution) {
      return res.status(404).json({ message: "Contribution not found." });
    }

    return res.json(contribution);
  } catch (error) {
    console.error("Error fetching contribution by ID:", error);
    return res.status(500).json({ message: "Server error retrieving contribution." });
  }
};

export const updateContributionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const [updatedCount] = await Contributions.update(
      { status, updated_at: new Date() },
      { where: { contribution_id: id } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: "Contribution not found or no changes made." });
    }

    const updatedContribution = await Contributions.findOne({ where: { contribution_id: id } });
    return res.status(200).json({
      message: "Contribution status updated successfully",
      contribution: updatedContribution,
    });
  } catch (error) {
    console.error("Error updating contribution status:", error);
    return res.status(500).json({ message: "Server error updating contribution status." });
  }
};

export const getContributionStats = async (req, res) => {
  try {
    const total = await Contributions.count();
    const pending = await Contributions.count({ where: { status: "pending" } });
    const approved = await Contributions.count({ where: { status: "approved" } });
    const rejected = await Contributions.count({ where: { status: "rejected" } });

    return res.json({ total, pending, approved, rejected });
  } catch (error) {
    console.error("Error fetching contribution stats:", error);
    return res.status(500).json({ message: "Server error retrieving contribution stats." });
  }
};

export const uploadContributionFiles = async (req, res) => {
  try {
    // req.files is an array of files
    const files = req.files.map((file) => file.filename);
    return res.status(200).json({
      message: 'Contribution files uploaded successfully',
      files,
    });
  } catch (error) {
    console.error('Error uploading contribution files:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
