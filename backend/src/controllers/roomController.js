// backend/src/controllers/roomController.js  (NEW)
import { Room } from "../models/index.js";
import { HTTP } from "../constants.js";

export const listRooms = async (_req, res) => {
  try {
    const rooms = await Room.findAll({ order: [["number", "ASC"]] });
    return res.status(HTTP.OK).json({ success: true, rooms });
  } catch (err) {
    console.error("[rooms/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { number, type, capacity } = req.body;
    if (!number?.trim() || !type) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "number and type are required" });
    }
    const existing = await Room.findOne({ where: { number: number.trim() } });
    if (existing) return res.status(HTTP.CONFLICT).json({ message: "Room number already exists" });

    const room = await Room.create({
      number: number.trim(),
      type,
      capacity: Number(capacity) || 1,
    });
    return res.status(HTTP.CREATED).json({ success: true, room });
  } catch (err) {
    console.error("[rooms/create]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Available", "Occupied", "Maintenance"].includes(status)) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Invalid status" });
    }
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(HTTP.NOT_FOUND).json({ message: "Room not found" });

    await room.update({ status });
    return res.status(HTTP.OK).json({ success: true, room });
  } catch (err) {
    console.error("[rooms/updateStatus]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(HTTP.NOT_FOUND).json({ message: "Room not found" });
    await room.destroy();
    return res.status(HTTP.OK).json({ success: true, message: "Room removed" });
  } catch (err) {
    console.error("[rooms/delete]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};