import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import path from "path";

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file, folder) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
      folder: folder,
    });

    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      format: uploadResponse.format,
      bytes: uploadResponse.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, description, members, groupPic } = req.body;
    const adminId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!members || members.length === 0) {
      return res.status(400).json({ message: "At least one member is required" });
    }

    // Ensure admin is included in members
    const memberIds = [...new Set([adminId.toString(), ...members])];

    let groupPicUrl = "";
    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      groupPicUrl = uploadResponse.secure_url;
    }

    const newGroup = new Group({
      name,
      description,
      groupPic: groupPicUrl,
      admin: adminId,
      members: memberIds,
    });

    await newGroup.save();

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("admin", "-password")
      .populate("members", "-password");

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.log("Error in createGroup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("admin", "-password")
      .populate("members", "-password")
      .sort({ updatedAt: -1 });

    // Get last message for each group
    const groupsWithLastMessage = await Promise.all(
      groups.map(async (group) => {
        const lastMessage = await Message.findOne({ groupId: group._id })
          .sort({ createdAt: -1 })
          .populate("senderId", "fullName profilePic")
          .lean();

        return {
          ...group.toObject(),
          lastMessage: lastMessage ? {
            text: lastMessage.text,
            image: lastMessage.image,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          } : null,
        };
      })
    );

    res.status(200).json(groupsWithLastMessage);
  } catch (error) {
    console.log("Error in getUserGroups controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messages = await Message.find({ groupId })
      .populate("senderId", "-password")
      .populate({
        path: "replyTo",
        populate: { path: "senderId", select: "fullName profilePic" }
      })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, replyTo } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    let imageUrl;
    let fileData;

    // Handle image upload
    if (req.body.image) {
      const uploadResponse = await uploadToCloudinary(req.body.image, "group-images");
      imageUrl = uploadResponse.url;
    }

    // Handle file upload
    if (req.body.file) {
      console.log("Processing group file upload:", {
        fileName: req.body.fileName,
        fileType: req.body.fileType,
        fileSize: req.body.file ? req.body.file.length : 0
      });
      
      const uploadResponse = await uploadToCloudinary(req.body.file, "group-files");
      
      const fileName = req.body.fileName || "file";
      const fileExtension = path.extname(fileName).slice(1) || uploadResponse.format;
      const fileType = req.body.fileType || `application/${fileExtension}`;
      const fileSize = uploadResponse.bytes;

      fileData = {
        url: uploadResponse.url,
        publicId: uploadResponse.publicId,
        name: fileName,
        size: fileSize,
        type: fileType,
        extension: fileExtension,
      };
      
      console.log("Group file processed successfully:", fileData);
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image: imageUrl,
      file: fileData,
      replyTo: replyTo || null,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "-password")
      .populate({
        path: "replyTo",
        populate: { path: "senderId", select: "fullName profilePic" }
      });

    // Emit to all group members via group room
    io.to(`group_${groupId}`).emit("newGroupMessage", {
      groupId,
      message: populatedMessage,
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { members } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can add members
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Add new members
    const newMembers = members.filter(
      (memberId) => !group.members.includes(memberId)
    );
    group.members.push(...newMembers);

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "-password")
      .populate("members", "-password");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in addGroupMembers controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can remove members or user can leave themselves
    if (
      group.admin.toString() !== userId.toString() &&
      memberId !== userId.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    // Can't remove admin
    if (memberId === group.admin.toString()) {
      return res.status(400).json({ message: "Cannot remove group admin" });
    }

    group.members = group.members.filter(
      (member) => member.toString() !== memberId
    );

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "-password")
      .populate("members", "-password");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in removeGroupMember controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { name, description, groupPic } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can update group
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can update group" });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      group.groupPic = uploadResponse.secure_url;
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "-password")
      .populate("members", "-password");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in updateGroup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can delete group
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    await Group.findByIdAndDelete(groupId);
    await Message.deleteMany({ groupId });

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.log("Error in deleteGroup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupUnreadCount = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const count = await Message.countDocuments({
      groupId,
      senderId: { $ne: userId },
      "readBy.user": { $ne: userId },
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error in getGroupUnreadCount:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};