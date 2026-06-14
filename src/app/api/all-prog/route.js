import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import xml2js from 'xml2js';

export async function GET(request) {
  const parser = new xml2js.Parser();
  const builder = new xml2js.Builder();

  const allProgs = []

  try {
    const hakbuXmlPath = path.join(process.cwd(), 'src', 'data', 'hakbu_data.xml');
    const hakbuXmlRaw = await fs.readFile(hakbuXmlPath, 'utf-8');
    const hakbuXmlParsed = await parser.parseStringPromise(hakbuXmlRaw);
    
    const detailReqXmlPath = path.join(process.cwd(), 'src', 'data', 'req_data', 'prog-detail.xml');
    const detailReqXmlRaw = await fs.readFile(detailReqXmlPath, 'utf-8');

    const reqXmlPath = path.join(process.cwd(), 'src', 'data', 'req_data', 'all-prog.xml');
    let reqXmlRaw = await fs.readFile(reqXmlPath, 'utf-8');

    const reqXmlParsed = await parser.parseStringPromise(reqXmlRaw);
    const pageRow = reqXmlParsed.Root.Dataset
    .find(ds => ds.$ && ds.$.id === 'ds_cond')
    .Rows[0].Row[0];

    let stop = false;

    for(let i=1; i<20; i++){
      for (let col of pageRow.Col) {
        if (col.$ && col.$.id === 'PAGE') {
          col._ = String(i);
          break;
        }
      }

      reqXmlRaw = builder.buildObject(reqXmlParsed);

      const res = await fetch("https://onstar.jj.ac.kr/XMain", {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: reqXmlRaw
      });
      const resXmlRaw = await res.text();

      const resXmlParsed = await parser.parseStringPromise(resXmlRaw);
      const targetRows = resXmlParsed.Root.Dataset
      .find(ds => ds.$ && ds.$.id === 'ds_list01')
      .Rows[0];

      for(let row of targetRows.Row) {
        const gwamokData = {
          JANGHAK: false,
          SANG: false,
          SRP: false
        };

        for (let col of row.Col) {
          if (col.$ && col.$.id === 'DDAY') {
            if(col._ === '마감'){
              stop = true;
              break;
            }
            else {
              gwamokData.DDAY = col._;
            }
          }
          else if (col.$ && col.$.id === 'PROG_HAKYY') {
            gwamokData.PROG_HAKYY = col._;
          }
          else if (col.$ && col.$.id === 'PROG_HAKGI') {
            gwamokData.PROG_HAKGI = col._;
          }
          else if (col.$ && col.$.id === 'GWAMOK_CODE') {
            gwamokData.GWAMOK_CODE = col._;
          }
          else if (col.$ && col.$.id === 'GWAMOK_BUNBAN') {
            gwamokData.GWAMOK_BUNBAN = col._;
          }
          else if (col.$ && col.$.id === 'PROG_TITLE') {
            gwamokData.PROG_TITLE = col._;
          }
          else if (col.$ && col.$.id === 'APP_DATE') {
            gwamokData.APP_DATE = col._;
          }
          else if (col.$ && col.$.id === 'PROG_TIME_INFO') {
            gwamokData.PROG_TIME_INFO = col._;
          }
          else if (col.$ && col.$.id === 'MEMBER_CNT') {
            gwamokData.MEMBER_CNT = col._;
          }

          if (col.$ && col._ && String(col._).includes('장학금')){
            gwamokData.JANGHAK = true;
          }
          if (col.$ && col._ && String(col._).includes('상금')){
            gwamokData.SANG = true;
          }
          if (col.$ && col._ && String(col._).includes('SRP')){
            gwamokData.SRP = true;
          }
        }

        if(stop) {
          break;
        }
        else {
          const detailReqXmlParsed = await parser.parseStringPromise(detailReqXmlRaw);
          const gwamokRow = detailReqXmlParsed.Root.Dataset
          .find(ds => ds.$ && ds.$.id === 'ds_cond')
          .Rows[0].Row[0];

          for (let col of gwamokRow.Col) {
            if (col.$ && col.$.id === 'PROG_HAKYY') {
              col._ = gwamokData.PROG_HAKYY;
            }
            else if (col.$ && col.$.id === 'PROG_HAKGI') {
              col._ = gwamokData.PROG_HAKGI;
            }
            else if (col.$ && col.$.id === 'GWAMOK_CODE') {
              col._ = gwamokData.GWAMOK_CODE;
            }
            else if (col.$ && col.$.id === 'GWAMOK_BUNBAN') {
              col._ = gwamokData.GWAMOK_BUNBAN;
            }
          }

          const configuredDetailXmlRaw = builder.buildObject(detailReqXmlParsed);

          const detail_res = await fetch("https://onstar.jj.ac.kr/XMain", {
            method: "POST",
            headers: {
              "Content-Type": "text/xml",
              "X-Requested-With": "XMLHttpRequest"
            },
            body: configuredDetailXmlRaw
          });

          const detailResXmlRaw = await detail_res.text();
          const detailResXmlParsed = await parser.parseStringPromise(detailResXmlRaw);

          const detailRow = detailResXmlParsed.Root.Dataset
          .find(ds => ds.$ && ds.$.id === 'ds_list02')
          .Rows[0].Row[0];

          let target_daehak_code = null;
          let target_hakbu_code = null;
          let target_grade = ["1", "2", "3", "4", "5"];

          for (let col of detailRow.Col) {
            if (col.$ && col.$.id === 'CODE_DAEHAK' && col._ && String(col._) !== '00') {
              target_daehak_code = col._;
            }
            else if (col.$ && col.$.id === 'CODE_HAKBU' && col._ && String(col._) !== '0000') {
              target_hakbu_code = col._;
            }
            else if (col.$ && col.$.id === 'TARGET_GRADE' && col._) {
              target_grade = String(col._).split(',').slice(1);
            }
          }

          const target_daehak_name = target_daehak_code ? 
          hakbuXmlParsed.DAEHAK_LIST.DAEHAK
          .find(dh => dh.$ && dh.$.code === target_daehak_code).$.name : 'any'

          const target_hakbu_name = (target_daehak_code && target_hakbu_code) ? 
          hakbuXmlParsed.DAEHAK_LIST.DAEHAK
          .find(dh => dh.$ && dh.$.code === target_daehak_code).HAKBU
          .find(hb => hb.$ && hb.$.code === target_hakbu_code).$.name : 'any'

          gwamokData.TARGET_DAEHAK = target_daehak_name;
          gwamokData.TARGET_HAKBU = target_hakbu_name;
          gwamokData.TARGET_GRADE = target_grade;

          allProgs.push(gwamokData);
        }
      }

      if(stop){
        break;
      }
    }

    return NextResponse.json({
      status: "success",
      data: allProgs,
      error_msg: ""
    });
  }
  catch (error){
    console.log(`fetch error:\n${error.message}`)
    return NextResponse.json({
      status: "fail",
      data: [],
      error_msg: error.message
    }, { status: 500 });
  }
}