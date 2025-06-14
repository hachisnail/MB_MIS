import { Invitation } from '../models/invitationModels.js';
import { User } from '../models/authModels.js';
import { v4 as uuidv4 } from 'uuid';
import transporter, { sendEmail } from '../services/emailTransporter.js';
import { mainDb } from '../models/authModels.js';
import bcrypt from 'bcryptjs';



export const sendInvitation = async (req, res, next) => {
  console.log("Received invitation request:", req.body);

  try {
    const { first_name, last_name, email, contact_number, role, position } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      console.log(existingUser);
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check for existing pending invitation
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

    // Generate token and expiration
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
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

    console.log('Invitation created:', invitation);
    
    // Set for logging middleware
    req.logDetails = {
      new: invitation.dataValues,
      message: `Invitation created for ${email}`
    };
    res.locals.newRecordId = invitation.id;

    // Frontend registration URL (point to your React app)
    const frontendBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const registrationUrl = `${frontendBaseUrl}/complete-registration/${token}`;

    // // Skip email in development if needed
    // if (process.env.NODE_ENV === 'development' && process.env.SKIP_EMAILS === 'true') {
    //   console.log('Skipping email in development for:', email);
    //   return res.status(201).json({
    //     message: 'Invitation created (email skipped)',
    //     invitation: formatInvitation(invitation)
    //   });
    // }

    try {
      const emailHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #6F3FFF;">You're Invited to Museo Bulawan</h2>
            <p>Hello <strong>${first_name}</strong>,</p>
            <p>You have been invited to join <strong>Museo Bulawan</strong> as a <strong>${role}</strong>.</p>
            <p>Please click the button below to complete your registration:</p>
            <a href="${registrationUrl}" style="display: inline-block; padding: 12px 20px; background-color: #6F3FFF; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Complete Registration</a>
            <p style="margin-top: 30px; font-size: 14px; color: #777;">This invitation will expire on <strong>${expiresAt.toDateString()}</strong>.</p>
          </div>
        </div>
      `;

      await sendEmail({
        from: '"Museo Bulawan" <museobulawanmis@gmail.com>',
        to: email,
        subject: 'Invitation to join Museo Bulawan',
        html: emailHtml
      });

      res.status(201).json({
        message: 'Invitation sent successfully',
        invitation: formatInvitation(invitation)
      });
      next();
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(201).json({
        message: 'Invitation created but email failed to send',
        invitation: formatInvitation(invitation)
      });
    }

  } catch (error) {
    console.error('Error in sendInvitation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }

};

// Helper function to format invitation response
const formatInvitation = (invitation) => {
  return {
    id: invitation.id,
    email: invitation.email,
    first_name: invitation.first_name,
    last_name: invitation.last_name,
    contact_number: invitation.contact_number || '',
    role: invitation.role,
    position: invitation.position || '',
    expiresAt: invitation.expiresAt,
    isUsed: invitation.isUsed,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt
  };
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
      username: username,
      password: hashedPassword,
      fname: invitation.first_name,
      lname: invitation.last_name,
      email: invitation.email,
      contact: invitation.contact_number || null,
      roleId: roleMap[invitation.role], 
      position: position 
    });

    invitation.isUsed = true;
    await invitation.save();

    req.logDetails = {
      new: newUser.dataValues,
      message: `User ${newUser.email} has successfully completed registration.`,
    };
    res.locals.newRecordId = newUser.id;

    res.status(200).json({ message: 'Registration completed successfully' });
    return next();

  } catch (error) {
    console.error('Error completing registration:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


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



export const resendInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find invitation by ID
    const invitation = await Invitation.findByPk(id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if already used
    if (invitation.isUsed) {
      return res.status(400).json({ message: 'Invitation has already been used' });
    }

    const previousState = invitation.toJSON();

    // Generate new expiry date (7 days from now)
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 7);

    // Force update of token and expiry
    invitation.set({
      token: uuidv4(),
      expiresAt: newExpiryDate,
    });

    await invitation.save();

    const newState = invitation.toJSON();

    // Log details for audit
    req.logDetails = {
      previous: previousState,
      new: newState,
      message: `Invitation for ${invitation.email} was resent`,
    };
    res.locals.newRecordId = invitation.id;

    // Build registration link
    const frontendBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const registrationUrl = `${frontendBaseUrl}/complete-registration/${invitation.token}`;

    // HTML email content
    const emailHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
          <h2 style="color: #6F3FFF;">Reminder: Invitation to Museo Bulawan</h2>
          <p>Hello <strong>${invitation.first_name}</strong>,</p>
          <p>This is a friendly reminder that you have been invited to join <strong>Museo Bulawan</strong> as a <strong>${invitation.role}</strong>.</p>
          <p>Please click the button below to complete your registration:</p>
          <a href="${registrationUrl}" style="display: inline-block; padding: 12px 20px; background-color: #6F3FFF; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Complete Registration</a>
          <p style="margin-top: 30px; font-size: 14px; color: #777;">This invitation will now expire on <strong>${invitation.expiresAt.toDateString()}</strong>.</p>
        </div>
      </div>
    `;

    // Send email
    await sendEmail({
      from: '"Museo Bulawan" <museobulawanmis@gmail.com>',
      to: invitation.email,
      subject: 'Invitation Reminder',
      html: emailHtml
    });

    // Final response
    res.status(200).json({ message: 'Invitation resent successfully' });

    // Optional: Proceed to logger middleware
    next();
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

    await invitation.destroy(); // Hard delete

    req.logDetails = {
      previous: previousState,
      message: `Invitation for ${invitation.email} permanently revoked`,
    };

    res.locals.newRecordId = id;

    res.status(200).json({ message: 'Invitation permanently deleted' });
    next();
  } catch (error) {
    console.error('Revoke Invitation Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

