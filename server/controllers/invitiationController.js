import { Invitation } from '../models/invitationModels.js';
import { User } from '../models/authModels.js';
import { v4 as uuidv4 } from 'uuid';
import transporter, { sendEmail } from '../services/emailTransporter.js';
import { mainDb } from '../models/authModels.js';
import bcrypt from 'bcryptjs';
import { createLog } from '../services/logService.js';

// Utility function to get the username from userId
const getUsername = async (userId) => {
  const user = await User.findByPk(userId);
  return user ? user.username : 'System';
};

export const sendInvitation = async (req, res, next) => {
  try {
    const { first_name, last_name, email, contact_number, role, position } = req.body;

    if (!first_name || !last_name || !email || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingInvitation = await Invitation.findOne({
      where: {
        email,
        isUsed: false,
        expiresAt: { [mainDb.Sequelize.Op.gt]: new Date() },
      },
    });
    if (existingInvitation) {
      return res.status(400).json({ message: "Pending invitation already exists" });
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await Invitation.create({
      email,
      first_name,
      last_name,
      contact_number: contact_number || null,
      token,
      expiresAt,
      role,
      position: position || null
    });

    const frontendBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const registrationUrl = `${frontendBaseUrl}/complete-registration/${token}`;

    const emailHtml = `...`; // Compose your styled HTML email content here

    await sendEmail({
      from: '"Museo Bulawan" <museobulawanmis@gmail.com>',
      to: email,
      subject: 'Invitation to join Museo Bulawan',
      html: emailHtml
    });

    const actor = await getUsername(req.session?.userId || 1);
    await createLog('create', 'Invitation', `${actor} created an invitation for ${email}`, req.session?.userId || 1, null, invitation.dataValues, {
      new: invitation.dataValues,
      message: `${actor} has created an invitation for ${email}.`
    });

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: formatInvitation(invitation)
    });
  } catch (error) {
    console.error('Error in sendInvitation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const completeRegistration = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, username, position } = req.body;

    if (!password || !username || !position) {
      return res.status(400).json({ message: 'Password, username, and position are required' });
    }

    const invitation = await Invitation.findOne({
      where: {
        token,
        isUsed: false,
        expiresAt: { [mainDb.Sequelize.Op.gt]: new Date() }
      }
    });

    if (!invitation) {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const roleMap = {
      Admin: 1,
      ContentManager: 2,
      Viewer: 3,
      Reviewer: 4
    };

    const newUser = await User.create({
      username,
      password: hashedPassword,
      fname: invitation.first_name,
      lname: invitation.last_name,
      email: invitation.email,
      contact: invitation.contact_number || null,
      roleId: roleMap[invitation.role],
      position
    });

    invitation.isUsed = true;
    await invitation.save();

    const actor = newUser.username;
    await createLog('update', 'User', `${actor} completed registration with email ${newUser.email}`, newUser.id, null, newUser.dataValues, {
      new: newUser.dataValues,
      message: `${actor} has successfully completed their registration.`
    });

    res.status(200).json({ message: 'Registration completed successfully' });
  } catch (error) {
    console.error('Error completing registration:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const resendInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findByPk(id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.isUsed) {
      return res.status(400).json({ message: 'Invitation has already been used' });
    }

    const previousState = invitation.toJSON();
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 7);

    invitation.set({
      token: uuidv4(),
      expiresAt: newExpiryDate,
    });

    await invitation.save();
    const newState = invitation.toJSON();

    const frontendBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const registrationUrl = `${frontendBaseUrl}/complete-registration/${invitation.token}`;

    const emailHtml = `...`; // Compose your styled email HTML here

    await sendEmail({
      from: '"Museo Bulawan" <museobulawanmis@gmail.com>',
      to: invitation.email,
      subject: 'Invitation Reminder',
      html: emailHtml
    });

    const actor = await getUsername(req.session?.userId || 1);
    await createLog('update', 'Invitation', `${actor} resent an invitation to ${invitation.email}`, req.session?.userId || 1, previousState, newState, {
      previous: previousState,
      new: newState,
      message: `${actor} has resent an invitation to ${invitation.email}.`
    });

    res.status(200).json({ message: 'Invitation resent successfully' });
  } catch (error) {
    console.error('Resend Invitation Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const revokeInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findByPk(id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    const previousState = invitation.toJSON();
    await invitation.destroy();

    const actor = await getUsername(req.session?.userId || 1);
    await createLog('delete', 'Invitation', `${actor} revoked an invitation for ${invitation.email}`, req.session?.userId || 1, previousState, null, {
      previous: previousState,
      message: `${actor} has permanently revoked the invitation for ${invitation.email}.`
    });

    res.status(200).json({ message: 'Invitation permanently deleted' });
  } catch (error) {
    console.error('Revoke Invitation Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const formatInvitation = (inv) => ({
  id: inv.id,
  email: inv.email,
  first_name: inv.first_name,
  last_name: inv.last_name,
  contact_number: inv.contact_number || '',
  role: inv.role,
  position: inv.position || '',
  expiresAt: inv.expiresAt,
  isUsed: inv.isUsed,
  createdAt: inv.createdAt,
  updatedAt: inv.updatedAt
});

export const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.findAll({
      where: {
        isUsed: false
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(invitations.map(formatInvitation));
  } catch (error) {
    console.error('Error fetching:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
