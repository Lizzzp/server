import e, { Request, Response, Router } from "express";
import  { MeianDB, oaDB } from "../db/dbConnect";
import { QueryTypes } from "sequelize";
const router = Router();

router.post("/query", async (req: Request, res: Response) => {
  req.setTimeout(300 * 1000); // 查询过慢
  const {
    shop, // 店铺
    conversion_rate_l, //转换率
    conversion_rate_h, 
    sales_numbers, // 销量
    linkids,        // 链接IDs
    begin_date,     // 开始时间
    end_date,       // 结束时间
    promotion_intensity, // 推广力度
    sales_rank, // 热销等级
    sales_volume, // 销售额
    profit_rate_l, // 利润率
    profit_rate_h, //
    p_r_l,  // 推广费占比
    p_r_h,
    head
  } = req.body;

  let sqlWhereOne = "";
  if (shop) {
    sqlWhereOne += sqlWhereOne.length ? " and " : " WHERE ";
    sqlWhereOne += `[店铺]='${shop}' `;
  }

  if (begin_date!==undefined) {
    sqlWhereOne += sqlWhereOne.length ? " and " : " WHERE ";
    sqlWhereOne += `[业务日期]>='${begin_date}' `;
  }
  if (end_date!==undefined) {
    sqlWhereOne += sqlWhereOne.length ? " and " : " WHERE ";
    sqlWhereOne += `[业务日期]<='${end_date}' `;
  }
  // console.log(linkids);
  // if (linkids!==undefined) {
  //   sqlWhereOne += sqlWhereOne.length ? " and " : " WHERE ";
  //   sqlWhereOne += `[链接ID] IN (\'${(linkids as string[]).join("','")}\')`;
  // }



  let sqlWhereThree = "";

  // 转化率
  if (conversion_rate_l!== undefined) {
    sqlWhereThree += sqlWhereThree.length ? " and " : " WHERE ";
    sqlWhereThree += `a.[转化率] >= ${conversion_rate_l} `;
  }
  if (conversion_rate_h!== undefined) {
    sqlWhereThree += sqlWhereThree.length ? " and " : " WHERE ";
    sqlWhereThree += `a.[转化率] <= ${conversion_rate_h} `;
  }
  // 利润率
  if (profit_rate_l !== undefined) {
    sqlWhereThree += sqlWhereThree.length ? " and " : " WHERE ";
    sqlWhereThree += `a.[利润率] >= ${profit_rate_l} `;
  }

  if (profit_rate_h !== undefined) {
    sqlWhereThree += sqlWhereThree.length ? " and " : " WHERE ";
    sqlWhereThree += `a.[利润率] <= ${profit_rate_h} `;
  }
  // 推广费占比

  if (p_r_l !== undefined) {
    sqlWhereThree += sqlWhereThree.length ? " and " : " WHERE ";
    sqlWhereThree += `a.[推广费占比] >= ${p_r_l} `;
  }
  if (p_r_h !== undefined) {
    sqlWhereThree += sqlWhereThree.length ? " and " : " WHERE ";
    sqlWhereThree += `a.[推广费占比] <= ${p_r_h} `;
  }
  // 销售额
  if (sales_volume!==undefined) {
    sqlWhereThree += sqlWhereThree.length ? " and " : " WHERE ";
    sqlWhereThree += `a.[销售额] >= ${sales_volume} `;
  }

  // 销售件数
  if (sales_numbers!==undefined) {
    sqlWhereThree += sqlWhereThree.length ? " and " : " WHERE ";
    sqlWhereThree += `a.[销售件数] >= ${sales_numbers} `;
  }

  try {
    const links1 = await MeianDB.query(`
SELECT
  c.* ,
  b.[销售等级] AS sales_rank,
  b.[负责人] AS head,
  b.[推款阶段] AS promotion_intensity,
  b.[主图],
  b.[店铺名称],
  b.[创建时间],
  b.[链接URL] 
FROM
  (
    SELECT
      * 
    FROM
      (
        SELECT
          [链接ID],
          SUM([销售额]) AS [销售额],
          SUM([访客数]) AS 访客数,
          SUM([买家数]) AS 买家数,
          SUM([平台广告费] + [刷单广告费] + [联盟广告费]) AS 推广费,
          SUM([销售利润]) AS 销售利润,
        CASE
            
            WHEN SUM([销售件数]) IS NULL THEN
            0 ELSE SUM([销售件数]) 
          END AS 销售件数,
        CASE
            
            WHEN SUM([访客数]) = 0 THEN
            0 ELSE SUM([买家数]) / SUM([访客数]) 
          END AS 转化率,
        CASE
            
            WHEN SUM([销售额]) = 0 THEN
            0 ELSE SUM([平台广告费] + [刷单广告费] + [联盟广告费]) / SUM([销售额]) 
          END AS 推广费占比,
        CASE
            
            WHEN SUM([销售额]) = 0 THEN
            0 ELSE SUM([销售利润]) / SUM([销售额]) 
          END AS 利润率 
        FROM
          [DW_Links].[链接日报] 
        ${sqlWhereOne}
        GROUP BY
      [链接ID]) AS a 
    ${sqlWhereThree}
  AND a.[销售件数] >= 0) AS c
  LEFT JOIN [DIM].[链接表] AS b ON c.[链接ID] = b.[链接ID]`,
        {
          type: QueryTypes.SELECT,
        }
      );
    
      if (links1.length) {
        const links3 = await oaDB.query(
          `SELECT * FROM link_mark`,
          {
            type: QueryTypes.SELECT,
          }
        );
        const data = links1
          .map((l: any) => {
            const target2 = links3.find((k: any) => k["link_id"] === l["链接ID"]);
            let link = { ...l };
            if (target2) {
              link = { ...link, ...target2 };
            }
            return link;
          })
          .filter((l) => {
            let flag = true;
            if (promotion_intensity) {
              flag = flag && l.promotion_intensity === promotion_intensity;
            }
            if (sales_rank) {
              flag = flag && l.sales_rank === sales_rank;
            }
            if(head) {
              flag = flag && l.head === head;
            }
            if (linkids) {
              if (linkids instanceof Array) {
                flag = flag && linkids.includes(l['链接ID'])
              } else if (typeof linkids === 'string') {
                flag = flag && linkids === l['链接ID']
              }
            }
            return flag;
          });
        res.status(200).json({
          data
        });
      } else {
        res.status(200).json({
          data: [],
        });
      }
  } catch (error) {
    console.log(error);
    res.status(200).json({
        data: [],
    });
  }
});
export default router;
