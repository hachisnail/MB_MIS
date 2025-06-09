import RouterFlag from "../models/routerFlags.js";

export const getFlags = async (req, res) => {
  try {
    const flags = await RouterFlag.findAll({
      attributes: { exclude: ['role'] }, 
    });
    res.json(flags);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch router flags" });
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

    if (flag) {
      flag.is_enabled = is_enabled;
      await flag.save(); 
    } else {
      flag = await RouterFlag.create({ route_key, is_enabled }); 
      created = true;
    }


    res.json({ flag, created });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update router flag" });
  }
};
