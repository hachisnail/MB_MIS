import { getIO } from "../configs/socketServer.js";

/**
 * Emits a Socket.io event for DB changes
 * @param {string} modelName
 * @param {string} action - "create" | "update" | "delete"
 * @param {Sequelize.Instance} instance
 */
  export function emitDbChange(modelName, action, instance, options = {}) {
    try {
      const io = getIO();
      const payload = {
        model: modelName,
        action,
        data: instance.toJSON(),
      };

      const { toUserId = null, event = "dbChange", room = null } = options;

      console.log(
        `[Socket Emit] Emitting event="${event}" for model="${modelName}", action="${action}" to ${room || (toUserId ? `user:${toUserId}` : "all")} with data:`,
        payload.data
      );

      if (room) {
        io.to(room).emit(event, payload);
      } else if (toUserId) {
        io.to(`user:${toUserId}`).emit(event, payload);
      } else {
        io.emit(event, payload);
      }

    } catch (err) {
      console.error(`Socket emit error for ${modelName}:${action}:`, err.message);
    }
  }


/**
 * Attach hooks for create, update, delete that call emitDbChange automatically
 * @param {import("sequelize").Model} model Sequelize model
 * @param {string} modelName
 */
export function addDbChangeHooks(model, modelName) {
  model.afterCreate((instance, options) => {
    console.log(`[Hook] afterCreate triggered for ${modelName}`);
    emitDbChange(modelName, "create", instance);
  });

  model.afterUpdate((instance, options) => {
    const changed = instance.changed();
    if (changed && changed.length > 0) {
      console.log(`[Hook] afterUpdate: changed fields on ${modelName}:`, changed);
      emitDbChange(modelName, "update", instance);
    } else {
      console.log(`[Hook] Skipped update emit: No fields changed on ${modelName}`);
    }
  });

  model.afterDestroy((instance, options) => {
    console.log(`[Hook] afterDestroy triggered for ${modelName}`);
    emitDbChange(modelName, "delete", instance);
  });
}
