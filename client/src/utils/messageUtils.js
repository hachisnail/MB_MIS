export function mapMessageToLane(msg, currentUser) {
  const senderUserId =
    msg.sender?.userId !== undefined ? msg.sender.userId : msg.sender_user_id;
  const senderGuestId =
    msg.sender?.guestId !== undefined ? msg.sender.guestId : msg.sender_guest_id;

  // Infer type with backwards compatibility
  const type =
    msg.type ||
    msg.message_type ||
    ((senderUserId == null && senderGuestId == null) ? "system" : "user");

  const isAdmin = type !== "system" && !!senderUserId;
  const isCurrentUser = senderUserId && currentUser?.id && String(senderUserId) === String(currentUser.id);

  const laneVariant = type === "system" ? "system" : (isAdmin ? "admin" : "donor");
  const laneLabel = type === "system" ? "System" : (isAdmin ? "Admin" : "Guest");

  return {
    id: msg.message_id || msg.id,
    laneLabel,
    laneVariant,          // "admin" | "donor" | "system"
    message: msg.text || msg.message,
    author:
      type === "system"
        ? "System"
        : isAdmin
          ? (isCurrentUser ? "You" : "Admin")
          : `Guest ${senderGuestId || ""}`,
    size:
      (msg.text || msg.message)?.length > 140
        ? "lg"
        : (msg.text || msg.message)?.length > 60
          ? "md"
          : "sm",
    createdAt: msg.created_at || msg.createdAt,
  };
}
