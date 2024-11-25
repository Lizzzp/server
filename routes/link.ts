import { Request, Response, Router } from "express";
import sequelize, { oaDB } from "../db/dbConnect";
import { QueryTypes } from "sequelize";
const router = Router();


router.post("/", async (req: Request, res: Response) => {
  req.setTimeout(300 * 1000);
  const {
    shop,
    conversion_rate_l,
    conversion_rate_h,
    sales_numbers,
    linkids,
    begin_date,
    end_date,
    promotion_intensity,
    sales_rank,
    sales_volume,
    profit_rate_l,
    profit_rate_h,
    p_r_l,
    p_r_h
  } = req.body;

  let sqlWhereOne = "";
  if (shop!==undefined) {
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

  if (linkids!==undefined) {
    sqlWhereOne += sqlWhereOne.length ? " and " : " WHERE ";
    sqlWhereOne += `[链接ID] IN (\'${(linkids as string[]).join("','")}\')`;
  }

  let sqlWhereTwo = "";

  // 销售额
  if (sales_volume!==undefined) {
    sqlWhereTwo += sqlWhereTwo.length ? " and " : " HAVING ";
    sqlWhereTwo += `SUM([销售额]) >= ${sales_volume} `;
  }

  // 销售件数
  if (sales_numbers!==undefined) {
    sqlWhereTwo += sqlWhereTwo.length ? " and " : " HAVING ";
    sqlWhereTwo += `SUM([销售件数]) >= ${sales_numbers} `;
  }
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

  const links1 = await sequelize.query(
    `
        SELECT * 
        FROM (
          SELECT
          SUM([销售件数]) AS 销售件数,
          [链接ID],
          SUM([销售额]) AS [销售额],
          SUM([访客数]) AS 访客数,
          SUM([买家数]) AS 买家数,
          SUM([平台广告费] + [刷单广告费] + [联盟广告费]) AS 推广费,
          SUM([销售利润]) AS 销售利润,
        CASE
            WHEN SUM([访客数]) = 0 THEN
            NULL ELSE SUM([买家数]) / SUM([访客数]) 
          END AS 转化率,
        CASE
            WHEN SUM([销售额]) = 0 THEN
            NULL ELSE SUM([平台广告费] + [刷单广告费] + [联盟广告费]) / SUM([销售额]) 
          END AS 推广费占比,
        CASE
            
            WHEN SUM([销售额]) = 0 THEN
            NULL ELSE SUM([销售利润]) / SUM([销售额]) 
          END AS 利润率 
        FROM
          [DW_Links].[链接日报] 
    ${sqlWhereOne}
        GROUP BY [链接ID] 
    ${sqlWhereTwo}
        ) AS a
            ${sqlWhereThree}
                `,
    {
      type: QueryTypes.SELECT,
    }
  );

  if (links1.length) {
    const linkids = links1.map((l: any) => l["链接ID"]);
    let links2: any[] = [];
    for (let index = 0; index < linkids.length; index += 10000) {
      const d = await sequelize.query(
        `SELECT * FROM [DIM].[链接表] WHERE [链接ID] IN (\'${linkids
          .slice(index, index + 10000)
          .join("','")}\')`,
        {
          type: QueryTypes.SELECT,
        }
      );
      links2 = links2.concat(d);
    }

    const links3 = await oaDB.query(
      `
            SELECT * 
            FROM link_mark`,
      {
        type: QueryTypes.SELECT,
      }
    );
    const data = links1
      .map((l: any) => {
        const target1 = links2.find((k: any) => k["链接ID"] === l["链接ID"]);
        const target2 = links3.find((k: any) => k["link_id"] === l["链接ID"]);
        let link = { ...l };
        if (target1) {
          link = { ...link, ...target1 };
        }
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
        return flag;
      });
    res.status(200).json({
      data: data.slice(0, 100),
    });
  } else {
    res.status(200).json({
      data: [],
    });
  }
});


export default router;
