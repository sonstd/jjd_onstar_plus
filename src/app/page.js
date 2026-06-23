import fs from "fs";
import path from "path";
import ProgramList from "./ProgramList";

// ── 로컬 저장된 비교과 프로그램 데이터 읽기 ──────────────
function getSavedPrograms() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "saved_result.json");
    const fileText = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(fileText);
    return json || [];
  } catch (e) {
    console.error("saved_result.json 읽기 실패:", e.message);
    return [];
  }
}

// ── 단과대/학부 XML 데이터 읽기 (public/hakbu_data.xml) ──
function getHakbuXml() {
  try {
    const filePath = path.join(process.cwd(), "public", "hakbu_data.xml");
    return fs.readFileSync(filePath, "utf-8");
  } catch (e) {
    console.error("hakbu_data.xml 읽기 실패:", e.message);
    return null;
  }
}

export default function Home() {
  const initialPrograms = getSavedPrograms();
  const hakbuXml = getHakbuXml();

  return (
    <ProgramList initialPrograms={initialPrograms} hakbuXml={hakbuXml} />
  );
}