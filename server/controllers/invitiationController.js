import { Invitation } from '../models/invitationModels.js';
import { User } from '../models/authModels.js';
import { v4 as uuidv4 } from 'uuid';
import transporter, { sendEmail } from '../services/emailTransporter.js';
import { mainDb } from '../models/authModels.js';
import bcrypt from 'bcryptjs';
import { createLog } from '../services/logService.js';



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

    const emailHtml = `...`; // Same styled email as before

    await sendEmail({
      from: '"Museo Bulawan" <museobulawanmis@gmail.com>',
      to: email,
      subject: 'Invitation to join Museo Bulawan',
      html: emailHtml
    });

    await createLog('create', 'Invitation', `Created invitation for ${email}`, req.session?.userId || 1, null, invitation.dataValues, {
      new: invitation.dataValues,
      message: `Invitation created for ${email}`
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

    await createLog('update', 'User', `Completed registration for ${newUser.email}`, newUser.id, null, newUser.dataValues, {
      new: newUser.dataValues,
      message: `User ${newUser.email} has successfully completed registration.`
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

    const emailHtml = `...`; // Same styled email as before

    await sendEmail({
      from: '"Museo Bulawan" <museobulawanmis@gmail.com>',
      to: invitation.email,
      subject: 'Invitation Reminder',
      html: emailHtml
    });

    await createLog('update', 'Invitation', `Resent invitation to ${invitation.email}`, req.session?.userId || 1, previousState, newState, {
      previous: previousState,
      new: newState,
      message: `Invitation for ${invitation.email} was resent`
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

    await createLog('delete', 'Invitation', `Revoked invitation for ${invitation.email}`, req.session?.userId || 1, previousState, null, {
      previous: previousState,
      message: `Invitation for ${invitation.email} permanently revoked`
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



// export const resendInvitation = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     // Find invitation by ID
//     const invitation = await Invitation.findByPk(id);
//     if (!invitation) {
//       return res.status(404).json({ message: 'Invitation not found' });
//     }

//     // Check if already used
//     if (invitation.isUsed) {
//       return res.status(400).json({ message: 'Invitation has already been used' });
//     }

//     const previousState = invitation.toJSON();

//     // Generate new expiry date (7 days from now)
//     const newExpiryDate = new Date();
//     newExpiryDate.setDate(newExpiryDate.getDate() + 7);

//     // Force update of token and expiry
//     invitation.set({
//       token: uuidv4(),
//       expiresAt: newExpiryDate,
//     });

//     await invitation.save();

//     const newState = invitation.toJSON();

//     // Log details for audit
//     req.logDetails = {
//       previous: previousState,
//       new: newState,
//       message: `Invitation for ${invitation.email} was resent`,
//     };
//     res.locals.newRecordId = invitation.id;

//     // Build registration link
//     const frontendBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
//     const registrationUrl = `${frontendBaseUrl}/complete-registration/${invitation.token}`;

//     // HTML email content
//     const emailHtml = `
//       <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
//         <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
//           <h2 style="color: #6F3FFF;">Reminder: Invitation to Museo Bulawan</h2>
//           <p>Hello <strong>${invitation.first_name}</strong>,</p>
//           <p>This is a friendly reminder that you have been invited to join <strong>Museo Bulawan</strong> as a <strong>${invitation.role}</strong>.</p>
//           <p>Please click the button below to complete your registration:</p>
//           <a href="${registrationUrl}" style="display: inline-block; padding: 12px 20px; background-color: #6F3FFF; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Complete Registration</a>
//           <p style="margin-top: 30px; font-size: 14px; color: #777;">This invitation will now expire on <strong>${invitation.expiresAt.toDateString()}</strong>.</p>
//         </div>
//       </div>
//     `;

//     // Send email
//     await sendEmail({
//       from: '"Museo Bulawan" <museobulawanmis@gmail.com>',
//       to: invitation.email,
//       subject: 'Invitation Reminder',
//       html: emailHtml
//     });

//     // Final response
//     res.status(200).json({ message: 'Invitation resent successfully' });

//     // Optional: Proceed to logger middleware
//     next();
//   } catch (error) {
//     console.error('Resend Invitation Error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };



// export const revokeInvitation = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const invitation = await Invitation.findByPk(id);
//     if (!invitation) {
//       return res.status(404).json({ message: 'Invitation not found' });
//     }

//     const previousState = invitation.toJSON();

//     await invitation.destroy(); // Hard delete

//     req.logDetails = {
//       previous: previousState,
//       message: `Invitation for ${invitation.email} permanently revoked`,
//     };

//     res.locals.newRecordId = id;

//     res.status(200).json({ message: 'Invitation permanently deleted' });
//     next();
//   } catch (error) {
//     console.error('Revoke Invitation Error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

