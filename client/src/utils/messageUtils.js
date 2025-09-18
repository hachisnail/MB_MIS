// utils/messageUtils.js
export function mapMessageToLane(msg, currentUser) {
  // normalize sender info (from DB rows or from socket emit)
  const senderUserId =
    msg.sender?.userId !== undefined ? msg.sender.userId : msg.sender_user_id;
  const senderGuestId =
    msg.sender?.guestId !== undefined ? msg.sender.guestId : msg.sender_guest_id;

  const isAdmin = !!senderUserId;
  const isCurrentUser = senderUserId === currentUser?.id;

  return {
    id: msg.message_id || msg.id,
    laneLabel: isAdmin ? "Admin" : "Guest",
    laneVariant: isAdmin ? "admin" : "suggestions",
    message: msg.text || msg.message,
    author: isAdmin
      ? isCurrentUser
        ? "You"
        : "Admin"
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
