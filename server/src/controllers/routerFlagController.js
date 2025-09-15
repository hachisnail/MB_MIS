import RouterFlag from "../models/routerFlags.js";
import { createLog } from "../services/logService.js";
import { Op } from "sequelize";
import { mapAndObfuscateFlags } from "../services/obfuscateFlags.js";

export const getFlags = async (req, res) => {
  try {
    const flags = await RouterFlag.findAll({ attributes: ['route_key', 'is_enabled', 'is_public'] });
    // console.log("Fetched Flags: ", flags); // Log fetched flags

    if (!flags || flags.length === 0) {
      console.log("No flags found.");
      return res.status(404).json({ message: "No flags found in the database" });
    }

    const { encoded, keys } = mapAndObfuscateFlags(flags);
    // console.log("Encoded Flags: ", encoded); // Log encoded flags

    res.json({ encoded, keys });  
  } catch (error) {
    console.error("Error fetching flags:", error);
    res.status(500).json({ message: "Failed to fetch router flags" });
  }
};


export const getFlagsForAdmin = async (req, res) => {
  try {
    // Fetch all flags from the database, including 'route_key', 'is_enabled', and 'is_public' attributes
    const flags = await RouterFlag.findAll({
      attributes: ['route_key', 'is_enabled', 'is_public']
    });

    // console.log("Fetched Flags for Admin: ", flags); // Log fetched flags for verification

    if (!flags || flags.length === 0) {
      console.log("No flags found.");
      return res.status(404).json({ message: "No flags found in the database" });
    }

    // Return the flags data directly without encoding
    return res.json({ flags });
  } catch (error) {
    console.error("Error fetching flags for Admin:", error);
    res.status(500).json({ message: "Failed to fetch router flags for Admin" });
  }
};





export const setFlag = async (req, res) => {
  const { route_key, is_enabled } = req.body;

  if (!route_key || typeof is_enabled !== "boolean") {
    return res.status(400).json({ message: "Missing or invalid route_key or is_enabled" });
  }

  try {
    let flag = await RouterFlag.findOne({ where: { route_key } });
    let created = false;

    const user = req.session?.user || { id: 1, username: "System" }; // fallback to system
    const userId = user.id;
    const action = flag ? "update" : "create";

    const stateChangeText = is_enabled ? "enabled" : "disabled";
    const details = `Flag "${route_key}" was ${stateChangeText} by ${user.username}`;

    if (flag) {
      const beforeState = flag.toJSON();

      flag.is_enabled = is_enabled;
      await flag.save();

      await createLog(
        action,
        "RouterFlag",
        `Router flag "${route_key}" ${stateChangeText}`,
        userId,
        beforeState,
        flag.toJSON(),
        details
      );
    } else {
      flag = await RouterFlag.create({ route_key, is_enabled });
      created = true;

      await createLog(
        action,
        "RouterFlag",
        `Router flag "${route_key}" ${stateChangeText}`,
        userId,
        null,
        flag.toJSON(),
        details
      );
    }

    res.json({ flag, created });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update router flag" });
  }
};



export const setMaintenanceMode = async (req, res) => {
  const { enable } = req.body;

  if (typeof enable !== "boolean") {
    return res.status(400).json({ message: "Missing or invalid 'enable' value" });
  }

  try {
    const user = req.session?.user || { id: 1, username: "System" };
    const userId = user.id;

    const beforeState = {};
    const afterState = {};

    // Step 1: Toggle the `maintenance` flag itself
    const [maintenance, created] = await RouterFlag.findOrCreate({
      where: { route_key: "maintenance" },
      defaults: {
        is_enabled: enable,
        is_public: false,
      },
    });

    beforeState["maintenance"] = maintenance.toJSON();
    maintenance.is_enabled = enable;
    await maintenance.save();
    afterState["maintenance"] = maintenance.toJSON();

    // Step 2: Disable/Restore public flags except login & maintenance
    const affectedFlags = await RouterFlag.findAll({
      where: {
        is_public: true,
        route_key: { [Op.notIn]: ["login", "maintenance"] },
      },
    });

    for (const flag of affectedFlags) {
      beforeState[flag.route_key] = flag.toJSON();

      if (enable) {
        // Backup current state
        flag.backup_json = JSON.stringify({ is_enabled: flag.is_enabled });
        flag.is_enabled = false;
      } else {
        // Restore previous state
        try {
          const backup = JSON.parse(flag.backup_json || "{}");
          flag.is_enabled = backup.is_enabled ?? true;
        } catch {
          flag.is_enabled = true;
        }
        flag.backup_json = null;
      }

      await flag.save();
      afterState[flag.route_key] = flag.toJSON();
    }

    // Step 3: Log the change
    await createLog(
      "update",
      "RouterFlag",
      `Maintenance mode ${enable ? "enabled" : "disabled"}`,
      userId,
      beforeState,
      afterState,
      `Maintenance mode was ${enable ? "enabled" : "disabled"} by ${user.username}`
    );

    res.json({
      message: `Maintenance mode ${enable ? "enabled" : "disabled"}`,
      updatedFlags: Object.values(afterState),
    });
  } catch (err) {
    console.error("Maintenance mode error:", err);
    res.status(500).json({ message: "Failed to toggle maintenance mode" });
  }
};