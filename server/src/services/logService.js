import { User } from "../models/authModels.js";
import { Log } from "../models/logModel.js";

export const createLog = async (
  action,
  model,
  description,
  userId,
  beforeState = null,
  afterState = null,
  details = null
) => {
  try {
    await Log.create({
      action,
      model,
      userId,
      description,
      beforeState: beforeState ? JSON.stringify(beforeState) : null,
      afterState: afterState ? JSON.stringify(afterState) : null,
      details,
    });
  } catch (error) {
    console.error("Error creating log:", error);
  }
};

export const logAction = (action, modelName) => async (req, res, next) => {
  try {
    //improtant
    //in prod modify this to match the system account
    const system = 1;
    const modelId = req.params.id || res.locals.newRecordId;
    const details = req.logDetails || null;
    const userId = res.locals.userId || (req.user ? req.user.id : system);
    // console.log('Logging action:', { action, modelName, modelId, details, userId });

    await createLog(action, modelName, modelId, details, userId);

    // console.log('Log created for action:', action);
    next();
  } catch (error) {
    console.error("Logging middleware error:", error);
    next(error);
  }
};

export const fetchLog = async (req, res) => {
  try {
    const logs = await Log.findAll({
      include: [
        {
          model: User,
          required: true,
        },
      ],
    });
    res.json(logs);
  } catch (error) {
    // console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Error fetching logs" });
  }
};
