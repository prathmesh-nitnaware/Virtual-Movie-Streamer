const roomService = require('../services/roomService');

function getRoomsStats(req, res) {
  const rooms = roomService.getAllRoomsSummary();
  res.json({
    activeRoomsCount: rooms.length,
    rooms
  });
}

function getRoomDetails(req, res) {
  const { roomId } = req.params;
  const room = roomService.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found or inactive' });
  }

  res.json({
    id: room.id,
    hostName: room.hostName,
    viewerCount: room.users.length,
    videoState: room.videoState,
    createdAt: room.createdAt
  });
}

module.exports = {
  getRoomsStats,
  getRoomDetails
};
