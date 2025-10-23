import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import path from "path"; // ADD THIS - Missing import
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file, folder) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name_here') {
      console.log("Cloudinary not configured, using local storage fallback");
      // For development, you can store files locally or use a different approach
      // For now, we'll return a mock response
      return {
        url: `data:image/jpeg;base64,${file.split(',')[1] || file}`,
        publicId: `local_${Date.now()}`,
        format: 'jpeg',
        bytes: Buffer.from(file.split(',')[1] || file, 'base64').length,
      };
    }

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

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    // Get last message for each user
    const usersWithLastMessage = await Promise.all(
      filteredUsers.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .populate("senderId", "fullName profilePic")
          .lean();

        return {
          ...user.toObject(),
          lastMessage: lastMessage ? {
            text: lastMessage.text,
            image: lastMessage.image,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          } : null,
        };
      })
    );

    res.status(200).json(usersWithLastMessage);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    })
    .populate("senderId", "fullName profilePic")
    .populate({
      path: "replyTo",
      populate: { path: "senderId", select: "fullName profilePic" }
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let fileData;

    // Handle image upload
    if (req.body.image) {
      const uploadResponse = await uploadToCloudinary(req.body.image, "chat-images");
      imageUrl = uploadResponse.url;
    }

    // Handle file upload
    if (req.body.file) {
      const uploadResponse = await uploadToCloudinary(req.body.file, "chat-files");
      
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
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      file: fileData,
      replyTo: replyTo || null,
    });

    await newMessage.save();

    // Populate sender info and replied message before sending via socket
    await newMessage.populate("senderId", "fullName profilePic");
    if (newMessage.replyTo) {
      await newMessage.populate({
        path: "replyTo",
        populate: { path: "senderId", select: "fullName profilePic" }
      });
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds, isGroup, chatId } = req.body;
    const userId = req.user._id;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: "Invalid message IDs" });
    }

    const readAt = new Date();

    let query;
    if (isGroup) {
      query = {
        _id: { $in: messageIds },
        groupId: chatId,
        senderId: { $ne: userId },
      };
    } else {
      query = {
        _id: { $in: messageIds },
        receiverId: userId,
        senderId: { $ne: userId },
      };
    }

    // Update messages
    await Message.updateMany(
      query,
      {
        $addToSet: {
          readBy: { user: userId, readAt },
        },
        isRead: true,
      }
    );

    // Get the sender IDs to notify them
    const messages = await Message.find({ _id: { $in: messageIds } });
    const senderIds = [...new Set(messages.map(msg => msg.senderId.toString()))];

    // Emit read status to all senders
    senderIds.forEach(senderId => {
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages:read:update", {
          messageIds,
          readBy: userId,
          readAt,
        });
      }
    });

    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const count = await Message.countDocuments({
      senderId: userId,
      receiverId: currentUserId,
      "readBy.user": { $ne: currentUserId },
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error in getUnreadCount:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};