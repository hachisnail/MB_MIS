import { User, UserSession } from "../models/authModels.js";

export const displayUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "fname", "lname", "email", "contact", "roleId"],
      include: [
        {
          model: UserSession,
          attributes: ["id", "loginAt", "logoutAt", "isOnline"],
          required: false, 
        }
      ],
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users with sessions:", error);
    res.status(500).json({ message: "Error fetching users with sessions" });
  }
};


export const displayUser = async (req, res) => {
  const fullName = decodeURIComponent(req.params.fullName);
  const [fname, ...rest] = fullName.trim().split(" ");
  const lname = rest.join(" ");

  try {
    const users = await User.findAll({
      where: {
        fname,
        lname,
      },
      attributes: ["id", "username", "fname", "lname", "email", "contact", "position", "roleId"],
      include: [
        {
          model: UserSession,
          attributes: ["id", "loginAt", "logoutAt", "isOnline"],
          required: false,
        }
      ],
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users with sessions:", error);
    res.status(500).json({ message: "Error fetching users with sessions" });
  }
};


