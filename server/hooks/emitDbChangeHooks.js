import { getIO } from "../configs/socketServer.js";

const ALLOWED_GUEST_MODELS = new Set(["RouterFlag"]);

export function emitDbChange(modelName, action, instance, options = {}) {
  try {
    const io = getIO();
    const payload = {
      model: modelName,
      action,
      data: instance.toJSON(),
    };

    const {
      toUserId = null,
      event = "dbChange",
      room = null,
    } = options;

    const safeLogTarget = () => {
      if (room) return `room: ${room}`;
      if (toUserId) return `user:${toUserId}`;
      return "authenticated users";
    };

    // Guest-safe emit
    if (ALLOWED_GUEST_MODELS.has(modelName)) {
      io.to("guestRoom").emit(event, payload);
      console.log(`[Socket Emit] Sent guest-safe model "${modelName}" to guestRoom`);
    }

    // Authenticated-only broadcast to realtimeDB
    io.to("realtimeDB").emit(event, payload);
    console.log(`[Socket Emit] Sent "${modelName}" to realtimeDB (${safeLogTarget()})`);

  } catch (err) {
    console.error(`Socket emit error for ${modelName}:${action}:`, err.message);
  }
}

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
