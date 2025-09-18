// src/models/conversationModel.js
import { DataTypes } from "sequelize";
import { mainDb } from "./authModels.js";

const Conversation = mainDb.define(
  "Conversation",
  {
    conversation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contribution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Contributions", // must match your contributions table name
        key: "contribution_id",
      },
      onDelete: "CASCADE",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true, // optional, in case you want conversation titles later
    },
    status: {
      type: DataTypes.ENUM("open", "closed", "archived"),
      allowNull: false,
      defaultValue: "open",
    },
  },
  {
    tableName: "conversations",
    timestamps: true, // adds createdAt, updatedAt
    underscored: true,
  }
);

export default Conversation;
