import { User } from "../models/authModels.js";
import { Log } from "../models/logModel.js";
export const createLog = async (action, model, modelId, details, userId) => {
  try {
    console.log('Creating log entry:', { action, model, modelId, details, userId });  // Add debug log
    await Log.create({
      action,
      model,
      modelId,
      details: details || null,
      userId
    });
    // console.log('Log created successfully');  // Check if this is logged
  } catch (error) {
    console.error('Error creating log:', error);
  }
};


export const logAction = (action, modelName) => 
  async (req, res, next) => {
    try {
      //improtant
      //in prod modify this to match the system account
      const system = 5;
      const modelId = req.params.id || res.locals.newRecordId;
      const details = req.logDetails || null;
      const userId = res.locals.userId || (req.user ? req.user.id : system);
      // console.log('Logging action:', { action, modelName, modelId, details, userId });

      await createLog(action, modelName, modelId, details, userId);
      
      // console.log('Log created for action:', action);  
      next(); 
    } catch (error) {
      console.error('Logging middleware error:', error);
      next(error); 
    }
  };



  export const fetchLog = async (req, res) => {
    try {
      const logs = await Log.findAll({
        include: [{
          model: User,
          required: true  
        }],
      });
      res.json(logs);
    } catch (error) {
      // console.error("Error fetching logs:", error); 
      res.status(500).json({ message: 'Error fetching logs' });
    }
  }