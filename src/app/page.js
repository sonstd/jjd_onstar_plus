import fs from "fs";
import path from "path";
import ProgramList from "./ProgramList";

// ── 로컬 저장된 비교과 프로그램 데이터 읽기 ──────────────
async function getSavedPrograms() {
  try {
    const res = await fetch('https://jbhuaqih2dcwhv3v.public.blob.vercel-storage.com/saved_result.json');
    if(!res.ok) {
      console.log("캐싱 읽어오기 실패");
      return [];
    }
    return await res.json();
  } catch (e) {
    console.error("캐싱 읽어오기 실패", e.message);
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

export default async function Home() {
  const initialPrograms = await getSavedPrograms();
  const hakbuXml = getHakbuXml();

  return (
    <ProgramList initialPrograms={initialPrograms} hakbuXml={hakbuXml} />
  );
}