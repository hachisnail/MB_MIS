export default (sequelize, DataTypes) => {
  const EngagementEvent = sequelize.define(
    "EngagementEvent",
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      t: { type: DataTypes.BIGINT, allowNull: false },
      br: { type: DataTypes.STRING, allowNull: false },
      // userId: { type: DataTypes.STRING, allowNull: true },  // removed for public use
      type: { type: DataTypes.STRING, allowNull: false }, // view_start, time, click, transition, view_end
      articleId: { type: DataTypes.STRING, allowNull: true },
      fromId: { type: DataTypes.STRING, allowNull: true },
      toId: { type: DataTypes.STRING, allowNull: true },
      // target: { type: DataTypes.STRING, allowNull: true },  // removed
      ms: { type: DataTypes.BIGINT, allowNull: true },
    },
    {
      tableName: "engagement_events",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["type"] },
        { fields: ["article_id"] },
        { fields: ["from_id", "to_id"] },
      ],
    }
  );
  return EngagementEvent;
};
