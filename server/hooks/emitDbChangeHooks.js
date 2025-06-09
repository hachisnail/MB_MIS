import { getIO } from "../configs/socketServer.js";

/**
 * Emits a Socket.io event for DB changes
 * @param {string} modelName
 * @param {string} action - "create" | "update" | "delete"
 * @param {Sequelize.Instance} instance
 */
export function emitDbChange(modelName, action, instance) {
  try {
    const io = getIO();
    const payload = {
      model: modelName,
      action,
      data: instance.toJSON(),
    };
    console.log(`[Socket Emit] Emitting dbChange for model="${modelName}", action="${action}" with data:`, payload.data);
    io.emit("dbChange", payload);
  } catch (err) {
    console.error(`Socket.io not initialized or error emitting for ${modelName}:`, err.message);
  }
}

/**
 * Attach hooks for create, update, delete that call emitDbChange automatically
 * @param {import("sequelize").Model} model Sequelize model
 * @param {string} modelName
 */
export function addDbChangeHooks(model, modelName) {
  model.afterCreate((instance, options) => {
    emitDbChange(modelName, "create", instance);
  });

  model.afterUpdate((instance, options) => {
    // Only emit if any field was actually changed
    const changed = instance.changed();
    if (changed && changed.length > 0) {
      emitDbChange(modelName, "update", instance);
    } else {
      console.log(`[Socket Emit] Skipped emit: No changes detected for "${modelName}"`);
    }
  });

  model.afterDestroy((instance, options) => {
    emitDbChange(modelName, "delete", instance);
  });
}
