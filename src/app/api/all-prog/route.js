import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import xml2js from 'xml2js';
import { put } from '@vercel/blob';

const cached_templates = { isInitialized: false };

async function parseXml(xml_raw) {
  const parser = new xml2js.Parser();

  const xml_parsed = await parser.parseStringPromise(xml_raw);
  return xml_parsed;
}

function buildXml(xml_parsed) {
  const builder = new xml2js.Builder();

  return builder.buildObject(xml_parsed);
}

async function getParsedXmlFromPath(xml_path) {
  const path_parts = xml_path.split('/');
  const abs_path = path.join(process.cwd(), 'src', 'data', ...path_parts);
  const xml_raw = await fs.readFile(abs_path, 'utf-8');
  const xml_parsed = await parseXml(xml_raw);

  return xml_parsed;
}

async function cacheXmlTemplates() {
  cached_templates.req_progsList = await getParsedXmlFromPath('req_data/get-progs-list.xml');
  cached_templates.req_progDetail = await getParsedXmlFromPath('req_data/get-prog-detail.xml');
  cached_templates.hakbu = await getParsedXmlFromPath('hakbu_data.xml');
  cached_templates.isInitialized = true;
}

async function saveResult(result) {
  await put('saved_result.json', JSON.stringify(result, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function reqProgsList(page_num) {
  try {
    const reqData_progsList = structuredClone(cached_templates.req_progsList);
    const cond_row = reqData_progsList.Root.Dataset
      .find(ds => ds.$ && ds.$.id === 'ds_cond')
      .Rows[0].Row[0];

    for (let col of cond_row.Col) {
      if (col.$ && col.$.id === 'PAGE') {
        col._ = String(page_num);
        break;
      }
    }

    const res = await fetch("https://onstar.jj.ac.kr/XMain", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: buildXml(reqData_progsList)
    });
    const res_xml_raw = await res.text();

    const progsList_xml = await parseXml(res_xml_raw);
    const progsList_rows = progsList_xml.Root.Dataset
      .find(ds => ds.$ && ds.$.id === 'ds_list01').Rows[0].Row;

    const progsList = (progsList_rows ?? []).reduce((res, row) => {
      const prog_data = {};

      for (let col of row.Col) {
        if (col.$ && col.$.id === 'PROG_HAKYY') {
          prog_data.PROG_HAKYY = col._;
        }
        else if (col.$ && col.$.id === 'PROG_HAKGI') {
          prog_data.PROG_HAKGI = col._;
        }
        else if (col.$ && col.$.id === 'GWAMOK_CODE') {
          prog_data.GWAMOK_CODE = col._;
        }
        else if (col.$ && col.$.id === 'GWAMOK_BUNBAN') {
          prog_data.GWAMOK_BUNBAN = col._;
        }
        else if (col.$ && col.$.id === 'PROG_TITLE') {
          prog_data.PROG_TITLE = col._;
        }
        else if (col.$ && col.$.id === 'APP_DATE') {
          prog_data.APP_DATE = col._;
        }
        else if (col.$ && col.$.id === 'PROG_TIME_INFO') {
          prog_data.PROG_TIME_INFO = col._;
        }
        else if (col.$ && col.$.id === 'DDAY') {
          prog_data.DDAY = col._;
        }
        else if (col.$ && col.$.id === 'MEMBER_CNT') {
          prog_data.MEMBER_CNT = col._;
        }

        if (col.$ && col._ && String(col._).includes('장학금')) {
          prog_data.JANGHAK = true;
        }
        if (col.$ && col._ && String(col._).includes('상금')) {
          prog_data.SANG = true;
        }
        if (col.$ && col._ && String(col._).includes('SRP')) {
          prog_data.SRP = true;
        }
      }

      if (prog_data.DDAY !== '마감') {
        res.push(prog_data);
      }

      return res;
    }, []);

    return progsList;
  }
  catch (error) {
    console.log('reqProgsList - Error:\n', error);
    return null;
  }
}

async function reqProgDetail(hakyy, hakgi, code, bunban) {
  try {
    const reqData_progDetail = structuredClone(cached_templates.req_progDetail);
    const cond_row = reqData_progDetail.Root.Dataset
      .find(ds => ds.$ && ds.$.id === 'ds_cond')
      .Rows[0].Row[0];

    for (let col of cond_row.Col) {
      if (col.$ && col.$.id === 'PROG_HAKYY') {
        col._ = hakyy;
      }
      else if (col.$ && col.$.id === 'PROG_HAKGI') {
        col._ = hakgi;
      }
      else if (col.$ && col.$.id === 'GWAMOK_CODE') {
        col._ = code;
      }
      else if (col.$ && col.$.id === 'GWAMOK_BUNBAN') {
        col._ = bunban;
      }
    }

    const res = await fetch("https://onstar.jj.ac.kr/XMain", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: buildXml(reqData_progDetail)
    });
    const res_xml_raw = await res.text();

    const progDetail_xml = await parseXml(res_xml_raw);
    const progDetail_row = progDetail_xml.Root.Dataset
      .find(ds => ds.$ && ds.$.id === 'ds_list02').Rows[0].Row[0];

    const hakbu_xml = cached_templates.hakbu;

    const getDaehakName = daehak_code => {
      return daehak_code ?
        hakbu_xml.DAEHAK_LIST.DAEHAK
          .find(dh => dh.$ && dh.$.code === daehak_code)
          .$.name :
        '';
    }
    const getHakbuName = (daehak_code, hakbu_code) => {
      return (daehak_code && hakbu_code) ?
        hakbu_xml.DAEHAK_LIST.DAEHAK
          .find(dh => dh.$ && dh.$.code === daehak_code)
          .HAKBU.find(hb => hb.$ && hb.$.code === hakbu_code)
          .$.name :
        '';
    }

    const progDetail = {
      TARGET_DAEHAK: '',
      TARGET_HAKBU: '',
      TARGET_GRADE: ["1", "2", "3", "4", "5"]
    };

    for (let col of progDetail_row.Col) {
      if (col.$ && col.$.id === 'CODE_DAEHAK') {
        progDetail.TARGET_DAEHAK = String(col._);
      }
      else if (col.$ && col.$.id === 'CODE_HAKBU') {
        progDetail.TARGET_HAKBU = String(col._);
      }
      else if (col.$ && col.$.id === 'TARGET_GRADE') {
        progDetail.TARGET_GRADE = String(col._).split(',').slice(1);
      }
    }

    progDetail.TARGET_HAKBU = getHakbuName(progDetail.TARGET_DAEHAK, progDetail.TARGET_HAKBU);
    progDetail.TARGET_DAEHAK = getDaehakName(progDetail.TARGET_DAEHAK);

    return progDetail;
  }
  catch (error) {
    console.log('reqProgDetail - Error:\n', error);
    return null;
  }
}

export async function GET(request) {
  const timemsg = (msg) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');

    console.log(`${hours}:${minutes}:${seconds}.${ms}:\n${msg}\n`);
  }

  if (!cached_templates.isInitialized) {
    await cacheXmlTemplates();
  }

  try {
    const max_search_pages_count = 6;

    timemsg('프로그램 목록 요청 시작');
    const requests_progsList = Array.from({ length: max_search_pages_count }, (_, i) =>
      reqProgsList(i + 1)
    );
    const available_progsList = (await Promise.all(requests_progsList)).flat().filter(Boolean);
    if (available_progsList.length === 0) {
      timemsg('프로그램 목록 요청 실패');

      return NextResponse.json({
        status: "fail",
        data: [],
        error_msg: 'fail to get programs list'
      }, { status: 500 });
    }
    timemsg('프로그램 목록 요청 성공');

    timemsg('프로그램 상세정보 요청 시작');
    const requests_progsDetail = Array.from({ length: available_progsList.length }, (_, i) => {
      const { PROG_HAKYY, PROG_HAKGI, GWAMOK_CODE, GWAMOK_BUNBAN } = available_progsList[i];
      return reqProgDetail(PROG_HAKYY, PROG_HAKGI, GWAMOK_CODE, GWAMOK_BUNBAN);
    });
    const progDetails = await Promise.all(requests_progsDetail);
    timemsg('프로그램 상세정보 요청 완료');

    const progs_info = Array.from({ length: available_progsList.length }, (_, i) => {
      return { ...available_progsList[i], ...progDetails[i] }
    });

    saveResult(progs_info);
    return NextResponse.json({ status: "success", data: progs_info, error_msg: "" });
  }
  catch (error) {
    console.log(`fetch error:\n${error.message}`)
    return NextResponse.json({ status: "fail", data: [], error_msg: error.message }, { status: 500 });
  }
}