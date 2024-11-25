/**
 * 链接运营日报 
 *
 * */
import { DataTypes } from "sequelize";
import sequelize from "../db/dbConnect";

export const Daily_Link_Reports = sequelize.define(
  "链接运营日报",
  {
    "业务日期": {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    "平台": {
      type: DataTypes.STRING,
      allowNull: false,
    },
    "链接ID": {
      type: DataTypes.STRING,
      allowNull: false,
    },
    "销售额": {
      type: DataTypes.FLOAT(53),
      allowNull: true,
    },
    "销售件数": {
      type: DataTypes.FLOAT(53),
      allowNull: false,
    },
    "订单数": {
      type: DataTypes.FLOAT(53),
      allowNull: true,
    },
    "访客数" : {
      type: DataTypes.FLOAT(53),
      allowNull: true
    },
    "加购人数": {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
